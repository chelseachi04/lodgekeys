import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  ClipboardList,
  CalendarCheck,
  Users,
  CreditCard,
  Settings,
  Bell,
  Search,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Eye,
  KeyRound,
  LogOut,
  ArrowLeft,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  Clock,
  Sparkles,
  FileText,
  DollarSign,
  AlertCircle,
  UserCheck,
  Check,
  X,
  Mail,
  Phone,
  MapPin,
  BedDouble,
  Sliders,
  RefreshCw,
  SlidersHorizontal,
  Menu,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  sampleHotels,
  useHotels,
  setHotelDelisted,
  publishNewHotel,
} from '../../data/hotels';
import { hotelService } from '../../services/hotelService';
import { applicationService } from '../../services/applicationService';
import { userService } from '../../services/userService';
import './AdminDashboard.css';

// ─── Storage Keys ────────────────────────────────────────────────────────────
const STORAGE_KEY_APPLICATIONS = 'lodgekeys_admin_applications_v1';
const STORAGE_KEY_ADMIN_ACTIVITY = 'lodgekeys_admin_activity_v1';
const STORAGE_KEY_USERS = 'lodgekeys_users_v1';
const STORAGE_KEY_MGR_RES = 'lodgekeys_manager_reservations_v1';
const STORAGE_KEY_BOOKINGS = 'lodgekeys_bookings_v1';
const STORAGE_KEY_SETTINGS = 'lodgekeys_admin_platform_settings_v1';

// ─── Navigation Definitions ─────────────────────────────────────────────────
const ADMIN_NAV = [
  { id: 'overview',     icon: LayoutDashboard, label: 'Overview' },
  { id: 'hotels',       icon: Building2,       label: 'Hotels' },
  { id: 'applications', icon: ClipboardList,   label: 'Applications', badge: true },
  { id: 'bookings',     icon: CalendarCheck,   label: 'Bookings' },
  { id: 'users',        icon: Users,           label: 'Users & Managers' },
  { id: 'payments',     icon: CreditCard,      label: 'Payments' },
  { id: 'settings',     icon: Settings,        label: 'Settings' },
];

// ─── Seed Data ───────────────────────────────────────────────────────────────
const SEED_APPLICATIONS = [
  {
    id: 'APP-2026-081',
    name: 'Royal Palms Hotel & Suites',
    slug: 'royal-palms-hotel-suites',
    ownerName: 'Chief Donald Eke',
    contactEmail: 'donald.eke@royalpalmsabraka.ng',
    contactPhone: '+234 802 334 1122',
    area: 'Town Centre',
    address: '22 Commercial Boulevard, Abraka Town Centre, Delta State',
    category: 'Luxury',
    startingRate: 55000,
    totalRooms: 24,
    documents: 'CAC RC-149201 · Delta State Tourism Board Approval · Fire Safety Certificate · 12 High-Res Photos',
    description: 'Premier 4-star hospitality offering modern executive suites, swimming pool terrace, conference facilities, and 24/7 solar-backed electricity.',
    status: 'pending',
    submittedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    reviewedAt: null,
    feedback: '',
  },
  {
    id: 'APP-2026-079',
    name: 'Campus View Executive Inn',
    slug: 'campus-view-executive-inn',
    ownerName: 'Dr. Angela Okonjo',
    contactEmail: 'contact@campusviewinn.com',
    contactPhone: '+234 813 550 9988',
    area: 'Campus Area',
    address: '8 University Crescent, Adjacent DELSU Gate 2, Abraka',
    category: 'Boutique',
    startingRate: 28000,
    totalRooms: 16,
    documents: 'Business Registration BN-9923 · DELSU Commercial Zoning Permit · Health & Sanitation Certificate',
    description: 'Quiet boutique inn specially designed for visiting academics, researchers, and dignitaries with dedicated workspace desks and fiber internet.',
    status: 'pending',
    submittedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    reviewedAt: null,
    feedback: '',
  },
  {
    id: 'APP-2026-074',
    name: 'Green Valley River Lodge',
    slug: 'green-valley-river-lodge',
    ownerName: 'Engr. Kenneth Momoh',
    contactEmail: 'k.momoh@greenvalleylodge.ng',
    contactPhone: '+234 805 112 4433',
    area: 'Riverfront',
    address: 'River Road Tributary, Off Old Waterway, Abraka',
    category: 'Resort',
    startingRate: 42000,
    totalRooms: 18,
    documents: 'Certificate of Occupancy · Tourism License · Verified Tax Clearance',
    description: 'Eco-conscious riverfront chalets nestled in native flora with personal jetty access and complimentary breakfast.',
    status: 'approved',
    submittedAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    reviewedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    feedback: 'All certifications verified. Manager account provisioned.',
  },
  {
    id: 'APP-2026-071',
    name: 'Sunset Palm Resort',
    slug: 'sunset-palm-resort',
    ownerName: 'Babatunde Adeleke',
    contactEmail: 'babatunde@sunsetpalm.com',
    contactPhone: '+234 807 445 2211',
    area: 'Express Road',
    address: 'KM 4 Sapele-Agbor Expressway, Abraka Environs',
    category: 'Resort',
    startingRate: 35000,
    totalRooms: 12,
    documents: 'Incomplete CAC registration; Missing fire safety clearance',
    description: 'Expressway transit resort and event venue with outdoor garden bar.',
    status: 'declined',
    submittedAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    reviewedAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    feedback: 'Please provide valid fire safety inspection clearance and high-resolution room photography before re-applying.',
  },
];

const SEED_ADMIN_ACTIVITY = [
  { id: 1, type: 'application', text: 'New hotel application: Royal Palms Hotel & Suites submitted for approval', time: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
  { id: 2, type: 'booking', text: 'New reservation: Room 204 at The River House Retreat', time: new Date(Date.now() - 60 * 60 * 1000).toISOString() },
  { id: 3, type: 'user', text: 'New customer registered: Chinwemba Oliseneku', time: new Date(Date.now() - 2 * 3600 * 1000).toISOString() },
  { id: 4, type: 'payout', text: 'Platform payout settled: ₦144,000 to Palm Court Suites', time: new Date(Date.now() - 5 * 3600 * 1000).toISOString() },
  { id: 5, type: 'hotel', text: 'Hotel status updated: Green Valley River Lodge approved and published', time: new Date(Date.now() - 24 * 3600 * 1000).toISOString() },
];

const SEED_PLATFORM_RESERVATIONS = [
  { id: 'LK-97AB028B', guestName: 'Emeka Okonkwo', hotelName: 'The River House Retreat', hotelSlug: 'the-river-house-retreat', room: '101', roomTier: 'Deluxe Garden Room', arrival: '2026-10-18', departure: '2026-10-21', status: 'checked_in', payment: 'Paid', total: 135000, nights: 3, createdAt: new Date(Date.now() - 7200000).toISOString() },
  { id: 'LK-B4C12F7E', guestName: 'Adaeze Nwosu', hotelName: 'The River House Retreat', hotelSlug: 'the-river-house-retreat', room: '204', roomTier: 'Executive Suite', arrival: '2026-10-18', departure: '2026-10-20', status: 'confirmed', payment: 'Pay at Hotel', total: 144000, nights: 2, createdAt: new Date(Date.now() - 18000000).toISOString() },
  { id: 'LK-PC88019A', guestName: 'Fola Durotoye', hotelName: 'Palm Court Suites', hotelSlug: 'palm-court-suites', room: '202', roomTier: 'Classic Luxury Suite', arrival: '2026-10-19', departure: '2026-10-22', status: 'confirmed', payment: 'Paid', total: 114000, nights: 3, createdAt: new Date(Date.now() - 22000000).toISOString() },
  { id: 'LK-GR11094B', guestName: 'Prof. Vincent Anigboro', hotelName: 'The Garden Residence', hotelSlug: 'the-garden-residence', room: '104', roomTier: 'Executive Study Room', arrival: '2026-10-19', departure: '2026-10-24', status: 'confirmed', payment: 'Paid', total: 125000, nights: 5, createdAt: new Date(Date.now() - 30000000).toISOString() },
  { id: 'LK-EW90234F', guestName: 'Dr. Tariye Briggs', hotelName: 'Ethiope Waterside Sanctuary', hotelSlug: 'ethiope-waterside-sanctuary', room: 'V-02', roomTier: 'Waterside Panorama Villa', arrival: '2026-10-16', departure: '2026-10-18', status: 'checked_out', payment: 'Paid', total: 124000, nights: 2, createdAt: new Date(Date.now() - 172800000).toISOString() },
  { id: 'LK-SL44120X', guestName: 'Oluwaseun Adeyemi', hotelName: 'Savannah Executive Loft', hotelSlug: 'savannah-executive-loft', room: '305', roomTier: 'Executive Loft', arrival: '2026-10-12', departure: '2026-10-14', status: 'cancelled', payment: 'Refunded', total: 64000, nights: 2, createdAt: new Date(Date.now() - 432000000).toISOString() },
];

const DEFAULT_SETTINGS = {
  platformCommission: 10, // 10%
  tourismLevyVat: 5,      // 5%
  supportEmail: 'support@lodgekeys.com',
  supportPhone: '+234 800 563 4353',
  autoPublishApproved: true,
  escrowHoldDays: 1,
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function loadStore(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveStore(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Failed saving to localStorage', e);
  }
}

function fmtNGN(num) {
  return '₦' + Number(num || 0).toLocaleString('en-NG');
}

function fmtDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

function getRelativeTime(iso) {
  if (!iso) return '';
  const diffMin = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return `${Math.floor(diffHr / 24)}d ago`;
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const { currentUser, isAuthenticated, userRole, signOut, openAuth } = useAuth();
  const { setActiveReceipt } = useNotifications();
  const navigate = useNavigate();
  const { tab } = useParams();
  const [searchParams] = useSearchParams();

  // Strict role check for state isolation & prevention of localStorage snooping
  const isAdmin = isAuthenticated && userRole === 'admin';

  // Active section/tab
  const [activeSection, setActiveSection] = useState(
    (tab && ADMIN_NAV.some(n => n.id === tab)) ? tab : 'overview'
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Core Data States: Only load administrative data if verified admin
  const [applications, setApplications] = useState(() => (isAdmin ? loadStore(STORAGE_KEY_APPLICATIONS, []) : []));
  const [isLoadingApps, setIsLoadingApps] = useState(false);
  const [activityFeed, setActivityFeed] = useState(() => (isAdmin ? loadStore(STORAGE_KEY_ADMIN_ACTIVITY, SEED_ADMIN_ACTIVITY) : []));
  const [platformSettings, setPlatformSettings] = useState(() => (isAdmin ? loadStore(STORAGE_KEY_SETTINGS, DEFAULT_SETTINGS) : DEFAULT_SETTINGS));
  const [usersList, setUsersList] = useState(() => (isAdmin ? loadStore(STORAGE_KEY_USERS, []) : []));

  // Dynamic Hotel Hook
  const liveHotels = useHotels();

  // Toast
  const [toast, setToast] = useState(null);
  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Notifications dropdown
  const [showNotifications, setShowNotifications] = useState(false);

  // Decline Application Modal
  const [declineModalApp, setDeclineModalApp] = useState(null);
  const [declineReason, setDeclineReason] = useState('');

  // Application Details Modal
  const [viewAppModal, setViewAppModal] = useState(null);

  // User Role Management Modal
  const [userRoleModal, setUserRoleModal] = useState(null);
  const [selectedNewRole, setSelectedNewRole] = useState('customer');

  // Master Reservations Search & Filter State
  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingHotelFilter, setBookingHotelFilter] = useState('all');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all');

  // Applications Filter
  const [appFilter, setAppFilter] = useState('all');

  // Hotels Filter
  const [hotelFilter, setHotelFilter] = useState('all');
  const [hotelSearch, setHotelSearch] = useState('');

  // Users Filter
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');

  // Persistence Effects
  useEffect(() => { saveStore(STORAGE_KEY_APPLICATIONS, applications); }, [applications]);
  useEffect(() => { saveStore(STORAGE_KEY_ADMIN_ACTIVITY, activityFeed); }, [activityFeed]);
  useEffect(() => { saveStore(STORAGE_KEY_SETTINGS, platformSettings); }, [platformSettings]);

  // Sync tab with URL
  useEffect(() => {
    if (tab && ADMIN_NAV.some(n => n.id === tab)) {
      setActiveSection(tab);
    } else if (!tab) {
      setActiveSection('overview');
    }
  }, [tab]);

  // Role Guard: Strictly role === 'admin'
  useEffect(() => {
    if (!isAuthenticated) {
      openAuth('signin');
      return;
    }
    if (userRole === 'hotel_manager') {
      navigate('/manager/dashboard', { replace: true });
      return;
    }
    if (userRole !== 'admin') {
      navigate('/dashboard', { replace: true });
      return;
    }
  }, [isAuthenticated, userRole, openAuth, navigate]);

  // Load real applications from Supabase database
  const loadApplications = useCallback(async () => {
    if (!isAdmin) return;
    setIsLoadingApps(true);
    try {
      const data = await applicationService.getApplicationsAsync();
      setApplications(data);
    } catch (err) {
      console.warn('Failed loading applications:', err);
    } finally {
      setIsLoadingApps(false);
    }
  }, [isAdmin]);

  // Refresh Users from Supabase profiles
  const refreshUsers = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const users = await userService.getUsersAsync();
      if (users && users.length > 0) {
        setUsersList(users);
      } else {
        const stored = loadStore(STORAGE_KEY_USERS, []);
        setUsersList(stored);
      }
    } catch {
      const stored = loadStore(STORAGE_KEY_USERS, []);
      setUsersList(stored);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    loadApplications();
    refreshUsers();
    const handleStorage = (e) => {
      if (e.key === STORAGE_KEY_USERS) refreshUsers();
      if (e.key === STORAGE_KEY_APPLICATIONS) {
        loadApplications();
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [isAdmin, loadApplications, refreshUsers]);

  // Combine Master Reservations
  const masterReservations = useMemo(() => {
    const mgrRes = loadStore(STORAGE_KEY_MGR_RES, []);
    const custBookings = loadStore(STORAGE_KEY_BOOKINGS, []);

    const existingMap = new Map();
    SEED_PLATFORM_RESERVATIONS.forEach(r => existingMap.set(r.id, r));

    // Map manager reservations
    mgrRes.forEach(r => {
      existingMap.set(r.id, {
        id: r.id,
        guestName: r.guestName || 'Guest',
        hotelName: 'The River House Retreat',
        hotelSlug: r.hotelSlug || 'the-river-house-retreat',
        room: r.room || '—',
        roomTier: r.roomTier || 'Standard',
        arrival: r.arrival || '',
        departure: r.departure || '',
        status: r.status || 'confirmed',
        payment: r.payment || 'Paid',
        total: r.total || 0,
        nights: r.nights || 1,
        createdAt: r.createdAt || new Date().toISOString(),
      });
    });

    // Map customer bookings
    custBookings.forEach(b => {
      const id = b.id || b.bookingRef;
      if (!existingMap.has(id)) {
        existingMap.set(id, {
          id,
          guestName: b.guest?.fullName || 'Guest',
          hotelName: b.hotelName || 'Lodgekeys Stay',
          hotelSlug: b.hotelSlug || '',
          room: b.roomNumber || 'Assigned',
          roomTier: b.roomName || 'Room',
          arrival: b.dates?.arrival || '',
          departure: b.dates?.departure || '',
          status: 'confirmed',
          payment: b.paymentMethod === 'hotel' ? 'Pay at Hotel' : 'Paid',
          total: b.totalAmount || 0,
          nights: b.dates?.nights || 1,
          createdAt: b.timestamp || new Date().toISOString(),
        });
      }
    });

    return Array.from(existingMap.values()).sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );
  }, [applications]);

  // Filtered Master Reservations
  const filteredReservations = useMemo(() => {
    return masterReservations.filter(res => {
      if (bookingHotelFilter !== 'all' && res.hotelSlug !== bookingHotelFilter) {
        return false;
      }
      if (bookingStatusFilter !== 'all') {
        if (bookingStatusFilter === 'confirmed' && res.status !== 'confirmed') return false;
        if (bookingStatusFilter === 'checked_in' && res.status !== 'checked_in') return false;
        if (bookingStatusFilter === 'checked_out' && res.status !== 'checked_out') return false;
        if (bookingStatusFilter === 'cancelled' && res.status !== 'cancelled') return false;
      }
      if (bookingSearch.trim()) {
        const q = bookingSearch.toLowerCase();
        const refMatch = res.id.toLowerCase().includes(q);
        const guestMatch = res.guestName.toLowerCase().includes(q);
        const hotelMatch = res.hotelName.toLowerCase().includes(q);
        const roomMatch = (res.room || '').toLowerCase().includes(q);
        if (!refMatch && !guestMatch && !hotelMatch && !roomMatch) return false;
      }
      return true;
    });
  }, [masterReservations, bookingHotelFilter, bookingStatusFilter, bookingSearch]);

  // Filtered Applications
  const filteredApplications = useMemo(() => {
    return applications.filter(app => {
      if (appFilter !== 'all' && app.status !== appFilter) return false;
      return true;
    });
  }, [applications, appFilter]);

  // Counts for KPIs
  const listedHotelsCount = useMemo(() => {
    return liveHotels.filter(h => !h.isDelisted && !h.isDeleted).length;
  }, [liveHotels]);

  const pendingAppsCount = useMemo(() => {
    return applications.filter(a => a.status === 'pending').length;
  }, [applications]);

  const totalReservationsCount = masterReservations.length;

  const registeredGuestsCount = useMemo(() => {
    return usersList.filter(u => u.role === 'customer').length || 1;
  }, [usersList]);

  // Analytics: Monthly Booking Data (May – Oct)
  const monthlyBookingStats = [
    { month: 'May', count: 68,  volume: 4890000, height: 42 },
    { month: 'Jun', count: 85,  volume: 6120000, height: 54 },
    { month: 'Jul', count: 112, volume: 8400000, height: 72 },
    { month: 'Aug', count: 140, volume: 10500000, height: 86 },
    { month: 'Sep', count: 165, volume: 12375000, height: 94 },
    { month: 'Oct', count: 192, volume: 14400000, height: 100 },
  ];

  // Payments / Volume Stats
  const totalGMV = useMemo(() => {
    return masterReservations.reduce((sum, r) => sum + (Number(r.total) || 0), 0);
  }, [masterReservations]);

  const platformRevenue = Math.round(totalGMV * ((platformSettings.platformCommission || 10) / 100));
  const hotelDisbursed = Math.round(totalGMV * 0.75);
  const pendingSettlement = totalGMV - platformRevenue - hotelDisbursed;

  // ─── Actions ───────────────────────────────────────────────────────────────

  // Switch tab & navigate URL
  const handleNavClick = (navId) => {
    setActiveSection(navId);
    setMobileMenuOpen(false);
    navigate(navId === 'overview' ? '/admin/dashboard' : `/admin/${navId}`);
  };

  // Approve Hotel Application
  const handleApproveApplication = async (app, feedback = '') => {
    try {
      // 1. Invoke atomic database transaction
      await applicationService.approveApplicationAsync(
        app.id,
        feedback || 'Approved and published to live catalog.'
      );

      // 2. Publish into live hotel catalog state
      publishNewHotel({
        name: app.name,
        area: app.area,
        address: app.address,
        category: app.category,
        startingRate: app.startingRate,
        roomsAvailable: app.totalRooms,
        description: app.description,
        contactEmail: app.contactEmail,
        contactPhone: app.contactPhone,
        image: '/images/hotel-1.jpg',
        heroImage: '/images/hero-resort.jpg',
      });

      // 3. Update application state
      setApplications((prev) =>
        prev.map((a) =>
          a.id === app.id
            ? { ...a, status: 'approved', reviewedAt: new Date().toISOString(), feedback: feedback || 'Approved and published to live catalog.' }
            : a
        )
      );

      // 4. Log to activity feed
      setActivityFeed((feed) => [
        {
          id: Date.now(),
          type: 'hotel',
          text: `Application approved: ${app.name} published to Lodgekeys catalog · Manager account provisioned`,
          time: new Date().toISOString(),
        },
        ...feed,
      ]);

      showToast(`"${app.name}" approved, published, and manager account provisioned!`, 'success');
      if (viewAppModal?.id === app.id) setViewAppModal(null);
    } catch (err) {
      console.error('Approval failed:', err);
      showToast(`Approval failed: ${err.message}`, 'error');
    }
  };

  // Open Decline Modal
  const openDeclineModal = (app) => {
    setDeclineModalApp(app);
    setDeclineReason('');
  };

  // Confirm Decline Application
  const handleConfirmDecline = async () => {
    if (!declineModalApp) return;
    const reason = declineReason.trim() || 'Application does not meet current verification requirements.';

    try {
      await applicationService.rejectApplicationAsync(declineModalApp.id, reason);

      setApplications((prev) =>
        prev.map((a) =>
          a.id === declineModalApp.id
            ? { ...a, status: 'declined', reviewedAt: new Date().toISOString(), feedback: reason }
            : a
        )
      );

      setActivityFeed((feed) => [
        {
          id: Date.now(),
          type: 'application',
          text: `Application declined: ${declineModalApp.name} · Feedback provided`,
          time: new Date().toISOString(),
        },
        ...feed,
      ]);

      showToast(`Application for "${declineModalApp.name}" was declined.`, 'warning');
      setDeclineModalApp(null);
      if (viewAppModal?.id === declineModalApp.id) setViewAppModal(null);
    } catch (err) {
      console.error('Decline failed:', err);
      showToast(`Decline action failed: ${err.message}`, 'error');
    }
  };

  // Toggle Delist / Publish on Hotel
  const handleToggleDelist = (hotel) => {
    const nextState = !hotel.isDelisted;
    setHotelDelisted(hotel.slug, nextState);
    setActivityFeed(feed => [
      {
        id: Date.now(),
        type: 'hotel',
        text: `Hotel ${nextState ? 'unlisted / delisted' : 'published live'}: ${hotel.name} by Administrator`,
        time: new Date().toISOString(),
      },
      ...feed,
    ]);
    showToast(
      `"${hotel.name}" is now ${nextState ? 'delisted from public view' : 'live and publicly bookable'}.`,
      nextState ? 'warning' : 'success'
    );
  };

  // Open Change User Role Modal
  const openUserRoleModal = (user) => {
    setUserRoleModal(user);
    setSelectedNewRole(user.role || 'customer');
  };

  // Save User Role
  const handleSaveUserRole = () => {
    if (!userRoleModal) return;
    const users = loadStore(STORAGE_KEY_USERS, []);
    const updated = users.map(u => u.id === userRoleModal.id ? { ...u, role: selectedNewRole } : u);
    saveStore(STORAGE_KEY_USERS, updated);
    setUsersList(updated);
    showToast(`Role updated to "${selectedNewRole}" for ${userRoleModal.fullName || userRoleModal.email}.`, 'success');
    setUserRoleModal(null);
  };

  // Save Platform Settings
  const handleSaveSettings = (e) => {
    e.preventDefault();
    saveStore(STORAGE_KEY_SETTINGS, platformSettings);
    showToast('Platform settings and fee configurations updated successfully.', 'success');
  };

  // View Receipt for a reservation
  const handleViewReceipt = (res) => {
    setActiveReceipt({
      id: res.id,
      bookingRef: res.id,
      hotelName: res.hotelName,
      hotelSlug: res.hotelSlug,
      roomName: res.roomTier,
      roomNumber: res.room,
      guest: { fullName: res.guestName, email: 'guest@lodgekeys.com', phone: '+234 800 000 0000' },
      dates: { arrival: res.arrival, departure: res.departure, nights: res.nights || 2 },
      pricing: { total: res.total, nightlyRate: Math.round(res.total / (res.nights || 2)) },
      totalAmount: res.total,
      paymentMethod: res.payment === 'Pay at Hotel' ? 'hotel' : 'card',
      timestamp: res.createdAt || new Date().toISOString(),
      status: res.status,
    });
  };

  // Simulation: Settle Pending Payouts Batch
  const handleSettlePayouts = () => {
    setActivityFeed(feed => [
      {
        id: Date.now(),
        type: 'payout',
        text: `Automated payout batch executed: ₦${pendingSettlement.toLocaleString('en-NG')} disbursed to 4 verified property accounts`,
        time: new Date().toISOString(),
      },
      ...feed,
    ]);
    showToast(`Payout batch executed! ₦${pendingSettlement.toLocaleString('en-NG')} disbursed to verified hotel accounts.`, 'success');
  };

  return (
    <div className="adm">
      {/* Toast */}
      {toast && (
        <div className={`adm-toast adm-toast--${toast.type}`}>
          {toast.type === 'success' && <CheckCircle2 size={17} />}
          {toast.type === 'warning' && <AlertCircle size={17} />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* ── Mobile Sidebar Backdrop ── */}
      <div
        className={`adm-sidebar-backdrop ${mobileMenuOpen ? 'adm-sidebar-backdrop--open' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />

      {/* ─── Deep Green Sidebar ────────────────────────────────────────────── */}
      <aside className={`adm-sidebar ${mobileMenuOpen ? 'adm-sidebar--open' : ''}`}>
        <div className="adm-sidebar__brand">
          <div className="adm-sidebar__brand-row">
            <Link to="/" className="adm-sidebar__logo" onClick={() => setMobileMenuOpen(false)}>
              <KeyRound size={20} strokeWidth={2} className="adm-sidebar__logo-icon" />
              <span>lodgekeys.</span>
            </Link>
            <button
              type="button"
              className="adm-sidebar__close-btn"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>
          <span className="adm-sidebar__portal-tag">ADMINISTRATOR PORTAL</span>
        </div>

        <nav className="adm-sidebar__nav" aria-label="Admin Navigation">
          {ADMIN_NAV.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                id={`adm-nav-${item.id}`}
                className={`adm-nav-item ${isActive ? 'adm-nav-item--active' : ''}`}
                onClick={() => handleNavClick(item.id)}
              >
                <Icon size={18} strokeWidth={isActive ? 2 : 1.75} />
                <span>{item.label}</span>
                {item.id === 'applications' && pendingAppsCount > 0 && (
                  <span className="adm-nav-badge" title={`${pendingAppsCount} pending reviews`}>
                    {pendingAppsCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="adm-sidebar__footer">
          <Link to="/" className="adm-sidebar__footer-link" onClick={() => setMobileMenuOpen(false)}>
            <ArrowLeft size={16} />
            <span>Back to Lodgekeys</span>
          </Link>
          <button
            className="adm-sidebar__footer-link adm-sidebar__footer-link--danger"
            onClick={() => {
              signOut();
              navigate('/');
            }}
          >
            <LogOut size={16} />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* ─── Main Content Canvas ──────────────────────────────────────────── */}
      <div className="adm-canvas">
        {/* Top Header Bar */}
        <header className="adm-header">
          <div className="adm-header__left">
            <button
              type="button"
              className="adm-header__menu-btn"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open sidebar menu"
              aria-expanded={mobileMenuOpen}
            >
              <Menu size={20} />
            </button>
            <h1 className="adm-header__title">
              Administrator portal{' '}
              <span className="adm-header__title-tag">
                · {ADMIN_NAV.find((n) => n.id === activeSection)?.label || 'Overview'}
              </span>
            </h1>
          </div>

          <div className="adm-header__right">
            {/* Notification Bell */}
            <div className="adm-header__bell-wrapper">
              <button
                className="adm-header__bell-btn"
                aria-label="Admin Notifications"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell size={18} />
                {pendingAppsCount > 0 && <span className="adm-header__bell-indicator" />}
              </button>

              {showNotifications && (
                <div className="adm-notifications-menu">
                  <div className="adm-notifications-menu__head">
                    <h4>Platform Alerts</h4>
                    <span className="adm-badge-sm">{pendingAppsCount} pending</span>
                  </div>
                  <div className="adm-notifications-menu__list">
                    {activityFeed.slice(0, 5).map(act => (
                      <div key={act.id} className="adm-notif-item">
                        <div className="adm-notif-item__dot" />
                        <div className="adm-notif-item__content">
                          <p>{act.text}</p>
                          <span>{getRelativeTime(act.time)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Admin Avatar */}
            <div className="adm-header__user" title={currentUser?.email || 'Administrator'}>
              <div className="adm-header__avatar">
                {currentUser?.initials || 'LA'}
              </div>
              <div className="adm-header__user-info">
                <span className="adm-header__user-name">{currentUser?.fullName || 'Super Admin'}</span>
                <span className="adm-header__user-role">Platform Lead</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Section Rendering */}
        <main className="adm-main">
          {/* SECTION: OVERVIEW */}
          {activeSection === 'overview' && (
            <div className="adm-overview-view">
              {/* Hero Banner */}
              <div className="adm-hero">
                <span className="adm-hero__tag">ADMINISTRATOR</span>
                <h2 className="adm-hero__heading">A clear view of Lodgekeys.</h2>
                <p className="adm-hero__sub">
                  Your collection, your guests, and the people behind each welcome.
                </p>
              </div>

              {/* 4 Clickable Metric KPI Cards */}
              <div className="adm-kpi-grid">
                {/* 1. Listed Hotels */}
                <div
                  className="adm-kpi-card"
                  onClick={() => handleNavClick('hotels')}
                  role="button"
                  tabIndex={0}
                >
                  <div className="adm-kpi-card__header">
                    <span className="adm-kpi-card__label">Listed Hotels</span>
                    <div className="adm-kpi-card__icon-box">
                      <Building2 size={19} />
                    </div>
                  </div>
                  <div className="adm-kpi-card__number">{listedHotelsCount}</div>
                  <div className="adm-kpi-card__footer">
                    <span className="adm-kpi-card__sub">Active public properties</span>
                    <ChevronRight size={15} className="adm-kpi-card__arrow" />
                  </div>
                </div>

                {/* 2. Pending Applications */}
                <div
                  className="adm-kpi-card adm-kpi-card--highlight"
                  onClick={() => handleNavClick('applications')}
                  role="button"
                  tabIndex={0}
                >
                  <div className="adm-kpi-card__header">
                    <span className="adm-kpi-card__label">Pending Applications</span>
                    <div className="adm-kpi-card__icon-box adm-kpi-card__icon-box--gold">
                      <ClipboardList size={19} />
                    </div>
                  </div>
                  <div className="adm-kpi-card__number">{pendingAppsCount}</div>
                  <div className="adm-kpi-card__footer">
                    <span className="adm-kpi-card__sub">Awaiting onboarding review</span>
                    <ChevronRight size={15} className="adm-kpi-card__arrow" />
                  </div>
                </div>

                {/* 3. Total Reservations */}
                <div
                  className="adm-kpi-card"
                  onClick={() => handleNavClick('bookings')}
                  role="button"
                  tabIndex={0}
                >
                  <div className="adm-kpi-card__header">
                    <span className="adm-kpi-card__label">Total Reservations</span>
                    <div className="adm-kpi-card__icon-box">
                      <CalendarCheck size={19} />
                    </div>
                  </div>
                  <div className="adm-kpi-card__number">{totalReservationsCount}</div>
                  <div className="adm-kpi-card__footer">
                    <span className="adm-kpi-card__sub">Across all Abraka properties</span>
                    <ChevronRight size={15} className="adm-kpi-card__arrow" />
                  </div>
                </div>

                {/* 4. Registered Guests */}
                <div
                  className="adm-kpi-card"
                  onClick={() => handleNavClick('users')}
                  role="button"
                  tabIndex={0}
                >
                  <div className="adm-kpi-card__header">
                    <span className="adm-kpi-card__label">Registered Guests</span>
                    <div className="adm-kpi-card__icon-box">
                      <Users size={19} />
                    </div>
                  </div>
                  <div className="adm-kpi-card__number">{registeredGuestsCount}</div>
                  <div className="adm-kpi-card__footer">
                    <span className="adm-kpi-card__sub">Active traveler accounts</span>
                    <ChevronRight size={15} className="adm-kpi-card__arrow" />
                  </div>
                </div>
              </div>

              {/* Analytics & Activity Split Grid */}
              <div className="adm-analytics-grid">
                {/* Left: Monthly Booking Bar Chart */}
                <div className="adm-card adm-card--chart">
                  <div className="adm-card__header">
                    <div>
                      <h3 className="adm-card__title">Platform Booking Activity</h3>
                      <p className="adm-card__subtitle">Monthly verified reservations across all properties</p>
                    </div>
                    <div className="adm-chart-legend">
                      <span className="adm-chart-dot" />
                      <span>Gross Bookings</span>
                    </div>
                  </div>

                  <div className="adm-chart-container">
                    <div className="adm-chart-bars">
                      {monthlyBookingStats.map((stat) => (
                        <div key={stat.month} className="adm-chart-col">
                          <div className="adm-chart-tooltip">
                            <strong>{stat.count} bookings</strong>
                            <span>{fmtNGN(stat.volume)}</span>
                          </div>
                          <div
                            className="adm-chart-bar"
                            style={{ height: `${stat.height}%` }}
                          />
                          <span className="adm-chart-month">{stat.month}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: Live Platform Activity Feed */}
                <div className="adm-card adm-card--feed">
                  <div className="adm-card__header">
                    <div>
                      <h3 className="adm-card__title">Platform Activity</h3>
                      <p className="adm-card__subtitle">Real-time system events</p>
                    </div>
                    <button
                      className="adm-card-refresh-btn"
                      onClick={() => showToast('Activity feed refreshed.', 'info')}
                      title="Refresh Activity"
                    >
                      <RefreshCw size={14} />
                    </button>
                  </div>

                  <div className="adm-activity-feed">
                    {activityFeed.slice(0, 7).map((act) => (
                      <div key={act.id} className="adm-activity-row">
                        <div className={`adm-activity-icon adm-activity-icon--${act.type || 'generic'}`}>
                          {act.type === 'application' && <ClipboardList size={14} />}
                          {act.type === 'booking' && <CalendarCheck size={14} />}
                          {act.type === 'user' && <UserCheck size={14} />}
                          {act.type === 'payout' && <CreditCard size={14} />}
                          {act.type === 'hotel' && <Building2 size={14} />}
                          {!['application', 'booking', 'user', 'payout', 'hotel'].includes(act.type) && (
                            <Clock size={14} />
                          )}
                        </div>
                        <div className="adm-activity-info">
                          <p className="adm-activity-text">{act.text}</p>
                          <span className="adm-activity-time">{getRelativeTime(act.time)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Master Platform Reservations Table Preview */}
              <div className="adm-card adm-overview-table-card">
                <div className="adm-card__header">
                  <div>
                    <h3 className="adm-card__title">Recent Platform Reservations</h3>
                    <p className="adm-card__subtitle">Latest bookings made across all managed properties</p>
                  </div>
                  <button
                    className="adm-btn adm-btn--ghost adm-btn--sm"
                    onClick={() => handleNavClick('bookings')}
                  >
                    <span>View All ({masterReservations.length})</span>
                    <ChevronRight size={14} />
                  </button>
                </div>

                <div className="adm-table-wrapper">
                  <table className="adm-table">
                    <thead>
                      <tr>
                        <th>Reference / Guest</th>
                        <th>Hotel & Room</th>
                        <th>Dates</th>
                        <th>Status</th>
                        <th>Payment / Total</th>
                        <th className="adm-th--actions">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {masterReservations.slice(0, 5).map((res) => (
                        <tr key={res.id}>
                          <td>
                            <div className="adm-cell-primary">{res.guestName}</div>
                            <div className="adm-cell-code">{res.id}</div>
                          </td>
                          <td>
                            <div className="adm-cell-hotel">{res.hotelName}</div>
                            <div className="adm-cell-room">{res.roomTier} (Rm {res.room})</div>
                          </td>
                          <td>
                            <div className="adm-cell-date">{fmtDate(res.arrival)}</div>
                            <div className="adm-cell-sub">to {fmtDate(res.departure)} ({res.nights}n)</div>
                          </td>
                          <td>
                            <span className={`adm-badge adm-badge--${res.status}`}>
                              {res.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td>
                            <div className="adm-cell-price">{fmtNGN(res.total)}</div>
                            <div className="adm-cell-sub">{res.payment}</div>
                          </td>
                          <td className="adm-td--actions">
                            <button
                              className="adm-btn-action adm-btn-action--receipt"
                              onClick={() => handleViewReceipt(res)}
                              title="View Guest Receipt Slip"
                            >
                              <FileText size={14} />
                              <span>Receipt</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SECTION: HOTELS */}
          {activeSection === 'hotels' && (
            <div className="adm-section-view">
              <div className="adm-section-header">
                <div>
                  <h2 className="adm-section-title">Hotel Directory</h2>
                  <p className="adm-section-subtitle">
                    Oversee all approved properties in the Lodgekeys catalog and control public visibility.
                  </p>
                </div>
                <div className="adm-section-header__actions">
                  <div className="adm-search-input-wrap">
                    <Search size={15} />
                    <input
                      type="text"
                      placeholder="Filter hotels by name or area..."
                      value={hotelSearch}
                      onChange={(e) => setHotelSearch(e.target.value)}
                    />
                  </div>
                  <select
                    className="adm-select"
                    value={hotelFilter}
                    onChange={(e) => setHotelFilter(e.target.value)}
                  >
                    <option value="all">All Properties</option>
                    <option value="listed">Listed & Active</option>
                    <option value="delisted">Delisted / Inactive</option>
                  </select>
                </div>
              </div>

              <div className="adm-hotels-grid">
                {liveHotels
                  .filter((h) => {
                    if (hotelFilter === 'listed' && h.isDelisted) return false;
                    if (hotelFilter === 'delisted' && !h.isDelisted) return false;
                    if (hotelSearch.trim()) {
                      const q = hotelSearch.toLowerCase();
                      if (!h.name.toLowerCase().includes(q) && !(h.area || '').toLowerCase().includes(q)) {
                        return false;
                      }
                    }
                    return true;
                  })
                  .map((hotel) => (
                    <div key={hotel.slug} className={`adm-hotel-card ${hotel.isDelisted ? 'adm-hotel-card--delisted' : ''}`}>
                      <div className="adm-hotel-card__media">
                        <img src={hotel.image || '/images/hotel-1.jpg'} alt={hotel.name} />
                        <span className={`adm-hotel-status-tag ${hotel.isDelisted ? 'adm-hotel-status-tag--delisted' : 'adm-hotel-status-tag--active'}`}>
                          {hotel.isDelisted ? 'Delisted' : 'Active Public'}
                        </span>
                        {hotel.badge && (
                          <span className="adm-hotel-badge-tag">{hotel.badge}</span>
                        )}
                      </div>

                      <div className="adm-hotel-card__body">
                        <div className="adm-hotel-card__location">
                          <MapPin size={13} />
                          <span>{hotel.location || `${hotel.area} · Abraka`}</span>
                        </div>
                        <h4 className="adm-hotel-card__title">{hotel.name}</h4>
                        <p className="adm-hotel-card__desc">{hotel.tagline || hotel.description}</p>

                        <div className="adm-hotel-card__specs">
                          <div className="adm-spec-item">
                            <span className="adm-spec-label">Rate from</span>
                            <span className="adm-spec-val">{hotel.price || fmtNGN(hotel.priceNumeric)}</span>
                          </div>
                          <div className="adm-spec-item">
                            <span className="adm-spec-label">Rating</span>
                            <span className="adm-spec-val">★ {hotel.rating || 4.8} ({hotel.reviewsCount || 20})</span>
                          </div>
                          <div className="adm-spec-item">
                            <span className="adm-spec-label">Rooms</span>
                            <span className="adm-spec-val">{hotel.roomsAvailable || 4} available</span>
                          </div>
                        </div>

                        <div className="adm-hotel-card__actions">
                          <Link
                            to={`/hotels/${hotel.slug}`}
                            className="adm-btn adm-btn--ghost adm-btn--sm"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink size={14} />
                            <span>View Public Page</span>
                          </Link>
                          <button
                            className={`adm-btn adm-btn--sm ${hotel.isDelisted ? 'adm-btn--primary' : 'adm-btn--outline-danger'}`}
                            onClick={() => handleToggleDelist(hotel)}
                          >
                            {hotel.isDelisted ? (
                              <>
                                <CheckCircle2 size={14} />
                                <span>Publish Stay</span>
                              </>
                            ) : (
                              <>
                                <XCircle size={14} />
                                <span>Delist Property</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* SECTION: APPLICATIONS */}
          {activeSection === 'applications' && (
            <div className="adm-section-view">
              <div className="adm-section-header">
                <div>
                  <h2 className="adm-section-title">Hotel Onboarding Applications</h2>
                  <p className="adm-section-subtitle">
                    Review and verify property submissions from hotel owners applying to join the Lodgekeys platform.
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    className="adm-btn adm-btn--ghost adm-btn--sm"
                    onClick={loadApplications}
                    disabled={isLoadingApps}
                    title="Refresh Applications from Supabase"
                  >
                    <RefreshCw size={14} className={isLoadingApps ? 'adm-spin' : ''} />
                    <span>{isLoadingApps ? 'Syncing...' : 'Refresh'}</span>
                  </button>
                  <div className="adm-filter-pills">
                    {['all', 'pending', 'approved', 'declined'].map((filterKey) => (
                      <button
                        key={filterKey}
                        className={`adm-filter-pill ${appFilter === filterKey ? 'adm-filter-pill--active' : ''}`}
                        onClick={() => setAppFilter(filterKey)}
                      >
                        <span>
                          {filterKey === 'all' ? 'All Applications' : filterKey.charAt(0).toUpperCase() + filterKey.slice(1)}
                        </span>
                        <span className="adm-filter-pill__count">
                          {filterKey === 'all'
                            ? applications.length
                            : applications.filter((a) => a.status === filterKey).length}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="adm-applications-list">
                {filteredApplications.length === 0 ? (
                  <div className="adm-empty-state">
                    <ClipboardList size={36} className="adm-empty-icon" />
                    <h3>No applications match this filter</h3>
                    <p>Submissions from the "List Your Hotel" flow will automatically populate here.</p>
                  </div>
                ) : (
                  filteredApplications.map((app) => (
                    <div key={app.id} className={`adm-app-card adm-app-card--${app.status}`}>
                      <div className="adm-app-card__header">
                        <div className="adm-app-card__title-group">
                          <span className="adm-app-card__id">{app.referenceNumber || app.id}</span>
                          <h3 className="adm-app-card__title">{app.name}</h3>
                          <span className="adm-app-card__area">
                            <MapPin size={13} />
                            {app.area} · Abraka
                          </span>
                        </div>
                        <span className={`adm-badge adm-badge--${app.status}`}>
                          {app.status === 'pending' ? 'Pending Review' : app.status}
                        </span>
                      </div>

                      <div className="adm-app-card__grid">
                        <div className="adm-app-info-block">
                          <span className="adm-app-label">Owner / Representative</span>
                          <span className="adm-app-val adm-app-val--strong">{app.ownerName}</span>
                          <div className="adm-app-contacts">
                            <a href={`mailto:${app.contactEmail}`} className="adm-contact-link">
                              <Mail size={12} /> {app.contactEmail}
                            </a>
                            <a href={`tel:${app.contactPhone}`} className="adm-contact-link">
                              <Phone size={12} /> {app.contactPhone}
                            </a>
                          </div>
                        </div>

                        <div className="adm-app-info-block">
                          <span className="adm-app-label">Proposed Tier & Capacity</span>
                          <span className="adm-app-val">
                            {app.category} · {app.totalRooms} Rooms
                          </span>
                          <span className="adm-app-sub">Starting at {fmtNGN(app.startingRate)} / night</span>
                        </div>

                        <div className="adm-app-info-block adm-app-info-block--full">
                          <span className="adm-app-label">Submitted Legal & Verification Documents</span>
                          <div className="adm-app-docs-box">
                            <ShieldCheck size={14} className="adm-docs-icon" />
                            <span>{app.documents || app.businessRegDoc || 'Documents submitted for review'}</span>
                          </div>
                        </div>

                        <div className="adm-app-info-block adm-app-info-block--full">
                          <span className="adm-app-label">Property Description</span>
                          <p className="adm-app-desc">{app.description}</p>
                        </div>

                        {app.feedback && (
                          <div className="adm-app-info-block adm-app-info-block--full adm-app-feedback-block">
                            <span className="adm-app-label">Admin Assessment Notes:</span>
                            <p>{app.feedback}</p>
                          </div>
                        )}
                      </div>

                      <div className="adm-app-card__footer">
                        <span className="adm-app-timestamp">
                          Submitted {getRelativeTime(app.submittedAt)}
                        </span>

                        <div className="adm-app-card__action-btns">
                          <button
                            className="adm-btn adm-btn--ghost adm-btn--sm"
                            onClick={() => setViewAppModal(app)}
                            title="Review Complete Application"
                          >
                            <Eye size={13} />
                            <span>Review Full Details</span>
                          </button>
                          {app.status === 'pending' ? (
                            <>
                              <button
                                className="adm-btn adm-btn--outline-danger adm-btn--sm"
                                onClick={() => openDeclineModal(app)}
                              >
                                <X size={14} />
                                <span>Decline</span>
                              </button>
                              <button
                                className="adm-btn adm-btn--primary adm-btn--sm"
                                onClick={() => handleApproveApplication(app)}
                              >
                                <Check size={14} />
                                <span>Approve & Publish</span>
                              </button>
                            </>
                          ) : app.status === 'approved' ? (
                            <div className="adm-approved-info">
                              <CheckCircle2 size={16} className="adm-approved-icon" />
                              <span>Live in catalog · Manager credentials sent</span>
                              <Link
                                to={`/hotels/${app.slug}`}
                                className="adm-btn adm-btn--ghost adm-btn--sm"
                                target="_blank"
                              >
                                <Eye size={13} /> View Stay
                              </Link>
                            </div>
                          ) : (
                            <div className="adm-declined-info">
                              <XCircle size={16} />
                              <span>Declined with feedback</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* SECTION: BOOKINGS */}
          {activeSection === 'bookings' && (
            <div className="adm-section-view">
              <div className="adm-section-header">
                <div>
                  <h2 className="adm-section-title">Master Platform Reservations</h2>
                  <p className="adm-section-subtitle">
                    Cross-property log of all guest reservations, check-ins, and stay vouchers.
                  </p>
                </div>
              </div>

              {/* Master Filters Header */}
              <div className="adm-filter-bar">
                <div className="adm-search-input-wrap adm-search-input-wrap--wide">
                  <Search size={15} />
                  <input
                    type="text"
                    placeholder="Search by reference ID, guest name, or room..."
                    value={bookingSearch}
                    onChange={(e) => setBookingSearch(e.target.value)}
                  />
                  {bookingSearch && (
                    <button
                      className="adm-clear-search-btn"
                      onClick={() => setBookingSearch('')}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className="adm-filter-dropdowns">
                  <select
                    className="adm-select"
                    value={bookingHotelFilter}
                    onChange={(e) => setBookingHotelFilter(e.target.value)}
                  >
                    <option value="all">All Properties</option>
                    {liveHotels.map((h) => (
                      <option key={h.slug} value={h.slug}>
                        {h.name}
                      </option>
                    ))}
                  </select>

                  <select
                    className="adm-select"
                    value={bookingStatusFilter}
                    onChange={(e) => setBookingStatusFilter(e.target.value)}
                  >
                    <option value="all">All Statuses</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="checked_in">Checked In</option>
                    <option value="checked_out">Checked Out</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Reservations Table */}
              <div className="adm-card adm-card--no-padding">
                <div className="adm-table-wrapper">
                  <table className="adm-table">
                    <thead>
                      <tr>
                        <th>Reference / Guest</th>
                        <th>Hotel & Room</th>
                        <th>Arrival & Departure</th>
                        <th>Status</th>
                        <th>Payment & Total</th>
                        <th className="adm-th--actions">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReservations.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="adm-table-empty">
                            No reservations match your search or filter criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredReservations.map((res) => (
                          <tr key={res.id}>
                            <td>
                              <div className="adm-cell-primary">{res.guestName}</div>
                              <div className="adm-cell-code">{res.id}</div>
                            </td>
                            <td>
                              <div className="adm-cell-hotel">{res.hotelName}</div>
                              <div className="adm-cell-room">{res.roomTier} (Rm {res.room})</div>
                            </td>
                            <td>
                              <div className="adm-cell-date">{fmtDate(res.arrival)}</div>
                              <div className="adm-cell-sub">to {fmtDate(res.departure)} ({res.nights}n)</div>
                            </td>
                            <td>
                              <span className={`adm-badge adm-badge--${res.status}`}>
                                {res.status.replace('_', ' ')}
                              </span>
                            </td>
                            <td>
                              <div className="adm-cell-price">{fmtNGN(res.total)}</div>
                              <div className="adm-cell-sub">{res.payment}</div>
                            </td>
                            <td className="adm-td--actions">
                              <button
                                className="adm-btn-action adm-btn-action--receipt"
                                onClick={() => handleViewReceipt(res)}
                                title="Open Guest Voucher & Receipt Slip"
                              >
                                <FileText size={14} />
                                <span>Receipt</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SECTION: USERS & MANAGERS */}
          {activeSection === 'users' && (
            <div className="adm-section-view">
              <div className="adm-section-header">
                <div>
                  <h2 className="adm-section-title">Users & Account Management</h2>
                  <p className="adm-section-subtitle">
                    Oversee customer accounts, assign property managers, and configure access permissions.
                  </p>
                </div>
                <div className="adm-section-header__actions">
                  <div className="adm-search-input-wrap">
                    <Search size={15} />
                    <input
                      type="text"
                      placeholder="Search accounts by name or email..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                    />
                  </div>
                  <select
                    className="adm-select"
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value)}
                  >
                    <option value="all">All Roles</option>
                    <option value="customer">Customers</option>
                    <option value="hotel_manager">Hotel Managers</option>
                    <option value="admin">Administrators</option>
                  </select>
                </div>
              </div>

              <div className="adm-card adm-card--no-padding">
                <div className="adm-table-wrapper">
                  <table className="adm-table">
                    <thead>
                      <tr>
                        <th>User Profile</th>
                        <th>Contact Email</th>
                        <th>Role & Access</th>
                        <th>Joined Date</th>
                        <th>Activity</th>
                        <th className="adm-th--actions">Manage Role</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usersList
                        .filter((u) => {
                          if (userRoleFilter !== 'all' && u.role !== userRoleFilter) return false;
                          if (userSearch.trim()) {
                            const q = userSearch.toLowerCase();
                            const nameMatch = (u.fullName || '').toLowerCase().includes(q);
                            const emailMatch = (u.email || '').toLowerCase().includes(q);
                            if (!nameMatch && !emailMatch) return false;
                          }
                          return true;
                        })
                        .map((usr) => (
                          <tr key={usr.id || usr.email}>
                            <td>
                              <div className="adm-user-cell">
                                <div className="adm-user-avatar">
                                  {usr.initials || usr.fullName?.[0] || 'U'}
                                </div>
                                <div>
                                  <div className="adm-cell-primary">{usr.fullName || 'User'}</div>
                                  <div className="adm-cell-sub">ID: {usr.id}</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="adm-cell-email">{usr.email}</div>
                              {usr.assignedHotel && (
                                <div className="adm-cell-sub">Assigned: {usr.assignedHotel}</div>
                              )}
                            </td>
                            <td>
                              <span className={`adm-role-badge adm-role-badge--${usr.role || 'customer'}`}>
                                {usr.role === 'admin'
                                  ? 'Platform Admin'
                                  : usr.role === 'hotel_manager'
                                  ? 'Hotel Manager'
                                  : 'Guest / Customer'}
                              </span>
                            </td>
                            <td>
                              <div className="adm-cell-date">{fmtDate(usr.joinedAt)}</div>
                            </td>
                            <td>
                              <span className="adm-cell-sub">
                                {usr.bookings?.length || 0} bookings
                              </span>
                            </td>
                            <td className="adm-td--actions">
                              <button
                                className="adm-btn adm-btn--ghost adm-btn--sm"
                                onClick={() => openUserRoleModal(usr)}
                              >
                                <SlidersHorizontal size={13} />
                                <span>Change Role</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SECTION: PAYMENTS */}
          {activeSection === 'payments' && (
            <div className="adm-section-view">
              <div className="adm-section-header">
                <div>
                  <h2 className="adm-section-title">Payments & Financial Volume</h2>
                  <p className="adm-section-subtitle">
                    Platform gross merchandise value, automated commission splits, and escrow disbursements.
                  </p>
                </div>
                <button
                  className="adm-btn adm-btn--primary"
                  onClick={handleSettlePayouts}
                >
                  <CreditCard size={15} />
                  <span>Settle Pending Payouts</span>
                </button>
              </div>

              {/* Volume KPI Cards */}
              <div className="adm-kpi-grid">
                <div className="adm-kpi-card">
                  <span className="adm-kpi-card__label">Gross Booking Volume</span>
                  <div className="adm-kpi-card__number">{fmtNGN(totalGMV)}</div>
                  <span className="adm-kpi-card__sub">Total platform bookings transacted</span>
                </div>

                <div className="adm-kpi-card adm-kpi-card--highlight">
                  <span className="adm-kpi-card__label">Platform Commission ({platformSettings.platformCommission}%)</span>
                  <div className="adm-kpi-card__number">{fmtNGN(platformRevenue)}</div>
                  <span className="adm-kpi-card__sub">Net Lodgekeys revenue collected</span>
                </div>

                <div className="adm-kpi-card">
                  <span className="adm-kpi-card__label">Disbursed to Hotels</span>
                  <div className="adm-kpi-card__number">{fmtNGN(hotelDisbursed)}</div>
                  <span className="adm-kpi-card__sub">Successfully settled to partner bank accounts</span>
                </div>

                <div className="adm-kpi-card">
                  <span className="adm-kpi-card__label">Pending Escrow</span>
                  <div className="adm-kpi-card__number">{fmtNGN(pendingSettlement)}</div>
                  <span className="adm-kpi-card__sub">Eligible upon guest check-out</span>
                </div>
              </div>

              {/* Transactions Ledger */}
              <div className="adm-card adm-card--no-padding">
                <div className="adm-card__header adm-card__header--padded">
                  <div>
                    <h3 className="adm-card__title">Platform Transactions Ledger</h3>
                    <p className="adm-card__subtitle">Verified booking transactions and payment status</p>
                  </div>
                </div>

                <div className="adm-table-wrapper">
                  <table className="adm-table">
                    <thead>
                      <tr>
                        <th>Transaction Ref</th>
                        <th>Booking / Hotel</th>
                        <th>Guest</th>
                        <th>Gross Amount</th>
                        <th>Platform Take (10%)</th>
                        <th>Net to Hotel</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {masterReservations.map((res, idx) => {
                        const commission = Math.round(res.total * 0.1);
                        const netHotel = res.total - commission;
                        const isSettled = res.status === 'checked_out' || idx > 2;

                        return (
                          <tr key={res.id}>
                            <td>
                              <div className="adm-cell-code">TXN-{(idx + 1042).toString(16).toUpperCase()}</div>
                              <div className="adm-cell-sub">Paystack / Card</div>
                            </td>
                            <td>
                              <div className="adm-cell-hotel">{res.hotelName}</div>
                              <div className="adm-cell-sub">Ref: {res.id}</div>
                            </td>
                            <td>
                              <div className="adm-cell-primary">{res.guestName}</div>
                            </td>
                            <td>
                              <div className="adm-cell-price">{fmtNGN(res.total)}</div>
                            </td>
                            <td>
                              <div className="adm-cell-commission">{fmtNGN(commission)}</div>
                            </td>
                            <td>
                              <div className="adm-cell-net">{fmtNGN(netHotel)}</div>
                            </td>
                            <td>
                              <span className={`adm-badge adm-badge--${isSettled ? 'checked_out' : 'pending'}`}>
                                {isSettled ? 'Settled' : 'In Escrow'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SECTION: SETTINGS */}
          {activeSection === 'settings' && (
            <div className="adm-section-view">
              <div className="adm-section-header">
                <div>
                  <h2 className="adm-section-title">Platform Configuration</h2>
                  <p className="adm-section-subtitle">
                    Set default commission percentages, municipal tourism taxes, and operational contact rules.
                  </p>
                </div>
              </div>

              <div className="adm-settings-container">
                <form className="adm-settings-form" onSubmit={handleSaveSettings}>
                  <div className="adm-card">
                    <h3 className="adm-card__title">Platform Economics</h3>
                    <p className="adm-card__subtitle">Configure standard transaction fee rates</p>

                    <div className="adm-form-grid">
                      <div className="adm-form-group">
                        <label className="adm-label">Platform Commission Take-Rate (%)</label>
                        <input
                          type="number"
                          className="adm-input"
                          min="0"
                          max="30"
                          value={platformSettings.platformCommission}
                          onChange={(e) =>
                            setPlatformSettings({ ...platformSettings, platformCommission: Number(e.target.value) })
                          }
                        />
                        <span className="adm-input-hint">Standard service fee deducted from online reservations</span>
                      </div>

                      <div className="adm-form-group">
                        <label className="adm-label">Abraka Tourism Levy / VAT (%)</label>
                        <input
                          type="number"
                          className="adm-input"
                          min="0"
                          max="15"
                          value={platformSettings.tourismLevyVat}
                          onChange={(e) =>
                            setPlatformSettings({ ...platformSettings, tourismLevyVat: Number(e.target.value) })
                          }
                        />
                        <span className="adm-input-hint">Local state municipal hospitality levy</span>
                      </div>
                    </div>
                  </div>

                  <div className="adm-card">
                    <h3 className="adm-card__title">Support & Notifications</h3>
                    <p className="adm-card__subtitle">Default emergency and partner communications channels</p>

                    <div className="adm-form-grid">
                      <div className="adm-form-group">
                        <label className="adm-label">Platform Support Email</label>
                        <input
                          type="email"
                          className="adm-input"
                          value={platformSettings.supportEmail}
                          onChange={(e) =>
                            setPlatformSettings({ ...platformSettings, supportEmail: e.target.value })
                          }
                        />
                      </div>

                      <div className="adm-form-group">
                        <label className="adm-label">Partner Operations Hotline</label>
                        <input
                          type="text"
                          className="adm-input"
                          value={platformSettings.supportPhone}
                          onChange={(e) =>
                            setPlatformSettings({ ...platformSettings, supportPhone: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="adm-form-actions">
                    <button type="submit" className="adm-btn adm-btn--primary">
                      <Check size={16} />
                      <span>Save Platform Settings</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ─── Decline Modal ────────────────────────────────────────────────── */}
      {declineModalApp && (
        <div className="adm-modal-overlay">
          <div className="adm-modal">
            <div className="adm-modal__head">
              <h3>Decline Application: {declineModalApp.name}</h3>
              <button
                className="adm-modal__close"
                onClick={() => setDeclineModalApp(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="adm-modal__body">
              <p>
                Provide optional feedback for the property owner explaining what documents or standards
                need resolution before re-application.
              </p>
              <textarea
                className="adm-textarea"
                rows={4}
                placeholder="e.g. Please provide updated Fire Safety inspection clearance and verified business certificate..."
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
              />
            </div>
            <div className="adm-modal__foot">
              <button
                className="adm-btn adm-btn--ghost"
                onClick={() => setDeclineModalApp(null)}
              >
                Cancel
              </button>
              <button
                className="adm-btn adm-btn--danger"
                onClick={handleConfirmDecline}
              >
                Decline Application
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── User Role Modal ──────────────────────────────────────────────── */}
      {userRoleModal && (
        <div className="adm-modal-overlay">
          <div className="adm-modal">
            <div className="adm-modal__head">
              <h3>Change Role: {userRoleModal.fullName || userRoleModal.email}</h3>
              <button
                className="adm-modal__close"
                onClick={() => setUserRoleModal(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="adm-modal__body">
              <p className="adm-modal-desc">
                Assign permission level across the Lodgekeys ecosystem.
              </p>
              <div className="adm-role-options">
                <label className="adm-radio-label">
                  <input
                    type="radio"
                    name="roleOption"
                    value="customer"
                    checked={selectedNewRole === 'customer'}
                    onChange={() => setSelectedNewRole('customer')}
                  />
                  <div>
                    <strong>Guest / Customer</strong>
                    <p>Can browse, save favorites, make bookings, and view receipts.</p>
                  </div>
                </label>

                <label className="adm-radio-label">
                  <input
                    type="radio"
                    name="roleOption"
                    value="hotel_manager"
                    checked={selectedNewRole === 'hotel_manager'}
                    onChange={() => setSelectedNewRole('hotel_manager')}
                  />
                  <div>
                    <strong>Hotel Manager</strong>
                    <p>Can manage hotel rooms, execute check-ins/outs, and update hotel policies.</p>
                  </div>
                </label>

                <label className="adm-radio-label">
                  <input
                    type="radio"
                    name="roleOption"
                    value="admin"
                    checked={selectedNewRole === 'admin'}
                    onChange={() => setSelectedNewRole('admin')}
                  />
                  <div>
                    <strong>Platform Administrator</strong>
                    <p>Full governance: oversees all hotels, approvals, payments, and users.</p>
                  </div>
                </label>
              </div>
            </div>
            <div className="adm-modal__foot">
              <button
                className="adm-btn adm-btn--ghost"
                onClick={() => setUserRoleModal(null)}
              >
                Cancel
              </button>
              <button
                className="adm-btn adm-btn--primary"
                onClick={handleSaveUserRole}
              >
                Save Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Application Review Modal ────────────────────────────────────── */}
      {viewAppModal && (
        <div className="adm-modal-overlay">
          <div className="adm-modal adm-modal--lg" style={{ maxWidth: '780px', width: '100%' }}>
            <div className="adm-modal__head">
              <div>
                <span className="adm-cell-code" style={{ display: 'block', marginBottom: '4px' }}>
                  {viewAppModal.referenceNumber || viewAppModal.id}
                </span>
                <h3 style={{ margin: 0 }}>{viewAppModal.name}</h3>
              </div>
              <button
                className="adm-modal__close"
                onClick={() => setViewAppModal(null)}
              >
                <X size={18} />
              </button>
            </div>
            <div className="adm-modal__body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', marginBottom: '20px' }}>
                <div>
                  <span className="adm-app-label">Status</span>
                  <div>
                    <span className={`adm-badge adm-badge--${viewAppModal.status}`}>
                      {viewAppModal.status === 'pending' ? 'Pending Review' : viewAppModal.status}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="adm-app-label">Category</span>
                  <div className="adm-app-val adm-app-val--strong">{viewAppModal.category || 'Hotel'}</div>
                </div>
                <div>
                  <span className="adm-app-label">Applicant Full Name</span>
                  <div className="adm-app-val adm-app-val--strong">{viewAppModal.ownerName}</div>
                </div>
                <div>
                  <span className="adm-app-label">Applicant Role</span>
                  <div className="adm-app-val">{viewAppModal.applicantRole || 'Owner'}</div>
                </div>
                <div>
                  <span className="adm-app-label">Contact Email</span>
                  <a href={`mailto:${viewAppModal.contactEmail}`} className="adm-contact-link">
                    <Mail size={12} /> {viewAppModal.contactEmail}
                  </a>
                </div>
                <div>
                  <span className="adm-app-label">Contact Phone</span>
                  <a href={`tel:${viewAppModal.contactPhone}`} className="adm-contact-link">
                    <Phone size={12} /> {viewAppModal.contactPhone}
                  </a>
                </div>
                <div>
                  <span className="adm-app-label">Abraka District / Neighbourhood</span>
                  <div className="adm-app-val">{viewAppModal.area}</div>
                </div>
                <div>
                  <span className="adm-app-label">Starting Nightly Rate</span>
                  <div className="adm-app-val adm-app-val--strong">{fmtNGN(viewAppModal.startingRate)} / night</div>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <span className="adm-app-label">Street Address</span>
                  <div className="adm-app-val">{viewAppModal.address}</div>
                </div>
                {viewAppModal.nearbyLandmark && (
                  <div>
                    <span className="adm-app-label">Nearby Landmark</span>
                    <div className="adm-app-val">{viewAppModal.nearbyLandmark}</div>
                  </div>
                )}
                {viewAppModal.businessRegStatus && (
                  <div>
                    <span className="adm-app-label">Business Registration</span>
                    <div className="adm-app-val">
                      {viewAppModal.businessRegStatus} {viewAppModal.businessRegNumber ? `(${viewAppModal.businessRegNumber})` : ''}
                    </div>
                  </div>
                )}
                <div>
                  <span className="adm-app-label">Declared Accommodation Units</span>
                  <div className="adm-app-val">{viewAppModal.totalRooms} Rooms</div>
                </div>
              </div>

              {viewAppModal.roomTypesOverview && (
                <div style={{ marginBottom: '16px' }}>
                  <span className="adm-app-label">Room Categories Overview</span>
                  <p className="adm-app-desc" style={{ marginTop: '4px' }}>{viewAppModal.roomTypesOverview}</p>
                </div>
              )}

              {viewAppModal.description && (
                <div style={{ marginBottom: '16px' }}>
                  <span className="adm-app-label">Property Description & Highlights</span>
                  <p className="adm-app-desc" style={{ marginTop: '4px' }}>{viewAppModal.description}</p>
                </div>
              )}

              {viewAppModal.facilities && viewAppModal.facilities.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <span className="adm-app-label">Reported Facilities & Amenities</span>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                    {viewAppModal.facilities.map((fac) => (
                      <span key={fac} style={{ background: '#eef6f1', color: '#174b2f', padding: '4px 10px', borderRadius: '6px', fontSize: '12px' }}>
                        ✓ {fac}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '16px' }}>
                <span className="adm-app-label">Verification & Compliance Documents</span>
                <div className="adm-app-docs-box" style={{ marginTop: '6px' }}>
                  <ShieldCheck size={16} className="adm-docs-icon" />
                  <span>{viewAppModal.documents || viewAppModal.businessRegDoc || 'CAC Registration & Delta Hospitality Board Inspection on file'}</span>
                </div>
              </div>

              {viewAppModal.feedback && (
                <div className="adm-app-feedback-block" style={{ marginBottom: '16px' }}>
                  <span className="adm-app-label">Administrative Review Notes:</span>
                  <p style={{ marginTop: '4px' }}>{viewAppModal.feedback}</p>
                </div>
              )}
            </div>
            <div className="adm-modal__foot">
              <button
                className="adm-btn adm-btn--ghost"
                onClick={() => setViewAppModal(null)}
              >
                Close
              </button>
              {viewAppModal.status === 'pending' && (
                <>
                  <button
                    className="adm-btn adm-btn--danger"
                    onClick={() => openDeclineModal(viewAppModal)}
                  >
                    <X size={15} /> Decline
                  </button>
                  <button
                    className="adm-btn adm-btn--primary"
                    onClick={() => handleApproveApplication(viewAppModal)}
                  >
                    <Check size={15} /> Approve & Publish Listing
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
