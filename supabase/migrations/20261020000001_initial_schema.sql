-- ==============================================================================
-- Lodgekeys Database Foundation — Migration 001: Initial Schema
-- ==============================================================================
-- Description:
-- Creates core schema entities, foreign key relationships, indexes,
-- domain constraints, and audit logging tables.
-- ==============================================================================

-- 1. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- 2. Profiles (Linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'hotel_manager', 'admin')),
    initials TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Hotels
CREATE TABLE IF NOT EXISTS public.hotels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    sub_tag TEXT,
    badge TEXT,
    location TEXT,
    area TEXT NOT NULL,
    address TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Resort', 'Luxury', 'Boutique', 'Eco-Lodge', 'Hotel', 'Apartment', 'Standard')),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    rating NUMERIC(2,1) NOT NULL DEFAULT 5.0 CHECK (rating >= 1.0 AND rating <= 5.0),
    reviews_count INTEGER NOT NULL DEFAULT 0 CHECK (reviews_count >= 0),
    tagline TEXT,
    description TEXT NOT NULL,
    about_headline TEXT,
    about_overview TEXT,
    image_url TEXT,
    hero_image_url TEXT,
    secondary_gallery JSONB NOT NULL DEFAULT '{"main": "", "top": "", "bottom": ""}'::jsonb,
    gallery_images JSONB NOT NULL DEFAULT '[]'::jsonb,
    amenities TEXT[] NOT NULL DEFAULT '{}',
    extras JSONB NOT NULL DEFAULT '[]'::jsonb,
    contact_email TEXT,
    contact_phone TEXT,
    website TEXT,
    check_in_time TEXT NOT NULL DEFAULT '2:00 PM',
    check_out_time TEXT NOT NULL DEFAULT '11:00 AM',
    arrival_policy TEXT,
    cancellation_policy TEXT,
    starting_rate NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (starting_rate >= 0),
    is_published BOOLEAN NOT NULL DEFAULT true,
    is_delisted BOOLEAN NOT NULL DEFAULT false,
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Hotel Managers Assignment Table
CREATE TABLE IF NOT EXISTS public.hotel_managers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    is_primary BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_hotel_manager UNIQUE (hotel_id, user_id)
);

-- 5. Hotel Applications (Onboarding Workflow)
CREATE TABLE IF NOT EXISTS public.hotel_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    area TEXT NOT NULL,
    address TEXT NOT NULL,
    category TEXT NOT NULL,
    starting_rate NUMERIC(12,2) NOT NULL DEFAULT 40000.00 CHECK (starting_rate >= 0),
    total_rooms INTEGER NOT NULL DEFAULT 10 CHECK (total_rooms > 0),
    documents TEXT,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    feedback TEXT DEFAULT '',
    created_hotel_id UUID REFERENCES public.hotels(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Room Categories / Types
CREATE TABLE IF NOT EXISTS public.room_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
    slug TEXT NOT NULL,
    name TEXT NOT NULL,
    bed_configuration TEXT NOT NULL,
    capacity TEXT NOT NULL,
    max_guests INTEGER NOT NULL DEFAULT 2 CHECK (max_guests > 0),
    room_size TEXT,
    view_description TEXT,
    features TEXT,
    base_rate_nightly NUMERIC(12,2) NOT NULL CHECK (base_rate_nightly >= 0),
    image_url TEXT,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_hotel_room_category UNIQUE (hotel_id, slug)
);

-- 7. Individual Physical Rooms (Operational Inventory)
CREATE TABLE IF NOT EXISTS public.rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.room_categories(id) ON DELETE RESTRICT,
    room_number TEXT NOT NULL,
    floor INTEGER NOT NULL DEFAULT 1,
    operational_status TEXT NOT NULL DEFAULT 'available' 
        CHECK (operational_status IN ('available', 'occupied', 'reserved', 'maintenance', 'cleaning', 'out_of_order')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_cleaned_at DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_hotel_room_number UNIQUE (hotel_id, room_number)
);

-- 8. Add-On Services (Bookable amenities/passes)
CREATE TABLE IF NOT EXISTS public.add_on_services (
    id TEXT PRIMARY KEY,
    hotel_id UUID REFERENCES public.hotels(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
    price_formatted TEXT,
    description TEXT,
    icon TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Bookings
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_reference TEXT NOT NULL UNIQUE,
    customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE RESTRICT,
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE RESTRICT,
    room_category_id UUID REFERENCES public.room_categories(id) ON DELETE SET NULL,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    stay_range DATERANGE GENERATED ALWAYS AS (daterange(check_in_date, check_out_date, '[)')) STORED,
    nights_count INTEGER NOT NULL CHECK (nights_count >= 1),
    rooms_count INTEGER NOT NULL DEFAULT 1 CHECK (rooms_count >= 1),
    guests_count INTEGER NOT NULL DEFAULT 1 CHECK (guests_count >= 1),
    guests_display TEXT,
    guest_full_name TEXT NOT NULL,
    guest_email TEXT NOT NULL,
    guest_phone TEXT NOT NULL,
    guest_special_requests TEXT,
    nightly_rate NUMERIC(12,2) NOT NULL CHECK (nightly_rate >= 0),
    room_subtotal NUMERIC(12,2) NOT NULL CHECK (room_subtotal >= 0),
    add_ons_total NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (add_ons_total >= 0),
    tax_rate_pct NUMERIC(5,2) NOT NULL DEFAULT 0.00 CHECK (tax_rate_pct >= 0),
    tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (tax_amount >= 0),
    grand_total NUMERIC(12,2) NOT NULL CHECK (grand_total >= 0),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('hotel', 'card', 'transfer')),
    booking_status TEXT NOT NULL DEFAULT 'confirmed' 
        CHECK (booking_status IN ('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'expired')),
    checked_in_at TIMESTAMPTZ,
    checked_out_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    hold_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_booking_dates CHECK (check_out_date > check_in_date)
);

-- 10. Booking Add-Ons Junction
CREATE TABLE IF NOT EXISTS public.booking_add_ons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    service_id TEXT NOT NULL REFERENCES public.add_on_services(id) ON DELETE RESTRICT,
    service_title TEXT NOT NULL,
    unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    total_price NUMERIC(12,2) NOT NULL CHECK (total_price >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. Payments Ledger
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE RESTRICT,
    transaction_reference TEXT NOT NULL UNIQUE,
    amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
    currency TEXT NOT NULL DEFAULT 'NGN',
    payment_method TEXT NOT NULL CHECK (payment_method IN ('card', 'transfer', 'hotel')),
    payment_status TEXT NOT NULL DEFAULT 'pending' 
        CHECK (payment_status IN ('pending', 'verified', 'manually_recorded', 'failed', 'refunded')),
    is_verified BOOLEAN NOT NULL DEFAULT false,
    verification_channel TEXT,
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    commission_pct NUMERIC(5,2) NOT NULL DEFAULT 10.00 CHECK (commission_pct >= 0),
    commission_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (commission_amount >= 0),
    net_payout_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (net_payout_amount >= 0),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. Hotel Payout Settlements
CREATE TABLE IF NOT EXISTS public.settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE RESTRICT,
    reference_code TEXT NOT NULL UNIQUE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    gross_amount NUMERIC(12,2) NOT NULL CHECK (gross_amount >= 0),
    commission_deducted NUMERIC(12,2) NOT NULL CHECK (commission_deducted >= 0),
    net_disbursed NUMERIC(12,2) NOT NULL CHECK (net_disbursed >= 0),
    settlement_status TEXT NOT NULL DEFAULT 'pending' 
        CHECK (settlement_status IN ('pending', 'processing', 'completed', 'disputed')),
    paid_at TIMESTAMPTZ,
    processed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    proof_reference TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_settlement_dates CHECK (period_end >= period_start)
);

-- 13. Customer Saved Hotels (Favorites)
CREATE TABLE IF NOT EXISTS public.saved_hotels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_saved_hotel UNIQUE (user_id, hotel_id)
);

-- 14. Persistent Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    booking_reference TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_read BOOLEAN NOT NULL DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 15. Platform Settings (Fee, Commission, Support configs)
CREATE TABLE IF NOT EXISTS public.platform_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 16. Audit Log (Administrative, Financial, Booking actions)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    actor_role TEXT,
    action_type TEXT NOT NULL,
    target_entity TEXT NOT NULL,
    target_id TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 17. Indexes for Query Performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_hotels_slug ON public.hotels(slug);
CREATE INDEX IF NOT EXISTS idx_hotels_status ON public.hotels(is_published, is_delisted, is_deleted);
CREATE INDEX IF NOT EXISTS idx_hotels_category ON public.hotels(category);
CREATE INDEX IF NOT EXISTS idx_hotels_area ON public.hotels(area);

CREATE INDEX IF NOT EXISTS idx_hotel_managers_user ON public.hotel_managers(user_id);
CREATE INDEX IF NOT EXISTS idx_hotel_managers_hotel ON public.hotel_managers(hotel_id);

CREATE INDEX IF NOT EXISTS idx_hotel_applications_status ON public.hotel_applications(status);
CREATE INDEX IF NOT EXISTS idx_hotel_applications_email ON public.hotel_applications(contact_email);

CREATE INDEX IF NOT EXISTS idx_room_categories_hotel ON public.room_categories(hotel_id);
CREATE INDEX IF NOT EXISTS idx_rooms_hotel ON public.rooms(hotel_id);
CREATE INDEX IF NOT EXISTS idx_rooms_category ON public.rooms(category_id);
CREATE INDEX IF NOT EXISTS idx_rooms_op_status ON public.rooms(operational_status);

CREATE INDEX IF NOT EXISTS idx_bookings_customer ON public.bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_hotel ON public.bookings(hotel_id);
CREATE INDEX IF NOT EXISTS idx_bookings_room ON public.bookings(room_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(booking_status);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON public.bookings(check_in_date, check_out_date);

CREATE INDEX IF NOT EXISTS idx_payments_booking ON public.payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(payment_status);

CREATE INDEX IF NOT EXISTS idx_saved_hotels_user ON public.saved_hotels(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON public.audit_logs(target_entity, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_id);
