# Lodgekeys Room Reservation Conflict Prevention Strategy

## 1. The Core Concurrency Problem

In hotel booking engines, relying exclusively on client-side or application-layer availability checks introduces critical race conditions:
1. Two customers search for "Deluxe Garden Room" at the exact same moment.
2. Both clients check availability and receive `status: available`.
3. Both proceed to payment or confirmation concurrently.
4. Without a database-level lock or exclusion constraint, two reservations are created for the exact same physical room on overlapping dates, creating an operational crisis for the hotel front desk.

**Lodgekeys addresses this by enforcing mathematical exclusion inside PostgreSQL.**

---

## 2. PostgreSQL GiST Exclusion Constraint Design

Lodgekeys uses the `btree_gist` PostgreSQL extension combined with a generated `DATERANGE` column.

### 2.1 The Stay Range Model
In hospitality, dates represent night stays. A stay arriving on October 18 and departing on October 20 comprises:
- Night of Oct 18
- Night of Oct 19
- Departure morning of Oct 20

Another guest can safely check in on October 20 without conflict.

In PostgreSQL, this is modeled by a **half-open interval**:
`daterange(check_in_date, check_out_date, '[)')`
- `[`: Inclusive of `check_in_date`.
- `)`: Exclusive of `check_out_date`.

We store this as an indexed, generated column on `public.bookings`:
```sql
stay_range DATERANGE GENERATED ALWAYS AS (
    daterange(check_in_date, check_out_date, '[)')
) STORED
```

### 2.2 The Exclusion Constraint
```sql
CREATE EXTENSION IF NOT EXISTS "btree_gist";

ALTER TABLE public.bookings
ADD CONSTRAINT exclude_overlapping_room_bookings
EXCLUDE USING gist (
    room_id WITH =,
    stay_range WITH &&
)
WHERE (booking_status IN ('pending', 'confirmed', 'checked_in'));
```

### 2.3 How the Constraint Evaluates
1. `room_id WITH =`: Evaluates if the booking targets the exact same physical room.
2. `stay_range WITH &&`: Evaluates if the date intervals overlap.
   - Guest A: `[2026-10-18, 2026-10-20)`
   - Guest B: `[2026-10-20, 2026-10-22)`
   - Overlap check: `[2026-10-18, 2026-10-20) && [2026-10-20, 2026-10-22)` returns **FALSE**. Both bookings succeed.
   - Guest C: `[2026-10-19, 2026-10-21)`
   - Overlap check: `[2026-10-18, 2026-10-20) && [2026-10-19, 2026-10-21)` returns **TRUE**. The database **rejects Guest C with error code 23P01 (exclusion_violation)**.

---

## 3. Booking Lifecycle & Partial Filter Conditioning

The exclusion constraint is filtered with a partial condition:
```sql
WHERE (booking_status IN ('pending', 'confirmed', 'checked_in'))
```

This maps directly to the operational booking lifecycle:

```
[Customer Checkout] ---> (pending) --------[Hold Expired]-------> [expired] (Frees room)
                            |
                     [Payment / Desk Confirm]
                            |
                            v
                      (confirmed) ---------[Guest Cancels]------> [cancelled] (Frees room)
                            |
                    [Desk Check-In]
                            |
                            v
                     (checked_in)
                            |
                    [Desk Check-Out]
                            |
                            v
                     [checked_out] (Frees room)
```

- **Active States (Blocking Room Inventory)**:
  - `pending`: Temporary checkout reservation hold.
  - `confirmed`: Active future booking.
  - `checked_in`: Guest is currently in-house.
- **Terminal States (Releasing Room Inventory)**:
  - `checked_out`: Completed stay.
  - `cancelled`: Cancelled stay.
  - `expired`: Uncompleted checkout attempt whose hold period lapsed.

Because terminal states are omitted from the partial index condition, they instantly release the physical room for new reservations without deleting historical records.

---

## 4. Temporary Booking Holds & Sweeper Strategy

When a customer enters the payment wizard or bank transfer flow, inventory may be placed on temporary hold to prevent another guest from snapping it up during the payment step:
1. `booking_status` is set to `'pending'`.
2. `hold_expires_at` is set to `now() + INTERVAL '15 minutes'`.
3. The exclusion constraint immediately protects the room.

### Sweeper Routine (`expire_stale_booking_holds`)
A stored function sweeps abandoned holds:
```sql
CREATE OR REPLACE FUNCTION public.expire_stale_booking_holds()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_expired_count INTEGER;
BEGIN
    WITH expired_rows AS (
        UPDATE public.bookings
        SET booking_status = 'expired',
            updated_at = now()
        WHERE booking_status = 'pending'
          AND hold_expires_at IS NOT NULL
          AND hold_expires_at < now()
        RETURNING id
    )
    SELECT COUNT(*) INTO v_expired_count FROM expired_rows;

    RETURN v_expired_count;
END;
$$;
```

**Production Trigger Options**:
1. **Scheduled pg_cron**: Trigger `SELECT public.expire_stale_booking_holds();` every 5 minutes in Supabase.
2. **On-Demand Pre-Check**: When searching for room availability, the booking service invokes `expire_stale_booking_holds()` to clear any expired holds for that hotel before returning inventory counts.

---

## 5. Future Transactional Booking Function Contract

In a subsequent phase, an atomic RPC procedure (`public.create_booking_atomic`) will encapsulate pricing calculation, room selection, and booking creation within a single transaction.

### Contract Specification (Design Document)

```sql
-- Signature
create_booking_atomic(
    p_hotel_id UUID,
    p_room_category_id UUID,
    p_check_in DATE,
    p_check_out DATE,
    p_guest_details JSONB,
    p_add_on_ids TEXT[],
    p_payment_method TEXT
) RETURNS JSONB;
```

### Transaction Steps
1. **Input Validation**: Check dates (`p_check_out > p_check_in`), calculate `v_nights`.
2. **Fetch Category & Rate**:
   ```sql
   SELECT base_rate_nightly, name INTO v_rate, v_category_name
   FROM public.room_categories
   WHERE id = p_room_category_id AND hotel_id = p_hotel_id AND is_active = true;
   ```
3. **Lock & Allocate Available Physical Room**:
   Select an available room under that category that is not reserved for the requested dates:
   ```sql
   SELECT id INTO v_room_id
   FROM public.rooms r
   WHERE r.hotel_id = p_hotel_id
     AND r.category_id = p_room_category_id
     AND r.is_active = true
     AND r.operational_status NOT IN ('maintenance', 'out_of_order')
     AND NOT EXISTS (
         SELECT 1 FROM public.bookings b
         WHERE b.room_id = r.id
           AND b.booking_status IN ('pending', 'confirmed', 'checked_in')
           AND b.stay_range && daterange(p_check_in, p_check_out, '[)')
     )
   ORDER BY r.room_number ASC
   LIMIT 1
   FOR UPDATE SKIP LOCKED;
   ```
   If no row is returned, raise exception `'No rooms of this tier are available for the selected dates.'`.
4. **Calculate Financials Server-Side**:
   - `v_room_subtotal := v_rate * v_nights;`
   - Calculate add-on sum from `public.add_on_services`.
   - Calculate VAT and total.
5. **Insert Booking**:
   Insert row into `public.bookings`. If another transaction slipped in, the GiST exclusion constraint guarantees an immediate rollback and prevents duplicates.
6. **Insert Itemized Add-Ons**:
   Insert into `public.booking_add_ons`.
7. **Create Pending Payment Record**:
   Insert into `public.payments`.
8. **Return Confirmation**:
   Returns booking reference, allocated room number, and grand total.
