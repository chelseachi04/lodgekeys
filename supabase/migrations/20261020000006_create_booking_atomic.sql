-- ==============================================================================
-- Lodgekeys Database Foundation — Migration 006: Server-Authoritative Booking RPC
-- ==============================================================================
-- Description:
-- Provisions the atomic server-side booking procedure (create_booking_atomic).
-- Guarantees server-side price calculation, row-level locking of physical rooms,
-- GiST exclusion double-booking defense, and atomic reservation creation.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.create_booking_atomic(
    p_hotel_id UUID,
    p_room_category_id UUID,
    p_check_in_date DATE,
    p_check_out_date DATE,
    p_guest_count INTEGER DEFAULT 1,
    p_guest_details JSONB DEFAULT '{}'::jsonb,
    p_add_on_ids TEXT[] DEFAULT '{}'::text[],
    p_payment_method TEXT DEFAULT 'hotel',
    p_rooms_count INTEGER DEFAULT 1
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_hotel RECORD;
    v_category RECORD;
    v_nights INTEGER;
    v_room_id UUID;
    v_room_number TEXT;
    v_nightly_rate NUMERIC(12,2);
    v_room_subtotal NUMERIC(12,2);
    v_add_ons_total NUMERIC(12,2) := 0.00;
    v_tax_rate_pct NUMERIC(5,2) := 5.00;
    v_commission_pct NUMERIC(5,2) := 10.00;
    v_tax_amount NUMERIC(12,2) := 0.00;
    v_grand_total NUMERIC(12,2);
    v_commission_amount NUMERIC(12,2);
    v_net_payout NUMERIC(12,2);
    v_ref_code TEXT;
    v_booking_id UUID;
    v_guest_name TEXT;
    v_guest_email TEXT;
    v_guest_phone TEXT;
    v_special_requests TEXT;
    v_payment_method TEXT;
    v_now TIMESTAMPTZ := now();
    v_itemized_addons JSONB := '[]'::jsonb;
BEGIN
    -- 1. Date Validation
    IF p_check_in_date IS NULL OR p_check_out_date IS NULL THEN
        RAISE EXCEPTION 'Check-in and check-out dates are required.';
    END IF;

    IF p_check_out_date <= p_check_in_date THEN
        RAISE EXCEPTION 'Check-out date must be after check-in date.';
    END IF;

    v_nights := p_check_out_date - p_check_in_date;
    IF v_nights < 1 THEN
        RAISE EXCEPTION 'Booking duration must be at least 1 night.';
    END IF;

    -- 2. Fetch and Validate Hotel
    SELECT id, slug, name, address, location, is_published, is_delisted, is_deleted
    INTO v_hotel
    FROM public.hotels
    WHERE id = p_hotel_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Target hotel not found: %', p_hotel_id;
    END IF;

    IF NOT v_hotel.is_published OR v_hotel.is_delisted OR v_hotel.is_deleted THEN
        RAISE EXCEPTION 'Hotel "%" is currently not accepting public reservations.', v_hotel.name;
    END IF;

    -- 3. Fetch and Validate Room Category
    SELECT id, slug, name, base_rate_nightly, max_guests, is_active
    INTO v_category
    FROM public.room_categories
    WHERE id = p_room_category_id AND hotel_id = p_hotel_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Selected room category not found for this property.';
    END IF;

    IF NOT v_category.is_active THEN
        RAISE EXCEPTION 'Selected room category "%" is currently inactive.', v_category.name;
    END IF;

    v_nightly_rate := v_category.base_rate_nightly;

    -- 4. Allocate Available Physical Room (with Row-Level Lock & Exclusion Defense)
    SELECT r.id, r.room_number
    INTO v_room_id, v_room_number
    FROM public.rooms r
    WHERE r.hotel_id = p_hotel_id
      AND r.category_id = v_category.id
      AND r.is_active = true
      AND r.operational_status NOT IN ('maintenance', 'out_of_order')
      AND NOT EXISTS (
          SELECT 1 
          FROM public.bookings b
          WHERE b.room_id = r.id
            AND b.booking_status IN ('pending', 'confirmed', 'checked_in')
            AND b.stay_range && daterange(p_check_in_date, p_check_out_date, '[)')
      )
    ORDER BY r.room_number ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;

    IF v_room_id IS NULL THEN
        RAISE EXCEPTION 'Selected room category is sold out for these dates.'
            USING ERRCODE = '23P01'; -- Map to Postgres exclusion violation convention
    END IF;

    -- 5. Server-Authoritative Price Calculations
    v_room_subtotal := v_nightly_rate * v_nights * GREATEST(1, COALESCE(p_rooms_count, 1));

    -- Calculate Add-ons from public.add_on_services
    IF p_add_on_ids IS NOT NULL AND array_length(p_add_on_ids, 1) > 0 THEN
        SELECT 
            COALESCE(SUM(s.price), 0.00),
            COALESCE(jsonb_agg(jsonb_build_object(
                'id', s.id,
                'title', s.title,
                'price', s.price,
                'priceFormatted', COALESCE(s.price_formatted, '₦' || to_char(s.price, 'FM999,999,999'))
            )), '[]'::jsonb)
        INTO v_add_ons_total, v_itemized_addons
        FROM public.add_on_services s
        WHERE s.id = ANY(p_add_on_ids)
          AND (s.hotel_id IS NULL OR s.hotel_id = p_hotel_id)
          AND s.is_active = true;
    END IF;

    -- Pull platform tax rate from platform_settings
    SELECT 
        COALESCE((value->>'tourismLevyVat')::numeric, 5.00),
        COALESCE((value->>'platformCommission')::numeric, 10.00)
    INTO v_tax_rate_pct, v_commission_pct
    FROM public.platform_settings
    WHERE key = 'platform_commission';

    -- Tax applied to room subtotal (in accordance with platform policy)
    v_tax_amount := ROUND(v_room_subtotal * (v_tax_rate_pct / 100.0), 2);
    v_grand_total := v_room_subtotal + v_add_ons_total + v_tax_amount;
    v_commission_amount := ROUND(v_grand_total * (v_commission_pct / 100.0), 2);
    v_net_payout := v_grand_total - v_commission_amount;

    -- 6. Generate Booking Reference (LK- + 8 characters)
    v_ref_code := 'LK-' || UPPER(SUBSTRING(MD5(RANDOM()::text || CLOCK_TIMESTAMP()::text) FROM 1 FOR 8));

    -- Extract Guest Details
    v_guest_name := COALESCE(NULLIF(TRIM(p_guest_details->>'fullName'), ''), NULLIF(TRIM(p_guest_details->>'full_name'), ''), 'Guest');
    v_guest_email := LOWER(COALESCE(NULLIF(TRIM(p_guest_details->>'email'), ''), 'guest@lodgekeys.com'));
    v_guest_phone := COALESCE(NULLIF(TRIM(p_guest_details->>'phone'), ''), '');
    v_special_requests := p_guest_details->>'specialRequests';

    v_payment_method := LOWER(COALESCE(p_payment_method, 'hotel'));
    IF v_payment_method NOT IN ('hotel', 'card', 'transfer') THEN
        v_payment_method := 'hotel';
    END IF;

    -- 7. Insert Booking Record
    INSERT INTO public.bookings (
        booking_reference,
        customer_id,
        hotel_id,
        room_id,
        room_category_id,
        check_in_date,
        check_out_date,
        nights_count,
        rooms_count,
        guests_count,
        guests_display,
        guest_full_name,
        guest_email,
        guest_phone,
        guest_special_requests,
        nightly_rate,
        room_subtotal,
        add_ons_total,
        tax_rate_pct,
        tax_amount,
        grand_total,
        payment_method,
        booking_status,
        created_at,
        updated_at
    ) VALUES (
        v_ref_code,
        auth.uid(),
        p_hotel_id,
        v_room_id,
        v_category.id,
        p_check_in_date,
        p_check_out_date,
        v_nights,
        GREATEST(1, COALESCE(p_rooms_count, 1)),
        GREATEST(1, COALESCE(p_guest_count, 1)),
        GREATEST(1, COALESCE(p_guest_count, 1)) || ' Guest' || CASE WHEN GREATEST(1, COALESCE(p_guest_count, 1)) > 1 THEN 's' ELSE '' END,
        v_guest_name,
        v_guest_email,
        v_guest_phone,
        v_special_requests,
        v_nightly_rate,
        v_room_subtotal,
        v_add_ons_total,
        v_tax_rate_pct,
        v_tax_amount,
        v_grand_total,
        v_payment_method,
        'confirmed',
        v_now,
        v_now
    )
    RETURNING id INTO v_booking_id;

    -- 8. Insert Itemized Add-Ons
    IF p_add_on_ids IS NOT NULL AND array_length(p_add_on_ids, 1) > 0 THEN
        INSERT INTO public.booking_add_ons (
            booking_id,
            service_id,
            service_title,
            unit_price,
            quantity,
            total_price
        )
        SELECT 
            v_booking_id,
            s.id,
            s.title,
            s.price,
            1,
            s.price
        FROM public.add_on_services s
        WHERE s.id = ANY(p_add_on_ids)
          AND (s.hotel_id IS NULL OR s.hotel_id = p_hotel_id)
          AND s.is_active = true;
    END IF;

    -- 9. Insert Initial Payment Record
    INSERT INTO public.payments (
        booking_id,
        transaction_reference,
        amount,
        currency,
        payment_method,
        payment_status,
        is_verified,
        commission_pct,
        commission_amount,
        net_payout_amount,
        notes,
        created_at,
        updated_at
    ) VALUES (
        v_booking_id,
        'TXN-' || v_ref_code,
        v_grand_total,
        'NGN',
        v_payment_method,
        'pending',
        false,
        v_commission_pct,
        v_commission_amount,
        v_net_payout,
        'Automated booking checkout initialization',
        v_now,
        v_now
    );

    -- 10. Provision In-App Notification if User is Authenticated
    IF auth.uid() IS NOT NULL THEN
        INSERT INTO public.notifications (
            user_id,
            title,
            message,
            booking_reference,
            metadata,
            created_at
        ) VALUES (
            auth.uid(),
            'Booking Confirmed: ' || v_category.name || ' at ' || v_hotel.name,
            'Your reservation (' || v_ref_code || ') has been confirmed. Room allocated: ' || v_room_number || '.',
            v_ref_code,
            jsonb_build_object(
                'booking_id', v_booking_id,
                'booking_ref', v_ref_code,
                'hotel_id', p_hotel_id,
                'hotel_name', v_hotel.name,
                'room_number', v_room_number,
                'check_in', p_check_in_date,
                'check_out', p_check_out_date,
                'total_amount', v_grand_total
            ),
            v_now
        );
    END IF;

    -- 11. Audit Log
    PERFORM public.log_audit_event(
        'BOOKING_CREATED_ATOMIC',
        'bookings',
        v_booking_id::text,
        jsonb_build_object(
            'booking_ref', v_ref_code,
            'hotel_slug', v_hotel.slug,
            'room_id', v_room_id,
            'room_number', v_room_number,
            'grand_total', v_grand_total
        )
    );

    -- 12. Return Consolidated Booking Confirmation Payload
    RETURN jsonb_build_object(
        'success', true,
        'id', v_ref_code,
        'bookingId', v_booking_id,
        'bookingRef', v_ref_code,
        'hotelId', p_hotel_id,
        'hotelName', v_hotel.name,
        'hotelSlug', v_hotel.slug,
        'hotelAddress', COALESCE(v_hotel.address, v_hotel.location),
        'roomName', v_category.name,
        'roomNumber', 'Room ' || v_room_number,
        'allocatedRoomNumber', v_room_number,
        'dates', jsonb_build_object(
            'arrival', p_check_in_date,
            'departure', p_check_out_date,
            'nights', v_nights,
            'guests', COALESCE(p_guest_count, 1) || ' Guest' || CASE WHEN COALESCE(p_guest_count, 1) > 1 THEN 's' ELSE '' END,
            'roomsCount', GREATEST(1, COALESCE(p_rooms_count, 1))
        ),
        'guest', jsonb_build_object(
            'fullName', v_guest_name,
            'email', v_guest_email,
            'phone', v_guest_phone,
            'specialRequests', v_special_requests
        ),
        'addOns', v_itemized_addons,
        'nightlyRate', v_nightly_rate,
        'roomSubtotal', v_room_subtotal,
        'addOnsTotal', v_add_ons_total,
        'taxRatePct', v_tax_rate_pct,
        'taxAmount', v_tax_amount,
        'totalAmount', v_grand_total,
        'paymentMethod', v_payment_method,
        'status', 'confirmed',
        'createdAt', v_now
    );
END;
$$;

-- Grant execution to all users (authenticated and public visitors)
GRANT EXECUTE ON FUNCTION public.create_booking_atomic TO anon, authenticated;
