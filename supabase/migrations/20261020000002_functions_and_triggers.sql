-- ==============================================================================
-- Lodgekeys Database Foundation — Migration 002: Functions & Triggers
-- ==============================================================================
-- Description:
-- Establishes security-definer authorization helpers, timestamp automation,
-- role-escalation prevention, automatic profile provisioning on auth signup,
-- safe hotel onboarding approval procedure, and audit logging helpers.
-- ==============================================================================

-- 1. Automated Updated-At Timestamp Function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Apply updated_at triggers across mutable tables
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
          AND tablename IN ('profiles', 'hotels', 'hotel_applications', 'room_categories', 
                           'rooms', 'add_on_services', 'bookings', 'payments', 
                           'settlements', 'platform_settings')
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_updated_at ON public.%I;', tbl, tbl);
        EXECUTE format('CREATE TRIGGER trg_%I_updated_at 
                        BEFORE UPDATE ON public.%I 
                        FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();', tbl, tbl);
    END LOOP;
END;
$$;

-- 2. Authorization Helper: Check if Current User is Platform Admin
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

-- 3. Authorization Helper: Check if Current User Has Access to a Specific Hotel
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

-- 4. Role Escalation Prevention Trigger
-- Prevents non-administrators from escalating their role or assigning privileged roles.
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Only existing admins can alter the role field
    IF NEW.role IS DISTINCT FROM OLD.role THEN
        IF NOT public.is_admin() THEN
            RAISE EXCEPTION 'Access denied: You do not have permission to modify account roles.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_role_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_role_escalation
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_role_escalation();

-- 5. Safe Profile Provisioning on User Signup
-- Automatically provisions a user profile when a new user registers through Supabase Auth.
-- Strictly sets the initial role to 'customer' to prevent unauthorized privilege grant.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_name TEXT;
    user_initials TEXT;
    user_phone TEXT;
BEGIN
    -- Extract name from metadata or fallback to email prefix
    user_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1)
    );

    user_phone := NEW.raw_user_meta_data->>'phone';

    -- Derive up to 2 uppercase initials
    user_initials := UPPER(
        COALESCE(
            SUBSTRING(split_part(user_name, ' ', 1) FROM 1 FOR 1) ||
            NULLIF(SUBSTRING(split_part(user_name, ' ', 2) FROM 1 FOR 1), ''),
            SUBSTRING(user_name FROM 1 FOR 2)
        )
    );

    INSERT INTO public.profiles (
        id,
        full_name,
        email,
        phone,
        role,
        initials,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        user_name,
        LOWER(NEW.email),
        user_phone,
        'customer', -- Enforce customer role on public signup without exception
        user_initials,
        now(),
        now()
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        phone = COALESCE(public.profiles.phone, EXCLUDED.phone),
        updated_at = now();

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Centralized Audit Log Helper
CREATE OR REPLACE FUNCTION public.log_audit_event(
    p_action_type TEXT,
    p_target_entity TEXT,
    p_target_id TEXT,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_actor_id UUID;
    v_actor_role TEXT;
    v_log_id UUID;
BEGIN
    v_actor_id := auth.uid();
    
    IF v_actor_id IS NOT NULL THEN
        SELECT role INTO v_actor_role FROM public.profiles WHERE id = v_actor_id;
    ELSE
        v_actor_role := 'system';
    END IF;

    INSERT INTO public.audit_logs (
        actor_id,
        actor_role,
        action_type,
        target_entity,
        target_id,
        metadata,
        created_at
    ) VALUES (
        v_actor_id,
        v_actor_role,
        p_action_type,
        p_target_entity,
        p_target_id,
        p_metadata,
        now()
    )
    RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$;

-- 7. Safe Hotel Application Approval Procedure
-- Atomically creates the hotel, provisions/assigns the manager, updates application state,
-- and records an audit log entry.
CREATE OR REPLACE FUNCTION public.approve_hotel_application(
    p_application_id UUID,
    p_feedback TEXT DEFAULT 'Application approved and property published.'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_app public.hotel_applications%ROWTYPE;
    v_hotel_id UUID;
    v_manager_profile_id UUID;
    v_slug TEXT;
BEGIN
    -- Verify reviewer authorization
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied: Only platform administrators can approve hotel applications.';
    END IF;

    -- Fetch and lock application
    SELECT * INTO v_app
    FROM public.hotel_applications
    WHERE id = p_application_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Application not found: %', p_application_id;
    END IF;

    IF v_app.status != 'pending' THEN
        RAISE EXCEPTION 'Application % cannot be approved because current status is "%".', p_application_id, v_app.status;
    END IF;

    -- Derive or sanitize slug
    v_slug := LOWER(REGEXP_REPLACE(v_app.slug, '[^a-z0-9\-]+', '-', 'g'));
    IF v_slug IS NULL OR v_slug = '' THEN
        v_slug := 'hotel-' || SUBSTRING(p_application_id::text FROM 1 FOR 8);
    END IF;

    -- 1. Create or link hotel record
    INSERT INTO public.hotels (
        slug,
        name,
        area,
        address,
        category,
        description,
        starting_rate,
        contact_email,
        contact_phone,
        is_published,
        is_delisted,
        is_deleted,
        created_at,
        updated_at
    ) VALUES (
        v_slug,
        v_app.name,
        v_app.area,
        v_app.address,
        v_app.category,
        COALESCE(v_app.description, 'Quality boutique accommodations.'),
        v_app.starting_rate,
        v_app.contact_email,
        v_app.contact_phone,
        true,
        false,
        false,
        now(),
        now()
    )
    ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        area = EXCLUDED.area,
        address = EXCLUDED.address,
        category = EXCLUDED.category,
        starting_rate = EXCLUDED.starting_rate,
        contact_email = EXCLUDED.contact_email,
        contact_phone = EXCLUDED.contact_phone,
        is_published = true,
        is_delisted = false,
        updated_at = now()
    RETURNING id INTO v_hotel_id;

    -- 2. Check if a profile exists for the manager contact email
    SELECT id INTO v_manager_profile_id
    FROM public.profiles
    WHERE LOWER(email) = LOWER(v_app.contact_email);

    -- If profile exists, upgrade role to hotel_manager and assign property
    IF v_manager_profile_id IS NOT NULL THEN
        UPDATE public.profiles
        SET role = 'hotel_manager', updated_at = now()
        WHERE id = v_manager_profile_id AND role != 'admin';

        INSERT INTO public.hotel_managers (hotel_id, user_id, is_primary)
        VALUES (v_hotel_id, v_manager_profile_id, true)
        ON CONFLICT (hotel_id, user_id) DO NOTHING;
    END IF;

    -- 3. Update application record
    UPDATE public.hotel_applications
    SET status = 'approved',
        reviewed_at = now(),
        reviewed_by = auth.uid(),
        feedback = p_feedback,
        created_hotel_id = v_hotel_id,
        updated_at = now()
    WHERE id = p_application_id;

    -- 4. Audit Log
    PERFORM public.log_audit_event(
        'HOTEL_APPLICATION_APPROVED',
        'hotel_applications',
        p_application_id::text,
        jsonb_build_object(
            'hotel_id', v_hotel_id,
            'slug', v_slug,
            'hotel_name', v_app.name,
            'manager_email', v_app.contact_email,
            'manager_profile_linked', v_manager_profile_id IS NOT NULL
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'hotel_id', v_hotel_id,
        'slug', v_slug,
        'application_id', p_application_id,
        'manager_linked', v_manager_profile_id IS NOT NULL
    );
END;
$$;
