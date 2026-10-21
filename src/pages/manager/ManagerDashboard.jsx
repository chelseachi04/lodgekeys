import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  LayoutDashboard, BedDouble, CalendarCheck, BarChart3, Bell,
  Settings, LogOut, ArrowLeft, ChevronRight, Search,
  TrendingUp, DoorOpen, DoorClosed, CheckCircle2,
  Clock, XCircle, MoreVertical, Eye, PrinterCheck,
  RefreshCcw, Wifi, Utensils, Waves, Car, Leaf, Star,
  MapPin, Phone, Mail, Globe, Building2, KeyRound, Lock,
  SlidersHorizontal, ArrowUpRight, Activity, CheckSquare, X,
  Edit3, Shield, Coffee, Plus, Trash2, Zap, Dumbbell,
  Sparkles, Tv, Wind, Loader2, RotateCcw, AlertTriangle,
  EyeOff, Layers, Users, Menu
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  sampleHotels, saveHotelOverrides, useHotel, syncHotelRooms,
  setHotelDelisted, deleteHotel, restoreHotel
} from '../../data/hotels';
import { roomService } from '../../services/roomService';
import { hotelService } from '../../services/hotelService';
import './ManagerDashboard.css';

const MANAGER_HOTEL_SLUG = 'the-river-house-retreat';
const STORAGE_KEY_MGR_RES      = 'lodgekeys_manager_reservations_v1';
const STORAGE_KEY_MGR_ROOMS    = 'lodgekeys_manager_rooms_v1';
const STORAGE_KEY_MGR_ACTIVITY = 'lodgekeys_manager_activity_v1';
const STORAGE_KEY_MGR_SETTINGS = 'lodgekeys_manager_settings_v1';

function computeSixMonthOccupancy(currentRate) {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  const currentMonthIdx = now.getMonth();
  const result = [];
  const historicalSeed = [58, 68, 74, 82, 89, 71, 76];

  for (let i = 5; i >= 0; i--) {
    const idx = (currentMonthIdx - i + 12) % 12;
    const m = monthNames[idx];
    if (i === 0) {
      result.push({ month: m, rate: Math.max(15, Math.min(100, Math.round(currentRate))) });
    } else {
      const rate = historicalSeed[(idx + 2) % historicalSeed.length];
      result.push({ month: m, rate });
    }
  }
  return result;
}

const SIDEBAR_NAV = [
  { id: 'overview',      icon: LayoutDashboard, label: 'Overview' },
  { id: 'rooms',         icon: BedDouble,       label: 'Room Inventory' },
  { id: 'reservations',  icon: CalendarCheck,   label: 'Reservations' },
  { id: 'reports',       icon: BarChart3,       label: 'Reports' },
  { id: 'notifications', icon: Bell,            label: 'Notifications', badge: true },
  { id: 'settings',      icon: Settings,        label: 'Hotel Settings' },
];

const SEED_RES = [
  { id: 'LK-97AB028B', guestName: 'Emeka Okonkwo',     room: '101', roomTier: 'Deluxe Garden Room', arrival: '2026-10-18', departure: '2026-10-21', status: 'checked_in',  payment: 'Paid',         total: 135000, hotelSlug: MANAGER_HOTEL_SLUG, createdAt: new Date(Date.now()-7200000).toISOString(),   nights: 3 },
  { id: 'LK-B4C12F7E', guestName: 'Adaeze Nwosu',      room: '204', roomTier: 'Executive Suite',    arrival: '2026-10-18', departure: '2026-10-20', status: 'confirmed',   payment: 'Pay at Hotel', total: 144000, hotelSlug: MANAGER_HOTEL_SLUG, createdAt: new Date(Date.now()-18000000).toISOString(),  nights: 2 },
  { id: 'LK-F9A3D02C', guestName: 'Chukwuemeka Eze',   room: '308', roomTier: 'Family Suite',       arrival: '2026-10-19', departure: '2026-10-23', status: 'confirmed',   payment: 'Paid',         total: 440000, hotelSlug: MANAGER_HOTEL_SLUG, createdAt: new Date(Date.now()-28800000).toISOString(),  nights: 4 },
  { id: 'LK-55DE190A', guestName: 'Ngozi Okafor',      room: '101', roomTier: 'Deluxe Garden Room', arrival: '2026-10-15', departure: '2026-10-17', status: 'checked_out', payment: 'Paid',         total: 90000,  hotelSlug: MANAGER_HOTEL_SLUG, createdAt: new Date(Date.now()-201600000).toISOString(), nights: 2 },
  { id: 'LK-3E8B7712', guestName: 'Oluwaseun Adeyemi', room: '204', roomTier: 'Executive Suite',    arrival: '2026-10-12', departure: '2026-10-14', status: 'cancelled',   payment: 'Pending',      total: 144000, hotelSlug: MANAGER_HOTEL_SLUG, createdAt: new Date(Date.now()-432000000).toISOString(), nights: 2 },
];

const DEFAULT_AMENITIES_LIST = [
  { id: 'wifi',       name: 'Free High-speed Wi-Fi',        icon: 'wifi',       enabled: true,  isCustom: false },
  { id: 'pool',       name: 'Swimming Pool (Lounge)',       icon: 'pool',       enabled: true,  isCustom: false },
  { id: 'restaurant', name: 'Restaurant & Grill',           icon: 'restaurant', enabled: true,  isCustom: false },
  { id: 'parking',    name: 'Secure On-site Parking',       icon: 'parking',    enabled: true,  isCustom: false },
  { id: 'garden',     name: 'Private Riverfront Garden',    icon: 'garden',     enabled: true,  isCustom: false },
  { id: 'spa',        name: 'Wellness Spa & Massage',       icon: 'spa',        enabled: false, isCustom: false },
  { id: 'workspace',  name: 'Executive Business Workspace', icon: 'workspace',  enabled: false, isCustom: false },
  { id: 'bar',        name: 'Cocktail Bar & Lounge',        icon: 'bar',        enabled: false, isCustom: false },
];

const AMENITY_ICON_COMPONENTS = {
  wifi: Wifi,
  pool: Waves,
  restaurant: Utensils,
  parking: Car,
  garden: Leaf,
  spa: Sparkles,
  workspace: Building2,
  bar: Coffee,
  zap: Zap,
  solar: Zap,
  dumbbell: Dumbbell,
  gym: Dumbbell,
  shuttle: Car,
  coffee: Coffee,
  shield: Shield,
  security: Shield,
  tv: Tv,
  wind: Wind,
  star: Star,
  sparkles: Sparkles,
};

const ICON_PICKER_OPTIONS = [
  { id: 'zap', label: 'Solar / Power', icon: Zap },
  { id: 'dumbbell', label: 'Gym / Fitness', icon: Dumbbell },
  { id: 'car', label: 'Shuttle / Car', icon: Car },
  { id: 'waves', label: 'Pool / River', icon: Waves },
  { id: 'wifi', label: 'Wi-Fi', icon: Wifi },
  { id: 'restaurant', label: 'Dining', icon: Utensils },
  { id: 'coffee', label: 'Cafe / Bar', icon: Coffee },
  { id: 'shield', label: 'Security', icon: Shield },
  { id: 'sparkles', label: 'Spa / VIP', icon: Sparkles },
  { id: 'tv', label: 'TV / Media', icon: Tv },
  { id: 'wind', label: 'AC / Climate', icon: Wind },
  { id: 'star', label: 'Luxury Star', icon: Star },
];

function normalizeSettings(s) {
  if (!s) s = {};
  let amenitiesList = DEFAULT_AMENITIES_LIST;
  if (Array.isArray(s.amenitiesList)) {
    amenitiesList = s.amenitiesList;
  } else if (s.amenities && typeof s.amenities === 'object') {
    amenitiesList = DEFAULT_AMENITIES_LIST.map(item => ({
      ...item,
      enabled: Boolean(s.amenities[item.id] !== undefined ? s.amenities[item.id] : item.enabled),
    }));
  }
  return {
    checkInTime: s.checkInTime || '2:00 PM',
    checkOutTime: s.checkOutTime || '11:00 AM',
    contactPhone: s.contactPhone || '+234 803 000 0001',
    contactEmail: s.contactEmail || 'info@riverhouseretreat.ng',
    website: s.website || 'www.riverhouseretreat.ng',
    arrivalPolicy: s.arrivalPolicy || 'Check-in from 2:00 PM. Government-issued photo ID required on arrival.',
    cancellationPolicy: s.cancellationPolicy || 'Free cancellation up to 48 hours before arrival. Cancellations made within 48 hours are subject to a one-night fee.',
    amenitiesList,
  };
}

const SEED_ROOMS = [
  { number: '101', tier: 'Deluxe Garden Room', floor: 1, pricePerNight: 45000,  status: 'occupied',    lastCleaned: '2026-10-18', isActive: true, bed: 'King bed', capacity: 'Up to 2 guests', image: '/images/room-deluxe.jpg' },
  { number: '102', tier: 'Deluxe Garden Room', floor: 1, pricePerNight: 45000,  status: 'available',   lastCleaned: '2026-10-17', isActive: true, bed: 'King bed', capacity: 'Up to 2 guests', image: '/images/room-deluxe.jpg' },
  { number: '103', tier: 'Deluxe Garden Room', floor: 1, pricePerNight: 45000,  status: 'available',   lastCleaned: '2026-10-18', isActive: true, bed: 'King bed', capacity: 'Up to 2 guests', image: '/images/room-deluxe.jpg' },
  { number: '201', tier: 'Executive Suite',    floor: 2, pricePerNight: 72000,  status: 'available',   lastCleaned: '2026-10-17', isActive: true, bed: 'King bed + Lounge', capacity: 'Up to 2 guests', image: '/images/hotel-1.jpg' },
  { number: '204', tier: 'Executive Suite',    floor: 2, pricePerNight: 72000,  status: 'occupied',    lastCleaned: '2026-10-15', isActive: true, bed: 'King bed + Lounge', capacity: 'Up to 2 guests', image: '/images/hotel-1.jpg' },
  { number: '205', tier: 'Executive Suite',    floor: 2, pricePerNight: 72000,  status: 'maintenance', lastCleaned: '2026-10-10', isActive: false, bed: 'King bed + Lounge', capacity: 'Up to 2 guests', image: '/images/hotel-1.jpg' },
  { number: '301', tier: 'Family Suite',       floor: 3, pricePerNight: 110000, status: 'available',   lastCleaned: '2026-10-18', isActive: true, bed: 'Two queen beds', capacity: 'Up to 4 guests', image: '/images/stay-weekend.jpg' },
  { number: '308', tier: 'Family Suite',       floor: 3, pricePerNight: 110000, status: 'reserved',    lastCleaned: '2026-10-18', isActive: true, bed: 'Two queen beds', capacity: 'Up to 4 guests', image: '/images/stay-weekend.jpg' },
];

const SEED_ACTIVITY = [
  { id: 1, icon: 'checkin',  text: 'Emeka Okonkwo checked in · Room 101',           time: new Date(Date.now()-7200000).toISOString() },
  { id: 2, icon: 'booking',  text: 'New reservation: Room 204 by Adaeze Nwosu',     time: new Date(Date.now()-18000000).toISOString() },
  { id: 3, icon: 'booking',  text: 'New reservation: Room 308 by Chukwuemeka Eze',  time: new Date(Date.now()-28800000).toISOString() },
  { id: 4, icon: 'checkout', text: 'Ngozi Okafor checked out · Room 101',           time: new Date(Date.now()-108000000).toISOString() },
  { id: 5, icon: 'update',   text: 'Room inventory updated by manager',              time: new Date(Date.now()-172800000).toISOString() },
];

function loadStore(key, def) {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : def; } catch { return def; }
}
function saveStore(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }

function getRelativeTime(iso) {
  if (!iso) return '';
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return m + 'm ago';
  const h = Math.floor(m / 60);
  if (h < 24) return h + 'h ago';
  return Math.floor(h / 24) + 'd ago';
}
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtNGN(n) { return '\u20a6' + Number(n).toLocaleString('en-NG'); }
function extractRoom(s) {
  const m = (s || '').match(/Room\s*(\d+)/i);
  return m ? m[1] : (s || '').split('\u2014')[0].replace(/Room/i, '').trim() || '?';
}

// ─── Root Component ────────────────────────────────────────────────────
export default function ManagerDashboard() {
  const { currentUser, isAuthenticated, userRole, signOut, openAuth } = useAuth();
  const { notifications, bookings, unreadCount, markAllAsRead, clearNotification, setActiveReceipt } = useNotifications();
  const navigate = useNavigate();
  const { tab } = useParams();
  const [searchParams] = useSearchParams();

  // Strict role check & manager state isolation
  const isManager = isAuthenticated && userRole === 'hotel_manager';
  // Bind strictly to manager's assigned property to prevent cross-hotel data leakage
  const managerHotelSlug = currentUser?.assignedHotel || currentUser?.hotelSlug || MANAGER_HOTEL_SLUG;

  const [activeSection, setActiveSection] = useState(
    (tab && SIDEBAR_NAV.some(n => n.id === tab)) ? tab : 'overview'
  );

  // Core Data States: Protected from state snooping if unauthorized
  const [reservations, setReservations]   = useState(() => (isManager ? loadStore(STORAGE_KEY_MGR_RES, SEED_RES) : []));
  const [rooms, setRooms]                 = useState(() => (isManager ? loadStore(STORAGE_KEY_MGR_ROOMS, SEED_ROOMS) : []));
  const [categories, setCategories]       = useState(() => (isManager ? roomService.getCategories(managerHotelSlug) : []));
  const [activityFeed, setActivityFeed]   = useState(() => (isManager ? loadStore(STORAGE_KEY_MGR_ACTIVITY, SEED_ACTIVITY) : []));
  const [hotelSettings, setHotelSettings] = useState(() => {
    if (!isManager) return normalizeSettings(null);
    const loaded = loadStore(STORAGE_KEY_MGR_SETTINGS, null);
    return normalizeSettings(loaded);
  });

  const [searchQuery,      setSearchQuery]      = useState('');
  const [statusFilter,     setStatusFilter]     = useState(() => searchParams.get('filter') || 'all');
  const [actionMenuId,     setActionMenuId]     = useState(null);
  const [editingRoom,      setEditingRoom]      = useState(null);

  const [toast, setToast] = useState(null);
  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  useEffect(() => {
    if (isManager) saveStore(STORAGE_KEY_MGR_RES, reservations);
  }, [isManager, reservations]);

  useEffect(() => {
    if (isManager) {
      saveStore(STORAGE_KEY_MGR_ROOMS, rooms);
      syncHotelRooms(managerHotelSlug, rooms);
    }
  }, [isManager, managerHotelSlug, rooms]);

  useEffect(() => {
    if (isManager) saveStore(STORAGE_KEY_MGR_ACTIVITY, activityFeed);
  }, [isManager, activityFeed]);

  useEffect(() => {
    if (isManager) saveStore(STORAGE_KEY_MGR_SETTINGS, hotelSettings);
  }, [isManager, hotelSettings]);

  useEffect(() => {
    if (tab && SIDEBAR_NAV.some(n => n.id === tab)) {
      setActiveSection(tab);
      if (tab === 'reservations') {
        const filterParam = searchParams.get('filter');
        if (filterParam) setStatusFilter(filterParam);
      }
    } else {
      setActiveSection('overview');
    }
  }, [tab, searchParams]);

  useEffect(() => {
    if (!isAuthenticated) { openAuth('signin'); return; }
    if (userRole === 'admin') {
      navigate('/admin/dashboard', { replace: true });
      return;
    }
    if (userRole !== 'hotel_manager') navigate('/', { replace: true });
  }, [isAuthenticated, userRole, openAuth, navigate]);

  // Sync new bookings from customer booking wizard into this manager's table (isolated to assigned property)
  useEffect(() => {
    if (!isManager || !bookings || bookings.length === 0) return;
    setReservations(prev => {
      const ids = new Set(prev.map(r => r.id));
      const incoming = bookings
        .filter(b => b.hotelSlug === managerHotelSlug && !ids.has(b.id || b.bookingRef))
        .map(b => ({
          id: b.id || b.bookingRef,
          guestName: b.guest?.fullName || 'Guest',
          room: extractRoom(b.roomNumber || ''),
          roomTier: b.roomName || 'Room',
          arrival: b.dates?.arrival || '',
          departure: b.dates?.departure || '',
          status: 'confirmed',
          payment: b.paymentMethod === 'hotel' ? 'Pay at Hotel' : 'Paid',
          total: b.totalAmount || 0,
          hotelSlug: b.hotelSlug,
          createdAt: b.timestamp || new Date().toISOString(),
          nights: b.dates?.nights || 1,
        }));
      if (incoming.length === 0) return prev;
      setActivityFeed(feed => {
        const acts = incoming.map(r => ({
          id: Date.now() + Math.random(), icon: 'booking',
          text: `New reservation: ${r.roomTier} (Rm ${r.room}) by ${r.guestName} · Ref ${r.id}`,
          time: r.createdAt,
        }));
        return [...acts, ...feed].slice(0, 30);
      });
      return [...incoming, ...prev];
    });
  }, [isManager, bookings, managerHotelSlug]);

  // Live room & category inventory sync from Supabase
  useEffect(() => {
    if (!isManager || !managerHotelSlug) return;
    let isMounted = true;
    Promise.all([
      roomService.fetchRooms(managerHotelSlug),
      roomService.fetchCategories(managerHotelSlug),
    ]).then(([liveRooms, liveCats]) => {
      if (!isMounted) return;
      if (liveRooms && liveRooms.length > 0) setRooms(liveRooms);
      if (liveCats && liveCats.length > 0) setCategories(liveCats);
    }).catch((err) => {
      console.warn('Live room/category sync fallback:', err);
    });
    return () => { isMounted = false; };
  }, [isManager, managerHotelSlug]);

  const hotel = useHotel(managerHotelSlug, { includeDeleted: true }) || sampleHotels[0];

  const handleSaveHotelSettings = useCallback((newSettings) => {
    setHotelSettings(newSettings);
    saveHotelOverrides(managerHotelSlug, newSettings);
    hotelService.updateHotelSettings(managerHotelSlug, newSettings).catch((err) => {
      console.warn('Supabase hotel settings sync error:', err);
    });
    setActivityFeed(feed => [{
      id: Date.now(),
      icon: 'update',
      text: 'Hotel policies and amenities updated by manager',
      time: new Date().toISOString(),
    }, ...feed].slice(0, 30));
    showToast('Hotel settings & amenities saved successfully.', 'success');
  }, [managerHotelSlug, showToast]);

  const handleAddRoom = useCallback((roomData) => {
    setRooms(prev => {
      const updated = [...prev, roomData];
      saveStore(STORAGE_KEY_MGR_ROOMS, updated);
      syncHotelRooms(managerHotelSlug, updated);
      return updated;
    });
    roomService.addRoom(managerHotelSlug, roomData).catch((err) => {
      console.warn('Supabase add room error:', err);
    });
    setActivityFeed(feed => [{
      id: Date.now(),
      icon: 'update',
      text: `Room ${roomData.number} (${roomData.tier}) added to inventory`,
      time: new Date().toISOString(),
    }, ...feed].slice(0, 30));
    showToast(`Room ${roomData.number} added successfully to ${roomData.tier}.`, 'success');
  }, [managerHotelSlug, showToast]);

  const handleUpdateRoom = useCallback((number, updates) => {
    setRooms(prev => {
      const updated = prev.map(r => r.number === number ? { ...r, ...updates } : r);
      saveStore(STORAGE_KEY_MGR_ROOMS, updated);
      syncHotelRooms(managerHotelSlug, updated);
      return updated;
    });
    roomService.updateRoom(managerHotelSlug, number, updates).catch((err) => {
      console.warn('Supabase update room error:', err);
    });
    setActivityFeed(feed => [{
      id: Date.now(), icon: 'update',
      text: `Room ${number} updated by manager`,
      time: new Date().toISOString(),
    }, ...feed].slice(0, 30));
    showToast(`Room ${number} updated successfully.`, 'success');
  }, [managerHotelSlug, showToast]);

  const handleDeleteRoom = useCallback((number) => {
    // 1. Guard: Block deletion if room currently has active/upcoming reservations
    const hasActiveReservations = reservations.some(r => {
      const rNum = String(r.room || '').replace(/^Room\s*/i, '').trim();
      const isTargetRoom = rNum === String(number).trim();
      const isActiveStatus = r.status === 'confirmed' || r.status === 'checked_in';
      return isTargetRoom && isActiveStatus;
    });

    if (hasActiveReservations) {
      showToast('Cannot delete room with pending or checked-in bookings.', 'danger');
      return false;
    }

    // 2. Perform deletion for unassigned/inactive room
    setRooms(prev => {
      const updated = prev.filter(r => r.number !== number);
      saveStore(STORAGE_KEY_MGR_ROOMS, updated);
      syncHotelRooms(managerHotelSlug, updated);
      return updated;
    });
    try {
      roomService.deleteRoom(managerHotelSlug, number, reservations);
    } catch (err) {
      console.warn('Supabase delete room error:', err);
    }
    setActivityFeed(feed => [{
      id: Date.now(), icon: 'update',
      text: `Room ${number} removed from inventory`,
      time: new Date().toISOString(),
    }, ...feed].slice(0, 30));
    showToast(`Room ${number} removed from inventory.`, 'info');
    return true;
  }, [reservations, managerHotelSlug, showToast]);

  const handleSaveCategory = useCallback(async (catData) => {
    try {
      const saved = await roomService.saveCategory(managerHotelSlug, catData);
      if (catData.totalUnits) {
        await roomService.syncCategoryRooms(
          managerHotelSlug,
          saved?.id || catData.id || catData.name,
          catData.totalUnits,
          catData.roomPrefix || 'RM-'
        );
      }
      const [refreshedRooms, refreshedCats] = await Promise.all([
        roomService.fetchRooms(managerHotelSlug),
        roomService.fetchCategories(managerHotelSlug),
      ]);
      setRooms(refreshedRooms);
      setCategories(refreshedCats);
      showToast(`Category "${catData.name}" saved and physical inventory updated!`, 'success');
      return saved;
    } catch (err) {
      console.error('Save category error:', err);
      showToast(`Error saving category: ${err.message}`, 'danger');
      throw err;
    }
  }, [managerHotelSlug, showToast]);

  const handleSyncCategoryRooms = useCallback(async (categoryId, count, prefix) => {
    try {
      await roomService.syncCategoryRooms(managerHotelSlug, categoryId, count, prefix);
      const [refreshedRooms, refreshedCats] = await Promise.all([
        roomService.fetchRooms(managerHotelSlug),
        roomService.fetchCategories(managerHotelSlug),
      ]);
      setRooms(refreshedRooms);
      setCategories(refreshedCats);
      showToast(`Room inventory reconciled to ${count} units.`, 'success');
    } catch (err) {
      console.error('Sync rooms error:', err);
      showToast(`Sync error: ${err.message}`, 'danger');
    }
  }, [managerHotelSlug, showToast]);

  const handleToggleDelist = useCallback((nextState) => {
    setHotelDelisted(managerHotelSlug, nextState);
    showToast(
      nextState
        ? 'Property de-listed. Public bookings paused & hidden from Explore.'
        : 'Property re-listed! Live on public Explore page.',
      nextState ? 'warning' : 'success'
    );
  }, [managerHotelSlug, showToast]);

  const handleDeleteHotel = useCallback(() => {
    deleteHotel(managerHotelSlug);
    showToast('Hotel permanently deleted from Lodgekeys.', 'danger');
  }, [managerHotelSlug, showToast]);

  const handleRestoreHotel = useCallback(() => {
    restoreHotel(managerHotelSlug);
    showToast('Property listing restored successfully!', 'success');
  }, [managerHotelSlug, showToast]);

  const metrics = useMemo(() => {
    const today     = new Date().toISOString().split('T')[0];
    const arrivals  = reservations.filter(r => r.arrival === today && r.status !== 'cancelled').length;
    const departures= reservations.filter(r => r.departure === today && r.status !== 'cancelled').length;
    const occupied  = rooms.filter(r => r.status === 'occupied' || r.status === 'reserved').length;
    const available = rooms.filter(r => r.status === 'available' && r.isActive).length;
    const totalActive = rooms.filter(r => r.isActive).length;
    const occupancy = totalActive > 0 ? Math.round((occupied / totalActive) * 100) : 0;
    return { arrivals, departures, occupancy, available };
  }, [reservations, rooms]);

  const filteredRes = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return reservations.filter(r => {
      const q  = searchQuery.trim().toLowerCase();
      const ms = !q ||
        r.id.toLowerCase().includes(q) ||
        r.guestName.toLowerCase().includes(q) ||
        r.room.toLowerCase().includes(q) ||
        r.roomTier.toLowerCase().includes(q);

      let mf = true;
      if (statusFilter === 'arrivals') {
        mf = r.arrival === today && r.status !== 'cancelled';
      } else if (statusFilter === 'departures') {
        mf = r.departure === today && r.status !== 'cancelled';
      } else if (statusFilter === 'confirmed') {
        mf = r.status === 'confirmed' || r.status === 'reserved';
      } else if (statusFilter !== 'all') {
        mf = r.status === statusFilter;
      }

      return ms && mf;
    });
  }, [reservations, searchQuery, statusFilter]);

  // Dedicated action to trigger the official booking receipt voucher modal
  const handleOpenReceipt = useCallback((r) => {
    const nights = r.nights || 1;
    const roomPrice = r.total ? Math.round(r.total / nights) : 45000;
    setActiveReceipt({
      id: r.id,
      bookingRef: r.id,
      hotelName: hotel.name,
      hotelAddress: hotel.address || hotel.location || 'River Road, Off Ethiope Waterway, Abraka, Delta State',
      hotelSlug: r.hotelSlug || MANAGER_HOTEL_SLUG,
      roomNumber: `Room ${r.room}`,
      roomName: r.roomTier || 'Standard Room',
      roomPriceNumeric: roomPrice,
      totalAmount: r.total || 0,
      paymentMethod: r.payment === 'Pay at Hotel' ? 'hotel' : 'card',
      dates: {
        arrival: r.arrival,
        departure: r.departure,
        nights: nights,
        guests: '2 Guests, 1 Room',
      },
      guest: {
        fullName: r.guestName,
        email: r.email || `${r.guestName.toLowerCase().replace(/[^a-z0-9]+/g, '.')}@example.com`,
        phone: r.phone || '+234 803 000 0001',
        specialRequests: r.specialRequests || 'Standard guest front-desk check-in confirmation.',
      },
      status: r.status,
      checkedInAt: r.checkedInAt,
      checkedOutAt: r.checkedOutAt,
    });
  }, [hotel, setActiveReceipt]);

  // Check-In & Check-Out State Machine + Cross-Storage Syncing
  const updateResStatus = useCallback((id, status) => {
    const nowIso = new Date().toISOString();
    let updatedBooking = null;

    setReservations(prev => {
      const updated = prev.map(r => {
        if (r.id === id) {
          updatedBooking = {
            ...r,
            status,
            ...(status === 'checked_in' ? { checkedInAt: nowIso } : {}),
            ...(status === 'checked_out' ? { checkedOutAt: nowIso } : {}),
          };
          return updatedBooking;
        }
        return r;
      });
      saveStore(STORAGE_KEY_MGR_RES, updated);
      return updated;
    });

    const res = updatedBooking || reservations.find(r => r.id === id);
    if (res) {
      const roomNum = res.room;
      if (status === 'checked_in') {
        // Automatically flip room in inventory from reserved/available to occupied
        setRooms(prevRooms => {
          const updated = prevRooms.map(rm => String(rm.number) === String(roomNum) ? { ...rm, status: 'occupied' } : rm);
          saveStore(STORAGE_KEY_MGR_ROOMS, updated);
          syncHotelRooms(MANAGER_HOTEL_SLUG, updated);
          return updated;
        });

        setActivityFeed(feed => [{
          id: Date.now(),
          icon: 'checkin',
          text: `${res.guestName} checked in · Room ${roomNum} marked Occupied`,
          time: nowIso,
        }, ...feed].slice(0, 30));

        showToast(`Guest checked in! Room ${roomNum} allocated and marked Occupied.`, 'success');
      } else if (status === 'checked_out') {
        // Automatically flip room to available (with cleaned date stamped)
        setRooms(prevRooms => {
          const updated = prevRooms.map(rm => String(rm.number) === String(roomNum) ? { ...rm, status: 'available', lastCleaned: nowIso.split('T')[0] } : rm);
          saveStore(STORAGE_KEY_MGR_ROOMS, updated);
          syncHotelRooms(MANAGER_HOTEL_SLUG, updated);
          return updated;
        });

        setActivityFeed(feed => [{
          id: Date.now(),
          icon: 'checkout',
          text: `${res.guestName} checked out · Room ${roomNum} marked Available`,
          time: nowIso,
        }, ...feed].slice(0, 30));

        showToast(`Check-out complete! Room ${roomNum} returned to inventory.`, 'info');
      } else if (status === 'cancelled') {
        setRooms(prevRooms => {
          const updated = prevRooms.map(rm => String(rm.number) === String(roomNum) && rm.status === 'reserved' ? { ...rm, status: 'available' } : rm);
          saveStore(STORAGE_KEY_MGR_ROOMS, updated);
          syncHotelRooms(MANAGER_HOTEL_SLUG, updated);
          return updated;
        });

        setActivityFeed(feed => [{
          id: Date.now(),
          icon: 'update',
          text: `Reservation ${res.id} for ${res.guestName} cancelled`,
          time: nowIso,
        }, ...feed].slice(0, 30));

        showToast(`Reservation ${res.id} has been cancelled.`, 'warning');
      }
    }

    // Immediate sync with localStorage for Customer Dashboard
    try {
      const storedBookings = loadStore('lodgekeys_bookings_v1', []);
      const updatedStored = storedBookings.map(b => (b.id === id || b.bookingRef === id) ? {
        ...b,
        status,
        ...(status === 'checked_in' ? { checkedInAt: nowIso } : {}),
        ...(status === 'checked_out' ? { checkedOutAt: nowIso } : {}),
      } : b);
      saveStore('lodgekeys_bookings_v1', updatedStored);
    } catch {}

    try {
      const storedUsers = loadStore('lodgekeys_users_v1', []);
      let didUpdate = false;
      const updatedUsers = storedUsers.map(u => {
        if (Array.isArray(u.bookings) && u.bookings.some(b => b.id === id || b.bookingRef === id)) {
          didUpdate = true;
          return {
            ...u,
            bookings: u.bookings.map(b => (b.id === id || b.bookingRef === id) ? {
              ...b,
              status,
              ...(status === 'checked_in' ? { checkedInAt: nowIso } : {}),
              ...(status === 'checked_out' ? { checkedOutAt: nowIso } : {}),
            } : b),
          };
        }
        return u;
      });
      if (didUpdate) {
        saveStore('lodgekeys_users_v1', updatedUsers);
      }
    } catch {}

    window.dispatchEvent(new Event('storage'));
    setActionMenuId(null);
  }, [reservations, showToast]);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const handleLogout = () => { signOut(); navigate('/'); };
  const handleNav    = (id, search = '') => {
    setActiveSection(id);
    setMobileMenuOpen(false);
    navigate(`/manager/${id}${search}`);
  };

  if (!isAuthenticated || (userRole !== 'hotel_manager' && userRole !== 'admin')) {
    return (
      <div className="mgr-gate">
        <div className="mgr-gate__inner">
          <KeyRound size={36} strokeWidth={1.5} />
          <h2>Manager Access Required</h2>
          <p>This portal is restricted to hotel managers and admins.</p>
          <button className="mgr-gate__btn" onClick={() => openAuth('signin')}>Sign In</button>
        </div>
      </div>
    );
  }

  const initials = currentUser?.initials || 'HM';

  return (
    <div className="mgr">
      {/* ── Mobile Sidebar Backdrop ── */}
      <div
        className={`mgr-sidebar-backdrop ${mobileMenuOpen ? 'mgr-sidebar-backdrop--open' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />

      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside className={`mgr-sidebar ${mobileMenuOpen ? 'mgr-sidebar--open' : ''}`}>
        <div className="mgr-sidebar__brand">
          <div className="mgr-sidebar__brand-row">
            <Link to="/" className="mgr-sidebar__logo" onClick={() => setMobileMenuOpen(false)}>lodgekeys.</Link>
            <button
              type="button"
              className="mgr-sidebar__close-btn"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>
          <span className="mgr-sidebar__portal-tag">HOTEL MANAGER PORTAL</span>
        </div>
        <nav className="mgr-sidebar__nav">
          {SIDEBAR_NAV.map(item => {
            const Icon   = item.icon;
            const active = activeSection === item.id;
            return (
              <button
                key={item.id}
                className={`mgr-nav-item${active ? ' mgr-nav-item--active' : ''}`}
                onClick={() => handleNav(item.id)}
                id={`mgr-nav-${item.id}`}
              >
                <Icon size={18} strokeWidth={active ? 2 : 1.75} />
                <span>{item.label}</span>
                {item.badge && unreadCount > 0 && (
                  <span className="mgr-nav-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
              </button>
            );
          })}
        </nav>
        <div className="mgr-sidebar__footer">
          <Link to="/" className="mgr-sidebar__util" onClick={() => setMobileMenuOpen(false)}>
            <ArrowLeft size={16} /><span>Back to Lodgekeys</span>
          </Link>
          <button className="mgr-sidebar__util mgr-sidebar__util--logout" onClick={handleLogout}>
            <LogOut size={16} /><span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────── */}
      <div className="mgr-main">
        <header className="mgr-header">
          <div className="mgr-header__left">
            <button
              type="button"
              className="mgr-header__menu-btn"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open sidebar menu"
              aria-expanded={mobileMenuOpen}
            >
              <Menu size={20} />
            </button>
            <div className="mgr-header__breadcrumb">
              <span className="mgr-header__breadcrumb-root">Hotel Manager</span>
              <ChevronRight size={14} className="mgr-header__breadcrumb-sep" />
              <span className="mgr-header__breadcrumb-hotel">{hotel.name}</span>
              <span className="mgr-header__breadcrumb-tag">
                · {SIDEBAR_NAV.find(n => n.id === activeSection)?.label || 'Overview'}
              </span>
            </div>
          </div>
          <div className="mgr-header__right">
            <button className="mgr-header__bell" onClick={() => handleNav('notifications')} id="mgr-bell">
              <Bell size={20} />
              {unreadCount > 0 && <span className="mgr-header__bell-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
            </button>
            <div className="mgr-header__avatar" title={currentUser?.fullName || 'Manager'}>{initials}</div>
          </div>
        </header>

        {/* Global Toast Notification */}
        {toast && (
          <div className={`mgr-toast mgr-toast--${toast.type || 'success'}`}>
            {toast.type === 'danger' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
            <span>{toast.msg}</span>
            <button type="button" className="mgr-toast__close" onClick={() => setToast(null)}>
              <X size={14} />
            </button>
          </div>
        )}

        {/* Deleted Property Banner */}
        {hotel.isDeleted && (
          <div className="mgr-deleted-banner">
            <div className="mgr-deleted-banner__content">
              <AlertTriangle size={18} />
              <div>
                <strong>Property De-listed &amp; Deleted</strong> — {hotel.name} is permanently removed from public listings and search results.
              </div>
            </div>
            <div className="mgr-deleted-banner__actions">
              <button
                type="button"
                className="mgr-restore-property-btn"
                onClick={handleRestoreHotel}
                id="btn-restore-hotel"
              >
                <RotateCcw size={13} /> Restore Property Listing
              </button>
              <Link to="/" className="mgr-back-home-btn">
                Back to Home
              </Link>
            </div>
          </div>
        )}

        <div className="mgr-content">
          {activeSection === 'overview'      && <OverviewSection hotel={hotel} metrics={metrics} reservations={reservations} rooms={rooms} activityFeed={activityFeed} handleNav={handleNav} onOpenReceipt={handleOpenReceipt} />}
          {activeSection === 'rooms'         && <RoomsSection hotel={hotel} rooms={rooms} categories={categories} reservations={reservations} onAddRoom={handleAddRoom} onUpdateRoom={handleUpdateRoom} onDeleteRoom={handleDeleteRoom} onSaveCategory={handleSaveCategory} onSyncCategoryRooms={handleSyncCategoryRooms} initialStatusFilter={searchParams.get('status') || 'all'} />}
          {activeSection === 'reservations'  && <ReservationsSection reservations={filteredRes} allReservations={reservations} searchQuery={searchQuery} setSearchQuery={setSearchQuery} statusFilter={statusFilter} setStatusFilter={setStatusFilter} updateResStatus={updateResStatus} actionMenuId={actionMenuId} setActionMenuId={setActionMenuId} onOpenReceipt={handleOpenReceipt} />}
          {activeSection === 'reports'       && <ReportsSection reservations={reservations} rooms={rooms} />}
          {activeSection === 'notifications' && <NotificationsSection notifications={notifications} unreadCount={unreadCount} markAllAsRead={markAllAsRead} clearNotification={clearNotification} />}
          {activeSection === 'settings'      && <SettingsSection hotel={hotel} hotelSettings={hotelSettings} onSave={handleSaveHotelSettings} onToggleDelist={handleToggleDelist} onDeleteHotel={handleDeleteHotel} onRestoreHotel={handleRestoreHotel} />}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// OVERVIEW
// ══════════════════════════════════════════════════════════════
function OverviewSection({ hotel, metrics, reservations, rooms, activityFeed, handleNav, onOpenReceipt }) {
  const todayStr = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const dynamicOccupancy = useMemo(() => computeSixMonthOccupancy(metrics.occupancy), [metrics.occupancy]);
  const dateRangeStr = dynamicOccupancy.length > 0
    ? `${dynamicOccupancy[0].month} – ${dynamicOccupancy[dynamicOccupancy.length - 1].month} ${new Date().getFullYear()}`
    : 'Last 6 Months';

  return (
    <div className="mgr-section">
      <div className="mgr-overview-header">
        <div>
          <p className="mgr-overview-header__property">{hotel.name.toUpperCase()}</p>
          <h1 className="mgr-overview-header__title">Welcome back, Manager.</h1>
          <p className="mgr-overview-header__subtitle">One property. Every detail, thoughtfully managed.</p>
        </div>
        <div className="mgr-overview-header__meta">
          <span className="mgr-overview-header__date">{todayStr}</span>
          <span className="mgr-overview-header__location"><MapPin size={13} /> {hotel.location}</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="mgr-kpi-grid">
        <button
          type="button"
          className="mgr-kpi-card mgr-kpi-card--arrivals"
          onClick={() => handleNav('reservations', '?filter=arrivals')}
          id="kpi-arrivals"
          title="View Today's Expected Arrivals"
        >
          <div className="mgr-kpi-card__icon-wrap"><DoorOpen size={22} /></div>
          <div className="mgr-kpi-card__body">
            <span className="mgr-kpi-card__label">Today's Arrivals</span>
            <span className="mgr-kpi-card__value">{metrics.arrivals}</span>
            <span className="mgr-kpi-card__sub">Check-ins expected today</span>
          </div>
          <ArrowUpRight size={16} className="mgr-kpi-card__arrow" />
        </button>

        <button
          type="button"
          className="mgr-kpi-card mgr-kpi-card--departures"
          onClick={() => handleNav('reservations', '?filter=departures')}
          id="kpi-departures"
          title="View Today's Expected Departures"
        >
          <div className="mgr-kpi-card__icon-wrap"><DoorClosed size={22} /></div>
          <div className="mgr-kpi-card__body">
            <span className="mgr-kpi-card__label">Today's Departures</span>
            <span className="mgr-kpi-card__value">{metrics.departures}</span>
            <span className="mgr-kpi-card__sub">Check-outs expected today</span>
          </div>
          <ArrowUpRight size={16} className="mgr-kpi-card__arrow" />
        </button>

        <button
          type="button"
          className="mgr-kpi-card mgr-kpi-card--occupancy"
          onClick={() => handleNav('reports')}
          id="kpi-occupancy"
          title="View Occupancy Rate & Reports"
        >
          <div className="mgr-kpi-card__icon-wrap"><TrendingUp size={22} /></div>
          <div className="mgr-kpi-card__body">
            <span className="mgr-kpi-card__label">Occupancy Rate</span>
            <span className="mgr-kpi-card__value">{metrics.occupancy}%</span>
            <div className="mgr-kpi-card__bar-wrap">
              <div className="mgr-kpi-card__bar" style={{ width: `${metrics.occupancy}%` }} />
            </div>
          </div>
          <ArrowUpRight size={16} className="mgr-kpi-card__arrow" />
        </button>

        <button
          type="button"
          className="mgr-kpi-card mgr-kpi-card--available"
          onClick={() => handleNav('rooms', '?status=available')}
          id="kpi-available"
          title="View Available Rooms"
        >
          <div className="mgr-kpi-card__icon-wrap"><BedDouble size={22} /></div>
          <div className="mgr-kpi-card__body">
            <span className="mgr-kpi-card__label">Available Rooms</span>
            <span className="mgr-kpi-card__value">{metrics.available}</span>
            <span className="mgr-kpi-card__sub">Ready to receive guests</span>
          </div>
          <ArrowUpRight size={16} className="mgr-kpi-card__arrow" />
        </button>
      </div>

      {/* Analytics + Activity */}
      <div className="mgr-analytics-row">
        <div className="mgr-chart-card">
          <div className="mgr-chart-card__header">
            <div>
              <h3 className="mgr-chart-card__title">Monthly Occupancy</h3>
              <p className="mgr-chart-card__subtitle">Room fill rate over 6 months</p>
            </div>
            <span className="mgr-chart-card__badge">{dateRangeStr}</span>
          </div>
          <div className="mgr-chart">
            {dynamicOccupancy.map((d, i) => (
              <div key={i} className="mgr-chart__col">
                <div className="mgr-chart__bar-wrap">
                  <div className="mgr-chart__bar" style={{ height: `${d.rate}%` }} title={`${d.month}: ${d.rate}%`}>
                    <span className="mgr-chart__bar-label">{d.rate}%</span>
                  </div>
                </div>
                <span className="mgr-chart__month">{d.month}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mgr-activity-card">
          <div className="mgr-activity-card__header">
            <h3 className="mgr-activity-card__title">Property Activity</h3>
            <span className="mgr-activity-card__live"><Activity size={12} /> Live</span>
          </div>
          <ul className="mgr-activity-feed">
            {activityFeed.slice(0, 7).map((item, i) => (
              <li key={item.id || i} className="mgr-activity-item">
                <div className={`mgr-activity-item__icon mgr-activity-item__icon--${item.icon}`}>
                  {item.icon === 'checkin'  && <DoorOpen size={14} />}
                  {item.icon === 'checkout' && <DoorClosed size={14} />}
                  {item.icon === 'booking'  && <CalendarCheck size={14} />}
                  {item.icon === 'update'   && <RefreshCcw size={14} />}
                </div>
                <div className="mgr-activity-item__body">
                  <p className="mgr-activity-item__text">{item.text}</p>
                  <span className="mgr-activity-item__time">{getRelativeTime(item.time)}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Quick table */}
      <div className="mgr-quick-table">
        <div className="mgr-quick-table__header">
          <h3 className="mgr-quick-table__title">Recent Reservations</h3>
          <button className="mgr-quick-table__view-all" onClick={() => handleNav('reservations')}>
            View all <ArrowUpRight size={14} />
          </button>
        </div>
        <ReservationsTable
          reservations={reservations.slice(0, 5)}
          onStatusChange={null}
          actionMenuId={null}
          setActionMenuId={() => {}}
          onOpenReceipt={onOpenReceipt}
          compact
        />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// RESERVATIONS SECTION
// ══════════════════════════════════════════════════════════════
function ReservationsSection({
  reservations,
  allReservations,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  updateResStatus,
  actionMenuId,
  setActionMenuId,
  onOpenReceipt,
}) {
  const STATUS_OPTIONS = [
    { value: 'all', label: 'All Statuses' },
    { value: 'arrivals', label: "Today's Arrivals" },
    { value: 'departures', label: "Today's Departures" },
    { value: 'confirmed', label: 'Confirmed / Reserved' },
    { value: 'checked_in', label: 'Checked In' },
    { value: 'checked_out', label: 'Checked Out' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const today = new Date().toISOString().split('T')[0];
  const arrivalsCount = allReservations.filter(r => r.arrival === today && r.status !== 'cancelled').length;
  const departuresCount = allReservations.filter(r => r.departure === today && r.status !== 'cancelled').length;
  const confirmedCount = allReservations.filter(r => (r.status === 'confirmed' || r.status === 'reserved')).length;
  const checkedInCount = allReservations.filter(r => r.status === 'checked_in').length;

  return (
    <div className="mgr-section">
      <div className="mgr-section-head">
        <div>
          <h2 className="mgr-section-head__title">Reservations &amp; Check-In</h2>
          <p className="mgr-section-head__sub">Manage guest arrivals, front-desk check-in/out, and official vouchers.</p>
        </div>
        <div className="mgr-section-head__stats">
          <span className="mgr-section-head__stat">{allReservations.length} total</span>
          <span className="mgr-section-head__stat mgr-section-head__stat--green">{confirmedCount} confirmed</span>
          <span className="mgr-section-head__stat mgr-section-head__stat--emerald">{checkedInCount} checked in</span>
          {arrivalsCount > 0 && (
            <span className="mgr-section-head__stat" style={{ background: '#eff6ff', borderColor: '#bfdbfe', color: '#1d4ed8' }}>
              {arrivalsCount} arriving today
            </span>
          )}
          {departuresCount > 0 && (
            <span className="mgr-section-head__stat" style={{ background: '#fff7ed', borderColor: '#fed7aa', color: '#c2410c' }}>
              {departuresCount} departing today
            </span>
          )}
        </div>
      </div>

      <div className="mgr-table-controls">
        <div className="mgr-table-search">
          <Search size={16} />
          <input
            id="mgr-res-search"
            type="text"
            placeholder="Search by guest name, booking ref (e.g. LK-97AB028B), or room number..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="mgr-table-search__clear"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <div className="mgr-table-filter">
          <SlidersHorizontal size={15} />
          <select
            id="mgr-status-filter"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            {STATUS_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {statusFilter !== 'all' && (
        <div className="mgr-filter-active-bar">
          <span>Active filter: <strong>{STATUS_OPTIONS.find(o => o.value === statusFilter)?.label || statusFilter}</strong></span>
          <button type="button" className="mgr-filter-reset-link" onClick={() => setStatusFilter('all')}>
            Clear filter
          </button>
        </div>
      )}

      <ReservationsTable
        reservations={reservations}
        onStatusChange={updateResStatus}
        actionMenuId={actionMenuId}
        setActionMenuId={setActionMenuId}
        onOpenReceipt={onOpenReceipt}
        compact={false}
      />

      {reservations.length === 0 && (
        <div className="mgr-empty">
          <CalendarCheck size={36} strokeWidth={1.5} />
          <p>No reservations match your filters.</p>
          {(searchQuery || statusFilter !== 'all') && (
            <button
              type="button"
              className="mgr-action-btn"
              style={{ marginTop: '10px' }}
              onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}
            >
              Reset Search &amp; Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Shared Reservations Table ──────────────────────────────────────────
function ReservationsTable({ reservations, onStatusChange, actionMenuId, setActionMenuId, onOpenReceipt, compact }) {
  const SC = {
    confirmed:   { label: 'Confirmed',   cls: 'confirmed' },
    reserved:    { label: 'Reserved',    cls: 'confirmed' },
    checked_in:  { label: 'Checked In',  cls: 'checked-in' },
    checked_out: { label: 'Checked Out', cls: 'checked-out' },
    cancelled:   { label: 'Cancelled',   cls: 'cancelled' },
    pending:     { label: 'Pending',     cls: 'pending' },
  };

  return (
    <div className="mgr-table-wrap">
      <table className="mgr-table">
        <thead>
          <tr>
            <th>Reference / Guest</th>
            <th>Room</th>
            <th>Arrival</th>
            <th>Departure</th>
            <th>Status</th>
            <th>Payment</th>
            <th>Total</th>
            {!compact && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {reservations.map(r => {
            const sc     = SC[r.status] || SC.pending;
            const isOpen = actionMenuId === r.id;
            const canCheckIn = r.status === 'confirmed' || r.status === 'reserved';
            const canCheckOut = r.status === 'checked_in';

            return (
              <tr key={r.id} className="mgr-table__row">
                <td className="mgr-table__ref-cell">
                  <span className="mgr-table__ref">{r.id}</span>
                  <span className="mgr-table__guest">{r.guestName}</span>
                </td>
                <td className="mgr-table__room-cell">
                  <span className="mgr-table__room-num">{r.room}</span>
                  <span className="mgr-table__room-tier">{r.roomTier}</span>
                </td>
                <td>{fmtDate(r.arrival)}</td>
                <td>{fmtDate(r.departure)}</td>
                <td><span className={`mgr-status-badge mgr-status-badge--${sc.cls}`}>{sc.label}</span></td>
                <td>
                  <span className={`mgr-payment-badge${r.payment === 'Paid' ? ' mgr-payment-badge--paid' : r.payment === 'Pending' ? ' mgr-payment-badge--pending' : ''}`}>
                    {r.payment}
                  </span>
                </td>
                <td className="mgr-table__total">{fmtNGN(r.total)}</td>
                {!compact && (
                  <td className="mgr-table__actions-cell">
                    <div className="mgr-action-wrap">
                      {/* Active Check-In button */}
                      {onStatusChange && canCheckIn && (
                        <button
                          type="button"
                          className="mgr-action-btn mgr-action-btn--checkin"
                          onClick={() => onStatusChange(r.id, 'checked_in')}
                          id={`checkin-${r.id}`}
                          title="Check In guest & allocate room"
                        >
                          <DoorOpen size={13} /> Check In
                        </button>
                      )}

                      {/* Active Check-Out button */}
                      {onStatusChange && canCheckOut && (
                        <button
                          type="button"
                          className="mgr-action-btn mgr-action-btn--checkout"
                          onClick={() => onStatusChange(r.id, 'checked_out')}
                          id={`checkout-${r.id}`}
                          title="Check Out guest & return room to inventory"
                        >
                          <DoorClosed size={13} /> Check Out
                        </button>
                      )}

                      {/* View Receipt / Details action button */}
                      {onOpenReceipt && (
                        <button
                          type="button"
                          className="mgr-action-btn mgr-action-btn--receipt"
                          onClick={() => onOpenReceipt(r)}
                          id={`receipt-${r.id}`}
                          title="View Official Reservation Voucher"
                        >
                          <Eye size={13} /> Receipt
                        </button>
                      )}

                      {onStatusChange && (
                        <>
                          <button
                            type="button"
                            className="mgr-action-btn mgr-action-btn--menu"
                            onClick={() => setActionMenuId(isOpen ? null : r.id)}
                            id={`menu-${r.id}`}
                            aria-label="More actions"
                          >
                            <MoreVertical size={15} />
                          </button>
                          {isOpen && (
                            <div className="mgr-action-menu">
                              <button
                                type="button"
                                onClick={() => {
                                  onOpenReceipt?.(r);
                                  setActionMenuId(null);
                                }}
                              >
                                <Eye size={14} /> View Details &amp; Voucher
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  onOpenReceipt?.(r);
                                  setActionMenuId(null);
                                  setTimeout(() => window.print(), 350);
                                }}
                              >
                                <PrinterCheck size={14} /> Print Voucher
                              </button>
                              {r.status !== 'cancelled' && r.status !== 'checked_out' && (
                                <button
                                  type="button"
                                  className="mgr-action-menu__danger"
                                  onClick={() => onStatusChange(r.id, 'cancelled')}
                                >
                                  <XCircle size={14} /> Cancel Booking
                                </button>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// ADD ROOM MODAL
// ══════════════════════════════════════════════════════════════
function AddRoomModal({ isOpen, onClose, onAdd, existingRooms }) {
  const [roomNumber, setRoomNumber] = useState('');
  const [selectedTier, setSelectedTier] = useState('Deluxe Garden Room');
  const [customTier, setCustomTier] = useState('');
  const [floor, setFloor] = useState(1);
  const [price, setPrice] = useState('45000');
  const [status, setStatus] = useState('available');
  const [bed, setBed] = useState('King bed');
  const [capacity, setCapacity] = useState('Up to 2 guests');
  const [imageUrl, setImageUrl] = useState('/images/room-deluxe.jpg');
  const [error, setError] = useState('');

  const handleTierChange = (e) => {
    const val = e.target.value;
    setSelectedTier(val);
    if (val === 'Deluxe Garden Room') {
      setPrice('45000');
      setBed('King bed');
      setCapacity('Up to 2 guests');
      setImageUrl('/images/room-deluxe.jpg');
    } else if (val === 'Executive Suite') {
      setPrice('72000');
      setBed('King bed + Lounge');
      setCapacity('Up to 2 guests');
      setImageUrl('/images/hotel-1.jpg');
    } else if (val === 'Family Suite') {
      setPrice('110000');
      setBed('Two queen beds');
      setCapacity('Up to 4 guests');
      setImageUrl('/images/stay-weekend.jpg');
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanNum = roomNumber.trim().replace(/^Room\s*/i, '');
    if (!cleanNum) {
      setError('Please enter a room number (e.g. 206).');
      return;
    }
    if (existingRooms.some(r => String(r.number).toLowerCase() === cleanNum.toLowerCase())) {
      setError(`Room ${cleanNum} already exists in your inventory.`);
      return;
    }
    const finalTier = selectedTier === '__new__' ? customTier.trim() : selectedTier;
    if (!finalTier) {
      setError('Please provide a category / tier name.');
      return;
    }
    const numPrice = parseInt(price, 10);
    if (isNaN(numPrice) || numPrice <= 0) {
      setError('Please enter a valid price per night.');
      return;
    }

    onAdd({
      number: cleanNum,
      tier: finalTier,
      floor: parseInt(floor, 10) || 1,
      pricePerNight: numPrice,
      status,
      bed: bed || 'King bed',
      capacity: capacity || 'Up to 2 guests',
      image: imageUrl || '/images/room-deluxe.jpg',
      lastCleaned: new Date().toISOString().split('T')[0],
      isActive: status !== 'maintenance',
    });

    onClose();
  };

  return (
    <div className="mgr-modal-backdrop" onClick={onClose}>
      <div className="mgr-modal-card mgr-modal-card--room" onClick={e => e.stopPropagation()}>
        <div className="mgr-modal-header">
          <div>
            <h3 className="mgr-modal-title">Add New Room</h3>
            <p className="mgr-modal-subtitle">Register a new room unit into your property inventory.</p>
          </div>
          <button type="button" className="mgr-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="mgr-modal-body">
          {error && <div className="mgr-modal-error">{error}</div>}

          <div className="mgr-form-row">
            <div className="mgr-settings-field">
              <label>Room Number / Identifier *</label>
              <input
                id="add-room-number"
                type="text"
                placeholder="e.g. 206"
                value={roomNumber}
                onChange={e => { setRoomNumber(e.target.value); setError(''); }}
                className="mgr-settings-input"
                autoFocus
                required
              />
            </div>
            <div className="mgr-settings-field">
              <label>Floor Level</label>
              <select
                id="add-room-floor"
                value={floor}
                onChange={e => setFloor(e.target.value)}
                className="mgr-settings-input"
              >
                <option value={1}>Floor 1 (Ground)</option>
                <option value={2}>Floor 2</option>
                <option value={3}>Floor 3</option>
                <option value={4}>Floor 4</option>
                <option value={5}>Floor 5 / Penthouse</option>
              </select>
            </div>
          </div>

          <div className="mgr-settings-field">
            <label>Room Category / Tier *</label>
            <select
              id="add-room-tier"
              value={selectedTier}
              onChange={handleTierChange}
              className="mgr-settings-input"
            >
              <option value="Deluxe Garden Room">Deluxe Garden Room</option>
              <option value="Executive Suite">Executive Suite</option>
              <option value="Family Suite">Family Suite</option>
              <option value="__new__">+ New Category...</option>
            </select>
          </div>

          {selectedTier === '__new__' && (
            <div className="mgr-settings-field">
              <label>Custom Category Name *</label>
              <input
                id="add-room-custom-tier"
                type="text"
                placeholder="e.g. Royal River Pavilion"
                value={customTier}
                onChange={e => setCustomTier(e.target.value)}
                className="mgr-settings-input"
                required
              />
            </div>
          )}

          <div className="mgr-form-row">
            <div className="mgr-settings-field">
              <label>Price per Night (₦ NGN) *</label>
              <input
                id="add-room-price"
                type="number"
                placeholder="e.g. 50000"
                value={price}
                onChange={e => setPrice(e.target.value)}
                className="mgr-settings-input"
                required
              />
            </div>
            <div className="mgr-settings-field">
              <label>Initial Status</label>
              <select
                id="add-room-status"
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="mgr-settings-input"
              >
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
                <option value="reserved">Reserved</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>

          <div className="mgr-form-row">
            <div className="mgr-settings-field">
              <label>Bed Configuration</label>
              <input
                id="add-room-bed"
                type="text"
                placeholder="e.g. King Bed, 2 Queen Beds"
                value={bed}
                onChange={e => setBed(e.target.value)}
                className="mgr-settings-input"
              />
            </div>
            <div className="mgr-settings-field">
              <label>Guest Capacity</label>
              <select
                id="add-room-capacity"
                value={capacity}
                onChange={e => setCapacity(e.target.value)}
                className="mgr-settings-input"
              >
                <option value="Up to 2 guests">Up to 2 guests</option>
                <option value="Up to 3 guests">Up to 3 guests</option>
                <option value="Up to 4 guests">Up to 4 guests</option>
                <option value="Up to 6 guests">Up to 6 guests</option>
              </select>
            </div>
          </div>

          <div className="mgr-settings-field">
            <label>Room Photo URL (Optional)</label>
            <input
              id="add-room-image"
              type="text"
              placeholder="/images/room-deluxe.jpg"
              value={imageUrl}
              onChange={e => setImageUrl(e.target.value)}
              className="mgr-settings-input"
            />
          </div>

          <div className="mgr-modal-actions">
            <button type="button" className="mgr-cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="mgr-save-btn" id="btn-submit-add-room">
              <Plus size={15} /> Add Room to Inventory
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// EDIT ROOM MODAL
// ══════════════════════════════════════════════════════════════
function EditRoomModal({ room, isOpen, onClose, onSave, onDelete, hasActiveBookings = false }) {
  const [price, setPrice] = useState(room ? String(room.pricePerNight) : '');
  const [status, setStatus] = useState(room ? room.status : 'available');
  const [floor, setFloor] = useState(room ? String(room.floor) : '1');
  const [bed, setBed] = useState(room ? room.bed || 'King bed' : 'King bed');
  const [capacity, setCapacity] = useState(room ? room.capacity || 'Up to 2 guests' : 'Up to 2 guests');
  const [lastCleaned, setLastCleaned] = useState(room ? room.lastCleaned || new Date().toISOString().split('T')[0] : '');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  useEffect(() => {
    if (room) {
      setPrice(String(room.pricePerNight));
      setStatus(room.status);
      setFloor(String(room.floor));
      setBed(room.bed || 'King bed');
      setCapacity(room.capacity || 'Up to 2 guests');
      setLastCleaned(room.lastCleaned || new Date().toISOString().split('T')[0]);
      setShowConfirmDelete(false);
    }
  }, [room]);

  if (!isOpen || !room) return null;

  const handleSave = (e) => {
    e.preventDefault();
    onSave(room.number, {
      pricePerNight: parseInt(price, 10) || room.pricePerNight,
      status,
      floor: parseInt(floor, 10) || room.floor,
      bed,
      capacity,
      lastCleaned,
      isActive: status !== 'maintenance',
    });
    onClose();
  };

  return (
    <div className="mgr-modal-backdrop" onClick={onClose}>
      <div className="mgr-modal-card mgr-modal-card--room" onClick={e => e.stopPropagation()}>
        <div className="mgr-modal-header">
          <div>
            <h3 className="mgr-modal-title">Edit Room {room.number}</h3>
            <p className="mgr-modal-subtitle">{room.tier} · Floor {room.floor}</p>
          </div>
          <button type="button" className="mgr-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSave} className="mgr-modal-body">
          <div className="mgr-form-row">
            <div className="mgr-settings-field">
              <label>Price per Night (₦ NGN)</label>
              <input
                id="edit-room-price"
                type="number"
                value={price}
                onChange={e => setPrice(e.target.value)}
                className="mgr-settings-input"
                required
              />
            </div>
            <div className="mgr-settings-field">
              <label>Room Status</label>
              <select
                id="edit-room-status"
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="mgr-settings-input"
              >
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
                <option value="reserved">Reserved</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>

          <div className="mgr-form-row">
            <div className="mgr-settings-field">
              <label>Floor Level</label>
              <input
                id="edit-room-floor"
                type="number"
                value={floor}
                onChange={e => setFloor(e.target.value)}
                className="mgr-settings-input"
              />
            </div>
            <div className="mgr-settings-field">
              <label>Last Cleaned Date</label>
              <input
                id="edit-room-cleaned"
                type="date"
                value={lastCleaned}
                onChange={e => setLastCleaned(e.target.value)}
                className="mgr-settings-input"
              />
            </div>
          </div>

          <div className="mgr-form-row">
            <div className="mgr-settings-field">
              <label>Bed Configuration</label>
              <input
                id="edit-room-bed"
                type="text"
                value={bed}
                onChange={e => setBed(e.target.value)}
                className="mgr-settings-input"
              />
            </div>
            <div className="mgr-settings-field">
              <label>Guest Capacity</label>
              <input
                id="edit-room-capacity"
                type="text"
                value={capacity}
                onChange={e => setCapacity(e.target.value)}
                className="mgr-settings-input"
              />
            </div>
          </div>

          {/* Delete Danger Section */}
          <div className="mgr-edit-room-danger">
            {hasActiveBookings ? (
              <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '10px', padding: '12px 14px', textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#dc2626', fontSize: '13px', fontWeight: '700' }}>
                  <Lock size={15} /> Room Protected · Cannot Delete
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#991b1b', lineHeight: '1.45' }}>
                  This room currently has pending or checked-in reservations. Reassign or conclude active stays before removing from inventory.
                </p>
              </div>
            ) : showConfirmDelete ? (
              <div className="mgr-confirm-delete-box">
                <p>Are you sure you want to remove unassigned <strong>Room {room.number}</strong> from inventory?</p>
                <div className="mgr-confirm-delete-actions">
                  <button
                    type="button"
                    className="mgr-danger-confirm-btn"
                    onClick={() => {
                      onDelete(room.number);
                      onClose();
                    }}
                    id="btn-confirm-delete-room"
                  >
                    Yes, Delete Room
                  </button>
                  <button
                    type="button"
                    className="mgr-cancel-sm-btn"
                    onClick={() => setShowConfirmDelete(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="mgr-room-delete-trigger-btn"
                onClick={() => setShowConfirmDelete(true)}
                id="btn-trigger-delete-room"
              >
                <Trash2 size={14} /> Remove this room from inventory
              </button>
            )}
          </div>

          <div className="mgr-modal-actions">
            <button type="button" className="mgr-cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="mgr-save-btn" id="btn-save-room-edits">
              <CheckCircle2 size={15} /> Save Room Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// CATEGORY MODAL (CUSTOM CATEGORIES, PHOTOS, PRICING & UNITS)
// ══════════════════════════════════════════════════════════════
function CategoryModal({ category, isOpen, onClose, onSave }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [maxGuests, setMaxGuests] = useState('2');
  const [bedrooms, setBedrooms] = useState('1');
  const [bathrooms, setBathrooms] = useState('1');
  const [roomSize, setRoomSize] = useState('34 m²');
  const [amenitiesInput, setAmenitiesInput] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [totalUnits, setTotalUnits] = useState('3');
  const [roomPrefix, setRoomPrefix] = useState('RM-');
  const [isPublished, setIsPublished] = useState(true);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (category) {
      setName(category.name || '');
      setDescription(category.description || '');
      setPrice(String(category.baseRateNightly || '45000'));
      setMaxGuests(String(category.maxGuests || 2));
      setBedrooms(String(category.bedroomsCount || 1));
      setBathrooms(String(category.bathroomsCount || 1));
      setRoomSize(category.roomSize || '34 m²');
      setAmenitiesInput(Array.isArray(category.amenities) ? category.amenities.join(', ') : '');
      setPhotoUrl((category.photos && category.photos[0]) || '/images/room-deluxe.jpg');
      setTotalUnits(String(category.totalUnits || 3));
      setRoomPrefix(category.slug ? `${category.slug.slice(0, 3).toUpperCase()}-` : 'RM-');
      setIsPublished(category.isPublished ?? true);
      setError('');
    } else {
      setName('');
      setDescription('');
      setPrice('45000');
      setMaxGuests('2');
      setBedrooms('1');
      setBathrooms('1');
      setRoomSize('34 m²');
      setAmenitiesInput('King Bed, Free Wi-Fi, 24/7 Power, Air Conditioning, En-suite Bath');
      setPhotoUrl('/images/room-deluxe.jpg');
      setTotalUnits('3');
      setRoomPrefix('RM-');
      setIsPublished(true);
      setError('');
    }
  }, [category, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Category name is required (e.g. VIP Suite, Cottage, Deluxe Room).');
      return;
    }
    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      setError('Valid nightly rate in NGN is required.');
      return;
    }
    const units = Math.max(1, Math.min(100, Number(totalUnits) || 1));

    setIsSaving(true);
    setError('');
    try {
      const amenities = amenitiesInput
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean);

      const photos = photoUrl.trim()
        ? photoUrl.split(',').map((p) => p.trim()).filter(Boolean)
        : ['/images/room-deluxe.jpg'];

      await onSave({
        id: category?.id,
        name: name.trim(),
        description: description.trim(),
        baseRateNightly: numPrice,
        maxGuests: Number(maxGuests) || 2,
        capacity: `Up to ${maxGuests || 2} guests`,
        bedroomsCount: Number(bedrooms) || 1,
        bathroomsCount: Number(bathrooms) || 1,
        roomSize: roomSize.trim(),
        amenities,
        photos,
        totalUnits: units,
        roomPrefix: roomPrefix.trim() || 'RM-',
        isPublished,
      });

      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save category.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mgr-modal-backdrop" onClick={onClose}>
      <div className="mgr-modal-card mgr-modal-card--room" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
        <div className="mgr-modal-header">
          <div>
            <h3 className="mgr-modal-title">{category ? `Edit Category: ${category.name}` : 'Create Room Category'}</h3>
            <p className="mgr-modal-subtitle">
              Configure room tier specifications, nightly rates, capacity, and physical units count.
            </p>
          </div>
          <button type="button" className="mgr-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="mgr-modal-body">
          {error && <div className="mgr-modal-error">{error}</div>}

          <div className="mgr-form-row">
            <div className="mgr-settings-field">
              <label>Category Name *</label>
              <input
                type="text"
                placeholder="e.g. Cottage, VIP Suite, Alcove Room..."
                value={name}
                onChange={(e) => { setName(e.target.value); setError(''); }}
                className="mgr-settings-input"
                required
                autoFocus
              />
            </div>
            <div className="mgr-settings-field">
              <label>Nightly Rate (₦ NGN) *</label>
              <input
                type="number"
                placeholder="45000"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="mgr-settings-input"
                min="5000"
                step="1000"
                required
              />
            </div>
          </div>

          <div className="mgr-form-row">
            <div className="mgr-settings-field">
              <label>Max Guest Capacity</label>
              <select value={maxGuests} onChange={(e) => setMaxGuests(e.target.value)} className="mgr-settings-input">
                <option value="1">1 Guest</option>
                <option value="2">2 Guests</option>
                <option value="3">3 Guests</option>
                <option value="4">4 Guests</option>
                <option value="6">6 Guests</option>
                <option value="8">8 Guests (Large Villa)</option>
              </select>
            </div>
            <div className="mgr-settings-field">
              <label>Room Size (Optional)</label>
              <input
                type="text"
                placeholder="e.g. 36 m²"
                value={roomSize}
                onChange={(e) => setRoomSize(e.target.value)}
                className="mgr-settings-input"
              />
            </div>
          </div>

          <div className="mgr-form-row">
            <div className="mgr-settings-field">
              <label>Bedrooms Count</label>
              <input
                type="number"
                min="1"
                max="10"
                value={bedrooms}
                onChange={(e) => setBedrooms(e.target.value)}
                className="mgr-settings-input"
              />
            </div>
            <div className="mgr-settings-field">
              <label>Bathrooms Count</label>
              <input
                type="number"
                min="1"
                max="10"
                value={bathrooms}
                onChange={(e) => setBathrooms(e.target.value)}
                className="mgr-settings-input"
              />
            </div>
          </div>

          <div className="mgr-form-row">
            <div className="mgr-settings-field">
              <label>Total Physical Units to Allocate *</label>
              <input
                type="number"
                min="1"
                max="50"
                value={totalUnits}
                onChange={(e) => setTotalUnits(e.target.value)}
                className="mgr-settings-input"
                required
              />
              <span style={{ fontSize: '11px', color: '#64746b' }}>
                Allocates distinct physical unit records in database
              </span>
            </div>
            <div className="mgr-settings-field">
              <label>Unit Identifier Prefix</label>
              <input
                type="text"
                placeholder="e.g. VIP-, COT-, RM-"
                value={roomPrefix}
                onChange={(e) => setRoomPrefix(e.target.value)}
                className="mgr-settings-input"
              />
            </div>
          </div>

          <div className="mgr-settings-field">
            <label>Category-Specific Amenities (Comma-separated)</label>
            <input
              type="text"
              placeholder="e.g. King Bed, River View Balcony, Work Desk, Mini Bar, En-suite Jacuzzi"
              value={amenitiesInput}
              onChange={(e) => setAmenitiesInput(e.target.value)}
              className="mgr-settings-input"
            />
          </div>

          <div className="mgr-settings-field">
            <label>Primary Photo URL</label>
            <input
              type="text"
              placeholder="/images/room-deluxe.jpg"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              className="mgr-settings-input"
            />
          </div>

          <div className="mgr-settings-field">
            <label>Description & Ambiance</label>
            <textarea
              rows={2}
              placeholder="Describe this room tier's comfort, view, and unique guest experience..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mgr-settings-input"
              style={{ padding: '8px 12px' }}
            />
          </div>

          <div className="mgr-modal-actions">
            <button type="button" className="mgr-cancel-btn" onClick={onClose} disabled={isSaving}>
              Cancel
            </button>
            <button type="submit" className="mgr-save-btn" disabled={isSaving}>
              {isSaving ? <Loader2 size={15} className="mgr-spin" /> : <CheckCircle2 size={15} />}
              <span>{category ? 'Save Category Changes' : 'Create Category & Allocate Units'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// ROOMS SECTION (CATEGORIES & PHYSICAL UNITS INVENTORY)
// ══════════════════════════════════════════════════════════════
function RoomsSection({
  hotel,
  rooms = [],
  categories = [],
  reservations = [],
  onAddRoom,
  onUpdateRoom,
  onDeleteRoom,
  onSaveCategory,
  onSyncCategoryRooms,
  initialStatusFilter = 'all',
}) {
  const [subTab, setSubTab] = useState('categories'); // 'categories' or 'units'
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedCategoryForEdit, setSelectedCategoryForEdit] = useState(null);
  const [selectedRoomForEdit, setSelectedRoomForEdit] = useState(null);
  const [quickDeleteRoom, setQuickDeleteRoom] = useState(null);
  const [roomFilter, setRoomFilter] = useState(initialStatusFilter);

  const roomHasActiveBookings = (roomNumber) => {
    return (reservations || []).some((r) => {
      const rNum = String(r.room || '').replace(/^Room\s*/i, '').trim();
      return rNum === String(roomNumber).trim() && (r.status === 'confirmed' || r.status === 'checked_in');
    });
  };

  useEffect(() => {
    if (initialStatusFilter) {
      setRoomFilter(initialStatusFilter);
    }
  }, [initialStatusFilter]);

  const SC_CLS = {
    available: 'mgr-room-status--available',
    occupied: 'mgr-room-status--occupied',
    reserved: 'mgr-room-status--reserved',
    maintenance: 'mgr-room-status--maintenance',
  };

  const filteredRooms = useMemo(() => {
    if (!roomFilter || roomFilter === 'all') return rooms;
    return rooms.filter((r) => r.status === roomFilter);
  }, [rooms, roomFilter]);

  const grouped = filteredRooms.reduce((acc, r) => {
    const tier = r.tier || 'Standard Room';
    if (!acc[tier]) acc[tier] = [];
    acc[tier].push(r);
    return acc;
  }, {});

  return (
    <div className="mgr-section">
      <div className="mgr-section-head">
        <div>
          <h2 className="mgr-section-head__title">Room Categories & Inventory</h2>
          <p className="mgr-section-head__sub">
            Configure flexible room tiers, pricing, photos, and authoritative physical room assignments.
          </p>
        </div>

        <div className="mgr-room-head-actions">
          {subTab === 'categories' ? (
            <button
              type="button"
              className="mgr-add-room-btn"
              onClick={() => { setSelectedCategoryForEdit(null); setShowCategoryModal(true); }}
            >
              <Plus size={15} /> Add Custom Category
            </button>
          ) : (
            <button
              type="button"
              className="mgr-add-room-btn"
              onClick={() => setShowAddRoomModal(true)}
              id="btn-open-add-room"
            >
              <Plus size={15} /> Add Single Room
            </button>
          )}
        </div>
      </div>

      {/* Subtab Toggle Buttons */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid #e2e8e5', paddingBottom: '12px' }}>
        <button
          type="button"
          className={`mgr-filter-pill ${subTab === 'categories' ? 'mgr-filter-pill--active' : ''}`}
          onClick={() => setSubTab('categories')}
          style={{ padding: '8px 18px', fontSize: '13.5px', fontWeight: '600' }}
        >
          <span>Room Categories &amp; Pricing</span>
          <span className="mgr-filter-pill__count">{categories.length}</span>
        </button>
        <button
          type="button"
          className={`mgr-filter-pill ${subTab === 'units' ? 'mgr-filter-pill--active' : ''}`}
          onClick={() => setSubTab('units')}
          style={{ padding: '8px 18px', fontSize: '13.5px', fontWeight: '600' }}
        >
          <span>Physical Room Units</span>
          <span className="mgr-filter-pill__count">{rooms.length}</span>
        </button>
      </div>

      {/* Notice Banner */}
      <div style={{ background: '#f8faf9', border: '1px solid #d4e7dc', borderRadius: '10px', padding: '10px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12.5px', color: '#2d4538' }}>
        <ShieldCheck size={16} color="#174b2f" />
        <span>
          <strong>Authoritative Inventory System:</strong> Price updates apply to future reservations and do not alter past contractual bookings. Room assignments are locked at the database level to prevent double-bookings.
        </span>
      </div>

      {/* ── Subtab 1: Categories View ── */}
      {subTab === 'categories' && (
        <div className="mgr-categories-view">
          {categories.length === 0 ? (
            <div className="mgr-empty">
              <Layers size={36} strokeWidth={1.5} />
              <p>No room categories defined for this property yet.</p>
              <button
                type="button"
                className="mgr-add-room-btn"
                style={{ marginTop: '12px' }}
                onClick={() => { setSelectedCategoryForEdit(null); setShowCategoryModal(true); }}
              >
                <Plus size={15} /> Create First Room Category
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '18px' }}>
              {categories.map((cat) => {
                const assignedRooms = rooms.filter(
                  (r) => r.categoryId === cat.id || (r.tier && r.tier.toLowerCase() === cat.name.toLowerCase())
                );

                return (
                  <div
                    key={cat.id || cat.slug}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8e5',
                      borderRadius: '14px',
                      overflow: 'hidden',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    <div style={{ position: 'relative', height: '160px', background: '#e8eeea' }}>
                      <img
                        src={(cat.photos && cat.photos[0]) || '/images/room-deluxe.jpg'}
                        alt={cat.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <span
                        style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          background: 'rgba(23, 75, 47, 0.9)',
                          color: '#ffffff',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '11.5px',
                          fontWeight: '700',
                        }}
                      >
                        {fmtNGN(cat.baseRateNightly)} / night
                      </span>
                    </div>

                    <div style={{ padding: '18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <h4 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#19241e' }}>
                          {cat.name}
                        </h4>
                        <span style={{ fontSize: '11px', color: '#64746b', background: '#f0f4f2', padding: '3px 8px', borderRadius: '4px' }}>
                          {cat.roomSize || 'Standard Size'}
                        </span>
                      </div>

                      <p style={{ fontSize: '13px', color: '#526259', margin: '0 0 14px 0', lineHeight: '1.45' }}>
                        {cat.description || 'Thoughtfully appointed room with tailored amenities.'}
                      </p>

                      <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#374151', marginBottom: '14px', flexWrap: 'wrap' }}>
                        <span>👤 {cat.capacity || `Up to ${cat.maxGuests || 2} guests`}</span>
                        <span>🛏️ {cat.bedroomsCount || 1} Bed</span>
                        <span>🚿 {cat.bathroomsCount || 1} Bath</span>
                      </div>

                      {/* Amenities Pills */}
                      {cat.amenities && cat.amenities.length > 0 && (
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
                          {cat.amenities.slice(0, 4).map((am) => (
                            <span key={am} style={{ fontSize: '11px', background: '#f4f7f5', color: '#273931', padding: '3px 8px', borderRadius: '4px' }}>
                              {am}
                            </span>
                          ))}
                          {cat.amenities.length > 4 && (
                            <span style={{ fontSize: '11px', color: '#88988f', padding: '3px 4px' }}>
                              +{cat.amenities.length - 4} more
                            </span>
                          )}
                        </div>
                      )}

                      {/* Physical Units Badge */}
                      <div style={{ background: '#f0f7f3', border: '1px solid #d4e7dc', borderRadius: '8px', padding: '10px 12px', marginBottom: '16px', fontSize: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <strong>Physical Inventory Units:</strong>
                          <span style={{ color: '#174b2f', fontWeight: '700' }}>{assignedRooms.length} Active</span>
                        </div>
                        <div style={{ color: '#4d6356' }}>
                          {assignedRooms.length > 0 ? (
                            <span>Assigned: {assignedRooms.map((r) => r.number).join(', ')}</span>
                          ) : (
                            <span style={{ color: '#b45309' }}>No physical units yet assigned to this category.</span>
                          )}
                        </div>
                      </div>

                      <div style={{ marginTop: 'auto', display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          className="mgr-action-btn"
                          style={{ flex: 1, padding: '8px 12px', fontSize: '12.5px' }}
                          onClick={() => { setSelectedCategoryForEdit(cat); setShowCategoryModal(true); }}
                        >
                          <Edit3 size={13} /> Edit Category
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Subtab 2: Physical Units View ── */}
      {subTab === 'units' && (
        <div className="mgr-units-view">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div className="mgr-section-head__stats">
              <span className="mgr-section-head__stat mgr-section-head__stat--green">
                {rooms.filter((r) => r.status === 'available').length} available
              </span>
              <span className="mgr-section-head__stat mgr-section-head__stat--emerald">
                {rooms.filter((r) => r.status === 'occupied').length} occupied
              </span>
              <span className="mgr-section-head__stat">
                {rooms.filter((r) => r.status === 'maintenance').length} maintenance
              </span>
            </div>

            <div className="mgr-table-filter">
              <SlidersHorizontal size={14} />
              <select
                id="mgr-room-status-filter"
                value={roomFilter}
                onChange={(e) => setRoomFilter(e.target.value)}
              >
                <option value="all">All Rooms ({rooms.length})</option>
                <option value="available">Available ({rooms.filter((r) => r.status === 'available').length})</option>
                <option value="occupied">Occupied ({rooms.filter((r) => r.status === 'occupied').length})</option>
                <option value="reserved">Reserved ({rooms.filter((r) => r.status === 'reserved').length})</option>
                <option value="maintenance">Maintenance ({rooms.filter((r) => r.status === 'maintenance').length})</option>
              </select>
            </div>
          </div>

          {rooms.length === 0 ? (
            <div className="mgr-empty">
              <BedDouble size={36} strokeWidth={1.5} />
              <p>No physical rooms currently in inventory.</p>
              <button
                type="button"
                className="mgr-add-room-btn"
                style={{ marginTop: '12px' }}
                onClick={() => setShowAddRoomModal(true)}
              >
                <Plus size={15} /> Add Your First Room
              </button>
            </div>
          ) : (
            Object.entries(grouped).map(([tier, tierRooms]) => (
              <div key={tier} className="mgr-room-group">
                <div className="mgr-room-group__header">
                  <h4 className="mgr-room-group__title">{tier}</h4>
                  <span className="mgr-room-group__count">
                    {tierRooms.length} {tierRooms.length === 1 ? 'room' : 'rooms'}
                  </span>
                </div>
                <div className="mgr-room-grid">
                  {tierRooms.map((room) => (
                    <div key={room.number} className={`mgr-room-card${!room.isActive ? ' mgr-room-card--inactive' : ''}`}>
                      <div className="mgr-room-card__header">
                        <div>
                          <span className="mgr-room-card__number">Room {room.number}</span>
                          <span className="mgr-room-card__floor">Floor {room.floor}</span>
                        </div>
                        <span className={`mgr-room-status ${SC_CLS[room.status] || ''}`}>
                          {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
                        </span>
                      </div>

                      <div className="mgr-room-card__body">
                        <div className="mgr-room-card__price">
                          {fmtNGN(room.pricePerNight)}<span>/night</span>
                        </div>
                        <div className="mgr-room-card__specs">
                          {room.bed || 'King bed'} · {room.capacity || 'Up to 2 guests'}
                        </div>
                        <div className="mgr-room-card__meta">
                          Cleaned: {fmtDate(room.lastCleaned)}
                        </div>
                        <div className="mgr-room-card__actions">
                          <button
                            type="button"
                            className="mgr-room-edit-btn"
                            onClick={() => setSelectedRoomForEdit(room)}
                            id={`edit-room-${room.number}`}
                          >
                            <Edit3 size={13} /> Edit
                          </button>
                          {roomHasActiveBookings(room.number) ? (
                            <button
                              type="button"
                              className="mgr-room-delete-btn"
                              title="Cannot delete room with active or upcoming reservations"
                              onClick={() => alert(`Cannot delete Room ${room.number}: this room currently has pending or checked-in reservations.`)}
                              id={`delete-room-${room.number}`}
                              style={{ opacity: 0.45, cursor: 'not-allowed', color: '#dc2626' }}
                            >
                              <Lock size={13} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="mgr-room-delete-btn"
                              title={`Remove Room ${room.number}`}
                              onClick={() => setQuickDeleteRoom(room)}
                              id={`delete-room-${room.number}`}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Category Creation / Edit Modal */}
      <CategoryModal
        category={selectedCategoryForEdit}
        isOpen={showCategoryModal}
        onClose={() => { setShowCategoryModal(false); setSelectedCategoryForEdit(null); }}
        onSave={onSaveCategory}
      />

      {/* Add Single Room Modal */}
      <AddRoomModal
        isOpen={showAddRoomModal}
        onClose={() => setShowAddRoomModal(false)}
        onAdd={onAddRoom}
        existingRooms={rooms}
      />

      {/* Edit Room Modal */}
      <EditRoomModal
        room={selectedRoomForEdit}
        isOpen={Boolean(selectedRoomForEdit)}
        onClose={() => setSelectedRoomForEdit(null)}
        onSave={onUpdateRoom}
        onDelete={onDeleteRoom}
        hasActiveBookings={selectedRoomForEdit ? roomHasActiveBookings(selectedRoomForEdit.number) : false}
      />

      {/* Quick Delete Confirmation Modal */}
      {quickDeleteRoom && (
        <div className="mgr-modal-backdrop" onClick={() => setQuickDeleteRoom(null)}>
          <div className="mgr-modal-card mgr-modal-card--sm" onClick={e => e.stopPropagation()}>
            <div className="mgr-modal-header">
              <h3 className="mgr-modal-title">Delete Room {quickDeleteRoom.number}?</h3>
              <button type="button" className="mgr-modal-close" onClick={() => setQuickDeleteRoom(null)}><X size={18} /></button>
            </div>
            <div className="mgr-modal-body">
              <p style={{ fontSize: '14px', color: '#475569', marginBottom: '18px', lineHeight: '1.5' }}>
                Remove <strong>Room {quickDeleteRoom.number}</strong> ({quickDeleteRoom.tier}) from inventory? This will update public hotel availability immediately.
              </p>
              <div className="mgr-modal-actions">
                <button type="button" className="mgr-cancel-btn" onClick={() => setQuickDeleteRoom(null)}>Cancel</button>
                <button
                  type="button"
                  className="mgr-danger-delete-btn"
                  onClick={() => {
                    onDeleteRoom(quickDeleteRoom.number);
                    setQuickDeleteRoom(null);
                  }}
                  id="btn-confirm-quick-delete"
                >
                  <Trash2 size={14} /> Remove Room
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// REPORTS
// ══════════════════════════════════════════════════════════════
function ReportsSection({ reservations, rooms }) {
  const totalRev     = reservations.filter(r => r.status !== 'cancelled').reduce((s, r) => s + (r.total || 0), 0);
  const confirmedRev = reservations.filter(r => r.status === 'confirmed' || r.status === 'checked_in').reduce((s, r) => s + (r.total || 0), 0);
  const completedRev = reservations.filter(r => r.status === 'checked_out').reduce((s, r) => s + (r.total || 0), 0);
  const totalActive  = rooms.filter(r => r.isActive).length;
  const occupied     = rooms.filter(r => r.status === 'occupied' || r.status === 'reserved').length;
  const occupancy    = totalActive > 0 ? Math.round((occupied / totalActive) * 100) : 0;

  return (
    <div className="mgr-section">
      <div className="mgr-section-head">
        <div>
          <h2 className="mgr-section-head__title">Revenue & Reports</h2>
          <p className="mgr-section-head__sub">Occupancy trends and financial breakdown for this property.</p>
        </div>
      </div>
      <div className="mgr-report-cards">
        <div className="mgr-report-card"><BarChart3 size={20} className="mgr-report-card__icon" /><span className="mgr-report-card__label">Total Revenue (Active)</span><span className="mgr-report-card__value">{fmtNGN(totalRev)}</span></div>
        <div className="mgr-report-card"><CalendarCheck size={20} className="mgr-report-card__icon" /><span className="mgr-report-card__label">Upcoming (Confirmed)</span><span className="mgr-report-card__value">{fmtNGN(confirmedRev)}</span></div>
        <div className="mgr-report-card"><CheckCircle2 size={20} className="mgr-report-card__icon" /><span className="mgr-report-card__label">Collected (Checked Out)</span><span className="mgr-report-card__value">{fmtNGN(completedRev)}</span></div>
        <div className="mgr-report-card"><TrendingUp size={20} className="mgr-report-card__icon" /><span className="mgr-report-card__label">Current Occupancy</span><span className="mgr-report-card__value">{occupancy}%</span></div>
      </div>
      <div className="mgr-chart-card mgr-chart-card--full">
        <div className="mgr-chart-card__header">
          <div>
            <h3 className="mgr-chart-card__title">Monthly Occupancy Trend</h3>
            <p className="mgr-chart-card__subtitle">6-month room fill rate overview</p>
          </div>
          <span className="mgr-chart-card__badge">May \u2013 Oct 2026</span>
        </div>
        <div className="mgr-chart mgr-chart--tall">
          {MONTHLY_OCCUPANCY.map((d, i) => (
            <div key={i} className="mgr-chart__col">
              <div className="mgr-chart__bar-wrap">
                <div className="mgr-chart__bar" style={{ height: `${d.rate}%` }} title={`${d.month}: ${d.rate}%`}>
                  <span className="mgr-chart__bar-label">{d.rate}%</span>
                </div>
              </div>
              <span className="mgr-chart__month">{d.month}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mgr-report-breakdown">
        <h3 className="mgr-report-breakdown__title">Booking Status Breakdown</h3>
        <div className="mgr-report-breakdown__grid">
          {[
            { label: 'Confirmed', status: 'confirmed', cls: 'confirmed' },
            { label: 'Checked In', status: 'checked_in', cls: 'checked-in' },
            { label: 'Checked Out', status: 'checked_out', cls: 'checked-out' },
            { label: 'Cancelled', status: 'cancelled', cls: 'cancelled' },
          ].map(({ label, status, cls }) => {
            const count = reservations.filter(r => r.status === status).length;
            const rev   = reservations.filter(r => r.status === status).reduce((s, r) => s + (r.total || 0), 0);
            return (
              <div key={status} className="mgr-report-row">
                <span className={`mgr-status-badge mgr-status-badge--${cls}`}>{label}</span>
                <span className="mgr-report-row__count">{count} booking{count !== 1 ? 's' : ''}</span>
                <span className="mgr-report-row__rev">{fmtNGN(rev)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// NOTIFICATIONS
// ══════════════════════════════════════════════════════════════
function NotificationsSection({ notifications, unreadCount, markAllAsRead, clearNotification }) {
  return (
    <div className="mgr-section">
      <div className="mgr-section-head">
        <div>
          <h2 className="mgr-section-head__title">Notifications</h2>
          <p className="mgr-section-head__sub">Reservation alerts, check-in pings, and property updates.</p>
        </div>
        {unreadCount > 0 && (
          <button className="mgr-mark-read-btn" onClick={markAllAsRead}><CheckSquare size={15} /> Mark all as read</button>
        )}
      </div>
      {notifications.length === 0 ? (
        <div className="mgr-empty"><Bell size={36} strokeWidth={1.5} /><p>No notifications yet. New reservations and activity will appear here.</p></div>
      ) : (
        <div className="mgr-notif-list">
          {notifications.map(n => (
            <div key={n.id} className={`mgr-notif-item${!n.read ? ' mgr-notif-item--unread' : ''}`}>
              <div className="mgr-notif-item__icon"><Bell size={16} /></div>
              <div className="mgr-notif-item__body">
                <p className="mgr-notif-item__title">{n.title}</p>
                <p className="mgr-notif-item__msg">{n.message}</p>
                <span className="mgr-notif-item__time">{n.timestamp}</span>
              </div>
              {!n.read && <div className="mgr-notif-item__dot" />}
              <button className="mgr-notif-item__dismiss" onClick={() => clearNotification(n.id)}><X size={14} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// SETTINGS SECTION
// ══════════════════════════════════════════════════════════════
function SettingsSection({ hotel, hotelSettings, onSave, onToggleDelist, onDeleteHotel, onRestoreHotel }) {
  const [local, setLocal] = useState(() => JSON.parse(JSON.stringify(hotelSettings)));
  const [saved, setSaved] = useState(() => JSON.parse(JSON.stringify(hotelSettings)));
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newAmenityName, setNewAmenityName] = useState('');
  const [newAmenityIcon, setNewAmenityIcon] = useState('sparkles');
  const [newAmenityEnabled, setNewAmenityEnabled] = useState(true);
  const [addError, setAddError] = useState('');

  useEffect(() => {
    setLocal(JSON.parse(JSON.stringify(hotelSettings)));
    setSaved(JSON.parse(JSON.stringify(hotelSettings)));
  }, [hotelSettings]);

  const isDirty = useMemo(() => {
    return JSON.stringify(local) !== JSON.stringify(saved);
  }, [local, saved]);

  const handleReset = () => {
    setLocal(JSON.parse(JSON.stringify(saved)));
    setToast(null);
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      onSave(local);
      setSaved(JSON.parse(JSON.stringify(local)));
      setIsSaving(false);
      setToast('Hotel settings & amenities updated successfully.');
      setTimeout(() => {
        setToast(null);
      }, 4000);
    }, 450);
  };

  const toggleAmenity = (id) => {
    setLocal(prev => ({
      ...prev,
      amenitiesList: prev.amenitiesList.map(item =>
        item.id === id ? { ...item, enabled: !item.enabled } : item
      ),
    }));
  };

  const deleteAmenity = (id) => {
    const target = local.amenitiesList.find(item => item.id === id);
    setLocal(prev => ({
      ...prev,
      amenitiesList: prev.amenitiesList.filter(item => item.id !== id),
    }));
    if (target) {
      setToast(`Removed "${target.name}". Click "Save Changes" to apply.`);
      setTimeout(() => setToast(null), 3500);
    }
  };

  const handleRestoreDefaults = () => {
    setLocal(prev => {
      // Find default amenities not currently in the list
      const missingDefaults = DEFAULT_AMENITIES_LIST.filter(
        d => !prev.amenitiesList.some(item => item.id === d.id)
      );
      return {
        ...prev,
        amenitiesList: [...prev.amenitiesList, ...missingDefaults],
      };
    });
    setToast('Default amenities restored. Click "Save Changes" to apply.');
    setTimeout(() => setToast(null), 3500);
  };

  const handleAddAmenity = (e) => {
    e?.preventDefault();
    const trimmed = newAmenityName.trim();
    if (!trimmed) {
      setAddError('Please enter an amenity name.');
      return;
    }
    const slug = 'custom_' + trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '_') + '_' + Date.now().toString().slice(-4);
    const newObj = {
      id: slug,
      name: trimmed,
      icon: newAmenityIcon || 'star',
      enabled: newAmenityEnabled,
      isCustom: true,
    };
    setLocal(prev => ({
      ...prev,
      amenitiesList: [...prev.amenitiesList, newObj],
    }));
    setNewAmenityName('');
    setNewAmenityIcon('sparkles');
    setNewAmenityEnabled(true);
    setAddError('');
    setShowAddModal(false);
  };

  return (
    <div className="mgr-section">
      <div className="mgr-section-head">
        <div>
          <h2 className="mgr-section-head__title">Hotel Settings</h2>
          <p className="mgr-section-head__sub">
            Manage property contact information, check-in policies, and guest amenities in real time.
          </p>
        </div>
        <div className="mgr-head-actions">
          <button
            type="button"
            className="mgr-discard-btn"
            onClick={handleReset}
            disabled={!isDirty || isSaving}
            id="mgr-discard-settings"
          >
            <RotateCcw size={14} /> Discard / Reset
          </button>
          <button
            type="button"
            className="mgr-save-btn"
            onClick={handleSave}
            disabled={isSaving}
            id="mgr-save-settings"
          >
            {isSaving ? (
              <>
                <Loader2 size={15} className="mgr-spin" /> Saving...
              </>
            ) : (
              <>
                <CheckCircle2 size={15} /> Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {toast && (
        <div className="mgr-toast mgr-toast--success">
          <CheckCircle2 size={18} />
          <span>{toast}</span>
          <button type="button" className="mgr-toast__close" onClick={() => setToast(null)}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Property Information Card */}
      <div className="mgr-settings-card">
        <h4 className="mgr-settings-card__title">
          <Building2 size={16} /> Property Information
        </h4>
        <div className="mgr-settings-grid">
          <div className="mgr-settings-field">
            <label>Property Name</label>
            <input type="text" value={hotel.name} readOnly className="mgr-settings-input mgr-settings-input--readonly" />
          </div>
          <div className="mgr-settings-field">
            <label>Address</label>
            <input type="text" value={hotel.address || hotel.location} readOnly className="mgr-settings-input mgr-settings-input--readonly" />
          </div>
          <div className="mgr-settings-field">
            <label><Phone size={13} /> Contact Phone</label>
            <input
              id="settings-phone"
              type="text"
              value={local.contactPhone}
              onChange={e => setLocal(p => ({ ...p, contactPhone: e.target.value }))}
              className="mgr-settings-input"
            />
          </div>
          <div className="mgr-settings-field">
            <label><Mail size={13} /> Contact Email</label>
            <input
              id="settings-email"
              type="email"
              value={local.contactEmail}
              onChange={e => setLocal(p => ({ ...p, contactEmail: e.target.value }))}
              className="mgr-settings-input"
            />
          </div>
          <div className="mgr-settings-field">
            <label><Globe size={13} /> Website</label>
            <input
              id="settings-website"
              type="text"
              value={local.website}
              onChange={e => setLocal(p => ({ ...p, website: e.target.value }))}
              className="mgr-settings-input"
            />
          </div>
        </div>
      </div>

      {/* Check-in / Check-out Policies Card */}
      <div className="mgr-settings-card">
        <h4 className="mgr-settings-card__title">
          <Shield size={16} /> Check-in / Check-out Policies
        </h4>
        <div className="mgr-settings-grid">
          <div className="mgr-settings-field">
            <label><Clock size={13} /> Check-in Time</label>
            <input
              id="settings-checkin"
              type="text"
              placeholder="e.g. 2:00 PM"
              value={local.checkInTime}
              onChange={e => setLocal(p => ({ ...p, checkInTime: e.target.value }))}
              className="mgr-settings-input"
            />
          </div>
          <div className="mgr-settings-field">
            <label><Clock size={13} /> Check-out Time</label>
            <input
              id="settings-checkout"
              type="text"
              placeholder="e.g. 11:00 AM"
              value={local.checkOutTime}
              onChange={e => setLocal(p => ({ ...p, checkOutTime: e.target.value }))}
              className="mgr-settings-input"
            />
          </div>
          <div className="mgr-settings-field mgr-settings-field--full">
            <label>Arrival Policy</label>
            <textarea
              id="settings-arrival-policy"
              value={local.arrivalPolicy}
              onChange={e => setLocal(p => ({ ...p, arrivalPolicy: e.target.value }))}
              className="mgr-settings-textarea"
              rows={3}
            />
          </div>
          <div className="mgr-settings-field mgr-settings-field--full">
            <label>Cancellation Policy</label>
            <textarea
              id="settings-cancel-policy"
              value={local.cancellationPolicy}
              onChange={e => setLocal(p => ({ ...p, cancellationPolicy: e.target.value }))}
              className="mgr-settings-textarea"
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* Amenities Management Card */}
      <div className="mgr-settings-card">
        <div className="mgr-settings-card__header-row">
          <div>
            <h4 className="mgr-settings-card__title"><Star size={16} /> Amenities Management</h4>
            <p className="mgr-settings-card__subtitle">
              Click any amenity card to toggle it ON or OFF. Click the trash icon to delete an amenity.
            </p>
          </div>
          <div className="mgr-amenity-actions">
            {DEFAULT_AMENITIES_LIST.some(d => !local.amenitiesList.some(item => item.id === d.id)) && (
              <button
                type="button"
                className="mgr-restore-amenities-btn"
                onClick={handleRestoreDefaults}
                title="Restore default hotel amenities"
                id="btn-restore-amenities"
              >
                <RotateCcw size={13} /> Restore Defaults
              </button>
            )}
            <button
              type="button"
              className="mgr-add-amenity-btn"
              onClick={() => setShowAddModal(true)}
              id="btn-add-amenity"
            >
              <Plus size={15} /> Add Amenity
            </button>
          </div>
        </div>

        {local.amenitiesList.length === 0 ? (
          <div className="mgr-amenities-empty">
            <Star size={24} />
            <p>No amenities are currently listed for this property.</p>
            <button
              type="button"
              className="mgr-restore-amenities-btn"
              onClick={handleRestoreDefaults}
            >
              <RotateCcw size={13} /> Restore Default Amenities
            </button>
          </div>
        ) : (
          <div className="mgr-amenities-grid">
            {local.amenitiesList.map(item => {
              const IconComp = AMENITY_ICON_COMPONENTS[item.icon?.toLowerCase()] || Star;
              return (
                <div
                  key={item.id}
                  className={`mgr-amenity-card ${item.enabled ? 'mgr-amenity-card--on' : 'mgr-amenity-card--off'}`}
                  onClick={() => toggleAmenity(item.id)}
                  id={`amenity-card-${item.id}`}
                  role="button"
                  tabIndex={0}
                  title={item.enabled ? 'Click to toggle OFF' : 'Click to toggle ON'}
                >
                  <div className="mgr-amenity-card__left">
                    <div className="mgr-amenity-card__icon-wrap">
                      <IconComp size={17} />
                    </div>
                    <div className="mgr-amenity-card__info">
                      <span className="mgr-amenity-card__name">{item.name}</span>
                      {item.isCustom && <span className="mgr-amenity-card__tag">Custom</span>}
                    </div>
                  </div>
                  <div className="mgr-amenity-card__right">
                    <span className={`mgr-amenity-pill ${item.enabled ? 'mgr-amenity-pill--on' : 'mgr-amenity-pill--off'}`}>
                      {item.enabled ? 'ON' : 'OFF'}
                    </span>
                    <button
                      type="button"
                      className="mgr-amenity-delete-btn"
                      title={`Delete "${item.name}"`}
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteAmenity(item.id);
                      }}
                      id={`delete-amenity-${item.id}`}
                      aria-label={`Delete ${item.name}`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Danger Zone Card */}
      <div className="mgr-settings-card mgr-settings-card--danger">
        <div className="mgr-danger-card__header">
          <div className="mgr-danger-icon-wrap">
            <AlertTriangle size={18} />
          </div>
          <div>
            <h4 className="mgr-settings-card__title mgr-text-danger">Danger Zone</h4>
            <p className="mgr-settings-card__subtitle">
              Manage property visibility or permanently remove this hotel listing from Lodgekeys.
            </p>
          </div>
        </div>

        {/* Option A: De-list Property (Pause Bookings) */}
        <div className="mgr-danger-item">
          <div className="mgr-danger-item__info">
            <div className="mgr-danger-item__title-row">
              <span className="mgr-danger-item__title">De-list Property (Pause Bookings)</span>
              <span className={`mgr-status-badge ${hotel.isDelisted ? 'mgr-status-badge--cancelled' : 'mgr-status-badge--confirmed'}`}>
                {hotel.isDelisted ? 'De-listed · Bookings Paused' : 'Live on Public Explore'}
              </span>
            </div>
            <p className="mgr-danger-item__desc">
              Temporarily hides the hotel from the public Explore page and stops incoming reservations without deleting records.
            </p>
          </div>
          <button
            type="button"
            className={`mgr-delist-toggle-btn ${hotel.isDelisted ? 'mgr-delist-toggle-btn--relist' : 'mgr-delist-toggle-btn--delist'}`}
            onClick={() => onToggleDelist(!hotel.isDelisted)}
            id="btn-toggle-delist"
          >
            {hotel.isDelisted ? (
              <>
                <CheckCircle2 size={14} /> Re-list Property
              </>
            ) : (
              <>
                <EyeOff size={14} /> Pause &amp; De-list
              </>
            )}
          </button>
        </div>

        {/* Option B: Delete Property Listing */}
        <div className="mgr-danger-item mgr-danger-item--delete">
          <div className="mgr-danger-item__info">
            <span className="mgr-danger-item__title mgr-text-danger">Delete Property Listing</span>
            <p className="mgr-danger-item__desc">
              Permanently remove this hotel from the master store. This will erase the hotel overview, room inventory, customer booking page, and public search results.
            </p>
          </div>
          <button
            type="button"
            className="mgr-delete-hotel-btn"
            onClick={() => setShowDeleteModal(true)}
            id="btn-open-delete-hotel"
          >
            <Trash2 size={14} /> Delete Hotel from Lodgekeys
          </button>
        </div>
      </div>

      {/* Delete Hotel Confirmation Modal */}
      <DeleteHotelModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={onDeleteHotel}
        hotelName={hotel.name}
      />

      {/* Add Custom Amenity Modal */}
      {showAddModal && (
        <div className="mgr-modal-backdrop" onClick={() => setShowAddModal(false)}>
          <div className="mgr-modal-card" onClick={e => e.stopPropagation()}>
            <div className="mgr-modal-header">
              <h3 className="mgr-modal-title">Add New Amenity</h3>
              <button
                type="button"
                className="mgr-modal-close"
                onClick={() => setShowAddModal(false)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddAmenity} className="mgr-modal-body">
              <div className="mgr-modal-field">
                <label>Amenity Name *</label>
                <input
                  type="text"
                  className="mgr-settings-input"
                  placeholder="e.g. 24/7 Solar Power, Tennis Court, Airport Shuttle, Gym..."
                  value={newAmenityName}
                  onChange={e => { setNewAmenityName(e.target.value); setAddError(''); }}
                  autoFocus
                />
                {addError && <span className="mgr-field-error">{addError}</span>}
              </div>

              <div className="mgr-modal-field">
                <label>Choose Icon</label>
                <div className="mgr-icon-picker-grid">
                  {ICON_PICKER_OPTIONS.map(opt => {
                    const IconComp = opt.icon;
                    const isSel = newAmenityIcon === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        className={`mgr-icon-picker-item ${isSel ? 'mgr-icon-picker-item--selected' : ''}`}
                        onClick={() => setNewAmenityIcon(opt.id)}
                        title={opt.label}
                      >
                        <IconComp size={18} />
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mgr-modal-field">
                <label>Initial Status</label>
                <div className="mgr-status-switch">
                  <button
                    type="button"
                    className={`mgr-status-opt ${newAmenityEnabled ? 'mgr-status-opt--on' : ''}`}
                    onClick={() => setNewAmenityEnabled(true)}
                  >
                    <CheckCircle2 size={14} /> ON (Active)
                  </button>
                  <button
                    type="button"
                    className={`mgr-status-opt ${!newAmenityEnabled ? 'mgr-status-opt--off' : ''}`}
                    onClick={() => setNewAmenityEnabled(false)}
                  >
                    <XCircle size={14} /> OFF (Inactive)
                  </button>
                </div>
              </div>

              <div className="mgr-modal-actions">
                <button
                  type="button"
                  className="mgr-cancel-btn"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="mgr-save-btn">
                  <Plus size={15} /> Add to Amenities
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sticky Bottom Action Bar when isDirty */}
      {isDirty && (
        <div className="mgr-sticky-bar">
          <div className="mgr-sticky-bar__inner">
            <div className="mgr-sticky-bar__status">
              <span className="mgr-sticky-bar__dot" />
              <span>You have unsaved changes to property policies &amp; amenities.</span>
            </div>
            <div className="mgr-sticky-bar__actions">
              <button
                type="button"
                className="mgr-sticky-bar__discard"
                onClick={handleReset}
                disabled={isSaving}
              >
                <RotateCcw size={13} /> Discard
              </button>
              <button
                type="button"
                className="mgr-sticky-bar__save"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? <Loader2 size={15} className="mgr-spin" /> : <CheckCircle2 size={15} />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// DELETE HOTEL CONFIRMATION MODAL
// ══════════════════════════════════════════════════════════════
function DeleteHotelModal({ isOpen, onClose, onConfirm, hotelName }) {
  const [confirmText, setConfirmText] = useState('');

  if (!isOpen) return null;

  const isConfirmed = confirmText.trim() === 'DELETE';

  return (
    <div className="mgr-modal-backdrop" onClick={onClose}>
      <div className="mgr-modal-card mgr-modal-card--danger" onClick={e => e.stopPropagation()}>
        <div className="mgr-modal-header mgr-modal-header--danger">
          <div className="mgr-danger-modal-icon-wrap">
            <AlertTriangle size={22} />
          </div>
          <div>
            <h3 className="mgr-modal-title mgr-text-danger">Delete Hotel from Lodgekeys</h3>
            <p className="mgr-modal-subtitle">Permanently remove this property listing and inventory.</p>
          </div>
          <button type="button" className="mgr-modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="mgr-modal-body">
          <div className="mgr-danger-notice">
            <p>
              Are you sure you want to permanently remove <strong>{hotelName}</strong>?
              This will erase the hotel overview, rooms inventory, guest view, and public search listing on Lodgekeys.
            </p>
          </div>

          <div className="mgr-settings-field">
            <label className="mgr-confirm-label">
              Type <strong>DELETE</strong> below to confirm permanent removal:
            </label>
            <input
              id="input-delete-confirm"
              type="text"
              placeholder="DELETE"
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              className="mgr-settings-input mgr-settings-input--danger"
              autoFocus
            />
          </div>

          <div className="mgr-modal-actions">
            <button type="button" className="mgr-cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className="mgr-danger-delete-btn"
              disabled={!isConfirmed}
              onClick={() => {
                onConfirm();
                onClose();
              }}
              id="btn-confirm-delete-hotel"
            >
              <Trash2 size={15} /> Permanently Delete Listing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
