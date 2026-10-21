import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Compass,
  Search,
  CalendarCheck,
  Heart,
  User,
  LayoutDashboard,
  BedDouble,
  BarChart3,
  Settings,
  Building2,
  ClipboardList,
  Users,
  CreditCard,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './MobileBottomNav.css';

const STORAGE_KEY_APPLICATIONS = 'lodgekeys_admin_applications_v1';

export default function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, openAuth } = useAuth();
  const { pathname } = location;

  const [pendingAppsCount, setPendingAppsCount] = useState(2);

  // Sync pending applications count for Admin badge
  useEffect(() => {
    const updateAppsCount = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY_APPLICATIONS);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const count = parsed.filter((a) => a.status === 'pending').length;
            setPendingAppsCount(count);
            return;
          }
        }
      } catch {}
      setPendingAppsCount(2); // fallback to seed pending count
    };

    updateAppsCount();
    window.addEventListener('storage', updateAppsCount);
    return () => window.removeEventListener('storage', updateAppsCount);
  }, [pathname]);

  // Determine portal mode
  const isManager = pathname.startsWith('/manager');
  const isAdmin = pathname.startsWith('/admin');

  // Trigger search focus
  const handleSearchClick = () => {
    if (pathname === '/explore') {
      const el = document.getElementById('explore-search-input');
      if (el) {
        el.focus();
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      navigate('/explore?focus=search');
    }
  };

  // Safe navigation for auth-protected customer destinations
  const handleCustomerNav = (targetPath) => {
    if (isAuthenticated) {
      navigate(targetPath);
    } else {
      openAuth('signin');
    }
  };

  // 1. Hotel Manager Portal Items
  if (isManager) {
    const managerItems = [
      {
        id: 'overview',
        label: 'Overview',
        icon: LayoutDashboard,
        path: '/manager/dashboard',
        isActive:
          pathname === '/manager' ||
          pathname === '/manager/dashboard' ||
          pathname === '/manager/overview',
        onClick: () => navigate('/manager/dashboard'),
      },
      {
        id: 'inventory',
        label: 'Inventory',
        icon: BedDouble,
        path: '/manager/rooms',
        isActive: pathname.startsWith('/manager/rooms'),
        onClick: () => navigate('/manager/rooms'),
      },
      {
        id: 'bookings',
        label: 'Bookings',
        icon: CalendarCheck,
        path: '/manager/reservations',
        isActive: pathname.startsWith('/manager/reservations'),
        onClick: () => navigate('/manager/reservations'),
      },
      {
        id: 'reports',
        label: 'Reports',
        icon: BarChart3,
        path: '/manager/reports',
        isActive: pathname.startsWith('/manager/reports'),
        onClick: () => navigate('/manager/reports'),
      },
      {
        id: 'settings',
        label: 'Settings',
        icon: Settings,
        path: '/manager/settings',
        isActive: pathname.startsWith('/manager/settings'),
        onClick: () => navigate('/manager/settings'),
      },
    ];

    return (
      <nav className="mobile-bottom-nav" aria-label="Hotel Manager mobile navigation">
        <div className="mobile-bottom-nav__inner">
          {managerItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                className={`mobile-bottom-nav__item ${
                  item.isActive ? 'mobile-bottom-nav__item--active' : ''
                }`}
                onClick={item.onClick}
                id={`mobile-nav-mgr-${item.id}`}
                aria-current={item.isActive ? 'page' : undefined}
              >
                <div className="mobile-bottom-nav__icon-wrap">
                  <Icon size={20} strokeWidth={item.isActive ? 2.2 : 1.75} />
                  {item.isActive && <span className="mobile-bottom-nav__dot" />}
                </div>
                <span className="mobile-bottom-nav__label">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    );
  }

  // 2. Administrator Portal Items
  if (isAdmin) {
    const adminItems = [
      {
        id: 'overview',
        label: 'Overview',
        icon: LayoutDashboard,
        path: '/admin/dashboard',
        isActive:
          pathname === '/admin' ||
          pathname === '/admin/dashboard' ||
          pathname === '/admin/overview',
        onClick: () => navigate('/admin/dashboard'),
      },
      {
        id: 'hotels',
        label: 'Hotels',
        icon: Building2,
        path: '/admin/hotels',
        isActive: pathname.startsWith('/admin/hotels'),
        onClick: () => navigate('/admin/hotels'),
      },
      {
        id: 'applications',
        label: 'Applications',
        icon: ClipboardList,
        path: '/admin/applications',
        badge: pendingAppsCount > 0 ? (pendingAppsCount > 9 ? '9+' : pendingAppsCount) : null,
        isActive: pathname.startsWith('/admin/applications'),
        onClick: () => navigate('/admin/applications'),
      },
      {
        id: 'users',
        label: 'Users',
        icon: Users,
        path: '/admin/users',
        isActive: pathname.startsWith('/admin/users'),
        onClick: () => navigate('/admin/users'),
      },
      {
        id: 'payments',
        label: 'Payments',
        icon: CreditCard,
        path: '/admin/payments',
        isActive: pathname.startsWith('/admin/payments'),
        onClick: () => navigate('/admin/payments'),
      },
    ];

    return (
      <nav className="mobile-bottom-nav" aria-label="Administrator mobile navigation">
        <div className="mobile-bottom-nav__inner">
          {adminItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                className={`mobile-bottom-nav__item ${
                  item.isActive ? 'mobile-bottom-nav__item--active' : ''
                }`}
                onClick={item.onClick}
                id={`mobile-nav-adm-${item.id}`}
                aria-current={item.isActive ? 'page' : undefined}
              >
                <div className="mobile-bottom-nav__icon-wrap">
                  <Icon size={20} strokeWidth={item.isActive ? 2.2 : 1.75} />
                  {item.badge && (
                    <span className="mobile-bottom-nav__badge" title={`${item.badge} pending`}>
                      {item.badge}
                    </span>
                  )}
                  {item.isActive && <span className="mobile-bottom-nav__dot" />}
                </div>
                <span className="mobile-bottom-nav__label">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    );
  }

  // 3. Public Guest / Customer Portal Items
  const isSearchActive =
    pathname === '/explore' &&
    (location.search.includes('focus=search') ||
      location.search.includes('q=') ||
      location.search.includes('search='));
  const isExploreActive =
    (pathname === '/explore' || pathname.startsWith('/hotels')) && !isSearchActive;
  const isStaysActive = pathname.startsWith('/dashboard/bookings');
  const isSavedActive = pathname.startsWith('/dashboard/saved');
  const isProfileActive =
    (pathname === '/dashboard' ||
      pathname === '/dashboard/profile' ||
      pathname === '/dashboard/notifications' ||
      pathname === '/dashboard/help') &&
    !isStaysActive &&
    !isSavedActive;

  const guestItems = [
    {
      id: 'explore',
      label: 'Explore',
      icon: Compass,
      isActive: isExploreActive,
      onClick: () => navigate('/explore'),
    },
    {
      id: 'search',
      label: 'Search',
      icon: Search,
      isActive: isSearchActive,
      onClick: handleSearchClick,
    },
    {
      id: 'stays',
      label: 'My Stays',
      icon: CalendarCheck,
      isActive: isStaysActive,
      onClick: () => handleCustomerNav('/dashboard/bookings'),
    },
    {
      id: 'saved',
      label: 'Saved',
      icon: Heart,
      isActive: isSavedActive,
      onClick: () => handleCustomerNav('/dashboard/saved'),
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      isActive: isProfileActive,
      onClick: () => handleCustomerNav('/dashboard'),
    },
  ];

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
      <div className="mobile-bottom-nav__inner">
        {guestItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              className={`mobile-bottom-nav__item ${
                item.isActive ? 'mobile-bottom-nav__item--active' : ''
              }`}
              onClick={item.onClick}
              id={`mobile-nav-${item.id}`}
              aria-current={item.isActive ? 'page' : undefined}
            >
              <div className="mobile-bottom-nav__icon-wrap">
                <Icon size={20} strokeWidth={item.isActive ? 2.2 : 1.75} />
                {item.isActive && <span className="mobile-bottom-nav__dot" />}
              </div>
              <span className="mobile-bottom-nav__label">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
