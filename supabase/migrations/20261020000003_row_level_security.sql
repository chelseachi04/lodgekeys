-- ==============================================================================
-- Lodgekeys Database Foundation — Migration 003: Row Level Security Policies
-- ==============================================================================
-- Description:
-- Enables Row Level Security (RLS) across every public table.
-- Implements least-privilege policies protecting customer personal data,
-- operational records, financial ledgers, and property management boundaries.
-- ==============================================================================

-- 1. Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotel_managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotel_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.add_on_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_add_ons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 2. Profiles Policies
-- ==============================================================================

-- A user can read their own profile; admins can read all profiles;
-- Hotel managers can view customer profiles for guests who have booked their hotel.
CREATE POLICY "profiles_select_own_or_admin_or_hotel_guest"
ON public.profiles FOR SELECT
USING (
    id = auth.uid()
    OR public.is_admin()
    OR EXISTS (
        SELECT 1 
        FROM public.bookings b
        JOIN public.hotel_managers hm ON b.hotel_id = hm.hotel_id
        WHERE b.customer_id = public.profiles.id
          AND hm.user_id = auth.uid()
    )
);

-- Users can update only their own profile details (role escalation prevented by trigger)
CREATE POLICY "profiles_update_own"
ON public.profiles FOR UPDATE
USING (id = auth.uid() OR public.is_admin())
WITH CHECK (id = auth.uid() OR public.is_admin());

-- Users can insert their initial profile if not provisioned by trigger
CREATE POLICY "profiles_insert_own"
ON public.profiles FOR INSERT
WITH CHECK (
    id = auth.uid() 
    AND (role = 'customer' OR public.is_admin())
);

-- Deletion restricted to the profile owner or platform admin
CREATE POLICY "profiles_delete_own_or_admin"
ON public.profiles FOR DELETE
USING (id = auth.uid() OR public.is_admin());

-- ==============================================================================
-- 3. Hotels Policies
-- ==============================================================================

-- Public can view active, published, non-delisted hotels.
-- Managers can view their assigned property. Admins view all.
CREATE POLICY "hotels_select_public_or_manager"
ON public.hotels FOR SELECT
USING (
    (is_published = true AND is_delisted = false AND is_deleted = false)
    OR public.has_hotel_access(id)
);

-- Hotel managers can update details for their assigned hotel; admins can update all
CREATE POLICY "hotels_update_manager_or_admin"
ON public.hotels FOR UPDATE
USING (public.has_hotel_access(id))
WITH CHECK (public.has_hotel_access(id));

-- Property publishing and hard deletion is restricted to platform administrators
CREATE POLICY "hotels_insert_admin"
ON public.hotels FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY "hotels_delete_admin"
ON public.hotels FOR DELETE
USING (public.is_admin());

-- ==============================================================================
-- 4. Hotel Managers Assignment Policies
-- ==============================================================================

-- Managers can see their own assignment; admins can inspect all assignments
CREATE POLICY "hotel_managers_select"
ON public.hotel_managers FOR SELECT
USING (user_id = auth.uid() OR public.is_admin());

-- Only admins can assign or modify manager relationships
CREATE POLICY "hotel_managers_admin_manage"
ON public.hotel_managers FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ==============================================================================
-- 5. Hotel Applications Policies
-- ==============================================================================

-- Applicants can view their own application; admins view all applications
CREATE POLICY "hotel_applications_select"
ON public.hotel_applications FOR SELECT
USING (
    public.is_admin()
    OR contact_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
);

-- Anyone authenticated can submit an onboarding application
CREATE POLICY "hotel_applications_insert"
ON public.hotel_applications FOR INSERT
WITH CHECK (
    auth.uid() IS NOT NULL
    AND status = 'pending'
);

-- Only admins can review/update application statuses
CREATE POLICY "hotel_applications_update_admin"
ON public.hotel_applications FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "hotel_applications_delete_admin"
ON public.hotel_applications FOR DELETE
USING (public.is_admin());

-- ==============================================================================
-- 6. Room Categories & Inventory Policies
-- ==============================================================================

-- Categories visible to public if hotel is active; managers/admins see all for their hotel
CREATE POLICY "room_categories_select"
ON public.room_categories FOR SELECT
USING (
    public.has_hotel_access(hotel_id)
    OR (
        is_active = true 
        AND EXISTS (
            SELECT 1 FROM public.hotels h 
            WHERE h.id = room_categories.hotel_id 
              AND h.is_published = true 
              AND h.is_delisted = false 
              AND h.is_deleted = false
        )
    )
);

CREATE POLICY "room_categories_manage"
ON public.room_categories FOR ALL
USING (public.has_hotel_access(hotel_id))
WITH CHECK (public.has_hotel_access(hotel_id));

-- Individual physical rooms:
-- Public can view available rooms for published hotels to determine inventory.
-- Managers and admins have full operational management access.
CREATE POLICY "rooms_select"
ON public.rooms FOR SELECT
USING (
    public.has_hotel_access(hotel_id)
    OR (
        is_active = true 
        AND operational_status NOT IN ('maintenance', 'out_of_order')
        AND EXISTS (
            SELECT 1 FROM public.hotels h 
            WHERE h.id = rooms.hotel_id 
              AND h.is_published = true 
              AND h.is_delisted = false 
              AND h.is_deleted = false
        )
    )
);

CREATE POLICY "rooms_manage"
ON public.rooms FOR ALL
USING (public.has_hotel_access(hotel_id))
WITH CHECK (public.has_hotel_access(hotel_id));

-- ==============================================================================
-- 7. Add-On Services Policies
-- ==============================================================================

CREATE POLICY "add_ons_select"
ON public.add_on_services FOR SELECT
USING (is_active = true OR public.is_admin() OR (hotel_id IS NOT NULL AND public.has_hotel_access(hotel_id)));

CREATE POLICY "add_ons_manage"
ON public.add_on_services FOR ALL
USING (
    public.is_admin() 
    OR (hotel_id IS NOT NULL AND public.has_hotel_access(hotel_id))
)
WITH CHECK (
    public.is_admin() 
    OR (hotel_id IS NOT NULL AND public.has_hotel_access(hotel_id))
);

-- ==============================================================================
-- 8. Bookings Policies
-- ==============================================================================

-- Customers see their own bookings; managers see bookings for their properties; admins see all
CREATE POLICY "bookings_select"
ON public.bookings FOR SELECT
USING (
    customer_id = auth.uid()
    OR public.has_hotel_access(hotel_id)
);

-- Customers can insert bookings for themselves
CREATE POLICY "bookings_insert_customer"
ON public.bookings FOR INSERT
WITH CHECK (
    (customer_id = auth.uid() OR customer_id IS NULL)
    OR public.has_hotel_access(hotel_id)
);

-- Customers can cancel their pending/confirmed booking.
-- Managers can update operational booking statuses (e.g., checked_in, checked_out).
CREATE POLICY "bookings_update"
ON public.bookings FOR UPDATE
USING (
    customer_id = auth.uid()
    OR public.has_hotel_access(hotel_id)
)
WITH CHECK (
    customer_id = auth.uid()
    OR public.has_hotel_access(hotel_id)
);

CREATE POLICY "bookings_delete_admin"
ON public.bookings FOR DELETE
USING (public.is_admin());

-- ==============================================================================
-- 9. Booking Add-Ons Policies
-- ==============================================================================

CREATE POLICY "booking_add_ons_select"
ON public.booking_add_ons FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.bookings b 
        WHERE b.id = booking_add_ons.booking_id 
          AND (b.customer_id = auth.uid() OR public.has_hotel_access(b.hotel_id))
    )
);

CREATE POLICY "booking_add_ons_insert"
ON public.booking_add_ons FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.bookings b 
        WHERE b.id = booking_add_ons.booking_id 
          AND (b.customer_id = auth.uid() OR public.has_hotel_access(b.hotel_id))
    )
);

-- ==============================================================================
-- 10. Financial Records & Settlements Policies
-- ==============================================================================

-- Customers view payments for their bookings; managers view payments for their hotel; admins view all
CREATE POLICY "payments_select"
ON public.payments FOR SELECT
USING (
    public.is_admin()
    OR EXISTS (
        SELECT 1 FROM public.bookings b
        WHERE b.id = payments.booking_id
          AND (b.customer_id = auth.uid() OR public.has_hotel_access(b.hotel_id))
    )
);

-- Customers can initiate unverified/pending payment attempts on their bookings.
-- Managers can record manual front-desk receipts.
CREATE POLICY "payments_insert"
ON public.payments FOR INSERT
WITH CHECK (
    public.is_admin()
    OR (
        is_verified = false 
        AND payment_status = 'pending'
        AND EXISTS (
            SELECT 1 FROM public.bookings b 
            WHERE b.id = payments.booking_id 
              AND b.customer_id = auth.uid()
        )
    )
    OR (
        payment_status IN ('pending', 'manually_recorded')
        AND EXISTS (
            SELECT 1 FROM public.bookings b 
            WHERE b.id = payments.booking_id 
              AND public.has_hotel_access(b.hotel_id)
        )
    )
);

-- Verified payment status alterations restricted to managers recording manual receipts or admins
CREATE POLICY "payments_update"
ON public.payments FOR UPDATE
USING (
    public.is_admin()
    OR EXISTS (
        SELECT 1 FROM public.bookings b 
        WHERE b.id = payments.booking_id 
          AND public.has_hotel_access(b.hotel_id)
    )
)
WITH CHECK (
    public.is_admin()
    OR EXISTS (
        SELECT 1 FROM public.bookings b 
        WHERE b.id = payments.booking_id 
          AND public.has_hotel_access(b.hotel_id)
    )
);

-- Settlements visible to assigned managers and admins only
CREATE POLICY "settlements_select"
ON public.settlements FOR SELECT
USING (public.has_hotel_access(hotel_id));

CREATE POLICY "settlements_admin_manage"
ON public.settlements FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ==============================================================================
-- 11. Saved Hotels (Favorites) Policies
-- ==============================================================================

CREATE POLICY "saved_hotels_manage_own"
ON public.saved_hotels FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ==============================================================================
-- 12. Persistent Notifications Policies
-- ==============================================================================

CREATE POLICY "notifications_select_own"
ON public.notifications FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "notifications_update_own"
ON public.notifications FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "notifications_delete_own"
ON public.notifications FOR DELETE
USING (user_id = auth.uid());

CREATE POLICY "notifications_insert_system_or_own"
ON public.notifications FOR INSERT
WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- ==============================================================================
-- 13. Platform Settings Policies
-- ==============================================================================

-- Authenticated users can read public platform configurations (e.g. commission & VAT rates)
CREATE POLICY "platform_settings_select"
ON public.platform_settings FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Only admins can modify platform settings
CREATE POLICY "platform_settings_admin_manage"
ON public.platform_settings FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ==============================================================================
-- 14. Audit Logs Policies
-- ==============================================================================

-- Audit logs are strictly read-only for platform administrators
CREATE POLICY "audit_logs_select_admin"
ON public.audit_logs FOR SELECT
USING (public.is_admin());

-- Inserts permitted for authenticated sessions creating audit trails
CREATE POLICY "audit_logs_insert"
ON public.audit_logs FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL OR public.is_admin());

-- Updates and deletions are strictly disabled (immutable audit trail)
-- No UPDATE or DELETE policies created for audit_logs.
