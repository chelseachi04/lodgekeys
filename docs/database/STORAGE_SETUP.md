# Lodgekeys Hotel Image Storage Setup & Access Policy Plan

## 1. Bucket Specifications

| Parameter | Value |
| :--- | :--- |
| **Bucket ID** | `hotel-images` |
| **Public Access** | `true` (Allows CDN delivery and direct browser image rendering without signed URLs) |
| **Max File Size** | `10,485,760` bytes (10 Megabytes) |
| **Allowed MIME Types** | `image/jpeg`, `image/png`, `image/webp`, `image/avif` |

---

## 2. Directory Path Hierarchy

To guarantee security isolation across multiple independent hotels and managers, all uploaded assets must follow a strict folder path convention:

```
hotel-images/
├── {hotel_slug}/
│   ├── hero/
│   │   └── hero-main.jpg
│   ├── rooms/
│   │   ├── deluxe-garden-101.jpg
│   │   └── executive-suite-204.jpg
│   └── gallery/
│       ├── pool-terrace.jpg
│       └── river-dock.jpg
```

- The root folder segment `(storage.foldername(name))[1]` **MUST** match the target hotel's unique `slug`.
- This slug serves as the authorization key in Row Level Security policies.

---

## 3. Storage Row Level Security Policies

Policies are defined on `storage.objects`:

### 3.1 Public Read Policy
Anyone (including unauthenticated visitors discovering hotels) can view uploaded property images.
```sql
CREATE POLICY "hotel_images_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'hotel-images');
```

### 3.2 Property-Isolated Manager Upload Policy
Hotel managers can only upload files into the folder belonging to their assigned hotel. Platform administrators can upload anywhere.
```sql
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
```

### 3.3 Property-Isolated Update and Delete Policies
Prevents managers from overwriting or deleting photography belonging to a competing property.
```sql
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
```

---

## 4. Phase 1 Implementation Rules

- **No image replacements yet**: During Phase 1, existing frontend image references under `/images/` are strictly preserved.
- **No fabricated images**: Do not upload dummy or placeholder images to the live storage bucket during foundation migration.
- Once the schema is approved and dashboard CRUD is connected in Phase 2, manager dashboard image upload components will directly leverage the `hotel-images/{hotel_slug}/` path.
