import { useState, useEffect } from 'react';
import { Menu, X, KeyRound, LayoutDashboard, LogOut, Building2, User } from 'lucide-react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import HotelApplicationModal from './HotelApplicationModal';
import './Navbar.css';

const navLinks = [
  { label: 'Home', path: '/' },
  { label: 'Explore Hotels', path: '/explore', altPaths: ['/hotels'] },
  { label: 'About Us', path: '/about' },
  { label: 'Contact', path: '/contact' },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const location = useLocation();
  const { openAuth, isAuthenticated, currentUser, signOut, userRole } = useAuth();

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

  const closeMenu = () => setMobileOpen(false);

  const isLinkActive = (item) => {
    if (item.path === '/') {
      return location.pathname === '/';
    }
    if (location.pathname.startsWith(item.path)) {
      return true;
    }
    if (item.altPaths && item.altPaths.some((p) => location.pathname.startsWith(p))) {
      return true;
    }
    return false;
  };

  const dashboardPath =
    userRole === 'customer'
      ? '/dashboard'
      : userRole === 'hotel_manager'
      ? '/manager/dashboard'
      : userRole === 'admin'
      ? '/admin/dashboard'
      : '/dashboard';

  const handleListYourHotelClick = () => {
    closeMenu();
    setIsListModalOpen(true);
  };

  return (
    <>
      <header className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`} id="home">
        <div className="navbar__inner container">
          {/* Brand */}
          <Link to="/" className="navbar__brand" onClick={closeMenu}>
            <KeyRound size={20} strokeWidth={1.5} className="navbar__logo-icon" />
            <span className="navbar__wordmark">lodgekeys.</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="navbar__nav" aria-label="Main navigation">
            {navLinks.map((link) => {
              const active = isLinkActive(link);
              return (
                <NavLink
                  key={link.label}
                  to={link.path}
                  className={`navbar__link ${active ? 'navbar__link--active' : ''}`}
                >
                  {link.label}
                </NavLink>
              );
            })}
          </nav>

          {/* Desktop Actions */}
          <div className="navbar__actions">
            <button
              type="button"
              className="navbar__list-hotel-btn"
              onClick={() => setIsListModalOpen(true)}
            >
              List Your Hotel
            </button>
            <NotificationBell />
            {isAuthenticated && currentUser ? (
              <>
                <Link to={dashboardPath} className="navbar__dashboard-link" title="Go to Dashboard">
                  <LayoutDashboard size={15} />
                  <span>Dashboard</span>
                </Link>
                <button
                  type="button"
                  className="navbar__user-avatar"
                  onClick={signOut}
                  title={`Sign out (${currentUser.fullName})`}
                >
                  <span className="navbar__avatar-initials">{currentUser.initials}</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                className="navbar__signin"
                onClick={() => openAuth('signin')}
              >
                Sign In
              </button>
            )}
          </div>

          {/* Mobile Toggle Button */}
          <div className="navbar__mobile-toggle-group">
            <NotificationBell />
            <button
              type="button"
              className="navbar__toggle"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              aria-expanded={mobileOpen}
            >
              <Menu size={24} />
            </button>
          </div>
        </div>

        {/* Backdrop for Drawer */}
        <div
          className={`navbar__backdrop ${mobileOpen ? 'navbar__backdrop--open' : ''}`}
          onClick={closeMenu}
          aria-hidden="true"
        />

        {/* Slide-in Mobile Drawer */}
        <div
          className={`navbar__drawer ${mobileOpen ? 'navbar__drawer--open' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation drawer"
        >
          {/* Drawer Header */}
          <div className="navbar__drawer-header">
            <Link to="/" className="navbar__drawer-brand" onClick={closeMenu}>
              <KeyRound size={20} strokeWidth={1.5} className="navbar__logo-icon" />
              <span className="navbar__wordmark">lodgekeys.</span>
            </Link>
            <button
              type="button"
              className="navbar__drawer-close"
              onClick={closeMenu}
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>

          {/* Drawer Navigation Links */}
          <div className="navbar__drawer-body">
            <nav className="navbar__drawer-nav" aria-label="Mobile Drawer Navigation">
              {navLinks.map((link) => {
                const active = isLinkActive(link);
                return (
                  <NavLink
                    key={link.label}
                    to={link.path}
                    className={`navbar__drawer-link ${active ? 'navbar__drawer-link--active' : ''}`}
                    onClick={closeMenu}
                  >
                    <span>{link.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            <div className="navbar__drawer-divider" />

            {/* Secondary CTA: List Your Hotel */}
            <div className="navbar__drawer-section">
              <button
                type="button"
                className="navbar__drawer-secondary-cta"
                onClick={handleListYourHotelClick}
              >
                <Building2 size={18} className="navbar__drawer-cta-icon" />
                <div className="navbar__drawer-cta-text">
                  <strong>List Your Hotel</strong>
                  <small>Partner with Lodgekeys in Abraka</small>
                </div>
              </button>
            </div>

            {/* Authenticated Account Info / Actions */}
            {isAuthenticated && currentUser && (
              <div className="navbar__drawer-account">
                <div className="navbar__drawer-user-info">
                  <div className="navbar__drawer-avatar">
                    {currentUser.initials || 'LK'}
                  </div>
                  <div className="navbar__drawer-user-meta">
                    <p className="navbar__drawer-user-name">{currentUser.fullName}</p>
                    <span className="navbar__drawer-user-role">{currentUser.role || userRole}</span>
                  </div>
                </div>

                <Link
                  to={dashboardPath}
                  className="navbar__drawer-dash-link"
                  onClick={closeMenu}
                >
                  <LayoutDashboard size={18} />
                  <span>My Dashboard</span>
                </Link>

                <button
                  type="button"
                  className="navbar__drawer-signout-btn"
                  onClick={() => {
                    signOut();
                    closeMenu();
                  }}
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>

          {/* Bottom Primary Action Bar */}
          <div className="navbar__drawer-footer">
            {isAuthenticated && currentUser ? (
              <Link
                to={dashboardPath}
                className="navbar__drawer-primary-btn"
                onClick={closeMenu}
              >
                <User size={18} />
                <span>My Account</span>
              </Link>
            ) : (
              <button
                type="button"
                className="navbar__drawer-primary-btn"
                onClick={() => {
                  closeMenu();
                  openAuth('signin');
                }}
              >
                <span>Sign In / Register</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hotel Application Modal */}
      <HotelApplicationModal
        isOpen={isListModalOpen}
        onClose={() => setIsListModalOpen(false)}
      />
    </>
  );
}
