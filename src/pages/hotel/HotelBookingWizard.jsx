import { useState, useEffect, useMemo } from 'react';
import { useOutletContext, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { 
  Calendar, Users, Bed, Check, ArrowRight, ArrowLeft, ShieldCheck, 
  Sparkles, Waves, Dumbbell, Ship, Printer, CheckCircle2, 
  CreditCard, Building2, Wallet, MapPin, Phone, Mail, User, Clock, AlertCircle,
  Percent, ChevronDown
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabaseClient';
import './HotelBookingWizard.css';

// ─── Storage Keys (cross-portal sync) ─────────────────────────────────────────
const STORAGE_KEY_MGR_RES      = 'lodgekeys_manager_reservations_v1';
const STORAGE_KEY_MGR_ROOMS    = 'lodgekeys_manager_rooms_v1';
const STORAGE_KEY_MGR_ACTIVITY = 'lodgekeys_manager_activity_v1';
const STORAGE_KEY_ADMIN_ACTIVITY = 'lodgekeys_admin_activity_v1';
const STORAGE_KEY_ADMIN_SETTINGS = 'lodgekeys_admin_platform_settings_v1';

function loadStore(key, fallback) {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; } catch { return fallback; }
}
function saveStore(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }

// Get today's date as YYYY-MM-DD string
function todayISO() {
  const d = new Date();
  return d.toFullYear
    ? undefined
    : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Returns YYYY-MM-DD for today (safe, no prototype issue)
function getTodayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Returns YYYY-MM-DD for tomorrow
function getTomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function fmtNGN(n) {
  return '\u20a6' + Number(n || 0).toLocaleString('en-NG');
}

function fmtDateNice(isoStr) {
  if (!isoStr) return '—';
  try {
    const [y, m, d] = isoStr.split('-');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${d} ${months[parseInt(m,10)-1]} ${y}`;
  } catch { return isoStr; }
}

function getAddOnIcon(iconName) {
  switch (iconName) {
    case 'dumbbell':
    case 'gym':
      return <Dumbbell size={18} />;
    case 'ship':
    case 'kayak':
    case 'boat':
      return <Ship size={18} />;
    case 'pool':
    case 'waves':
    default:
      return <Waves size={18} />;
  }
}

const ADD_ON_SERVICES = [
  {
    id: 'pool-pass',
    title: 'Swimming Pool & Cabana Pass',
    price: 5000,
    priceFormatted: '₦5,000',
    description: 'Day pass for resort lagoon pool, towel service & reserved private shaded cabana.',
    icon: <Waves size={18} />,
  },
  {
    id: 'gym-access',
    title: 'Gym & Fitness Center Access',
    price: 3500,
    priceFormatted: '₦3,500',
    description: 'Full pass to air-conditioned fitness studio, weights, cardio gear & infused hydration bar.',
    icon: <Dumbbell size={18} />,
  },
  {
    id: 'river-kayak',
    title: 'Ethiope River Boat Ride / Kayak Tour',
    price: 12000,
    priceFormatted: '₦12,000',
    description: '1-hour guided boat excursion or crystalline river kayak tour with life vests included.',
    icon: <Ship size={18} />,
  },
];

function calculateNights(checkInStr, checkOutStr) {
  if (!checkInStr || !checkOutStr) return 0;
  const start = new Date(checkInStr);
  const end = new Date(checkOutStr);
  const diffTime = end - start;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
}

function allocateRoomNumber(roomName) {
  const rName = (roomName || '').toLowerCase();
  if (rName.includes('garden') || rName.includes('classic') || rName.includes('study')) {
    return '204';
  }
  if (rName.includes('executive') || rName.includes('panorama') || rName.includes('regal')) {
    return '312';
  }
  if (rName.includes('family') || rName.includes('penthouse') || rName.includes('sanctuary')) {
    return '108';
  }
  if (rName.includes('villa') || rName.includes('chalet') || rName.includes('loft')) {
    return '402';
  }
  return String(Math.floor(201 + Math.random() * 50));
}

function allocateRoomDisplay(roomName) {
  const num = allocateRoomNumber(roomName);
  return `Room ${num} — ${roomName || 'Selected Room'}`;
}

export default function HotelBookingWizard() {
  const { hotel } = useOutletContext();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addBookingNotification, setActiveReceipt } = useNotifications();
  const { addBookingToUser } = useAuth();

  // Step state: 1 (Dates), 2 (Room & Extras), 3 (Guest Details), 4 (Review), 5 (Payment), 6 (Confirmation)
  const [currentStep, setCurrentStep] = useState(1);
  const [summaryOpen, setSummaryOpen] = useState(false);

  const STEP_LABELS = ['Dates', 'Room & Services', 'Guest Details', 'Review', 'Payment'];
  const currentStepLabel = STEP_LABELS[currentStep - 1] || '';

  // Form State
  const initialRoomId = searchParams.get('room') || (hotel.rooms?.[0]?.id || '');
  const [selectedRoomId, setSelectedRoomId] = useState(initialRoomId);

  const [arrivalDate, setArrivalDate] = useState(searchParams.get('arrival') || '');
  const [departureDate, setDepartureDate] = useState(searchParams.get('departure') || '');
  const [guests, setGuests] = useState(searchParams.get('guests') || '2 Guests, 1 Room');
  const [roomsCount, setRoomsCount] = useState(1);

  // Add-on services state (fetched from public.add_on_services with fallback)
  const [addOnServices, setAddOnServices] = useState(ADD_ON_SERVICES);
  const [selectedAddOnIds, setSelectedAddOnIds] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState(null);

  // Fetch dynamic add-ons from Supabase public.add_on_services
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let isMounted = true;
    supabase
      .from('add_on_services')
      .select('*')
      .eq('is_active', true)
      .then(({ data, error }) => {
        if (isMounted && !error && data && data.length > 0) {
          const mapped = data.map((item) => ({
            id: item.id,
            title: item.title,
            price: Number(item.price),
            priceFormatted: item.price_formatted || `₦${Number(item.price).toLocaleString('en-NG')}`,
            description: item.description,
            icon: getAddOnIcon(item.icon),
          }));
          setAddOnServices(mapped);
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch add-on services from Supabase:', err);
      });
    return () => { isMounted = false; };
  }, []);

  // Guest details state
  const [guestDetails, setGuestDetails] = useState({
    fullName: '',
    email: '',
    phone: '',
    specialRequests: '',
  });

  const [validationErrors, setValidationErrors] = useState({});

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState('hotel'); // 'hotel', 'card', 'transfer'
  const [cardInfo, setCardInfo] = useState({
    cardNumber: '5399 •••• •••• 4120',
    expiry: '12/28',
    cvv: '•••',
  });

  // Final confirmation record
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  // Derived current room
  const currentRoom = useMemo(() => {
    return (
      hotel.rooms?.find((r) => r.id === selectedRoomId) ||
      hotel.rooms?.[0] || {
        id: 'standard',
        name: `${hotel.name} Standard Room`,
        priceNumeric: hotel.priceNumeric || 45000,
        price: hotel.price || '₦45,000',
        features: 'King bed · En-suite bath · 2 Guests',
        image: hotel.image,
      }
    );
  }, [hotel, selectedRoomId]);

  // Load tax rate from Admin Platform Settings (live)
  const taxRate = useMemo(() => {
    const settings = loadStore(STORAGE_KEY_ADMIN_SETTINGS, {});
    const levy = Number(settings.tourismLevyVat || 5);
    return levy / 100; // e.g. 5% -> 0.05
  }, []);

  const taxRatePct = Math.round(taxRate * 100);

  // ─── Real-Time Price Formula ───────────────────────────────────────────────
  const nights = useMemo(() => calculateNights(arrivalDate, departureDate), [arrivalDate, departureDate]);
  const roomRate = currentRoom.priceNumeric || hotel.priceNumeric || 45000;

  // Base Cost = rate * nights * rooms (minimum 1 night equivalent if no dates chosen)
  const roomSubtotal = useMemo(() => {
    if (nights > 0) return roomRate * nights * roomsCount;
    // Before dates selected: show per-room rate as estimate
    return roomRate * roomsCount;
  }, [roomRate, nights, roomsCount]);

  const selectedAddOns = useMemo(() => {
    return addOnServices.filter((srv) => selectedAddOnIds.includes(srv.id));
  }, [addOnServices, selectedAddOnIds]);


  const addOnsTotal = useMemo(() => {
    return selectedAddOns.reduce((sum, srv) => sum + srv.price, 0);
  }, [selectedAddOns]);

  // Tax applied to room subtotal only (add-ons are tax-free)
  const taxAmount = useMemo(() => Math.round(roomSubtotal * taxRate), [roomSubtotal, taxRate]);

  const grandTotal = roomSubtotal + addOnsTotal + taxAmount;

  // Today string for min date enforcement
  const todayStr = useMemo(() => getTodayStr(), []);
  const tomorrowStr = useMemo(() => getTomorrowStr(), []);

  // Toggle add-on service
  const toggleAddOn = (serviceId) => {
    setSelectedAddOnIds((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId]
    );
  };

  // Step 3 Validation
  const validateStep3 = () => {
    const errors = {};
    if (!guestDetails.fullName.trim()) errors.fullName = 'Full Name is required';
    if (!guestDetails.email.trim() || !guestDetails.email.includes('@')) {
      errors.email = 'Valid email address is required';
    }
    if (!guestDetails.phone.trim() || guestDetails.phone.length < 7) {
      errors.phone = 'Valid phone number is required';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Navigation handlers
  const handleNext = () => {
    if (currentStep === 1) {
      if (!arrivalDate || !departureDate) {
        setValidationErrors({
          dates: 'Please select both your check-in and check-out dates to continue.',
        });
        return;
      }
      if (new Date(departureDate) <= new Date(arrivalDate)) {
        setValidationErrors({
          dates: 'Check-out date must be after check-in date.',
        });
        return;
      }
      setValidationErrors({});
    }
    if (currentStep === 3) {
      if (!validateStep3()) return;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentStep((prev) => Math.min(prev + 1, 5));
  };

  const handlePrev = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // ─── Cross-Portal Sync Helper ─────────────────────────────────────────────
  const syncLocalStores = (record) => {
    const roomNum = record.allocatedRoomNumber || (record.roomNumber ? String(record.roomNumber).replace(/[^0-9]/g, '') : '101');
    const now = record.createdAt || new Date().toISOString();

    // 2. Manager Portal Sync
    const today = getTodayStr();
    const isArrivalToday = record.dates?.arrival === today;

    const mgrRes = loadStore(STORAGE_KEY_MGR_RES, []);
    const mgrResEntry = {
      id: record.bookingRef,
      guestName: record.guest?.fullName || 'Guest',
      room: roomNum,
      roomTier: record.roomName,
      arrival: record.dates?.arrival,
      departure: record.dates?.departure,
      status: 'confirmed',
      payment: record.paymentMethod === 'hotel' ? 'Pay at Hotel' : record.paymentMethod === 'card' ? 'Paid' : 'Bank Transfer',
      total: record.totalAmount,
      hotelSlug: hotel.slug,
      createdAt: now,
      nights: record.dates?.nights || 1,
    };
    saveStore(STORAGE_KEY_MGR_RES, [mgrResEntry, ...mgrRes.filter(r => r.id !== record.bookingRef)]);

    const mgrRooms = loadStore(STORAGE_KEY_MGR_ROOMS, []);
    const updatedRooms = mgrRooms.map(rm =>
      String(rm.number) === String(roomNum) ? { ...rm, status: 'reserved' } : rm
    );
    saveStore(STORAGE_KEY_MGR_ROOMS, updatedRooms);

    const mgrActs = loadStore(STORAGE_KEY_MGR_ACTIVITY, []);
    saveStore(STORAGE_KEY_MGR_ACTIVITY, [
      {
        id: Date.now(),
        icon: 'booking',
        text: `New reservation: ${record.roomName} (Rm ${roomNum}) by ${record.guest?.fullName} · Ref ${record.bookingRef}`,
        time: now,
      },
      ...mgrActs,
    ].slice(0, 30));

    // 3. Admin Portal Sync
    const adminActs = loadStore(STORAGE_KEY_ADMIN_ACTIVITY, []);
    saveStore(STORAGE_KEY_ADMIN_ACTIVITY, [
      {
        id: Date.now() + 1,
        type: 'booking',
        text: `New booking: ${record.roomName} at ${hotel.name} by ${record.guest?.fullName} · Ref ${record.bookingRef}`,
        time: now,
      },
      ...adminActs,
    ].slice(0, 30));

    window.dispatchEvent(new Event('storage'));
  };

  // ─── Complete Booking + Server-Authoritative RPC ────────────────────────────
  const handleCompleteBooking = async () => {
    setIsSubmitting(true);
    setBookingError(null);

    // 1. Server-Authoritative Supabase RPC Execution
    if (isSupabaseConfigured) {
      try {
        let hotelId = hotel.uuid || hotel.id;
        let categoryId = currentRoom.uuid || currentRoom.id;

        const isUuid = (str) =>
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(str || ''));

        if (!isUuid(hotelId)) {
          const { data: dbHotel } = await supabase
            .from('hotels')
            .select('id')
            .eq('slug', hotel.slug)
            .maybeSingle();
          if (dbHotel) hotelId = dbHotel.id;
        }

        if (!isUuid(categoryId)) {
          const { data: dbCat } = await supabase
            .from('room_categories')
            .select('id')
            .eq('hotel_id', hotelId)
            .ilike('name', `%${(currentRoom.name || '').split(' ')[0]}%`)
            .limit(1)
            .maybeSingle();
          if (dbCat) categoryId = dbCat.id;
        }

        const guestCountNum = parseInt(guests, 10) || 2;

        const { data: rpcResult, error: rpcError } = await supabase.rpc('create_booking_atomic', {
          p_hotel_id: hotelId,
          p_room_category_id: categoryId,
          p_check_in_date: arrivalDate,
          p_check_out_date: departureDate,
          p_guest_count: guestCountNum,
          p_guest_details: {
            fullName: guestDetails.fullName,
            email: guestDetails.email,
            phone: guestDetails.phone,
            specialRequests: guestDetails.specialRequests,
          },
          p_add_on_ids: selectedAddOnIds,
          p_payment_method: paymentMethod,
          p_rooms_count: roomsCount,
        });

        if (rpcError) {
          console.error('create_booking_atomic error:', rpcError);
          const msg = (rpcError.message || '').toLowerCase();
          if (
            rpcError.code === '23P01' ||
            msg.includes('sold out') ||
            msg.includes('exclusion') ||
            msg.includes('conflict') ||
            msg.includes('not available')
          ) {
            setBookingError(
              'This room was just booked for the selected dates. Please select different dates or another room category.'
            );
            setIsSubmitting(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
          }
          throw rpcError;
        }

        if (rpcResult && rpcResult.success) {
          const bookingRecord = {
            id: rpcResult.bookingRef || rpcResult.id,
            bookingRef: rpcResult.bookingRef || rpcResult.id,
            hotelId: hotel.id,
            hotelName: hotel.name,
            hotelSlug: hotel.slug,
            hotelAddress: hotel.address || hotel.location,
            roomName: rpcResult.roomName || currentRoom.name,
            roomNumber: rpcResult.roomNumber || `Room ${rpcResult.allocatedRoomNumber}`,
            allocatedRoomNumber: rpcResult.allocatedRoomNumber,
            roomPriceNumeric: rpcResult.nightlyRate || roomRate,
            dates: {
              arrival: arrivalDate,
              departure: departureDate,
              nights: rpcResult.dates?.nights || nights,
              guests,
              roomsCount,
            },
            guest: { ...guestDetails },
            addOns: rpcResult.addOns || selectedAddOns,
            addOnsTotal: rpcResult.addOnsTotal || addOnsTotal,
            roomSubtotal: rpcResult.roomSubtotal || roomSubtotal,
            taxAmount: rpcResult.taxAmount || taxAmount,
            taxRatePct: rpcResult.taxRatePct || taxRatePct,
            totalAmount: rpcResult.totalAmount || grandTotal,
            paymentMethod,
            status: rpcResult.status || 'confirmed',
            timestamp: rpcResult.createdAt || new Date().toISOString(),
            createdAt: rpcResult.createdAt || new Date().toISOString(),
          };

          setConfirmedBooking(bookingRecord);
          setCurrentStep(6);
          window.scrollTo({ top: 0, behavior: 'smooth' });

          addBookingNotification(bookingRecord);
          try { if (addBookingToUser) addBookingToUser(bookingRecord); } catch { /* noop */ }
          syncLocalStores(bookingRecord);
          setIsSubmitting(false);
          return;
        }
      } catch (err) {
        console.warn('Booking submission error fallback:', err);
        const msg = (err.message || '').toLowerCase();
        if (
          err.code === '23P01' ||
          msg.includes('sold out') ||
          msg.includes('exclusion')
        ) {
          setBookingError(
            'This room was just booked for the selected dates. Please select different dates or another room category.'
          );
          setIsSubmitting(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
      }
    }

    // 2. Demo / Fallback Execution (if offline or database unconfigured)
    const refCode = `LK-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
    const roomNum = allocateRoomNumber(currentRoom.name);
    const roomDisplay = allocateRoomDisplay(currentRoom.name);
    const now = new Date().toISOString();

    const bookingRecord = {
      id: refCode,
      bookingRef: refCode,
      hotelId: hotel.id,
      hotelName: hotel.name,
      hotelSlug: hotel.slug,
      hotelAddress: hotel.address || hotel.location,
      roomName: currentRoom.name,
      roomNumber: roomDisplay,
      allocatedRoomNumber: roomNum,
      roomPriceNumeric: roomRate,
      dates: {
        arrival: arrivalDate,
        departure: departureDate,
        nights,
        guests,
        roomsCount,
      },
      guest: { ...guestDetails },
      addOns: selectedAddOns.map(a => ({ id: a.id, title: a.title, price: a.price, priceFormatted: a.priceFormatted })),
      addOnsTotal,
      roomSubtotal,
      taxAmount,
      taxRatePct,
      totalAmount: grandTotal,
      paymentMethod,
      status: 'confirmed',
      timestamp: now,
      createdAt: now,
    };

    setConfirmedBooking(bookingRecord);
    setCurrentStep(6);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    addBookingNotification(bookingRecord);
    try { if (addBookingToUser) addBookingToUser(bookingRecord); } catch { /* noop */ }
    syncLocalStores(bookingRecord);
    setIsSubmitting(false);
  };


  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="booking-wizard-page">
      {/* Top Banner & Stepper Header */}
      <section className="booking-wizard-header no-print">
        <div className="container">
          <div className="wizard-breadcrumb">
            <Link to={`/hotels/${hotel.slug}`} className="wizard-back-link">
              <ArrowLeft size={14} /> Back to {hotel.name}
            </Link>
          </div>

          <div className="wizard-title-row">
            <div>
              <span className="eyebrow" style={{ color: 'var(--color-gold)' }}>SECURE RESERVATION</span>
              <h1 className="wizard-title">Book Your Stay at {hotel.name}</h1>
            </div>
            <div className="wizard-guarantee-pill">
              <ShieldCheck size={14} />
              <span>Direct Desk Reservation · Zero Booking Fees</span>
            </div>
          </div>

          {/* Desktop Stepper Progress Bar (Steps 1 to 5) */}
          {currentStep <= 5 && (
            <div className="stepper-bar" aria-label="Booking steps">
              {[
                { step: 1, label: 'Dates' },
                { step: 2, label: 'Room & Services' },
                { step: 3, label: 'Guest Details' },
                { step: 4, label: 'Review' },
                { step: 5, label: 'Payment' },
              ].map((item) => {
                const isPassed = currentStep > item.step;
                const isActive = currentStep === item.step;
                return (
                  <div
                    key={item.step}
                    className={`stepper-node ${isPassed ? 'stepper-node--passed' : ''} ${
                      isActive ? 'stepper-node--active' : ''
                    }`}
                  >
                    <div className="stepper-circle">
                      {isPassed ? <Check size={14} strokeWidth={2.5} /> : item.step}
                    </div>
                    <span className="stepper-label">{item.label}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Mobile Compact Step Indicator */}
          {currentStep <= 5 && (
            <div className="stepper-mobile-indicator" aria-label="Booking progress">
              <span className="stepper-mobile-text">
                Step <strong>{currentStep} of 5</strong>: {currentStepLabel}
              </span>
              <div className="stepper-mobile-progress">
                <div
                  className="stepper-mobile-progress__bar"
                  style={{ width: `${(currentStep / 5) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Main Form Content Grid */}
      <div className="container wizard-container">
        {currentStep === 6 && confirmedBooking ? (
          /* ===================================
             Step 6: Confirmation & Receipt View
             =================================== */
          <div className="wizard-confirmation-view">
            {/* Success Celebration Card */}
            <div className="confirmation-banner no-print">
              <div className="confirmation-banner__icon">
                <CheckCircle2 size={36} />
              </div>
              <div className="confirmation-banner__content">
                <span className="confirmation-eyebrow">RESERVATION PLACED ON DESK HOLD</span>
                <h2 className="confirmation-heading">Your Stay in Abraka is Confirmed!</h2>
                <p className="confirmation-desc">
                  We've alerted the reception desk at <strong>{hotel.name}</strong>. A reservation hold is locked under reference code <strong>{confirmedBooking.bookingRef}</strong>.
                </p>
                <div className="confirmation-actions">
                  <button
                    type="button"
                    className="btn btn-primary btn-print-receipt"
                    onClick={handlePrintReceipt}
                  >
                    <Printer size={15} /> Download / Print Receipt
                  </button>
                  <Link to={`/hotels/${hotel.slug}`} className="btn btn-outline">
                    Return to Hotel Page
                  </Link>
                  <Link to="/explore" className="btn btn-outline">
                    Explore Other Stays
                  </Link>
                </div>
              </div>
            </div>

            {/* Official Printable Invoice Voucher */}
            <div className="official-receipt-card" id="printable-invoice">
              <div className="receipt-voucher-header">
                <div>
                  <span className="receipt-logo">lodgekeys.</span>
                  <span className="receipt-subtitle">Abraka Accommodations &amp; Verified Hospitality</span>
                </div>
                <div className="receipt-ref-pill">
                  <span className="ref-title">BOOKING REFERENCE</span>
                  <strong className="ref-number">{confirmedBooking.bookingRef}</strong>
                  <span className="ref-status-tag">CONFIRMED &amp; ALLOCATED</span>
                </div>
              </div>

              {/* Allocated Room Highlight Box */}
              <div className="allocated-room-banner">
                <div className="allocated-room-meta">
                  <span className="allocated-label">Automated Room Allocation</span>
                  <h3 className="allocated-number">{confirmedBooking.roomNumber}</h3>
                  <p className="allocated-hotel">
                    <MapPin size={13} /> {hotel.name} · {hotel.address || hotel.location}
                  </p>
                </div>
                <div className="allocated-qr-box">
                  <span className="qr-barcode-text">||| | |||| || | ||||| || |||</span>
                  <span className="qr-barcode-sub">{confirmedBooking.bookingRef}</span>
                </div>
              </div>

              {/* Schedule & Guest Grid */}
              <div className="receipt-data-grid">
                <div className="receipt-data-card">
                  <h4>Stay Schedule</h4>
                  <div className="receipt-field">
                    <Calendar size={14} />
                    <div>
                      <span>Check-in</span>
                      <strong>{fmtDateNice(confirmedBooking.dates.arrival)} (From 2:00 PM)</strong>
                    </div>
                  </div>
                  <div className="receipt-field">
                    <Calendar size={14} />
                    <div>
                      <span>Check-out</span>
                      <strong>{fmtDateNice(confirmedBooking.dates.departure)} (By 11:00 AM)</strong>
                    </div>
                  </div>
                  <div className="receipt-field">
                    <Clock size={14} />
                    <div>
                      <span>Stay Duration</span>
                      <strong>
                        {confirmedBooking.dates.nights} Night{confirmedBooking.dates.nights > 1 ? 's' : ''} · {confirmedBooking.dates.guests}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="receipt-data-card">
                  <h4>Guest Details</h4>
                  <div className="receipt-field">
                    <User size={14} />
                    <span>{confirmedBooking.guest.fullName}</span>
                  </div>
                  <div className="receipt-field">
                    <Mail size={14} />
                    <span>{confirmedBooking.guest.email}</span>
                  </div>
                  <div className="receipt-field">
                    <Phone size={14} />
                    <span>{confirmedBooking.guest.phone}</span>
                  </div>
                  {confirmedBooking.guest.specialRequests && (
                    <div className="receipt-field">
                      <span className="special-req-label">Note: "{confirmedBooking.guest.specialRequests}"</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Add-ons List if any */}
              {confirmedBooking.addOns.length > 0 && (
                <div className="receipt-addons-card">
                  <h4>Selected Experiences &amp; Activities</h4>
                  <ul>
                    {confirmedBooking.addOns.map((add) => (
                      <li key={add.id}>
                        <span>{add.title}</span>
                        <strong>+{add.priceFormatted}</strong>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Official Itemized Financial Breakdown */}
              <div className="receipt-financials-table">
                <div className="table-row">
                  <span>
                    {confirmedBooking.roomName}
                    &nbsp;({fmtNGN(confirmedBooking.roomPriceNumeric)} &times; {confirmedBooking.dates.nights} night{confirmedBooking.dates.nights > 1 ? 's' : ''}{confirmedBooking.dates.roomsCount > 1 ? ` × ${confirmedBooking.dates.roomsCount} rooms` : ''})
                  </span>
                  <strong>{fmtNGN(confirmedBooking.roomSubtotal ?? confirmedBooking.roomPriceNumeric * confirmedBooking.dates.nights)}</strong>
                </div>
                {confirmedBooking.addOns?.map(addon => (
                  <div key={addon.id} className="table-row">
                    <span>{addon.title}</span>
                    <strong>+{fmtNGN(addon.price)}</strong>
                  </div>
                ))}
                {(confirmedBooking.taxAmount ?? 0) > 0 && (
                  <div className="table-row">
                    <span>Delta Tourism Levy &amp; Hospitality Tax ({confirmedBooking.taxRatePct ?? 5}%)</span>
                    <span>+{fmtNGN(confirmedBooking.taxAmount)}</span>
                  </div>
                )}
                <div className="table-divider" />
                <div className="table-row table-row--grand">
                  <div>
                    <strong>Total Amount Due</strong>
                    <span className="method-note">
                      Payment Mode:{' '}
                      {confirmedBooking.paymentMethod === 'hotel'
                        ? 'Pay at Hotel Reception on Arrival'
                        : confirmedBooking.paymentMethod === 'card'
                        ? 'Card Pre-authorized Online'
                        : 'Bank Transfer Escrow'}
                    </span>
                  </div>
                  <strong className="grand-amount">{fmtNGN(confirmedBooking.totalAmount)}</strong>
                </div>
              </div>

              <div className="receipt-voucher-footer">
                <div className="voucher-assurance">
                  <ShieldCheck size={16} />
                  <span>
                    Present this reservation receipt or booking reference <strong>{confirmedBooking.bookingRef}</strong> upon check-in at {hotel.name} front desk.
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ===================================
             Steps 1 to 5: Form & Persistent Sidebar
             =================================== */
          <div className="wizard-split-layout">
            {/* Mobile Collapsible Summary Accordion */}
            <div className="wizard-summary-accordion">
              <button
                type="button"
                className="wizard-summary-accordion__toggle"
                onClick={() => setSummaryOpen(!summaryOpen)}
                aria-expanded={summaryOpen}
              >
                <div className="wizard-summary-accordion__toggle-label">
                  <span>
                    View Stay Summary: <strong>{fmtNGN(totalDue)}</strong>
                  </span>
                  <span className="wizard-summary-accordion__toggle-sub">
                    {currentRoom?.name || 'Selected Room'} ·{' '}
                    {nights > 0 ? `${nights} night${nights > 1 ? 's' : ''}` : '1 night'}
                  </span>
                </div>
                <ChevronDown
                  size={18}
                  className={`wizard-summary-accordion__chevron ${
                    summaryOpen ? 'wizard-summary-accordion__chevron--open' : ''
                  }`}
                />
              </button>

              {summaryOpen && (
                <div className="wizard-summary-accordion__body">
                  <div className="sidebar-dates-row" style={{ marginTop: 12 }}>
                    <div className="date-block">
                      <span className="date-label">Check-in</span>
                      <strong>{arrivalDate || 'Not selected'}</strong>
                    </div>
                    <div className="date-divider" />
                    <div className="date-block">
                      <span className="date-label">Check-out</span>
                      <strong>{departureDate || 'Not selected'}</strong>
                    </div>
                  </div>

                  <div className="sidebar-pricing-breakdown" style={{ marginTop: 12 }}>
                    <div className="pricing-row">
                      <span>
                        {fmtNGN(roomRate)} &times; {nights > 0 ? nights : 1} night(s)
                        {roomsCount > 1 ? ` &times; ${roomsCount} rooms` : ''}
                      </span>
                      <span>{fmtNGN(roomSubtotal)}</span>
                    </div>
                    {serviceCharge > 0 && (
                      <div className="pricing-row">
                        <span>Selected Add-ons</span>
                        <span>{fmtNGN(serviceCharge)}</span>
                      </div>
                    )}
                    <div className="pricing-row">
                      <span>Platform &amp; Direct Fee</span>
                      <span className="free-tag">₦0 (Waived)</span>
                    </div>
                    <div className="pricing-divider" />
                    <div className="pricing-total-row">
                      <span>Total Reservation Cost</span>
                      <span className="pricing-total-val">{fmtNGN(totalDue)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Left Steps Column */}
            <div className="wizard-main-col">
              {/* STEP 1: Dates & Rooms */}
              {currentStep === 1 && (
                <div className="wizard-step-card">
                  <span className="step-tag">STAGE 1 OF 5</span>
                  <h2 className="step-heading">Select Dates &amp; Guests</h2>
                  <p className="step-desc">
                    Choose when you plan to visit Abraka. We verify immediate room allocations in real time.
                  </p>

                  <div className="form-grid">
                    <div className="form-field">
                      <label className="form-label">Check-in Date</label>
                      <div className="form-input-wrap">
                        <input
                          type="date"
                          className="form-input"
                          value={arrivalDate}
                          min={todayStr}
                          onChange={(e) => {
                            setArrivalDate(e.target.value);
                            // Auto-advance checkout if needed
                            if (departureDate && e.target.value >= departureDate) {
                              const d = new Date(e.target.value);
                              d.setDate(d.getDate() + 1);
                              const y = d.getFullYear();
                              const m = String(d.getMonth()+1).padStart(2,'0');
                              const day = String(d.getDate()).padStart(2,'0');
                              setDepartureDate(`${y}-${m}-${day}`);
                            }
                          }}
                          required
                        />
                        <Calendar size={18} className="form-field-icon" />
                      </div>
                    </div>

                    <div className="form-field">
                      <label className="form-label">Check-out Date</label>
                      <div className="form-input-wrap">
                        <input
                          type="date"
                          className="form-input"
                          value={departureDate}
                          min={arrivalDate ? (() => {
                            const d = new Date(arrivalDate);
                            d.setDate(d.getDate() + 1);
                            return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
                          })() : tomorrowStr}
                          onChange={(e) => setDepartureDate(e.target.value)}
                          required
                        />
                        <Calendar size={18} className="form-field-icon" />
                      </div>
                    </div>

                    <div className="form-field">
                      <label className="form-label">Guests &amp; Accommodation</label>
                      <div className="form-input-wrap">
                        <select
                          className="form-select"
                          value={guests}
                          onChange={(e) => setGuests(e.target.value)}
                        >
                          <option value="1 Guest, 1 Room">1 Guest, 1 Room</option>
                          <option value="2 Guests, 1 Room">2 Guests, 1 Room</option>
                          <option value="3 Guests, 2 Rooms">3 Guests, 2 Rooms</option>
                          <option value="4+ Guests, Family Suite">4+ Guests, Family Suite</option>
                        </select>
                        <Users size={18} className="form-field-icon" />
                      </div>
                    </div>

                    <div className="form-field">
                      <label className="form-label">Number of Rooms</label>
                      <div className="form-input-wrap">
                        <select
                          className="form-select"
                          value={roomsCount}
                          onChange={(e) => setRoomsCount(Number(e.target.value))}
                        >
                          <option value={1}>1 Room</option>
                          <option value={2}>2 Rooms</option>
                          <option value={3}>3 Rooms</option>
                        </select>
                        <Bed size={18} className="form-field-icon" />
                      </div>
                    </div>
                  </div>

                  {validationErrors.dates && (
                    <div className="dates-error-banner">
                      <AlertCircle size={16} />
                      <span>{validationErrors.dates}</span>
                    </div>
                  )}

                  <div className="dates-summary-banner">
                    <Clock size={16} />
                    {arrivalDate && departureDate && nights > 0 ? (
                      <span>
                        Stay duration: <strong>{nights} night{nights > 1 ? 's' : ''}</strong>
                        &nbsp;·&nbsp;{fmtDateNice(arrivalDate)} <span style={{opacity:0.6}}>→</span> {fmtDateNice(departureDate)}
                        &nbsp;·&nbsp;Est. total: <strong>{fmtNGN(grandTotal)}</strong>
                      </span>
                    ) : (
                      <span>Please select your check-in and check-out dates above to calculate your stay duration and price.</span>
                    )}
                  </div>

                  <div className="wizard-step-footer">
                    <button type="button" className="btn btn-primary wizard-btn-next" onClick={handleNext}>
                      Continue to Room &amp; Extras
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: Room Selection & Add-on Services */}
              {currentStep === 2 && (
                <div className="wizard-step-card">
                  <span className="step-tag">STAGE 2 OF 5</span>
                  <h2 className="step-heading">Room Category &amp; Extra Services</h2>
                  <p className="step-desc">
                    Confirm your desired room type and optionally add bespoke local experiences for your Abraka retreat.
                  </p>

                  {/* Room Selection Radio Cards */}
                  <div className="rooms-selector-group">
                    <label className="group-label">Select Room Type</label>
                    <div className="rooms-choice-list">
                      {hotel.rooms?.map((rm) => (
                        <div
                          key={rm.id}
                          className={`room-choice-card ${selectedRoomId === rm.id ? 'room-choice-card--active' : ''}`}
                          onClick={() => setSelectedRoomId(rm.id)}
                        >
                          <img src={rm.image} alt={rm.name} className="room-choice-thumb" />
                          <div className="room-choice-info">
                            <h4 className="room-choice-title">{rm.name}</h4>
                            <span className="room-choice-features">{rm.features}</span>
                            <span className="room-choice-price">
                              <strong>{rm.price}</strong> / night
                            </span>
                          </div>
                          <div className="room-choice-radio">
                            {selectedRoomId === rm.id && <Check size={14} />}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Add-on Services Selector (Dropdown / Multi-Select) */}
                  <div className="addons-selector-group">
                    <div className="addons-header">
                      <div>
                        <label className="group-label" style={{ marginBottom: 2 }}>
                          Add-on Services &amp; Experiences
                        </label>
                        <span className="group-sublabel">
                          Optional passes to elevate your stay. All fees automatically update your itemized total.
                        </span>
                      </div>
                    </div>

                    <div className="addons-cards-list">
                      {addOnServices.map((srv) => {
                        const isSelected = selectedAddOnIds.includes(srv.id);
                        return (
                          <div
                            key={srv.id}
                            className={`addon-choice-card ${isSelected ? 'addon-choice-card--active' : ''}`}
                            onClick={() => toggleAddOn(srv.id)}
                          >
                            <div className="addon-checkbox">
                              {isSelected && <Check size={13} strokeWidth={3} />}
                            </div>
                            <div className="addon-icon-wrap">{srv.icon}</div>
                            <div className="addon-details">
                              <div className="addon-title-row">
                                <strong className="addon-title">{srv.title}</strong>
                                <span className="addon-price">+{srv.priceFormatted}</span>
                              </div>
                              <p className="addon-desc">{srv.description}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="wizard-step-footer">
                    <button type="button" className="btn btn-outline" onClick={handlePrev}>
                      <ArrowLeft size={15} /> Back to Dates
                    </button>
                    <button type="button" className="btn btn-primary wizard-btn-next" onClick={handleNext}>
                      Continue to Guest Details
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Guest Details */}
              {currentStep === 3 && (
                <div className="wizard-step-card">
                  <span className="step-tag">STAGE 3 OF 5</span>
                  <h2 className="step-heading">Guest &amp; Contact Details</h2>
                  <p className="step-desc">
                    Who will be checking in? We send booking vouchers and front-desk holds to these contacts.
                  </p>

                  <div className="form-grid">
                    <div className="form-field form-field--full">
                      <label className="form-label">Full Legal Name *</label>
                      <input
                        type="text"
                        className={`form-input ${validationErrors.fullName ? 'form-input--error' : ''}`}
                        placeholder="e.g. Dr. Emeka Okafor"
                        value={guestDetails.fullName}
                        onChange={(e) => setGuestDetails({ ...guestDetails, fullName: e.target.value })}
                        required
                      />
                      {validationErrors.fullName && (
                        <span className="field-error">{validationErrors.fullName}</span>
                      )}
                    </div>

                    <div className="form-field">
                      <label className="form-label">Email Address *</label>
                      <input
                        type="email"
                        className={`form-input ${validationErrors.email ? 'form-input--error' : ''}`}
                        placeholder="emeka@example.com"
                        value={guestDetails.email}
                        onChange={(e) => setGuestDetails({ ...guestDetails, email: e.target.value })}
                        required
                      />
                      {validationErrors.email && (
                        <span className="field-error">{validationErrors.email}</span>
                      )}
                    </div>

                    <div className="form-field">
                      <label className="form-label">Phone Number (WhatsApp) *</label>
                      <input
                        type="tel"
                        className={`form-input ${validationErrors.phone ? 'form-input--error' : ''}`}
                        placeholder="+234 803 000 0000"
                        value={guestDetails.phone}
                        onChange={(e) => setGuestDetails({ ...guestDetails, phone: e.target.value })}
                        required
                      />
                      {validationErrors.phone && (
                        <span className="field-error">{validationErrors.phone}</span>
                      )}
                    </div>

                    <div className="form-field form-field--full">
                      <label className="form-label">Special Requests / Desk Notes (Optional)</label>
                      <textarea
                        className="form-textarea"
                        rows={3}
                        placeholder="e.g. High floor requested, arriving late around 7:00 PM, vegetarian breakfast preference..."
                        value={guestDetails.specialRequests}
                        onChange={(e) => setGuestDetails({ ...guestDetails, specialRequests: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="wizard-step-footer">
                    <button type="button" className="btn btn-outline" onClick={handlePrev}>
                      <ArrowLeft size={15} /> Back
                    </button>
                    <button type="button" className="btn btn-primary wizard-btn-next" onClick={handleNext}>
                      Proceed to Review
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: Review */}
              {currentStep === 4 && (
                <div className="wizard-step-card">
                  <span className="step-tag">STAGE 4 OF 5</span>
                  <h2 className="step-heading">Review Your Reservation</h2>
                  <p className="step-desc">
                    Please verify your reservation details, room selection, and guest contacts before selecting payment.
                  </p>

                  <div className="review-summary-box">
                    <div className="review-section">
                      <h4>Property &amp; Room</h4>
                      <div className="review-grid">
                        <div>
                          <span className="review-sub">Hotel:</span>
                          <strong>{hotel.name}</strong>
                          <span className="review-address">{hotel.address || hotel.location}</span>
                        </div>
                        <div>
                          <span className="review-sub">Category:</span>
                          <strong>{currentRoom.name}</strong>
                          <span className="review-address">{currentRoom.features}</span>
                        </div>
                      </div>
                    </div>

                    <div className="review-section">
                      <h4>Dates &amp; Schedule</h4>
                      <div className="review-grid">
                        <div>
                          <span className="review-sub">Check-in:</span>
                          <strong>{arrivalDate} ({hotel.policies?.checkIn || hotel.checkIn || '2:00 PM'})</strong>
                        </div>
                        <div>
                          <span className="review-sub">Check-out:</span>
                          <strong>{departureDate} ({hotel.policies?.checkOut || hotel.checkOut || '11:00 AM'})</strong>
                        </div>
                        <div>
                          <span className="review-sub">Total Duration:</span>
                          <strong>{nights} Night(s) · {guests}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="review-section">
                      <h4>Guest Contact Information</h4>
                      <div className="review-grid">
                        <div>
                          <span className="review-sub">Primary Guest:</span>
                          <strong>{guestDetails.fullName}</strong>
                        </div>
                        <div>
                          <span className="review-sub">Email:</span>
                          <span>{guestDetails.email}</span>
                        </div>
                        <div>
                          <span className="review-sub">Phone:</span>
                          <span>{guestDetails.phone}</span>
                        </div>
                      </div>
                    </div>

                    <div className="review-section">
                      <h4>Property Policies &amp; Conditions</h4>
                      <div className="review-grid">
                        <div>
                          <span className="review-sub">Arrival Policy:</span>
                          <span style={{ fontSize: '13px', lineHeight: '1.4', display: 'block', marginTop: '2px' }}>
                            {hotel.policies?.arrivalPolicy || 'Government-issued photo ID required on arrival.'}
                          </span>
                        </div>
                        <div>
                          <span className="review-sub">Cancellation Policy:</span>
                          <span style={{ fontSize: '13px', lineHeight: '1.4', display: 'block', marginTop: '2px' }}>
                            {hotel.policies?.cancellationPolicy || 'Free cancellation up to 48 hours before arrival.'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {selectedAddOns.length > 0 && (
                      <div className="review-section">
                        <h4>Add-on Services Included</h4>
                        <div className="review-addons-pills">
                          {selectedAddOns.map((srv) => (
                            <span key={srv.id} className="review-addon-pill">
                              <Check size={12} /> {srv.title} (+{srv.priceFormatted})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="wizard-step-footer">
                    <button type="button" className="btn btn-outline" onClick={handlePrev}>
                      <ArrowLeft size={15} /> Edit Details
                    </button>
                    <button type="button" className="btn btn-primary wizard-btn-next" onClick={handleNext}>
                      Proceed to Payment
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 5: Payment */}
              {currentStep === 5 && (
                <div className="wizard-step-card">
                  <span className="step-tag">STAGE 5 OF 5</span>
                  <h2 className="step-heading">Payment Options</h2>
                  <p className="step-desc">
                    Choose how you would like to settle your stay. No non-refundable advance charges are forced on Lodgekeys.
                  </p>

                  {bookingError && (
                    <div
                      className="wizard-conflict-alert"
                      style={{
                        backgroundColor: '#fef2f2',
                        border: '1px solid #f87171',
                        color: '#991b1b',
                        padding: '14px 18px',
                        borderRadius: '8px',
                        marginBottom: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        fontSize: '0.95rem',
                      }}
                    >
                      <AlertCircle size={20} style={{ flexShrink: 0 }} />
                      <span>{bookingError}</span>
                    </div>
                  )}

                  <div className="payment-options-list">
                    {/* Option 1: Pay at Hotel (Recommended) */}
                    <div
                      className={`payment-option-card ${paymentMethod === 'hotel' ? 'payment-option-card--active' : ''}`}
                      onClick={() => setPaymentMethod('hotel')}
                    >
                      <div className="payment-radio">
                        {paymentMethod === 'hotel' && <Check size={13} />}
                      </div>
                      <div className="payment-icon">
                        <Building2 size={20} />
                      </div>
                      <div className="payment-details">
                        <div className="payment-title-row">
                          <strong>Pay at Hotel (Front Desk upon Arrival)</strong>
                          <span className="payment-badge-rec">RECOMMENDED</span>
                        </div>
                        <p className="payment-desc">
                          Lock your room number now. Settle in cash, POS card, or transfer directly upon check-in at {hotel.name}.
                        </p>
                      </div>
                    </div>

                    {/* Option 2: Card Payment Preview */}
                    <div
                      className={`payment-option-card ${paymentMethod === 'card' ? 'payment-option-card--active' : ''}`}
                      onClick={() => setPaymentMethod('card')}
                    >
                      <div className="payment-radio">
                        {paymentMethod === 'card' && <Check size={13} />}
                      </div>
                      <div className="payment-icon">
                        <CreditCard size={20} />
                      </div>
                      <div className="payment-details">
                        <div className="payment-title-row">
                          <strong>Debit / Credit Card (Paystack Preview)</strong>
                        </div>
                        <p className="payment-desc">
                          Instant card authorization via secure 256-bit encrypted gateway.
                        </p>
                        {paymentMethod === 'card' && (
                          <div className="card-preview-box">
                            <div className="card-mock-row">
                              <span>Card Number:</span>
                              <strong>{cardInfo.cardNumber}</strong>
                            </div>
                            <div className="card-mock-row">
                              <span>Expires: {cardInfo.expiry}</span>
                              <span>CVV: {cardInfo.cvv}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Option 3: Direct Bank Transfer */}
                    <div
                      className={`payment-option-card ${paymentMethod === 'transfer' ? 'payment-option-card--active' : ''}`}
                      onClick={() => setPaymentMethod('transfer')}
                    >
                      <div className="payment-radio">
                        {paymentMethod === 'transfer' && <Check size={13} />}
                      </div>
                      <div className="payment-icon">
                        <Wallet size={20} />
                      </div>
                      <div className="payment-details">
                        <div className="payment-title-row">
                          <strong>Direct Bank Transfer Escrow</strong>
                        </div>
                        <p className="payment-desc">
                          Transfer directly into Lodgekeys verified Nigerian escrow account (Zenith Bank / GTBank).
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="wizard-step-footer">
                    <button type="button" className="btn btn-outline" onClick={handlePrev} disabled={isSubmitting}>
                      <ArrowLeft size={15} /> Back
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary wizard-btn-confirm"
                      onClick={handleCompleteBooking}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <span>Securing Reservation...</span>
                      ) : (
                        <>
                          Confirm &amp; Place Reservation
                          <ArrowRight size={15} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Persistent Sticky Summary Sidebar (Right Column) */}
            <aside className="wizard-sidebar-col">
              <div className="wizard-sticky-card">
                <div className="sidebar-hotel-header">
                  <img
                    src={hotel.heroImage || hotel.image}
                    alt={hotel.name}
                    className="sidebar-hotel-img"
                  />
                  <div className="sidebar-hotel-info">
                    <span className="sidebar-category">{hotel.category} · {hotel.area}</span>
                    <h3 className="sidebar-hotel-name">{hotel.name}</h3>
                  </div>
                </div>

                <div className="sidebar-room-tag">
                  <Bed size={15} />
                  <div>
                    <span className="room-label">Selected Category:</span>
                    <strong>{currentRoom.name}</strong>
                  </div>
                </div>

                <div className="sidebar-dates-row">
                  <div className="date-block">
                    <span className="date-label">Check-in</span>
                    <strong>{arrivalDate}</strong>
                  </div>
                  <div className="date-divider" />
                  <div className="date-block">
                    <span className="date-label">Check-out</span>
                    <strong>{departureDate}</strong>
                  </div>
                </div>

                {/* Real-Time Itemized Pricing Breakdown */}
                <div className="sidebar-pricing-breakdown">
                  <div className="pricing-row">
                    <span>
                      {fmtNGN(roomRate)} &times; {nights > 0 ? `${nights} night${nights > 1 ? 's' : ''}` : '1 room'}
                      {roomsCount > 1 ? ` &times; ${roomsCount} rooms` : ''}
                    </span>
                    <span>{fmtNGN(roomSubtotal)}</span>
                  </div>

                  {selectedAddOns.map((srv) => (
                    <div key={srv.id} className="pricing-row pricing-row--addon">
                      <span>{srv.title}</span>
                      <span>+{fmtNGN(srv.price)}</span>
                    </div>
                  ))}

                  <div className="pricing-row pricing-row--tax">
                    <span>
                      <Percent size={12} style={{marginRight:3, verticalAlign:'middle'}} />
                      Delta Tourism Levy ({taxRatePct}%)
                    </span>
                    <span>+{fmtNGN(taxAmount)}</span>
                  </div>

                  <div className="pricing-divider" />

                  <div className="pricing-total-row">
                    <div>
                      <strong>Grand Total</strong>
                      <span className="pricing-vat-note">Inc. {taxRatePct}% tourism levy</span>
                    </div>
                    <strong className="sidebar-grand-total">{fmtNGN(grandTotal)}</strong>
                  </div>
                </div>

                <div className="sidebar-assurance-badge">
                  <ShieldCheck size={16} />
                  <span>
                    Your room will be held directly with {hotel.name}. Instant confirmation provided with voucher reference.
                  </span>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
