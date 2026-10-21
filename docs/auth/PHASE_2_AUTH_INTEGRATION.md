# Lodgekeys Phase 2: Supabase Authentication & Role-Based Profiles

This document summarizes the integration of real Supabase Auth into Lodgekeys, dynamic role and property resolution from the database, and how to verify real and demo users.

---

## 1. Architecture & Authentication Flow

```
[User Form / Social]
       |
       v
[AuthContext (React)]
       |
       +---> supabase.auth.signInWithPassword({ email, password })
       |     OR
       |     supabase.auth.signUp({ email, password, options: { data: { full_name, phone } } })
       |
       v
[Supabase Auth (GoTrue)]
       |
       +--- (Trigger on_auth_user_created automatically provisions public.profiles)
       |
       v
[Fetch Profile & Role (public.profiles)]
       |
       +---> role === 'customer'      ---> Redirect to /dashboard
       +---> role === 'admin'         ---> Redirect to /admin/dashboard
       +---> role === 'hotel_manager' ---> Query public.hotel_managers & public.hotels
                                           Fetch assigned hotel slug (e.g., 'the-river-house-retreat')
                                           Populate currentUser.assignedHotel
                                           Redirect to /manager/dashboard
```

---

## 2. Dynamic Manager Property Resolution

In the original mock setup, the hotel manager dashboard hardcoded The River House Retreat (`MANAGER_HOTEL_SLUG`).

In Phase 2:
1. When a user with `role === 'hotel_manager'` authenticates, `AuthContext` queries:
   ```sql
   SELECT hotel_id, is_primary, hotels:hotel_id ( id, slug, name )
   FROM public.hotel_managers
   WHERE user_id = auth.uid();
   ```
2. The property slug is assigned to `currentUser.assignedHotel` and `currentUser.hotelSlug`.
3. The Manager Dashboard (`ManagerDashboard.jsx`) reads `currentUser?.assignedHotel`, dynamically scoping:
   - Reservations
   - Room inventory
   - Activity feeds
   - Property settings
4. Multi-tenant property isolation is enforced at both the client and PostgreSQL Row Level Security levels.

---

## 3. Role-Based Redirection Matrix

| Role in `public.profiles` | Authorized Route | Description |
| :--- | :--- | :--- |
| `customer` | `/dashboard` | Customer dashboard for reservation history, saved stays, and profile preferences |
| `hotel_manager` | `/manager/dashboard` | Property management portal for front-desk operations, room inventory, and check-in |
| `admin` | `/admin/dashboard` | Administrative console for onboarding review, platform fees, and system audit logs |

---

## 4. Testing Real Users in Supabase

### A. Customer User Registration
1. Click **Sign In** in the top navbar.
2. Select the **Create Account** tab.
3. Fill in Full Name, Email, and Password (minimum 6 characters).
4. Click **Create Account**.
5. Supabase Auth generates the auth identity, and trigger `on_auth_user_created` creates the profile with `role = 'customer'`.
6. You are automatically redirected to `/dashboard`.

### B. Property Manager User Setup
1. Register an account in Supabase with the manager's email (e.g. `manager@lodgekeys.com`).
2. Run the SQL snippet to assign the manager role and property in the Supabase SQL Editor:
   ```sql
   -- Elevate user to hotel_manager and link to hotel
   DO $$
   DECLARE
       v_manager_email TEXT := 'manager@lodgekeys.com';
       v_user_id UUID;
       v_hotel_id UUID;
   BEGIN
       SELECT id INTO v_user_id FROM auth.users WHERE LOWER(email) = LOWER(v_manager_email);
       SELECT id INTO v_hotel_id FROM public.hotels WHERE slug = 'the-river-house-retreat';

       IF v_user_id IS NOT NULL AND v_hotel_id IS NOT NULL THEN
           UPDATE public.profiles SET role = 'hotel_manager' WHERE id = v_user_id;

           INSERT INTO public.hotel_managers (hotel_id, user_id, is_primary)
           VALUES (v_hotel_id, v_user_id, true)
           ON CONFLICT (hotel_id, user_id) DO NOTHING;
       END IF;
   END;
   $$;
   ```
3. Sign in with the credentials. The user will be redirected to `/manager/dashboard`, dynamically managing `the-river-house-retreat`.

### C. Platform Administrator User Setup
1. Register an account with your administrator email (e.g. `admin@lodgekeys.com`).
2. Elevate the user safely using the trusted administrative elevation script:
   ```sql
   UPDATE public.profiles
   SET role = 'admin'
   WHERE email = 'admin@lodgekeys.com';
   ```
3. Sign in with the credentials. The user will be redirected to `/admin/dashboard`.

---

## 5. Quick Demo Access Shortcuts

The existing quick-demo buttons at the bottom of the modal remain fully functional:
- **Demo as Guest** (`guest@lodgekeys.com` / `guest123`)
- **Demo as Manager** (`manager@lodgekeys.com` / `manager123`)
- **Demo as Admin** (`admin@lodgekeys.com` / `admin123`)

If these users are created in your Supabase Auth project, they will authenticate directly against Supabase. If running in offline/demo mode, the system seamlessly falls back to local demo sessions with no disruption to the user experience.
