# Lodgekeys Supabase Project Setup & Migration Guide

This guide provides instructions for provisioning a Supabase project, executing the version-controlled SQL migrations, loading development seed data, and configuring environment variables.

---

## 1. Supabase Project Requirements & Configuration

1. **Create Project**:
   - Create a project on [Supabase](https://supabase.com) (e.g. `lodgekeys-production` or `lodgekeys-staging`).
   - Select your preferred AWS/GCP region.
2. **Database Extensions**:
   The migrations automatically execute `CREATE EXTENSION IF NOT EXISTS`:
   - `pgcrypto` (Password hashing, cryptographic hashes)
   - `uuid-ossp` (UUID generators)
   - `btree_gist` (GiST exclusion indexing for double-booking prevention)
3. **Authentication Settings**:
   - In the Supabase Dashboard, navigate to **Authentication -> Providers -> Email**.
   - Ensure **Email provider** is enabled.
   - For local development / testing, you may toggle off **Confirm email** to allow immediate logins.
4. **API Settings**:
   - Navigate to **Project Settings -> API**.
   - Note the **Project URL** and the public **anon key**.
   - **CRITICAL**: Never copy or expose the `service_role` key in frontend `.env` files or commit it to source control.

---

## 2. Environment Variables Setup

1. In the repository root, inspect `.env.example`:
   ```bash
   # Lodgekeys Frontend Supabase Variables
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```
2. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
3. Replace the placeholder values with your actual Supabase Project URL and anon key.
4. Verify that `.env` is ignored by Git:
   ```bash
   git status --ignored
   ```
   `.env` must appear under Ignored files.

---

## 3. Applying Database Migrations

You can apply the migrations using either the **Supabase CLI** or the **Supabase Dashboard SQL Editor**.

### Method A: Using Supabase CLI (Recommended)

1. Link your local directory to your Supabase project:
   ```bash
   npx supabase link --project-ref your-project-ref
   ```
2. Push all migrations:
   ```bash
   npx supabase db push
   ```
3. (Optional) Apply development seed data:
   ```bash
   npx supabase db execute --file ./supabase/seed.sql
   ```

---

### Method B: Using Supabase SQL Editor

If executing migrations manually via the Supabase web dashboard, run each SQL file in the exact sequential order below:

1. **`supabase/migrations/20261020000001_initial_schema.sql`**
   - Provisions 15 domain tables, foreign keys, and indexes.
2. **`supabase/migrations/20261020000002_functions_and_triggers.sql`**
   - Provisions role check helpers (`is_admin()`, `has_hotel_access()`), updated-at triggers, role escalation prevention, auth signup trigger, and onboarding approval procedure.
3. **`supabase/migrations/20261020000003_row_level_security.sql`**
   - Enables RLS on all 15 tables and applies least-privilege security policies.
4. **`supabase/migrations/20261020000004_room_conflict_prevention.sql`**
   - Enables `btree_gist`, sets up the exclusion constraint, and creates hold expiration routines.
5. **`supabase/migrations/20261020000005_storage_buckets.sql`**
   - Creates the `hotel-images` bucket and sets up folder-isolated storage RLS policies.
6. **`supabase/seed.sql` (Development Environments Only)**
   - Seeds sample hotels (The River House Retreat, Palm Court Suites, etc.), sample rooms, global add-ons, and platform settings.

---

## 4. Initial Administrator Account Provisioning

Under our security rules, no user is ever granted administrator privileges automatically upon signup.

To create the initial administrator:
1. Register an account with your desired admin email (e.g. `admin@lodgekeys.com`) via the frontend signup or Supabase Auth dashboard.
2. In the Supabase SQL Editor, run:
   ```sql
   DO $$
   DECLARE
       v_admin_email TEXT := 'admin@lodgekeys.com';
       v_user_id UUID;
   BEGIN
       SELECT id INTO v_user_id FROM auth.users WHERE LOWER(email) = LOWER(v_admin_email);
       IF v_user_id IS NULL THEN
           RAISE EXCEPTION 'User % not found in auth.users. Please register first.', v_admin_email;
       END IF;

       UPDATE public.profiles
       SET role = 'admin', updated_at = now()
       WHERE id = v_user_id;

       PERFORM public.log_audit_event(
           'INITIAL_ADMIN_PROVISIONED',
           'profiles',
           v_user_id::text,
           jsonb_build_object('elevated_email', v_admin_email)
       );
   END;
   $$;
   ```

---

## 5. Local Verification

To verify migration files and database constraints locally:
```bash
node scripts/validate-database-schema.js
```
Expected output:
```
All 7 verification checks passed successfully.
```
