import { useState, useEffect } from 'react';
import { Menu, X, KeyRound, ArrowRight, Home, Info, BedDouble, Image, Phone } from 'lucide-react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import NotificationBell from '../NotificationBell';
import './HotelNavbar.css';

export default function HotelNavbar({ hotel, onOpenContact, onOpenBooking }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  // Close drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const basePath = `/hotels/${hotel.slug}`;
  const isOverview = location.pathname === basePath || location.pathname === `${basePath}/`;
  const isRooms = location.pathname.startsWith(`${basePath}/rooms`);
  const isGallery = location.pathname.startsWith(`${basePath}/gallery`);

  const closeMenu = () => setMobileOpen(false);

  const handleAboutClick = (e) => {
    if (isOverview) {
      e.preventDefault();
      const el = document.getElementById('about-hotel');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
    closeMenu();
  };

  // Compact name for mobile header
  const shortHotelName =
    hotel.name.length > 18 ? hotel.name.substring(0, 16).trim() + '…' : hotel.name;

  return (
    <>
      <header className={`hotel-navbar ${scrolled ? 'hotel-navbar--scrolled' : ''}`}>
        <div className="hotel-navbar__inner container">
          {/* Co-Branded Left Header */}
          <div className="hotel-navbar__branding">
            <Link to="/" className="hotel-navbar__parent-brand" title="Return to Lodgekeys Home">
              <KeyRound size={17} strokeWidth={1.5} className="hotel-navbar__logo-icon" />
              <span className="hotel-navbar__wordmark">lodgekeys.</span>
            </Link>
            <span className="hotel-navbar__separator">/</span>
            <Link to={basePath} className="hotel-navbar__hotel-brand" title={hotel.name}>
              <span className="hotel-navbar__hotel-name">{shortHotelName}</span>
              <span className="hotel-navbar__hotel-badge">{hotel.category}</span>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hotel-navbar__nav" aria-label="Hotel Microsite navigation">
            <Link to="/" className="hotel-navbar__link">
              Home
            </Link>
            <Link to="/explore" className="hotel-navbar__link">
              Explore Hotels
            </Link>
            <a
              href={`${basePath}#about-hotel`}
              className={`hotel-navbar__link ${isOverview ? 'hotel-navbar__link--active' : ''}`}
              onClick={handleAboutClick}
            >
              About
            </a>
            <NavLink
              to={`${basePath}/rooms`}
              className={`hotel-navbar__link ${isRooms ? 'hotel-navbar__link--active' : ''}`}
            >
              Rooms
            </NavLink>
            <NavLink
              to={`${basePath}/gallery`}
              className={`hotel-navbar__link ${isGallery ? 'hotel-navbar__link--active' : ''}`}
            >
              Gallery
            </NavLink>
            <button
              type="button"
              className="hotel-navbar__link-btn"
              onClick={onOpenContact}
            >
              Contact
            </button>
          </nav>

          {/* Desktop Right CTA */}
          <div className="hotel-navbar__actions">
            <NotificationBell />
            <Link
              to={`${basePath}/book`}
              className="btn btn-primary hotel-navbar__cta"
            >
              Book Now
              <ArrowRight size={13} />
            </Link>
          </div>

          {/* Mobile Right Controls: Compact Book Button & Hamburger */}
          <div className="hotel-navbar__mobile-right">
            <Link
              to={`${basePath}/book`}
              className="hotel-navbar__mobile-book-btn"
              aria-label="Book stay"
            >
              Book
            </Link>
            <button
              type="button"
              className="hotel-navbar__toggle"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              aria-expanded={mobileOpen}
            >
              <Menu size={22} />
            </button>
          </div>
        </div>

        {/* Horizontal Scrollable Pill Navigation for Quick Mobile Access */}
        <div className="hotel-navbar__pills-wrapper">
          <nav className="hotel-navbar__pills-container" aria-label="Quick hotel sections">
            <Link
              to={basePath}
              className={`hotel-navbar__pill ${isOverview ? 'hotel-navbar__pill--active' : ''}`}
            >
              Overview
            </Link>
            <a
              href={`${basePath}#about-hotel`}
              className="hotel-navbar__pill"
              onClick={handleAboutClick}
            >
              About
            </a>
            <NavLink
              to={`${basePath}/rooms`}
              className={({ isActive }) =>
                `hotel-navbar__pill ${isActive ? 'hotel-navbar__pill--active' : ''}`
              }
            >
              Rooms
            </NavLink>
            <NavLink
              to={`${basePath}/gallery`}
              className={({ isActive }) =>
                `hotel-navbar__pill ${isActive ? 'hotel-navbar__pill--active' : ''}`
              }
            >
              Gallery
            </NavLink>
            <button
              type="button"
              className="hotel-navbar__pill hotel-navbar__pill--btn"
              onClick={onOpenContact}
            >
              Contact
            </button>
          </nav>
        </div>

        {/* Drawer Backdrop */}
        <div
          className={`hotel-navbar__backdrop ${mobileOpen ? 'hotel-navbar__backdrop--open' : ''}`}
          onClick={closeMenu}
          aria-hidden="true"
        />

        {/* Mobile Slide-in Drawer */}
        <div
          className={`hotel-navbar__drawer ${mobileOpen ? 'hotel-navbar__drawer--open' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-label="Hotel navigation drawer"
        >
          {/* Drawer Header */}
          <div className="hotel-navbar__drawer-header">
            <div className="hotel-navbar__drawer-hotel-meta">
              <strong className="hotel-navbar__drawer-hotel-title">{hotel.name}</strong>
              <span className="hotel-navbar__drawer-hotel-location">{hotel.location}</span>
            </div>
            <button
              type="button"
              className="hotel-navbar__drawer-close"
              onClick={closeMenu}
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>

          {/* Drawer Body Links */}
          <div className="hotel-navbar__drawer-body">
            <nav className="hotel-navbar__drawer-nav">
              <Link to="/" className="hotel-navbar__drawer-link" onClick={closeMenu}>
                <Home size={18} />
                <span>Lodgekeys Home</span>
              </Link>
              <Link to="/explore" className="hotel-navbar__drawer-link" onClick={closeMenu}>
                <KeyRound size={18} />
                <span>Explore All Hotels</span>
              </Link>
              <div className="hotel-navbar__drawer-divider" />
              <Link to={basePath} className="hotel-navbar__drawer-link" onClick={closeMenu}>
                <Home size={18} />
                <span>Hotel Overview</span>
              </Link>
              <a
                href={`${basePath}#about-hotel`}
                className="hotel-navbar__drawer-link"
                onClick={handleAboutClick}
              >
                <Info size={18} />
                <span>About Property</span>
              </a>
              <Link to={`${basePath}/rooms`} className="hotel-navbar__drawer-link" onClick={closeMenu}>
                <BedDouble size={18} />
                <span>Rooms & Suites ({hotel.rooms?.length || 3})</span>
              </Link>
              <Link to={`${basePath}/gallery`} className="hotel-navbar__drawer-link" onClick={closeMenu}>
                <Image size={18} />
                <span>Photo Gallery</span>
              </Link>
              <button
                type="button"
                className="hotel-navbar__drawer-link hotel-navbar__drawer-link--btn"
                onClick={() => {
                  closeMenu();
                  onOpenContact();
                }}
              >
                <Phone size={18} />
                <span>Contact Desk</span>
              </button>
            </nav>
          </div>

          {/* Drawer Footer CTA */}
          <div className="hotel-navbar__drawer-footer">
            <Link
              to={`${basePath}/book`}
              className="hotel-navbar__drawer-book-btn"
              onClick={closeMenu}
            >
              <span>Book Your Stay</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}
