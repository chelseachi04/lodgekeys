# Lodgekeys Security Architecture & Row Level Security (RLS) Documentation

## 1. Security Philosophy: Least Privilege & Zero Trust

In client-side architectures like React + Supabase, the browser runs in an untrusted environment. Lodgekeys enforces defense-in-depth where authorization decisions are executed inside PostgreSQL using:
1. **Row Level Security (RLS)** on all 15 public tables.
2. **PostgreSQL Triggers** enforcing business invariants (e.g., role-escalation prevention).
3. **`SECURITY DEFINER` Functions** with locked `search_path = public` for sensitive operations (e.g., application approval).
4. **Foreign Key and Check Constraints** validating domain invariants.

---

## 2. Threat Model & Defenses

| Threat Scenario | Vector | Mitigation Strategy |
| :--- | :--- | :--- |
| **Role Escalation via Profile Edit** | Attacker calls `.update({ role: 'admin' })` on their profile | Handled by `trg_prevent_role_escalation` trigger before update. If `NEW.role != OLD.role` and caller is not an admin, the transaction throws an immediate fatal exception. |
| **Unauthorized Role on Signup** | Attacker specifies `{ "role": "admin" }` in user signup metadata | Handled by `handle_new_user()` trigger. The trigger explicitly hardcodes `'customer'` for all new signups regardless of input metadata. |
| **Cross-Tenant Hotel Spoofing** | Manager of Hotel A updates rooms or images for Hotel B | RLS verifies `public.has_hotel_access(hotel_id)`. The database checks `hotel_managers` against `auth.uid()`, ignoring any spoofed header or client ID. |
| **Guest Data Leakage** | Unauthenticated scraper queries `bookings` or `payments` | Tables deny unauthenticated SELECT. Customers only see their own `customer_id = auth.uid()`. Managers only see guests with bookings at their authorized hotel. |
| **Direct Payout/Payment Tampering** | User sets `is_verified = true` or fabricates paid settlements | Unprivileged users can only insert unverified `pending` payment records linked to their own booking. Verification and settlements require `public.is_admin()`. |
| **Storage Asset Tampering** | Manager uploads or overwrites pictures in another hotel's directory | Storage RLS verifies that the first path segment `(storage.foldername(name))[1]` matches a hotel slug where the manager is authorized in `hotel_managers`. |

---

## 3. Security Definer Helper Functions

### 3.1 `public.is_admin()`
```sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM public.profiles 
        WHERE id = auth.uid() 
          AND role = 'admin'
    );
$$;
```
- **Reasoning**: Avoids recursive RLS policy evaluations while providing a single authoritative source of admin identity evaluated against `auth.uid()`.
- **Search Path Isolation**: Explicitly sets `search_path = public` to prevent search path hijacking.

### 3.2 `public.has_hotel_access(hotel_uuid UUID)`
```sql
CREATE OR REPLACE FUNCTION public.has_hotel_access(hotel_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT (
        public.is_admin() OR EXISTS (
            SELECT 1 
            FROM public.hotel_managers 
            WHERE hotel_id = hotel_uuid 
              AND user_id = auth.uid()
        )
    );
$$;
```
- **Reasoning**: Grants permissions only if the authenticated user is either a verified platform admin or an assigned manager for the target hotel.

---

## 4. Table-by-Table RLS Policy Matrix

| Table | Policy Name | Command | Who | USING / WITH CHECK Clause |
| :--- | :--- | :--- | :--- | :--- |
| **profiles** | `profiles_select_own_or_admin_or_hotel_guest` | `SELECT` | User, Admin, Assigned Manager | `id = auth.uid() OR public.is_admin() OR (manager has booking with this guest)` |
| | `profiles_update_own` | `UPDATE` | User, Admin | `(id = auth.uid() OR public.is_admin())` |
| | `profiles_insert_own` | `INSERT` | User | `id = auth.uid() AND (role = 'customer' OR public.is_admin())` |
| | `profiles_delete_own_or_admin` | `DELETE` | User, Admin | `id = auth.uid() OR public.is_admin()` |
| **hotels** | `hotels_select_public_or_manager` | `SELECT` | Public, Manager, Admin | `(is_published = true AND is_delisted = false AND is_deleted = false) OR public.has_hotel_access(id)` |
| | `hotels_update_manager_or_admin` | `UPDATE` | Manager, Admin | `public.has_hotel_access(id)` |
| | `hotels_insert_admin` | `INSERT` | Admin | `public.is_admin()` |
| | `hotels_delete_admin` | `DELETE` | Admin | `public.is_admin()` |
| **hotel_managers** | `hotel_managers_select` | `SELECT` | Manager, Admin | `user_id = auth.uid() OR public.is_admin()` |
| | `hotel_managers_admin_manage` | `ALL` | Admin | `public.is_admin()` |
| **hotel_applications** | `hotel_applications_select` | `SELECT` | Applicant, Admin | `public.is_admin() OR contact_email = (current user email)` |
| | `hotel_applications_insert` | `INSERT` | Authenticated | `auth.uid() IS NOT NULL AND status = 'pending'` |
| | `hotel_applications_update_admin` | `UPDATE` | Admin | `public.is_admin()` |
| **room_categories** | `room_categories_select` | `SELECT` | Public, Manager, Admin | Active on published hotel OR `public.has_hotel_access(hotel_id)` |
| | `room_categories_manage` | `ALL` | Manager, Admin | `public.has_hotel_access(hotel_id)` |
| **rooms** | `rooms_select` | `SELECT` | Public, Manager, Admin | Available on published hotel OR `public.has_hotel_access(hotel_id)` |
| | `rooms_manage` | `ALL` | Manager, Admin | `public.has_hotel_access(hotel_id)` |
| **add_on_services** | `add_ons_select` | `SELECT` | Public | `is_active = true OR public.is_admin()` |
| | `add_ons_manage` | `ALL` | Manager, Admin | `public.is_admin() OR public.has_hotel_access(hotel_id)` |
| **bookings** | `bookings_select` | `SELECT` | Customer, Manager, Admin | `customer_id = auth.uid() OR public.has_hotel_access(hotel_id)` |
| | `bookings_insert_customer` | `INSERT` | Customer | `(customer_id = auth.uid() OR customer_id IS NULL) OR public.has_hotel_access(hotel_id)` |
| | `bookings_update` | `UPDATE` | Customer, Manager | `customer_id = auth.uid() OR public.has_hotel_access(hotel_id)` |
| | `bookings_delete_admin` | `DELETE` | Admin | `public.is_admin()` |
| **booking_add_ons** | `booking_add_ons_select` | `SELECT` | Customer, Manager, Admin | Inherits visibility of parent booking |
| | `booking_add_ons_insert` | `INSERT` | Customer, Admin | Inherits creation rights of parent booking |
| **payments** | `payments_select` | `SELECT` | Customer, Manager, Admin | Read payment records for user's own booking or managed hotel |
| | `payments_insert` | `INSERT` | Customer, Manager, Admin | Customer can create unverified pending payment; Manager can record manual front-desk receipt |
| | `payments_update` | `UPDATE` | Manager, Admin | Manage front-desk manual receipt state or admin audit override |
| **settlements** | `settlements_select` | `SELECT` | Manager, Admin | `public.has_hotel_access(hotel_id)` |
| | `settlements_admin_manage` | `ALL` | Admin | `public.is_admin()` |
| **saved_hotels** | `saved_hotels_manage_own` | `ALL` | Customer | `user_id = auth.uid()` |
| **notifications** | `notifications_select_own` | `SELECT` | Customer | `user_id = auth.uid()` |
| | `notifications_update_own` | `UPDATE` | Customer | `user_id = auth.uid()` |
| | `notifications_delete_own` | `DELETE` | Customer | `user_id = auth.uid()` |
| | `notifications_insert_system_or_own`| `INSERT` | Customer, Admin | `user_id = auth.uid() OR public.is_admin()` |
| **platform_settings** | `platform_settings_select` | `SELECT` | Authenticated | `auth.uid() IS NOT NULL` |
| | `platform_settings_admin_manage` | `ALL` | Admin | `public.is_admin()` |
| **audit_logs** | `audit_logs_select_admin` | `SELECT` | Admin | `public.is_admin()` |
| | `audit_logs_insert` | `INSERT` | Authenticated | `auth.uid() IS NOT NULL OR public.is_admin()` |

---

## 5. Safe Initial Administrator Account Provisioning

Under our design rules:
- **Do not automatically grant the first registered user an administrator role.**
- All user registrations through `auth.users` default strictly to `customer`.

### Trusted Administrative Procedure

To provision the first administrator account safely:

1. **Sign up the designated administrator user** through the application or Supabase Auth dashboard using a strong, verified password and company email address (e.g. `admin@lodgekeys.com`).
2. **Execute the trusted administrative SQL elevation script** in the Supabase Dashboard SQL Editor (or via direct psql connection):

```sql
-- Trusted Administrative Elevation Procedure
DO $$
DECLARE
    v_admin_email TEXT := 'admin@lodgekeys.com'; -- Replace with the verified admin email
    v_user_id UUID;
BEGIN
    SELECT id INTO v_user_id 
    FROM auth.users 
    WHERE LOWER(email) = LOWER(v_admin_email);

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Target user "%" does not exist in auth.users. Please sign up first.', v_admin_email;
    END IF;

    -- Elevate role in public.profiles
    UPDATE public.profiles
    SET role = 'admin',
        updated_at = now()
    WHERE id = v_user_id;

    -- Record in audit log
    INSERT INTO public.audit_logs (
        actor_id,
        actor_role,
        action_type,
        target_entity,
        target_id,
        metadata
    ) VALUES (
        v_user_id,
        'admin',
        'INITIAL_ADMIN_PROVISIONED',
        'profiles',
        v_user_id::text,
        jsonb_build_object('elevated_email', v_admin_email, 'executed_at', now())
    );

    RAISE NOTICE 'User "%" (ID: %) successfully elevated to administrator.', v_admin_email, v_user_id;
END;
$$;
```

This procedure guarantees that administrative privilege cannot be seized programmatically through the client API.
