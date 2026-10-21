# Lodgekeys Database Schema & Entity Relationship Documentation

This document specifies the PostgreSQL relational schema implemented for Lodgekeys (Phase 1: Foundation). The schema maps directly to the domain objects, operational statuses, and security boundaries required by the Lodgekeys hotel discovery and reservation platform.

---

## 1. Entity Relationship Overview

```
                      +-------------------+
                      |   auth.users      |
                      +---------+---------+
                                | 1:1
                                v
                      +-------------------+
                      |     profiles      |
                      +---+-----------+---+
                          | 1:N       | 1:N
                          |           +-------------------------+
                          v                                     v
                +-------------------+                 +-------------------+
                |   saved_hotels    |                 |   notifications   |
                +---------+---------+                 +-------------------+
                          |
                          | N:1
                          v
+-------------------+   +-------------------+   1:N   +-------------------+
| hotel_applications|-->|      hotels       +-------->|  hotel_managers   |
+-------------------+   +---+-----------+---+         +-------------------+
                            | 1:N       | 1:N
                            v           +-------------------------+
                  +-------------------+                           v
                  |  room_categories  |                 +-------------------+
                  +---------+---------+                 |  add_on_services  |
                            | 1:N                       +---------+---------+
                            v                                     |
                  +-------------------+                           |
                  |       rooms       |                           |
                  +---------+---------+                           |
                            | 1:N                                 |
                            v                                     |
                  +-------------------+       1:N                 |
                  |     bookings      +-----------------+         |
                  +---+-----------+---+                 |         |
                      | 1:N       | 1:N                 v         |
                      v           v            +------------------+-+
             +----------+   +-------------+    |  booking_add_ons   |
             | payments |   | settlements |    +--------------------+
             +----------+   +-------------+
```

---

## 2. Table Specifications

### 2.1 `profiles`
Links directly to Supabase Auth (`auth.users`) to represent platform actors with strict role boundaries.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY, REFERENCES auth.users(id) ON DELETE CASCADE` | Identity ID from Supabase Auth |
| `full_name` | `TEXT` | `NOT NULL` | Display/Legal name |
| `email` | `TEXT` | `NOT NULL, UNIQUE` | Normalized lowercase email |
| `phone` | `TEXT` | `NULLABLE` | Guest / Manager contact telephone |
| `role` | `TEXT` | `NOT NULL, DEFAULT 'customer', CHECK (role IN ('customer', 'hotel_manager', 'admin'))` | System role |
| `initials` | `TEXT` | `NULLABLE` | Cached two-letter avatar initials |
| `avatar_url` | `TEXT` | `NULLABLE` | Profile picture URI |
| `created_at` | `TIMESTAMPTZ`| `NOT NULL, DEFAULT now()` | Registration timestamp |
| `updated_at` | `TIMESTAMPTZ`| `NOT NULL, DEFAULT now()` | Mutation timestamp |

**Security Controls:**
- Protected by `trg_prevent_role_escalation` trigger: Non-admin users cannot alter their role.
- Auto-provisioned by `on_auth_user_created` trigger on `auth.users` with `role = 'customer'` strictly.

---

### 2.2 `hotels`
Core directory of properties in Abraka and surrounding regions.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY, DEFAULT gen_random_uuid()` | Unique property ID |
| `slug` | `TEXT` | `NOT NULL, UNIQUE` | URL-safe identifier (e.g. `the-river-house-retreat`) |
| `name` | `TEXT` | `NOT NULL` | Property name |
| `sub_tag` | `TEXT` | `NULLABLE` | Sub-heading tag (e.g. `RESORT · RIVERFRONT`) |
| `badge` | `TEXT` | `NULLABLE` | Marketing badge (e.g. `Curated Stay`) |
| `location` | `TEXT` | `NULLABLE` | Display location (e.g. `Riverfront · Abraka`) |
| `area` | `TEXT` | `NOT NULL` | Area cluster (`Riverfront`, `Town Centre`, `Campus Gate`, etc.) |
| `address` | `TEXT` | `NOT NULL` | Full physical address |
| `category` | `TEXT` | `NOT NULL, CHECK (category IN ('Resort', 'Luxury', 'Boutique', 'Eco-Lodge', 'Hotel', 'Apartment', 'Standard'))` | Property classification |
| `latitude` | `DOUBLE PRECISION` | `NULLABLE` | Geocoordinates latitude |
| `longitude`| `DOUBLE PRECISION` | `NULLABLE` | Geocoordinates longitude |
| `rating` | `NUMERIC(2,1)`| `NOT NULL, DEFAULT 5.0, CHECK (rating >= 1.0 AND rating <= 5.0)` | Aggregated guest rating |
| `reviews_count` | `INTEGER` | `NOT NULL, DEFAULT 0, CHECK (reviews_count >= 0)` | Total verified guest reviews |
| `tagline` | `TEXT` | `NULLABLE` | One-sentence summary |
| `description` | `TEXT` | `NOT NULL` | Full property overview |
| `about_headline`| `TEXT` | `NULLABLE` | About section headline |
| `about_overview`| `TEXT` | `NULLABLE` | Extended story / details |
| `image_url` | `TEXT` | `NULLABLE` | Primary thumbnail image |
| `hero_image_url`| `TEXT` | `NULLABLE` | Banner / hero image |
| `secondary_gallery`| `JSONB` | `NOT NULL, DEFAULT '{"main":"","top":"","bottom":""}'::jsonb` | 3-photo grid assets |
| `gallery_images` | `JSONB` | `NOT NULL, DEFAULT '[]'::jsonb` | Full photo gallery list with captions |
| `amenities` | `TEXT[]` | `NOT NULL, DEFAULT '{}'` | Amenity slugs (`wifi`, `pool`, `restaurant`, etc.) |
| `extras` | `JSONB` | `NOT NULL, DEFAULT '[]'::jsonb` | Highlight cards with title & icon |
| `contact_email` | `TEXT` | `NULLABLE` | Official property desk email |
| `contact_phone` | `TEXT` | `NULLABLE` | Front desk phone number |
| `website` | `TEXT` | `NULLABLE` | Official hotel website |
| `check_in_time` | `TEXT` | `NOT NULL, DEFAULT '2:00 PM'` | Check-in policy time |
| `check_out_time`| `TEXT` | `NOT NULL, DEFAULT '11:00 AM'` | Check-out policy time |
| `arrival_policy`| `TEXT` | `NULLABLE` | Check-in instructions & ID rules |
| `cancellation_policy`| `TEXT` | `NULLABLE` | Cancellation terms |
| `starting_rate` | `NUMERIC(12,2)` | `NOT NULL, DEFAULT 0.00` | Baseline per-night starting rate (NGN) |
| `is_published` | `BOOLEAN` | `NOT NULL, DEFAULT true` | Public visibility flag |
| `is_delisted` | `BOOLEAN` | `NOT NULL, DEFAULT false` | Temporary delisting flag |
| `is_deleted` | `BOOLEAN` | `NOT NULL, DEFAULT false` | Soft-deletion flag |

---

### 2.3 `hotel_managers`
Junction table mapping property managers to their authorized hotels.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY, DEFAULT gen_random_uuid()` | Assignment ID |
| `hotel_id` | `UUID` | `NOT NULL, REFERENCES hotels(id) ON DELETE CASCADE` | Assigned property |
| `user_id` | `UUID` | `NOT NULL, REFERENCES profiles(id) ON DELETE CASCADE` | Assigned manager |
| `is_primary` | `BOOLEAN` | `NOT NULL, DEFAULT true` | Primary manager flag |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT now()` | Assignment timestamp |

Constraint: `UNIQUE (hotel_id, user_id)`.

---

### 2.4 `hotel_applications`
Tracks property onboarding applications submitted by hotel owners or administrators.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY, DEFAULT gen_random_uuid()` | Application UUID |
| `reference_code` | `TEXT` | `NOT NULL, UNIQUE` | Reference code (e.g. `APP-2026-081`) |
| `name` | `TEXT` | `NOT NULL` | Proposed hotel name |
| `slug` | `TEXT` | `NOT NULL` | Proposed slug |
| `owner_name` | `TEXT` | `NOT NULL` | Applicant name |
| `contact_email` | `TEXT` | `NOT NULL` | Applicant email |
| `contact_phone` | `TEXT` | `NOT NULL` | Applicant phone |
| `area` | `TEXT` | `NOT NULL` | Region / area cluster |
| `address` | `TEXT` | `NOT NULL` | Physical property address |
| `category` | `TEXT` | `NOT NULL` | Proposed category |
| `starting_rate` | `NUMERIC(12,2)` | `NOT NULL, DEFAULT 40000.00` | Baseline nightly rate |
| `total_rooms` | `INTEGER` | `NOT NULL, DEFAULT 10` | Room count |
| `documents` | `TEXT` | `NULLABLE` | CAC / registration references |
| `description` | `TEXT` | `NULLABLE` | Proposed property overview |
| `status` | `TEXT` | `NOT NULL, DEFAULT 'pending', CHECK (status IN ('pending', 'approved', 'declined'))` | Workflow state |
| `submitted_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT now()` | Submission timestamp |
| `reviewed_at` | `TIMESTAMPTZ` | `NULLABLE` | Review timestamp |
| `reviewed_by` | `UUID` | `REFERENCES profiles(id) ON DELETE SET NULL` | Reviewing admin |
| `feedback` | `TEXT` | `DEFAULT ''` | Admin notes / decline rationale |
| `created_hotel_id`| `UUID` | `REFERENCES hotels(id) ON DELETE SET NULL` | Linked hotel record if approved |

---

### 2.5 `room_categories`
Defines room tiers (e.g. Deluxe Garden Room, Executive Suite, Family Suite).

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY, DEFAULT gen_random_uuid()` | Tier UUID |
| `hotel_id` | `UUID` | `NOT NULL, REFERENCES hotels(id) ON DELETE CASCADE` | Parent hotel |
| `slug` | `TEXT` | `NOT NULL` | Tier slug (e.g. `deluxe-garden`) |
| `name` | `TEXT` | `NOT NULL` | Display tier title |
| `bed_configuration`| `TEXT` | `NOT NULL` | Bed layout (e.g. `King bed`) |
| `capacity` | `TEXT` | `NOT NULL` | Human label (e.g. `Up to 2 guests`) |
| `max_guests` | `INTEGER` | `NOT NULL, DEFAULT 2` | Maximum guest capacity |
| `room_size` | `TEXT` | `NULLABLE` | Physical dimensions (e.g. `38 m²`) |
| `view_description`| `TEXT` | `NULLABLE` | Outlook (e.g. `Tropical Garden & Courtyard`) |
| `features` | `TEXT` | `NULLABLE` | Feature pill summary string |
| `base_rate_nightly`| `NUMERIC(12,2)` | `NOT NULL` | Nightly rate (NGN) |
| `image_url` | `TEXT` | `NULLABLE` | Room showcase photo |
| `description` | `TEXT` | `NULLABLE` | Detailed description |
| `is_active` | `BOOLEAN` | `NOT NULL, DEFAULT true` | Active listing status |

Constraint: `UNIQUE (hotel_id, slug)`.

---

### 2.6 `rooms`
Physical room units under each hotel. Represents operational housekeeping/maintenance state separately from reservation availability.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY, DEFAULT gen_random_uuid()` | Physical room UUID |
| `hotel_id` | `UUID` | `NOT NULL, REFERENCES hotels(id) ON DELETE CASCADE` | Property ID |
| `category_id` | `UUID` | `NOT NULL, REFERENCES room_categories(id) ON DELETE RESTRICT` | Associated room tier |
| `room_number` | `TEXT` | `NOT NULL` | Physical door identifier (e.g. `101`, `204`, `V-02`) |
| `floor` | `INTEGER` | `NOT NULL, DEFAULT 1` | Floor number |
| `operational_status`| `TEXT` | `NOT NULL, DEFAULT 'available', CHECK (operational_status IN ('available', 'occupied', 'reserved', 'maintenance', 'cleaning', 'out_of_order'))` | Front desk physical status |
| `is_active` | `BOOLEAN` | `NOT NULL, DEFAULT true` | Enabled in active inventory |
| `last_cleaned_at` | `DATE` | `DEFAULT CURRENT_DATE` | Last housekeeping stamp |

Constraint: `UNIQUE (hotel_id, room_number)`.

---

### 2.7 `add_on_services`
Bookable services (Pool passes, Gym access, River boat excursions).

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `TEXT` | `PRIMARY KEY` | Unique service slug (e.g. `pool-pass`, `gym-access`) |
| `hotel_id` | `UUID` | `REFERENCES hotels(id) ON DELETE CASCADE` | NULL for platform-wide, or specific hotel UUID |
| `title` | `TEXT` | `NOT NULL` | Service name |
| `price` | `NUMERIC(12,2)` | `NOT NULL` | Price in NGN |
| `price_formatted` | `TEXT` | `NULLABLE` | Display formatted price (e.g. `₦5,000`) |
| `description` | `TEXT` | `NULLABLE` | Service description |
| `icon` | `TEXT` | `NULLABLE` | Lucide icon identifier (`waves`, `dumbbell`, `ship`) |
| `is_active` | `BOOLEAN` | `NOT NULL, DEFAULT true` | Active flag |

---

### 2.8 `bookings`
Stores reservation records, calculated financials, guest details, and booking lifecycles.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY, DEFAULT gen_random_uuid()` | Unique booking record ID |
| `booking_reference` | `TEXT` | `NOT NULL, UNIQUE` | Customer reference (e.g. `LK-97AB028B`) |
| `customer_id` | `UUID` | `REFERENCES profiles(id) ON DELETE SET NULL` | Booking guest account |
| `hotel_id` | `UUID` | `NOT NULL, REFERENCES hotels(id) ON DELETE RESTRICT` | Booked hotel |
| `room_id` | `UUID` | `NOT NULL, REFERENCES rooms(id) ON DELETE RESTRICT` | Allocated physical room |
| `room_category_id` | `UUID` | `REFERENCES room_categories(id) ON DELETE SET NULL` | Reserved category |
| `check_in_date` | `DATE` | `NOT NULL` | Arrival date |
| `check_out_date` | `DATE` | `NOT NULL` | Departure date |
| `stay_range` | `DATERANGE` | `GENERATED ALWAYS AS (daterange(check_in_date, check_out_date, '[)')) STORED` | Half-open stay interval |
| `nights_count` | `INTEGER` | `NOT NULL, CHECK (nights_count >= 1)` | Duration in nights |
| `rooms_count` | `INTEGER` | `NOT NULL, DEFAULT 1, CHECK (rooms_count >= 1)` | Room units |
| `guests_count` | `INTEGER` | `NOT NULL, DEFAULT 1, CHECK (guests_count >= 1)` | Guest count |
| `guests_display` | `TEXT` | `NULLABLE` | UI string (e.g. `2 Guests, 1 Room`) |
| `guest_full_name` | `TEXT` | `NOT NULL` | Primary guest name |
| `guest_email` | `TEXT` | `NOT NULL` | Confirmation email |
| `guest_phone` | `TEXT` | `NOT NULL` | Contact phone |
| `guest_special_requests`| `TEXT`| `NULLABLE` | Guest requests |
| `nightly_rate` | `NUMERIC(12,2)` | `NOT NULL` | Nightly room rate |
| `room_subtotal` | `NUMERIC(12,2)` | `NOT NULL` | Nightly rate * nights * rooms |
| `add_ons_total` | `NUMERIC(12,2)` | `NOT NULL, DEFAULT 0.00` | Sum of selected add-on passes |
| `tax_rate_pct` | `NUMERIC(5,2)` | `NOT NULL, DEFAULT 0.00` | VAT / tourism levy percentage |
| `tax_amount` | `NUMERIC(12,2)` | `NOT NULL, DEFAULT 0.00` | Computed tax |
| `grand_total` | `NUMERIC(12,2)` | `NOT NULL` | Subtotal + AddOns + Tax |
| `payment_method` | `TEXT` | `NOT NULL, CHECK (payment_method IN ('hotel', 'card', 'transfer'))` | Chosen payment channel |
| `booking_status` | `TEXT` | `NOT NULL, DEFAULT 'confirmed', CHECK (booking_status IN ('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'expired'))` | Reservation state machine |
| `checked_in_at` | `TIMESTAMPTZ` | `NULLABLE` | Front desk check-in stamp |
| `checked_out_at`| `TIMESTAMPTZ` | `NULLABLE` | Front desk check-out stamp |
| `cancelled_at` | `TIMESTAMPTZ` | `NULLABLE` | Cancellation stamp |
| `cancellation_reason`| `TEXT` | `NULLABLE` | Cancellation notes |
| `hold_expires_at`| `TIMESTAMPTZ` | `NULLABLE` | Temporary inventory hold expiration |

**Constraints:**
- `CONSTRAINT chk_booking_dates CHECK (check_out_date > check_in_date)`
- `CONSTRAINT exclude_overlapping_room_bookings EXCLUDE USING gist (room_id WITH =, stay_range WITH &&) WHERE (booking_status IN ('pending', 'confirmed', 'checked_in'))`

---

### 2.9 `booking_add_ons`
Itemized add-ons attached to a reservation.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY, DEFAULT gen_random_uuid()` | Item record ID |
| `booking_id` | `UUID` | `NOT NULL, REFERENCES bookings(id) ON DELETE CASCADE` | Linked booking |
| `service_id` | `TEXT` | `NOT NULL, REFERENCES add_on_services(id) ON DELETE RESTRICT` | Service slug |
| `service_title` | `TEXT` | `NOT NULL` | Snapshot of title at booking time |
| `unit_price` | `NUMERIC(12,2)` | `NOT NULL` | Snapshot of unit price |
| `quantity` | `INTEGER` | `NOT NULL, DEFAULT 1` | Quantity |
| `total_price` | `NUMERIC(12,2)` | `NOT NULL` | `unit_price * quantity` |

---

### 2.10 `payments`
Tracks payment attempts, manual cash/front-desk receipts, and verified payment gateway records.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY, DEFAULT gen_random_uuid()` | Payment record ID |
| `booking_id` | `UUID` | `NOT NULL, REFERENCES bookings(id) ON DELETE RESTRICT` | Linked booking |
| `transaction_reference` | `TEXT` | `NOT NULL, UNIQUE` | Unique transaction reference |
| `amount` | `NUMERIC(12,2)` | `NOT NULL` | Transaction amount |
| `currency` | `TEXT` | `NOT NULL, DEFAULT 'NGN'` | Currency code |
| `payment_method` | `TEXT` | `NOT NULL, CHECK (payment_method IN ('card', 'transfer', 'hotel'))` | Payment method |
| `payment_status` | `TEXT` | `NOT NULL, DEFAULT 'pending', CHECK (payment_status IN ('pending', 'verified', 'manually_recorded', 'failed', 'refunded'))` | Verification state |
| `is_verified` | `BOOLEAN` | `NOT NULL, DEFAULT false` | Verified status flag |
| `verification_channel` | `TEXT` | `NULLABLE` | Gateway webhook, front-desk, or bank slip |
| `verified_at` | `TIMESTAMPTZ` | `NULLABLE` | Verification timestamp |
| `verified_by` | `UUID` | `REFERENCES profiles(id) ON DELETE SET NULL` | Reviewing agent |
| `commission_pct` | `NUMERIC(5,2)` | `NOT NULL, DEFAULT 10.00` | Platform commission percent |
| `commission_amount` | `NUMERIC(12,2)`| `NOT NULL, DEFAULT 0.00` | Platform commission cut |
| `net_payout_amount` | `NUMERIC(12,2)`| `NOT NULL, DEFAULT 0.00` | Hotel net cut |
| `notes` | `TEXT` | `NULLABLE` | Payment audit notes |

---

### 2.11 `settlements`
Periodic platform payouts to hotel partners.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY, DEFAULT gen_random_uuid()` | Settlement ID |
| `hotel_id` | `UUID` | `NOT NULL, REFERENCES hotels(id) ON DELETE RESTRICT` | Recipient hotel |
| `reference_code` | `TEXT` | `NOT NULL, UNIQUE` | Payout reference (e.g. `SETTLE-2026-10-001`) |
| `period_start` | `DATE` | `NOT NULL` | Accounting period start |
| `period_end` | `DATE` | `NOT NULL` | Accounting period end |
| `gross_amount` | `NUMERIC(12,2)` | `NOT NULL` | Total GMV for period |
| `commission_deducted`| `NUMERIC(12,2)` | `NOT NULL` | Platform commission retained |
| `net_disbursed` | `NUMERIC(12,2)` | `NOT NULL` | Net funds transferred |
| `settlement_status` | `TEXT` | `NOT NULL, DEFAULT 'pending', CHECK (settlement_status IN ('pending', 'processing', 'completed', 'disputed'))` | Payout lifecycle state |
| `paid_at` | `TIMESTAMPTZ` | `NULLABLE` | Payment execution timestamp |
| `processed_by` | `UUID` | `REFERENCES profiles(id) ON DELETE SET NULL` | Administrator who processed payout |
| `proof_reference` | `TEXT` | `NULLABLE` | Bank transfer reference or receipt |

---

### 2.12 `saved_hotels`
Customer saved hotels (favorites).

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY, DEFAULT gen_random_uuid()` | Record UUID |
| `user_id` | `UUID` | `NOT NULL, REFERENCES profiles(id) ON DELETE CASCADE` | Guest account |
| `hotel_id` | `UUID` | `NOT NULL, REFERENCES hotels(id) ON DELETE CASCADE` | Saved property |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT now()` | Timestamp |

Constraint: `UNIQUE (user_id, hotel_id)`.

---

### 2.13 `notifications`
Persistent notifications for booking confirmations, check-in receipts, and front-desk updates.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY, DEFAULT gen_random_uuid()` | Notification UUID |
| `user_id` | `UUID` | `NOT NULL, REFERENCES profiles(id) ON DELETE CASCADE` | Recipient user |
| `title` | `TEXT` | `NOT NULL` | Notification title |
| `message` | `TEXT` | `NOT NULL` | Notification body |
| `booking_reference` | `TEXT` | `NULLABLE` | Associated booking reference |
| `metadata` | `JSONB` | `NOT NULL, DEFAULT '{}'::jsonb` | Payload snapshot |
| `is_read` | `BOOLEAN` | `NOT NULL, DEFAULT false` | Read status |
| `read_at` | `TIMESTAMPTZ` | `NULLABLE` | Read timestamp |

---

### 2.14 `platform_settings`
Configurable fee parameters and platform variables.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY, DEFAULT gen_random_uuid()` | Config UUID |
| `key` | `TEXT` | `NOT NULL, UNIQUE` | Setting key (e.g. `platform_commission`) |
| `value` | `JSONB` | `NOT NULL` | JSON configuration value |
| `description` | `TEXT` | `NULLABLE` | Description of setting |
| `updated_by` | `UUID` | `REFERENCES profiles(id) ON DELETE SET NULL` | Editing admin |

---

### 2.15 `audit_logs`
Immutable audit log tracking administrative actions, property approval, booking status transitions, and role modifications.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY, DEFAULT gen_random_uuid()` | Log UUID |
| `actor_id` | `UUID` | `REFERENCES profiles(id) ON DELETE SET NULL` | User who initiated action |
| `actor_role` | `TEXT` | `NULLABLE` | Actor's role at time of action |
| `action_type` | `TEXT` | `NOT NULL` | Action code (`HOTEL_APPLICATION_APPROVED`, etc.) |
| `target_entity` | `TEXT` | `NOT NULL` | Target table (`hotels`, `bookings`, `profiles`) |
| `target_id` | `TEXT` | `NOT NULL` | Primary key of modified entity |
| `metadata` | `JSONB` | `NOT NULL, DEFAULT '{}'::jsonb` | Sanitized context (PII/secrets omitted) |
| `ip_address` | `TEXT` | `NULLABLE` | Client IP |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT now()` | Execution timestamp |
