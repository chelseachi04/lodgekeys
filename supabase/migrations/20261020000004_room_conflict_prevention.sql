-- ==============================================================================
-- Lodgekeys Database Foundation — Migration 004: Room Conflict Prevention
-- ==============================================================================
-- Description:
-- Implements a PostgreSQL GiST exclusion constraint preventing double bookings,
-- half-open date range mechanics [check_in, check_out), partial index conditions
-- isolating active reservations from cancelled/checked-out stays, and cleanup
-- routines for expiring temporary booking holds.
-- ==============================================================================

-- 1. Ensure required btree_gist extension is active
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- 2. PostgreSQL GiST Exclusion Constraint for Overlapping Bookings
-- Prevents two active bookings from reserving the exact same physical room
-- for overlapping date ranges.
-- The half-open range '[)' ensures checkout day for Guest A is immediately
-- available as check-in day for Guest B without artificial conflict.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'exclude_overlapping_room_bookings'
    ) THEN
        ALTER TABLE public.bookings
        ADD CONSTRAINT exclude_overlapping_room_bookings
        EXCLUDE USING gist (
            room_id WITH =,
            stay_range WITH &&
        )
        WHERE (booking_status IN ('pending', 'confirmed', 'checked_in'));
    END IF;
END;
$$;

-- 3. Room Availability Query Helper Function
-- Enables fast, server-side availability checks before starting a booking transaction.
CREATE OR REPLACE FUNCTION public.check_room_availability(
    p_room_id UUID,
    p_check_in DATE,
    p_check_out DATE,
    p_exclude_booking_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT NOT EXISTS (
        SELECT 1 
        FROM public.bookings
        WHERE room_id = p_room_id
          AND booking_status IN ('pending', 'confirmed', 'checked_in')
          AND (p_exclude_booking_id IS NULL OR id != p_exclude_booking_id)
          AND stay_range && dATERANGE(p_check_in, p_check_out, '[)')
    );
$$;

-- 4. Temporary Booking Hold Cleanup Routine
-- Sweeps pending reservations whose hold expiration timestamp has passed,
-- returning the allocated room back to the available inventory.
CREATE OR REPLACE FUNCTION public.expire_stale_booking_holds()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_expired_count INTEGER;
BEGIN
    WITH expired_rows AS (
        UPDATE public.bookings
        SET booking_status = 'expired',
            updated_at = now()
        WHERE booking_status = 'pending'
          AND hold_expires_at IS NOT NULL
          AND hold_expires_at < now()
        RETURNING id
    )
    SELECT COUNT(*) INTO v_expired_count FROM expired_rows;

    IF v_expired_count > 0 THEN
        PERFORM public.log_audit_event(
            'STALE_BOOKING_HOLDS_EXPIRED',
            'bookings',
            'batch',
            jsonb_build_object('expired_count', v_expired_count, 'executed_at', now())
        );
    END IF;

    RETURN v_expired_count;
END;
$$;
