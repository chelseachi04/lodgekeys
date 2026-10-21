-- ==============================================================================
-- Lodgekeys Database Foundation — Migration 007: Hotel Applications & Room Inventory
-- ==============================================================================
-- Description:
-- 1. Expands public.hotel_applications schema for professional onboarding data,
--    ownership details, location specifics, facilities, and verification docs.
-- 2. Expands public.room_categories schema for flexible multi-photo, amenity,
--    and bedroom/bathroom configurations.
-- 3. Provides secure atomic procedures for application submission, approval,
--    and rejection with duplicate-prevention transactions.
-- 4. Provides inventory reconciliation function for room categories.
-- ==============================================================================

-- 1. Extend Hotel Applications Schema
ALTER TABLE public.hotel_applications
    ADD COLUMN IF NOT EXISTS applicant_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS reference_number TEXT,
    ADD COLUMN IF NOT EXISTS year_established TEXT,
    ADD COLUMN IF NOT EXISTS business_reg_status TEXT DEFAULT 'unregistered',
    ADD COLUMN IF NOT EXISTS business_reg_number TEXT,
    ADD COLUMN IF NOT EXISTS website TEXT,
    ADD COLUMN IF NOT EXISTS applicant_role TEXT DEFAULT 'owner',
    ADD COLUMN IF NOT EXISTS alternative_phone TEXT,
    ADD COLUMN IF NOT EXISTS preferred_contact_method TEXT DEFAULT 'email',
    ADD COLUMN IF NOT EXISTS is_authorized BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS nearby_landmark TEXT,
    ADD COLUMN IF NOT EXISTS google_maps_url TEXT,
    ADD COLUMN IF NOT EXISTS location_notes TEXT,
    ADD COLUMN IF NOT EXISTS room_types_overview TEXT,
    ADD COLUMN IF NOT EXISTS facilities TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS additional_services_notes TEXT,
    ADD COLUMN IF NOT EXISTS business_reg_doc TEXT,
    ADD COLUMN IF NOT EXISTS operating_permit_doc TEXT,
    ADD COLUMN IF NOT EXISTS fire_safety_doc TEXT,
    ADD COLUMN IF NOT EXISTS proof_of_ownership_doc TEXT,
    ADD COLUMN IF NOT EXISTS declaration_agreed BOOLEAN DEFAULT true;

-- Ensure slug and reference_code allow flexible submissions without breaking constraints
ALTER TABLE public.hotel_applications
    ALTER COLUMN slug DROP NOT NULL;
ALTER TABLE public.hotel_applications
    ALTER COLUMN reference_code DROP NOT NULL;

-- Index for applicant lookups
CREATE INDEX IF NOT EXISTS idx_hotel_applications_user ON public.hotel_applications(applicant_user_id);
CREATE INDEX IF NOT EXISTS idx_hotel_applications_status ON public.hotel_applications(status);

-- 2. Extend Room Categories Schema
ALTER TABLE public.room_categories
    ADD COLUMN IF NOT EXISTS bedrooms_count INTEGER NOT NULL DEFAULT 1 CHECK (bedrooms_count >= 0),
    ADD COLUMN IF NOT EXISTS bathrooms_count INTEGER NOT NULL DEFAULT 1 CHECK (bathrooms_count >= 0),
    ADD COLUMN IF NOT EXISTS amenities TEXT[] NOT NULL DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS photos TEXT[] NOT NULL DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS total_units INTEGER NOT NULL DEFAULT 1 CHECK (total_units >= 0),
    ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS seasonal_rates JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Ensure room category configurations are flexible for custom category creation
ALTER TABLE public.room_categories
    ALTER COLUMN bed_configuration SET DEFAULT 'King Bed';
ALTER TABLE public.room_categories
    ALTER COLUMN bed_configuration DROP NOT NULL;
ALTER TABLE public.room_categories
    ALTER COLUMN capacity SET DEFAULT 'Up to 2 guests';
ALTER TABLE public.room_categories
    ALTER COLUMN capacity DROP NOT NULL;

-- Drop prior procedure versions to guarantee clean signature replacement
DROP FUNCTION IF EXISTS public.approve_hotel_application(UUID, TEXT);
DROP FUNCTION IF EXISTS public.reject_hotel_application(UUID, TEXT);
DROP FUNCTION IF EXISTS public.sync_category_rooms(UUID, UUID, INTEGER, TEXT);

-- 3. Atomic Server-Side Procedure: Approve Hotel Application
CREATE OR REPLACE FUNCTION public.approve_hotel_application(
    p_application_id UUID,
    p_admin_feedback TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_app RECORD;
    v_hotel_id UUID;
    v_hotel_slug TEXT;
    v_clean_slug TEXT;
    v_counter INTEGER := 1;
    v_existing_hotel_id UUID;
    v_manager_user_id UUID;
    v_now TIMESTAMPTZ := now();
    v_cat_id UUID;
    v_i INTEGER;
    v_room_num TEXT;
BEGIN
    -- Verify caller is admin
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied: Only administrators may approve hotel applications.';
    END IF;

    -- Lock application row
    SELECT * INTO v_app
    FROM public.hotel_applications
    WHERE id = p_application_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Application not found with ID %', p_application_id;
    END IF;

    -- Idempotency check: If already approved, return existing hotel
    IF v_app.status = 'approved' AND v_app.created_hotel_id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', true,
            'message', 'Application has already been approved.',
            'hotelId', v_app.created_hotel_id,
            'status', 'approved'
        );
    END IF;

    -- Derive unique slug
    v_clean_slug := LOWER(REGEXP_REPLACE(TRIM(v_app.name), '[^a-zA-Z0-9]+', '-', 'g'));
    v_clean_slug := TRIM(BOTH '-' FROM v_clean_slug);
    IF v_clean_slug = '' THEN
        v_clean_slug := 'hotel-' || SUBSTRING(MD5(p_application_id::text) FROM 1 FOR 8);
    END IF;

    v_hotel_slug := v_clean_slug;
    WHILE EXISTS (SELECT 1 FROM public.hotels WHERE slug = v_hotel_slug AND id != COALESCE(v_app.created_hotel_id, '00000000-0000-0000-0000-000000000000'::uuid)) LOOP
        v_counter := v_counter + 1;
        v_hotel_slug := v_clean_slug || '-' || v_counter;
    END LOOP;

    -- Create or reactivate hotel listing
    IF v_app.created_hotel_id IS NOT NULL THEN
        UPDATE public.hotels
        SET 
            name = v_app.name,
            slug = v_hotel_slug,
            area = v_app.area,
            address = v_app.address,
            category = v_app.category,
            starting_rate = v_app.starting_rate,
            contact_email = v_app.contact_email,
            contact_phone = v_app.contact_phone,
            website = v_app.website,
            description = v_app.description,
            amenities = COALESCE(v_app.facilities, '{}'),
            is_published = true,
            is_delisted = false,
            is_deleted = false,
            updated_at = v_now
        WHERE id = v_app.created_hotel_id
        RETURNING id INTO v_hotel_id;
    ELSE
        INSERT INTO public.hotels (
            slug,
            name,
            sub_tag,
            badge,
            location,
            area,
            address,
            category,
            rating,
            reviews_count,
            tagline,
            description,
            about_headline,
            about_overview,
            image_url,
            hero_image_url,
            amenities,
            contact_email,
            contact_phone,
            website,
            starting_rate,
            is_published,
            is_delisted,
            is_deleted,
            created_at,
            updated_at
        ) VALUES (
            v_hotel_slug,
            v_app.name,
            UPPER(v_app.category) || ' · ' || UPPER(v_app.area),
            'Verified Stay',
            v_app.area || ' · Abraka',
            v_app.area,
            v_app.address,
            CASE 
                WHEN v_app.category IN ('Resort', 'Luxury', 'Boutique', 'Eco-Lodge', 'Hotel', 'Apartment', 'Standard') THEN v_app.category
                ELSE 'Hotel'
            END,
            5.0,
            0,
            COALESCE(v_app.room_types_overview, v_app.description),
            v_app.description,
            'Welcome to ' || v_app.name,
            v_app.description,
            '/images/hotel-1.jpg',
            '/images/hero-resort.jpg',
            COALESCE(v_app.facilities, '{}'),
            v_app.contact_email,
            v_app.contact_phone,
            v_app.website,
            v_app.starting_rate,
            true,
            false,
            false,
            v_now,
            v_now
        )
        RETURNING id INTO v_hotel_id;
    END IF;

    -- Link applicant user as hotel manager
    v_manager_user_id := v_app.applicant_user_id;

    -- If applicant_user_id was null, look up profile by contact_email
    IF v_manager_user_id IS NULL AND v_app.contact_email IS NOT NULL THEN
        SELECT id INTO v_manager_user_id
        FROM public.profiles
        WHERE LOWER(email) = LOWER(v_app.contact_email)
        LIMIT 1;
    END IF;

    IF v_manager_user_id IS NOT NULL THEN
        -- Upgrade profile role to hotel_manager if currently customer
        UPDATE public.profiles
        SET role = 'hotel_manager', updated_at = v_now
        WHERE id = v_manager_user_id AND role = 'customer';

        -- Bind in hotel_managers table
        INSERT INTO public.hotel_managers (hotel_id, user_id, is_primary)
        VALUES (v_hotel_id, v_manager_user_id, true)
        ON CONFLICT (hotel_id, user_id) DO NOTHING;
    END IF;

    -- Create initial default room category if hotel has no categories yet
    IF NOT EXISTS (SELECT 1 FROM public.room_categories WHERE hotel_id = v_hotel_id) THEN
        INSERT INTO public.room_categories (
            hotel_id,
            slug,
            name,
            bed_configuration,
            capacity,
            max_guests,
            room_size,
            view_description,
            features,
            base_rate_nightly,
            image_url,
            description,
            is_active,
            total_units,
            bedrooms_count,
            bathrooms_count,
            created_at,
            updated_at
        ) VALUES (
            v_hotel_id,
            'standard-room',
            'Standard Room',
            'Queen bed',
            'Up to 2 guests',
            2,
            '32 m²',
            'Courtyard View',
            'Queen bed · En-suite bath · 2 Guests',
            v_app.starting_rate,
            '/images/room-deluxe.jpg',
            'Comfortable and thoughtfully appointed room with modern amenities.',
            true,
            GREATEST(1, LEAST(COALESCE(v_app.total_rooms, 5), 10)),
            1,
            1,
            v_now,
            v_now
        )
        RETURNING id INTO v_cat_id;

        -- Create corresponding physical units (e.g. 101, 102...)
        FOR v_i IN 1..GREATEST(1, LEAST(COALESCE(v_app.total_rooms, 5), 10)) LOOP
            v_room_num := (100 + v_i)::text;
            INSERT INTO public.rooms (
                hotel_id,
                category_id,
                room_number,
                floor,
                operational_status,
                is_active,
                created_at,
                updated_at
            ) VALUES (
                v_hotel_id,
                v_cat_id,
                v_room_num,
                1,
                'available',
                true,
                v_now,
                v_now
            )
            ON CONFLICT (hotel_id, room_number) DO NOTHING;
        END LOOP;
    END IF;

    -- Update application status
    UPDATE public.hotel_applications
    SET 
        status = 'approved',
        reviewed_at = v_now,
        reviewed_by = auth.uid(),
        feedback = p_admin_feedback,
        created_hotel_id = v_hotel_id,
        updated_at = v_now
    WHERE id = p_application_id;

    -- Send in-app notification to applicant if registered
    IF v_manager_user_id IS NOT NULL THEN
        INSERT INTO public.notifications (
            user_id,
            title,
            message,
            metadata,
            created_at
        ) VALUES (
            v_manager_user_id,
            'Hotel Application Approved: ' || v_app.name,
            'Congratulations! Your listing application for ' || v_app.name || ' has been approved. You can now access your manager dashboard to configure room inventory.',
            jsonb_build_object(
                'applicationId', p_application_id,
                'hotelId', v_hotel_id,
                'hotelSlug', v_hotel_slug,
                'status', 'approved'
            ),
            v_now
        );
    END IF;

    -- Audit log
    PERFORM public.log_audit_event(
        'HOTEL_APPLICATION_APPROVED',
        'hotel_applications',
        p_application_id::text,
        jsonb_build_object(
            'hotel_id', v_hotel_id,
            'hotel_slug', v_hotel_slug,
            'name', v_app.name,
            'admin_id', auth.uid()
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Application approved and hotel published successfully.',
        'hotelId', v_hotel_id,
        'hotelSlug', v_hotel_slug,
        'status', 'approved'
    );
END;
$$;

-- 4. Atomic Server-Side Procedure: Reject Hotel Application
CREATE OR REPLACE FUNCTION public.reject_hotel_application(
    p_application_id UUID,
    p_reason TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_app RECORD;
    v_now TIMESTAMPTZ := now();
BEGIN
    -- Verify caller is admin
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied: Only administrators may reject hotel applications.';
    END IF;

    SELECT * INTO v_app
    FROM public.hotel_applications
    WHERE id = p_application_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Application not found with ID %', p_application_id;
    END IF;

    -- Update application status
    UPDATE public.hotel_applications
    SET 
        status = 'declined',
        reviewed_at = v_now,
        reviewed_by = auth.uid(),
        feedback = p_reason,
        updated_at = v_now
    WHERE id = p_application_id;

    -- Notify applicant if user ID known
    IF v_app.applicant_user_id IS NOT NULL THEN
        INSERT INTO public.notifications (
            user_id,
            title,
            message,
            metadata,
            created_at
        ) VALUES (
            v_app.applicant_user_id,
            'Hotel Application Update: ' || v_app.name,
            'Your hotel listing application for ' || v_app.name || ' was not approved at this time.' || 
            CASE WHEN p_reason != '' THEN ' Reason: ' || p_reason ELSE '' END,
            jsonb_build_object(
                'applicationId', p_application_id,
                'status', 'declined',
                'reason', p_reason
            ),
            v_now
        );
    END IF;

    -- Audit log
    PERFORM public.log_audit_event(
        'HOTEL_APPLICATION_DECLINED',
        'hotel_applications',
        p_application_id::text,
        jsonb_build_object(
            'name', v_app.name,
            'reason', p_reason,
            'admin_id', auth.uid()
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Application rejected successfully.',
        'status', 'declined'
    );
END;
$$;

-- 5. Atomic Procedure: Reconcile Physical Rooms for Category
CREATE OR REPLACE FUNCTION public.sync_category_rooms(
    p_hotel_id UUID,
    p_category_id UUID,
    p_desired_count INTEGER,
    p_room_prefix TEXT DEFAULT 'RM-'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_current_count INTEGER;
    v_diff INTEGER;
    v_max_num INTEGER := 0;
    v_created INTEGER := 0;
    v_deleted INTEGER := 0;
    v_target_prefix TEXT;
    v_candidate_num TEXT;
    v_room_rec RECORD;
BEGIN
    -- Verify caller has hotel access
    IF NOT public.has_hotel_access(p_hotel_id) THEN
        RAISE EXCEPTION 'Access denied: You do not manage this hotel.';
    END IF;

    -- Normalize prefix (e.g., 'VIP-')
    v_target_prefix := COALESCE(NULLIF(TRIM(p_room_prefix), ''), 'RM-');
    IF NOT (v_target_prefix LIKE '%-' OR v_target_prefix LIKE '% ') THEN
        v_target_prefix := v_target_prefix || '-';
    END IF;

    -- Current active physical rooms for this category
    SELECT COUNT(*) INTO v_current_count
    FROM public.rooms
    WHERE hotel_id = p_hotel_id AND category_id = p_category_id AND is_active = true;

    -- Update room_categories total_units
    UPDATE public.room_categories
    SET total_units = GREATEST(0, p_desired_count), updated_at = now()
    WHERE id = p_category_id AND hotel_id = p_hotel_id;

    v_diff := p_desired_count - v_current_count;

    IF v_diff > 0 THEN
        -- Find current highest number for this prefix in this hotel
        SELECT COALESCE(MAX(SUBSTRING(room_number FROM '[0-9]+')::integer), 0)
        INTO v_max_num
        FROM public.rooms
        WHERE hotel_id = p_hotel_id AND room_number LIKE v_target_prefix || '%';

        -- Need to create more rooms (e.g. VIP-01, VIP-02...)
        FOR v_current_count IN 1..v_diff LOOP
            v_max_num := v_max_num + 1;
            v_candidate_num := v_target_prefix || LPAD(v_max_num::text, 2, '0');

            -- Avoid collisions with any existing room number in the hotel
            WHILE EXISTS (SELECT 1 FROM public.rooms WHERE hotel_id = p_hotel_id AND room_number = v_candidate_num) LOOP
                v_max_num := v_max_num + 1;
                v_candidate_num := v_target_prefix || LPAD(v_max_num::text, 2, '0');
            END LOOP;

            INSERT INTO public.rooms (
                hotel_id,
                category_id,
                room_number,
                floor,
                operational_status,
                is_active
            ) VALUES (
                p_hotel_id,
                p_category_id,
                v_candidate_num,
                1,
                'available',
                true
            );
            v_created := v_created + 1;
        END LOOP;
    ELSIF v_diff < 0 THEN
        -- Need to reduce rooms safely (only rooms without active/upcoming bookings)
        FOR v_room_rec IN (
            SELECT r.id, r.room_number
            FROM public.rooms r
            WHERE r.hotel_id = p_hotel_id 
              AND r.category_id = p_category_id
              AND r.is_active = true
              AND NOT EXISTS (
                  SELECT 1 FROM public.bookings b
                  WHERE b.room_id = r.id
                    AND b.booking_status IN ('pending', 'confirmed', 'checked_in')
              )
            ORDER BY r.created_at DESC
            LIMIT ABS(v_diff)
        ) LOOP
            DELETE FROM public.rooms WHERE id = v_room_rec.id;
            v_deleted := v_deleted + 1;
        END LOOP;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'categoryId', p_category_id,
        'desiredCount', p_desired_count,
        'createdRooms', v_created,
        'deletedRooms', v_deleted,
        'currentCount', v_current_count + v_created - v_deleted
    );
END;
$$;

-- 6. Update RLS on Hotel Applications
DROP POLICY IF EXISTS "hotel_applications_select" ON public.hotel_applications;
CREATE POLICY "hotel_applications_select"
ON public.hotel_applications FOR SELECT
USING (
    applicant_user_id = auth.uid()
    OR public.is_admin()
    OR contact_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "hotel_applications_insert" ON public.hotel_applications;
CREATE POLICY "hotel_applications_insert"
ON public.hotel_applications FOR INSERT
WITH CHECK (
    applicant_user_id = auth.uid()
    OR public.is_admin()
);

-- 7. Private Verification Documents Storage Bucket
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'storage') THEN
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'hotel-documents',
            'hotel-documents',
            false,
            20971520, -- 20MB limit
            ARRAY['application/pdf', 'image/jpeg', 'image/png']
        )
        ON CONFLICT (id) DO UPDATE SET
            public = false,
            file_size_limit = 20971520;

        -- RLS Policies on storage.objects for hotel-documents
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'objects') THEN
            DROP POLICY IF EXISTS "hotel_documents_admin_all" ON storage.objects;
            CREATE POLICY "hotel_documents_admin_all"
            ON storage.objects FOR ALL
            USING (bucket_id = 'hotel-documents' AND public.is_admin())
            WITH CHECK (bucket_id = 'hotel-documents' AND public.is_admin());

            DROP POLICY IF EXISTS "hotel_documents_applicant_upload" ON storage.objects;
            CREATE POLICY "hotel_documents_applicant_upload"
            ON storage.objects FOR INSERT
            WITH CHECK (
                bucket_id = 'hotel-documents' 
                AND auth.uid() IS NOT NULL
                AND (storage.foldername(name))[1] = auth.uid()::text
            );

            DROP POLICY IF EXISTS "hotel_documents_applicant_select" ON storage.objects;
            CREATE POLICY "hotel_documents_applicant_select"
            ON storage.objects FOR SELECT
            USING (
                bucket_id = 'hotel-documents'
                AND (
                    public.is_admin()
                    OR (auth.uid() IS NOT NULL AND (storage.foldername(name))[1] = auth.uid()::text)
                )
            );
        END IF;
    END IF;
END;
$$;

-- Permissions
GRANT EXECUTE ON FUNCTION public.approve_hotel_application TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_hotel_application TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_category_rooms TO authenticated;

