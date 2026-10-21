-- ==============================================================================
-- Lodgekeys Database Foundation — Migration 005: Supabase Storage Configuration
-- ==============================================================================
-- Description:
-- Provisions the public 'hotel-images' storage bucket for property photography.
-- Implements path-isolated Row Level Security policies on storage.objects ensuring
-- managers can upload/modify images only within their assigned hotel's folder path.
-- ==============================================================================

-- 1. Create the hotel-images bucket (if storage schema exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'storage') THEN
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'hotel-images',
            'hotel-images',
            true,
            10485760, -- 10MB limit per image
            ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']
        )
        ON CONFLICT (id) DO UPDATE SET
            public = true,
            file_size_limit = EXCLUDED.file_size_limit,
            allowed_mime_types = EXCLUDED.allowed_mime_types;
    END IF;
END;
$$;

-- 2. Storage Policies on storage.objects
-- Folder Path Strategy: hotel-images/{hotel_slug}/{image_file_name}

-- Public Read Policy: Anyone can view hotel images from the hotel-images bucket
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'objects') THEN
        
        DROP POLICY IF EXISTS "hotel_images_public_read" ON storage.objects;
        CREATE POLICY "hotel_images_public_read"
        ON storage.objects FOR SELECT
        USING (bucket_id = 'hotel-images');

        -- Upload Policy: Admins or hotel managers assigned to the property slug in the path
        DROP POLICY IF EXISTS "hotel_images_manager_upload" ON storage.objects;
        CREATE POLICY "hotel_images_manager_upload"
        ON storage.objects FOR INSERT
        WITH CHECK (
            bucket_id = 'hotel-images'
            AND (
                public.is_admin()
                OR EXISTS (
                    SELECT 1 
                    FROM public.hotels h
                    JOIN public.hotel_managers hm ON h.id = hm.hotel_id
                    WHERE h.slug = (storage.foldername(name))[1]
                      AND hm.user_id = auth.uid()
                )
            )
        );

        -- Update Policy: Admins or authorized managers for that hotel path
        DROP POLICY IF EXISTS "hotel_images_manager_update" ON storage.objects;
        CREATE POLICY "hotel_images_manager_update"
        ON storage.objects FOR UPDATE
        USING (
            bucket_id = 'hotel-images'
            AND (
                public.is_admin()
                OR EXISTS (
                    SELECT 1 
                    FROM public.hotels h
                    JOIN public.hotel_managers hm ON h.id = hm.hotel_id
                    WHERE h.slug = (storage.foldername(name))[1]
                      AND hm.user_id = auth.uid()
                )
            )
        );

        -- Delete Policy: Admins or authorized managers for that hotel path
        DROP POLICY IF EXISTS "hotel_images_manager_delete" ON storage.objects;
        CREATE POLICY "hotel_images_manager_delete"
        ON storage.objects FOR DELETE
        USING (
            bucket_id = 'hotel-images'
            AND (
                public.is_admin()
                OR EXISTS (
                    SELECT 1 
                    FROM public.hotels h
                    JOIN public.hotel_managers hm ON h.id = hm.hotel_id
                    WHERE h.slug = (storage.foldername(name))[1]
                      AND hm.user_id = auth.uid()
                )
            )
        );

    END IF;
END;
$$;
