import { useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowLeft, KeyRound, Lock, ExternalLink } from 'lucide-react';

/**
 * ProtectedRoute Guard
 * 
 * Enforces strict client-side role whitelisting and authentication verification.
 * Prevents unauthorized portal access and state snooping.
 *
 * @param {Object} props
 * @param {string[]} props.allowedRoles - Array of permitted roles, e.g. ['admin'], ['hotel_manager'], ['customer']
 * @param {React.ReactNode} props.children - Protected component to render if authorized
 */
export default function ProtectedRoute({ allowedRoles = [], children }) {
  const { currentUser, isAuthenticated, userRole, openAuth } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // 1. Unauthenticated: Immediately redirect to home with openAuth=true to trigger login modal
  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/?openAuth=true" replace state={{ from: location.pathname }} />;
  }

  // 2. Strict Role Verification
  const isAllowed = allowedRoles.length === 0 || allowedRoles.includes(userRole);

  if (!isAllowed) {
    // Determine the user's legitimate authorized destination
    const authorizedHome =
      userRole === 'admin'
        ? '/admin/dashboard'
        : userRole === 'hotel_manager'
        ? '/manager/dashboard'
        : '/dashboard';

    const roleDisplayName =
      userRole === 'admin'
        ? 'Platform Administrator'
        : userRole === 'hotel_manager'
        ? 'Hotel Manager'
        : 'Customer';

    const requiredRolesDisplay = allowedRoles
      .map(r => (r === 'admin' ? 'Administrator' : r === 'hotel_manager' ? 'Hotel Manager' : 'Customer'))
      .join(' or ');

    return (
      <div
        className="guard-denied-container"
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f2118 0%, #173827 100%)',
          padding: '24px',
          fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
          color: '#0f2118',
        }}
      >
        <div
          className="guard-denied-card"
          style={{
            maxWidth: '480px',
            width: '100%',
            background: '#ffffff',
            borderRadius: '20px',
            boxShadow: '0 24px 48px rgba(0, 0, 0, 0.25)',
            border: '1px solid #fee2e2',
            padding: '36px 30px',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Top subtle danger accent */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '5px',
              background: '#dc2626',
            }}
          />

          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: '#fef2f2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 18px',
              border: '2px solid #fee2e2',
            }}
          >
            <ShieldAlert size={32} strokeWidth={2} />
          </div>

          <span
            style={{
              display: 'inline-block',
              fontSize: '11px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#dc2626',
              background: '#fef2f2',
              padding: '4px 12px',
              borderRadius: '999px',
              marginBottom: '12px',
            }}
          >
            403 · Access Forbidden
          </span>

          <h2
            style={{
              fontSize: '22px',
              fontWeight: '800',
              color: '#0f2118',
              letterSpacing: '-0.02em',
              margin: '0 0 8px',
            }}
          >
            Restricted Portal
          </h2>

          <p
            style={{
              fontSize: '14px',
              color: '#64748b',
              lineHeight: '1.55',
              margin: '0 0 20px',
            }}
          >
            You do not have permission to access this section. This portal requires{' '}
            <strong style={{ color: '#0f2118' }}>{requiredRolesDisplay}</strong> privileges, but your
            active session is authenticated as{' '}
            <strong style={{ color: '#dc2626' }}>{roleDisplayName}</strong> ({currentUser.email}).
          </p>

          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '12px 16px',
              marginBottom: '24px',
              fontSize: '13px',
              color: '#475569',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <Lock size={16} color="#64748b" style={{ flexShrink: 0 }} />
            <span>
              URL tampering detected on <code>{location.pathname}</code>. State and sensitive assets
              remain isolated.
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              type="button"
              id="btn-return-authorized-portal"
              onClick={() => navigate(authorizedHome, { replace: true })}
              style={{
                width: '100%',
                padding: '13px 20px',
                background: '#1a5f3a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '11px',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#144d2e')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#1a5f3a')}
            >
              Return to Your Authorized Dashboard
            </button>

            <button
              type="button"
              id="btn-return-home"
              onClick={() => navigate('/', { replace: true })}
              style={{
                width: '100%',
                padding: '11px 20px',
                background: 'transparent',
                color: '#64748b',
                border: '1px solid #cbd5e1',
                borderRadius: '11px',
                fontWeight: '500',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.18s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#94a3b8';
                e.currentTarget.style.color = '#334155';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#cbd5e1';
                e.currentTarget.style.color = '#64748b';
              }}
            >
              Back to Lodgekeys Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. User is authenticated and permitted: render protected content
  return children;
}
