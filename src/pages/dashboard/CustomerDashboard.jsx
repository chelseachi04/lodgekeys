import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  LayoutDashboard, CalendarCheck, Heart, Bell, HelpCircle,
  LogOut, ArrowUpRight, KeyRound, ChevronRight, Printer,
  Calendar, MapPin, Users, ArrowRight, Home as HomeIcon,
  User, Mail, Phone, Lock, Trash2, AlertTriangle, CheckCircle2,
  X, ShieldCheck, Star, Menu
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { sampleHotels, useHotels } from '../../data/hotels';
import './CustomerDashboard.css';

// Featured inspiration hotels (first 2 from catalog)
const INSPIRATION_HOTELS = sampleHotels.slice(0, 2);

// Sidebar navigation items
const SIDEBAR_NAV = [
  { id: 'overview',      icon: LayoutDashboard, label: 'Overview' },
  { id: 'bookings',      icon: CalendarCheck,   label: 'My Bookings' },
  { id: 'saved',         icon: Heart,           label: 'Saved Hotels' },
  { id: 'profile',       icon: Users,           label: 'Profile Settings' },
  { id: 'notifications', icon: Bell,            label: 'Notifications', badge: true },
  { id: 'help',          icon: HelpCircle,      label: 'Help & Support' },
];

export default function CustomerDashboard() {
  const {
    currentUser,
    isAuthenticated,
    signOut,
    openAuth,
    updateProfile,
    updatePassword,
    deleteAccount,
    savedHotelIds,
    toggleFavorite,
    removeFavorite,
    isFavorite,
  } = useAuth();

  const { bookings, notifications, unreadCount, markAllAsRead } = useNotifications();
  const navigate = useNavigate();
  const { tab } = useParams();

  // Active section state synced with optional route param
  const [activeSection, setActiveSection] = useState(tab || 'overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Profile editing state
  const [profileName, setProfileName]   = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileFeedback, setProfileFeedback] = useState(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordFeedback, setPasswordFeedback] = useState(null);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Danger zone & account deletion state
  const [showDeleteModal, setShowDeleteModal]     = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting]               = useState(false);

  // Sync route param with active section
  useEffect(() => {
    if (tab && ['overview', 'bookings', 'saved', 'profile', 'notifications', 'help'].includes(tab)) {
      setActiveSection(tab);
    } else if (!tab) {
      setActiveSection('overview');
    }
  }, [tab]);

  // Sync profile fields with currentUser
  useEffect(() => {
    if (currentUser) {
      setProfileName(currentUser.fullName || '');
      setProfileEmail(currentUser.email || '');
      setProfilePhone(currentUser.phone || '');
    }
  }, [currentUser]);

  // Route protection – prompt sign in if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      openAuth('signin');
    }
  }, [isAuthenticated, openAuth]);

  const allHotels = useHotels();

  // Filter master catalog against saved hotel IDs
  const savedHotelsList = useMemo(() => {
    if (!savedHotelIds || savedHotelIds.length === 0) return [];
    return allHotels.filter(hotel =>
      savedHotelIds.some(savedId => String(savedId) === String(hotel.id) || String(savedId) === String(hotel.slug))
    );
  }, [savedHotelIds, allHotels]);

  if (!isAuthenticated || !currentUser) {
    return (
      <div className="dash-gate">
        <div className="dash-gate__inner">
          <KeyRound size={36} strokeWidth={1.5} />
          <h2>Sign in to access your portal</h2>
          <p>Your Customer Portal is protected. Please sign in to continue.</p>
          <button className="dash-gate__btn" onClick={() => openAuth('signin')}>
            Sign In to Lodgekeys
          </button>
        </div>
      </div>
    );
  }

  const handleSectionChange = (sectionId) => {
    setActiveSection(sectionId);
    setMobileMenuOpen(false);
    if (sectionId === 'overview') {
      navigate('/dashboard');
    } else {
      navigate(`/dashboard/${sectionId}`);
    }
  };

  const handleSignOut = () => {
    signOut();
    navigate('/');
  };

  // Merge bookings from context + current user object (deduped by id)
  const userBookings = [
    ...(currentUser.bookings || []),
    ...bookings.filter(b => !currentUser.bookings?.find(ub => ub.id === b.id || (ub.bookingRef && ub.bookingRef === b.id)))
  ];

  // Top metric cards
  const metrics = [
    {
      id: 'bookings',
      label: 'Total Bookings',
      value: userBookings.length,
      icon: CalendarCheck,
      color: '#1a5f3a',
      bg: 'rgba(26,95,58,0.08)',
      targetSection: 'bookings',
    },
    {
      id: 'upcoming',
      label: 'Upcoming Stays',
      value: userBookings.filter(b => b.status !== 'completed').length,
      icon: Calendar,
      color: '#b45309',
      bg: 'rgba(180,83,9,0.08)',
      targetSection: 'bookings',
    },
    {
      id: 'saved',
      label: 'Saved Hotels',
      value: savedHotelsList.length,
      icon: Heart,
      color: '#9d174d',
      bg: 'rgba(157,23,77,0.07)',
      targetSection: 'saved',
    },
    {
      id: 'notifs',
      label: 'Notifications',
      value: unreadCount,
      icon: Bell,
      color: '#1d4ed8',
      bg: 'rgba(29,78,216,0.08)',
      targetSection: 'notifications',
    },
  ];

  // Profile update handler
  const handleUpdateProfile = (e) => {
    e.preventDefault();
    setProfileFeedback(null);

    if (!profileName.trim()) {
      setProfileFeedback({ type: 'error', text: 'Please enter your full name.' });
      return;
    }
    if (!profileEmail.trim() || !profileEmail.includes('@')) {
      setProfileFeedback({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }

    setIsSavingProfile(true);
    const result = updateProfile({
      fullName: profileName.trim(),
      email: profileEmail.trim(),
      phone: profilePhone.trim(),
    });
    setIsSavingProfile(false);

    if (result.success) {
      setProfileFeedback({ type: 'success', text: 'Your personal information has been updated successfully.' });
      setTimeout(() => setProfileFeedback(null), 4000);
    } else {
      setProfileFeedback({ type: 'error', text: result.error || 'Failed to update profile.' });
    }
  };

  // Password change handler
  const handleChangePassword = (e) => {
    e.preventDefault();
    setPasswordFeedback(null);

    if (!currentPassword) {
      setPasswordFeedback({ type: 'error', text: 'Please enter your current password.' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordFeedback({ type: 'error', text: 'New password must be at least 6 characters long.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ type: 'error', text: 'New password and confirmation do not match.' });
      return;
    }

    setIsSavingPassword(true);
    const result = updatePassword(currentPassword, newPassword);
    setIsSavingPassword(false);

    if (result.success) {
      setPasswordFeedback({ type: 'success', text: 'Your password has been changed successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordFeedback(null), 4000);
    } else {
      setPasswordFeedback({ type: 'error', text: result.error || 'Failed to update password.' });
    }
  };

  // Account deletion handler
  const handleConfirmDelete = () => {
    if (!deleteConfirmText.trim()) return;
    setIsDeleting(true);
    const result = deleteAccount(deleteConfirmText);
    if (result && result.success) {
      setShowDeleteModal(false);
      navigate('/');
    } else {
      setIsDeleting(false);
      alert(result?.error || 'Failed to delete account. Please type DELETE or enter your password.');
    }
  };

  const activeNavLabel = SIDEBAR_NAV.find(n => n.id === activeSection)?.label || 'Overview';

  return (
    <div className="dash">
      {/* ── Sidebar Backdrop for Mobile ── */}
      <div
        className={`dash-sidebar-backdrop ${mobileMenuOpen ? 'dash-sidebar-backdrop--open' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />

      {/* ── Sidebar ───────────────────────────────────────────── */}
      <aside className={`dash-sidebar ${mobileMenuOpen ? 'dash-sidebar--open' : ''}`}>
        {/* Logo & Mobile Close */}
        <div className="dash-sidebar__top-row">
          <div className="dash-sidebar__logo">
            <KeyRound size={18} strokeWidth={1.5} className="dash-sidebar__logo-icon" />
            <span>lodgekeys.</span>
          </div>
          <button
            type="button"
            className="dash-sidebar__close-btn"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <div className="dash-sidebar__portal-tag">Customer Portal</div>

        {/* Navigation */}
        <nav className="dash-sidebar__nav">
          {SIDEBAR_NAV.map(({ id, icon: Icon, label, badge }) => (
            <button
              key={id}
              className={`dash-sidebar__nav-item ${activeSection === id ? 'dash-sidebar__nav-item--active' : ''}`}
              onClick={() => handleSectionChange(id)}
            >
              <Icon size={16} strokeWidth={1.8} />
              <span>{label}</span>
              {badge && unreadCount > 0 && (
                <span className="dash-sidebar__badge">{unreadCount}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="dash-sidebar__bottom">
          <Link to="/" className="dash-sidebar__back-link" onClick={() => setMobileMenuOpen(false)}>
            <HomeIcon size={14} />
            <span>Back to Lodgekeys</span>
          </Link>
          <button className="dash-sidebar__signout" onClick={handleSignOut} title="Sign out of your account">
            <LogOut size={14} />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────── */}
      <div className="dash-main">
        {/* Top Header Bar */}
        <header className="dash-header">
          <div className="dash-header__left">
            <button
              type="button"
              className="dash-header__menu-btn"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open sidebar menu"
              aria-expanded={mobileMenuOpen}
            >
              <Menu size={20} />
            </button>
            <div className="dash-header__breadcrumb">
              <span className="dash-header__breadcrumb-root">Customer Portal</span>
              <ChevronRight size={13} className="dash-header__breadcrumb-sep" />
              <span className="dash-header__breadcrumb-current">{activeNavLabel}</span>
            </div>
          </div>
          <div className="dash-header__right">
            <button
              className="dash-header__bell"
              onClick={() => { handleSectionChange('notifications'); markAllAsRead(); }}
              aria-label="Notifications"
            >
              <Bell size={18} strokeWidth={1.8} />
              {unreadCount > 0 && (
                <span className="dash-header__bell-badge">{unreadCount}</span>
              )}
            </button>
            <div className="dash-header__avatar" title={currentUser.fullName}>
              {currentUser.initials}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="dash-content">
          {/* ── OVERVIEW SECTION ── */}
          {activeSection === 'overview' && (
            <section className="dash-section">
              {/* Hero */}
              <div className="dash-hero">
                <div className="dash-hero__left">
                  <span className="dash-hero__tag">CUSTOMER</span>
                  <h1 className="dash-hero__headline">A stay to look forward to.</h1>
                  <p className="dash-hero__sub">
                    Welcome back, {currentUser.fullName.split(' ')[0]}. Here are your reservations and account details.
                  </p>
                </div>
                <Link to="/explore" className="dash-hero__cta">
                  Find a stay <ArrowUpRight size={14} />
                </Link>
              </div>

              {/* Clickable Interactive Metrics Grid */}
              <div className="dash-metrics">
                {metrics.map(({ id, label, value, icon: Icon, color, bg, targetSection }) => (
                  <div
                    key={id}
                    className="dash-metric dash-metric--interactive"
                    style={{ '--metric-color': color, '--metric-bg': bg }}
                    onClick={() => handleSectionChange(targetSection)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSectionChange(targetSection);
                      }
                    }}
                    title={`Click to open ${label}`}
                  >
                    <div className="dash-metric__icon">
                      <Icon size={20} />
                    </div>
                    <div className="dash-metric__body">
                      <span className="dash-metric__value">{value}</span>
                      <span className="dash-metric__label">{label}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bookings Section */}
              <div className="dash-block">
                <div className="dash-block__header">
                  <h2 className="dash-block__title">Your Bookings</h2>
                  <button
                    className="dash-block__view-all"
                    onClick={() => handleSectionChange('bookings')}
                  >
                    View all <ArrowRight size={13} />
                  </button>
                </div>

                {userBookings.length === 0 ? (
                  <div className="dash-empty">
                    <div className="dash-empty__icon">
                      <Calendar size={32} strokeWidth={1.3} />
                    </div>
                    <h3 className="dash-empty__headline">Your next chapter is waiting.</h3>
                    <p className="dash-empty__body">
                      You have no bookings yet. Explore our curated collection and reserve your stay.
                    </p>
                    <Link to="/explore" className="dash-empty__cta">
                      Find a stay <ArrowUpRight size={13} />
                    </Link>
                  </div>
                ) : (
                  <div className="dash-bookings-list">
                    {userBookings.slice(0, 3).map((booking) => (
                      <BookingCard key={booking.id} booking={booking} allHotels={allHotels} />
                    ))}
                  </div>
                )}
              </div>

              {/* Inspiration */}
              <div className="dash-block">
                <div className="dash-block__header">
                  <h2 className="dash-block__title">A little inspiration</h2>
                </div>
                <div className="dash-inspiration-grid">
                  {INSPIRATION_HOTELS.map((hotel) => {
                    const isFav = isFavorite(hotel);
                    return (
                      <div key={hotel.id} className="dash-hotel-card">
                        <div className="dash-hotel-card__img">
                          <img src={hotel.image} alt={hotel.name} />
                          <div className="dash-hotel-card__overlay" />
                          <span className="dash-hotel-card__badge">{hotel.badge}</span>
                          <button
                            className={`dash-hotel-card__fav ${isFav ? 'dash-hotel-card__fav--active' : ''}`}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleFavorite(hotel.id || hotel.slug);
                            }}
                            title={isFav ? 'Remove from saved hotels' : 'Save hotel'}
                            aria-label="Save hotel"
                          >
                            <Heart size={14} fill={isFav ? '#E06058' : 'none'} color={isFav ? '#E06058' : 'currentColor'} />
                          </button>
                        </div>
                        <div className="dash-hotel-card__body">
                          <div className="dash-hotel-card__meta">
                            <MapPin size={11} />
                            <span>{hotel.location}</span>
                          </div>
                          <h3 className="dash-hotel-card__name">{hotel.name}</h3>
                          <p className="dash-hotel-card__tagline">{hotel.tagline}</p>
                          <div className="dash-hotel-card__footer">
                            <div className="dash-hotel-card__price">
                              <span className="dash-hotel-card__price-from">from</span>
                              <span className="dash-hotel-card__price-val">{hotel.price}</span>
                              <span className="dash-hotel-card__price-night">/night</span>
                            </div>
                            <Link to={`/hotels/${hotel.slug}`} className="dash-hotel-card__link">
                              View Hotel <ArrowUpRight size={12} />
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {/* ── MY BOOKINGS SECTION ── */}
          {activeSection === 'bookings' && (
            <section className="dash-section">
              <div className="dash-section-header">
                <h1>My Bookings</h1>
                <p>All your reservation records and receipts in one place.</p>
              </div>
              {userBookings.length === 0 ? (
                <div className="dash-empty">
                  <div className="dash-empty__icon"><Calendar size={32} strokeWidth={1.3} /></div>
                  <h3 className="dash-empty__headline">Your next chapter is waiting.</h3>
                  <p className="dash-empty__body">You have no bookings yet. Explore our curated hotels and reserve your room.</p>
                  <Link to="/explore" className="dash-empty__cta">Find a stay <ArrowUpRight size={13} /></Link>
                </div>
              ) : (
                <div className="dash-bookings-list">
                  {userBookings.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} allHotels={allHotels} expanded />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ── SAVED HOTELS ── */}
          {activeSection === 'saved' && (
            <section className="dash-section">
              <div className="dash-section-header">
                <div className="dash-section-header__row">
                  <div>
                    <h1>Saved Hotels</h1>
                    <p>
                      {savedHotelsList.length > 0
                        ? `${savedHotelsList.length} saved stay${savedHotelsList.length > 1 ? 's' : ''} in your wishlist.`
                        : 'Hotels you have hearted during your exploration.'}
                    </p>
                  </div>
                  {savedHotelsList.length > 0 && (
                    <Link to="/explore" className="dash-saved-explore-link">
                      Explore more hotels <ArrowUpRight size={13} />
                    </Link>
                  )}
                </div>
              </div>

              {savedHotelsList.length === 0 ? (
                <div className="dash-empty">
                  <div className="dash-empty__icon"><Heart size={32} strokeWidth={1.3} /></div>
                  <h3 className="dash-empty__headline">No saved hotels yet.</h3>
                  <p className="dash-empty__body">Tap the heart icon on any hotel card to save it to your wishlist.</p>
                  <Link to="/explore" className="dash-empty__cta">Explore Hotels <ArrowUpRight size={13} /></Link>
                </div>
              ) : (
                <div className="dash-saved-grid">
                  {savedHotelsList.map((hotel) => (
                    <div key={hotel.id} className="dash-saved-card">
                      <div className="dash-saved-card__img">
                        <img src={hotel.image} alt={hotel.name} />
                        <span className="dash-saved-card__badge">{hotel.badge}</span>
                        <button
                          className="dash-saved-card__fav-btn"
                          onClick={() => removeFavorite(hotel.id || hotel.slug)}
                          title="Remove from saved hotels"
                          aria-label="Remove from saved hotels"
                        >
                          <Heart size={16} fill="#E06058" color="#E06058" strokeWidth={1.5} />
                        </button>
                      </div>
                      <div className="dash-saved-card__body">
                        <div className="dash-saved-card__meta">
                          <span className="dash-saved-card__location">
                            <MapPin size={11} /> {hotel.location}
                          </span>
                          <span className="dash-saved-card__category">{hotel.category}</span>
                        </div>
                        <h3 className="dash-saved-card__name">{hotel.name}</h3>
                        <p className="dash-saved-card__tagline">{hotel.tagline}</p>
                        <div className="dash-saved-card__footer">
                          <div className="dash-saved-card__price">
                            <span className="dash-saved-card__price-val">{hotel.price}</span>
                            <span className="dash-saved-card__price-night">/night</span>
                          </div>
                          <div className="dash-saved-card__actions">
                            <Link to={`/hotels/${hotel.slug}`} className="dash-saved-card__view-btn">
                              View Hotel
                            </Link>
                            <Link to={`/hotels/${hotel.slug}/book`} className="dash-saved-card__book-btn">
                              Book Stay <ArrowUpRight size={12} />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ── NOTIFICATIONS ── */}
          {activeSection === 'notifications' && (
            <section className="dash-section">
              <div className="dash-section-header">
                <h1>Notifications</h1>
                <p>{unreadCount > 0 ? `${unreadCount} unread message${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}</p>
              </div>
              {notifications.length === 0 ? (
                <div className="dash-empty">
                  <div className="dash-empty__icon"><Bell size={32} strokeWidth={1.3} /></div>
                  <h3 className="dash-empty__headline">No notifications yet.</h3>
                  <p className="dash-empty__body">Reservation confirmations and front-desk alerts will appear here.</p>
                </div>
              ) : (
                <div className="dash-notif-list">
                  {notifications.map((n) => (
                    <div key={n.id} className={`dash-notif ${n.read ? '' : 'dash-notif--unread'}`}>
                      <div className="dash-notif__dot" />
                      <div className="dash-notif__body">
                        <p className="dash-notif__title">{n.title}</p>
                        <p className="dash-notif__msg">{n.message}</p>
                        <span className="dash-notif__time">{n.timestamp}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ── PROFILE SETTINGS ── */}
          {activeSection === 'profile' && (
            <section className="dash-section">
              <div className="dash-section-header">
                <h1>Profile Settings</h1>
                <p>Manage your personal details, credentials, and account preferences.</p>
              </div>

              <div className="dash-profile-layout">
                {/* User Card Header */}
                <div className="dash-profile-card dash-profile-card--user">
                  <div className="dash-profile__avatar">
                    {currentUser.initials}
                  </div>
                  <div className="dash-profile__user-info">
                    <h3 className="dash-profile__user-name">{currentUser.fullName}</h3>
                    <p className="dash-profile__user-email">{currentUser.email}</p>
                    <div className="dash-profile__badges">
                      <span className="dash-profile__badge-role">
                        {currentUser.role.replace('_', ' ')}
                      </span>
                      <span className="dash-profile__badge-date">
                        Member since {new Date(currentUser.joinedAt || Date.now()).toLocaleDateString('en-GB', { year: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Personal Information Form */}
                <div className="dash-profile-card">
                  <div className="dash-profile-card__header">
                    <div className="dash-profile-card__icon-box">
                      <User size={18} />
                    </div>
                    <div>
                      <h3 className="dash-profile-card__title">Personal Information</h3>
                      <p className="dash-profile-card__desc">Update your name, contact phone, and account email.</p>
                    </div>
                  </div>

                  {profileFeedback && (
                    <div className={`dash-alert dash-alert--${profileFeedback.type}`}>
                      {profileFeedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                      <span>{profileFeedback.text}</span>
                    </div>
                  )}

                  <form onSubmit={handleUpdateProfile} className="dash-profile-form">
                    <div className="dash-form-row">
                      <div className="dash-form-group">
                        <label className="dash-form-label">Full Name</label>
                        <div className="dash-input-wrap">
                          <User size={15} className="dash-input-icon" />
                          <input
                            type="text"
                            value={profileName}
                            onChange={(e) => setProfileName(e.target.value)}
                            placeholder="e.g. John Doe"
                            className="dash-input"
                            required
                          />
                        </div>
                      </div>

                      <div className="dash-form-group">
                        <label className="dash-form-label">Email Address</label>
                        <div className="dash-input-wrap">
                          <Mail size={15} className="dash-input-icon" />
                          <input
                            type="email"
                            value={profileEmail}
                            onChange={(e) => setProfileEmail(e.target.value)}
                            placeholder="e.g. john@example.com"
                            className="dash-input"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="dash-form-group">
                      <label className="dash-form-label">Phone Number</label>
                      <div className="dash-input-wrap">
                        <Phone size={15} className="dash-input-icon" />
                        <input
                          type="tel"
                          value={profilePhone}
                          onChange={(e) => setProfilePhone(e.target.value)}
                          placeholder="e.g. +234 801 234 5678"
                          className="dash-input"
                        />
                      </div>
                    </div>

                    <div className="dash-form-actions">
                      <button
                        type="submit"
                        className="dash-btn dash-btn--primary"
                        disabled={isSavingProfile}
                      >
                        {isSavingProfile ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Password & Security Form */}
                <div className="dash-profile-card">
                  <div className="dash-profile-card__header">
                    <div className="dash-profile-card__icon-box">
                      <Lock size={18} />
                    </div>
                    <div>
                      <h3 className="dash-profile-card__title">Password & Security</h3>
                      <p className="dash-profile-card__desc">Change your password to keep your bookings secure.</p>
                    </div>
                  </div>

                  {passwordFeedback && (
                    <div className={`dash-alert dash-alert--${passwordFeedback.type}`}>
                      {passwordFeedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                      <span>{passwordFeedback.text}</span>
                    </div>
                  )}

                  <form onSubmit={handleChangePassword} className="dash-profile-form">
                    <div className="dash-form-group">
                      <label className="dash-form-label">Current Password</label>
                      <div className="dash-input-wrap">
                        <Lock size={15} className="dash-input-icon" />
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Enter your current password"
                          className="dash-input"
                          required
                        />
                      </div>
                    </div>

                    <div className="dash-form-row">
                      <div className="dash-form-group">
                        <label className="dash-form-label">New Password</label>
                        <div className="dash-input-wrap">
                          <Lock size={15} className="dash-input-icon" />
                          <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="At least 6 characters"
                            className="dash-input"
                            required
                          />
                        </div>
                      </div>

                      <div className="dash-form-group">
                        <label className="dash-form-label">Confirm New Password</label>
                        <div className="dash-input-wrap">
                          <Lock size={15} className="dash-input-icon" />
                          <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Repeat new password"
                            className="dash-input"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="dash-form-actions">
                      <button
                        type="submit"
                        className="dash-btn dash-btn--primary"
                        disabled={isSavingPassword}
                      >
                        {isSavingPassword ? 'Updating...' : 'Update Password'}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Danger Zone Section */}
                <div className="dash-profile-card dash-profile-card--danger">
                  <div className="dash-profile-card__header">
                    <div className="dash-profile-card__icon-box dash-profile-card__icon-box--danger">
                      <AlertTriangle size={18} />
                    </div>
                    <div>
                      <h3 className="dash-profile-card__title dash-profile-card__title--danger">Danger Zone</h3>
                      <p className="dash-profile-card__desc">Irreversible account actions and data removal.</p>
                    </div>
                  </div>

                  <div className="dash-danger-body">
                    <div className="dash-danger-info">
                      <h4 className="dash-danger-heading">Delete Account</h4>
                      <p className="dash-danger-text">
                        Permanently delete your Lodgekeys account, booking records, and saved hotels. This action cannot be undone.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="dash-btn dash-btn--danger"
                      onClick={() => { setShowDeleteModal(true); setDeleteConfirmText(''); }}
                    >
                      <Trash2 size={15} />
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* ── HELP ── */}
          {activeSection === 'help' && (
            <section className="dash-section">
              <div className="dash-section-header">
                <h1>Help & Support</h1>
                <p>Find answers or reach our team directly.</p>
              </div>
              <div className="dash-help-grid">
                {[
                  { q: 'How do I modify my booking?', a: 'Contact the hotel front desk directly via the contact number printed on your reservation receipt.' },
                  { q: 'Can I cancel a reservation?', a: 'Cancellation policies vary by property. Check your receipt breakdown for specific grace periods and terms.' },
                  { q: 'Is my payment data secure?', a: 'Yes — all transactions are encrypted with 256-bit SSL. We never store raw debit/credit card details.' },
                  { q: 'How do I list my property on Lodgekeys?', a: 'Property managers can apply via the Hotel Owner CTA on the Lodgekeys homepage or our Contact page.' },
                ].map((item, i) => (
                  <div key={i} className="dash-help-item">
                    <h4>{item.q}</h4>
                    <p>{item.a}</p>
                  </div>
                ))}
              </div>
              <div className="dash-help-contact">
                <p>Still need help? <Link to="/contact">Contact us →</Link></p>
              </div>
            </section>
          )}
        </main>
      </div>

      {/* ── Delete Account Confirmation Modal ── */}
      {showDeleteModal && (
        <div className="dash-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div
            className="dash-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
          >
            <button
              className="dash-modal__close"
              onClick={() => setShowDeleteModal(false)}
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>

            <div className="dash-modal__icon dash-modal__icon--danger">
              <AlertTriangle size={28} />
            </div>

            <h3 id="delete-modal-title" className="dash-modal__title">
              Delete your Lodgekeys account?
            </h3>
            <p className="dash-modal__desc">
              This action is permanent and cannot be undone. All your reservation histories, receipts, and saved hotels will be permanently deleted from our records.
            </p>

            <div className="dash-modal__prompt">
              <label htmlFor="confirm-delete-input">
                To confirm, type <strong>DELETE</strong> or your account password below:
              </label>
              <input
                id="confirm-delete-input"
                type="password"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE or your password"
                className="dash-modal__input"
                autoFocus
              />
            </div>

            <div className="dash-modal__actions">
              <button
                type="button"
                className="dash-modal__btn dash-modal__btn--cancel"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="dash-modal__btn dash-modal__btn--confirm-delete"
                disabled={!deleteConfirmText.trim() || isDeleting}
                onClick={handleConfirmDelete}
              >
                {isDeleting ? 'Deleting...' : 'Permanently Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Booking Card Sub-component ────────────────────────────────────────────────
function BookingCard({ booking, expanded = false, allHotels = [] }) {
  const hotel = (allHotels && allHotels.length > 0)
    ? (allHotels.find(h => h.name === booking.hotelName || h.slug === booking.hotelSlug) || sampleHotels.find(h => h.name === booking.hotelName) || sampleHotels[0])
    : (sampleHotels.find(h => h.name === booking.hotelName) || sampleHotels[0]);

  return (
    <div className="dash-booking-card">
      <div className="dash-booking-card__thumb">
        <img src={hotel?.image || '/images/hotel-1.jpg'} alt={booking.hotelName} />
      </div>
      <div className="dash-booking-card__body">
        <div className="dash-booking-card__top">
          <div>
            <span className="dash-booking-card__ref">{booking.id || booking.bookingRef}</span>
            <h3 className="dash-booking-card__hotel">{booking.hotelName}</h3>
            <p className="dash-booking-card__room">{booking.roomNumber || booking.roomName}</p>
          </div>
          <div className="dash-booking-card__status">
            <span className="dash-booking-card__status-pill">Confirmed</span>
          </div>
        </div>

        <div className="dash-booking-card__dates">
          <div className="dash-booking-card__date-item">
            <span className="dash-booking-card__date-label">Check-in</span>
            <span className="dash-booking-card__date-val">{booking.dates?.arrival || booking.arrival || '—'}</span>
          </div>
          <ChevronRight size={14} className="dash-booking-card__date-arrow" />
          <div className="dash-booking-card__date-item">
            <span className="dash-booking-card__date-label">Check-out</span>
            <span className="dash-booking-card__date-val">{booking.dates?.departure || booking.departure || '—'}</span>
          </div>
          <div className="dash-booking-card__date-item">
            <span className="dash-booking-card__date-label">Duration</span>
            <span className="dash-booking-card__date-val">{booking.dates?.nights || '—'} night{booking.dates?.nights !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {expanded && (
          <div className="dash-booking-card__total">
            Total: <strong>{booking.totals?.grandTotal || booking.totalCost || (booking.totalAmount ? `₦${booking.totalAmount.toLocaleString()}` : '—')}</strong>
            {booking.paymentMethod && (
              <span className="dash-booking-card__pay-method"> · {booking.paymentMethod === 'hotel' ? 'Pay at Hotel' : booking.paymentMethod}</span>
            )}
          </div>
        )}

        <div className="dash-booking-card__actions">
          <Link
            to={`/hotels/${hotel?.slug || 'the-river-house-retreat'}`}
            className="dash-booking-card__view-btn"
          >
            View Hotel
          </Link>
          <button
            className="dash-booking-card__receipt-btn"
            onClick={() => window.print()}
          >
            <Printer size={13} />
            Download Receipt
          </button>
        </div>
      </div>
    </div>
  );
}
