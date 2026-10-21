import { useState } from 'react';
import { 
  KeyRound, Mail, Lock, Eye, EyeOff, User, 
  ArrowRight, CheckCircle2, ShieldCheck, X 
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './SignIn.css';

export default function SignIn() {
  const { signIn, register, resetPassword } = useAuth();
  const [mode, setMode] = useState('signin'); // 'signin' or 'signup'
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (mode === 'signup' && !fullName.trim()) {
      setErrorMsg('Please enter your full name');
      return;
    }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setErrorMsg('Please enter a valid email address');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMsg('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    try {
      let result;
      if (mode === 'signin') {
        result = await signIn(email, password);
      } else {
        result = await register(fullName, email, password);
      }
      setIsLoading(false);
      if (!result.success) {
        setErrorMsg(result.error || 'Authentication failed');
        return;
      }
      setAuthSuccess(true);
      setTimeout(() => {
        navigate(result.redirectTo || '/');
      }, 1500);
    } catch (err) {
      setIsLoading(false);
      setErrorMsg(err.message || 'An unexpected error occurred');
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail || !/\S+@\S+\.\S+/.test(forgotEmail)) return;
    try {
      if (resetPassword) await resetPassword(forgotEmail);
      setForgotSent(true);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to send reset link');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* Auth Brand Header */}
        <div className="auth-header">
          <Link to="/" className="auth-brand">
            <KeyRound size={24} strokeWidth={1.5} className="auth-brand__icon" />
            <span className="auth-brand__name">lodgekeys.</span>
          </Link>
          <span className="eyebrow" style={{ marginTop: '12px' }}>GUEST & OWNER PORTAL</span>
          <h1 className="auth-title">
            {mode === 'signin' ? 'Welcome back to Lodgekeys' : 'Create your Lodgekeys account'}
          </h1>
          <p className="auth-subtitle">
            {mode === 'signin' 
              ? 'Access your verified Abraka reservations, saved stays, and personal concierge desk.' 
              : 'Join to reserve vetted stays, manage booking itineraries, and enjoy local perks.'}
          </p>
        </div>

        {/* Auth Card */}
        <div className="auth-card">
          {/* Mode Switcher Tabs */}
          <div className="auth-tabs">
            <button
              className={`auth-tab ${mode === 'signin' ? 'auth-tab--active' : ''}`}
              onClick={() => {
                setMode('signin');
                setErrorMsg('');
              }}
            >
              Sign In
            </button>
            <button
              className={`auth-tab ${mode === 'signup' ? 'auth-tab--active' : ''}`}
              onClick={() => {
                setMode('signup');
                setErrorMsg('');
              }}
            >
              Sign Up
            </button>
          </div>

          {authSuccess ? (
            <div className="auth-success-state">
              <div className="auth-success-icon">
                <CheckCircle2 size={48} />
              </div>
              <h3>
                {mode === 'signin' ? 'Signed in successfully!' : 'Account created successfully!'}
              </h3>
              <p>Welcome to Lodgekeys Abraka. Redirecting you to your homepage...</p>
            </div>
          ) : (
            <>
              {/* Social Login Options */}
              <div className="auth-social">
                <button 
                  type="button" 
                  className="auth-social-btn"
                  onClick={() => {
                    setIsLoading(true);
                    setTimeout(() => {
                      setIsLoading(false);
                      setAuthSuccess(true);
                      setTimeout(() => navigate('/'), 1800);
                    }, 1000);
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Continue with Google</span>
                </button>
              </div>

              <div className="auth-divider">
                <span>or continue with email</span>
              </div>

              {errorMsg && (
                <div className="auth-error-banner">
                  {errorMsg}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="auth-form" noValidate>
                {mode === 'signup' && (
                  <div className="auth-field">
                    <label className="auth-label">Full Name</label>
                    <div className="auth-input-wrap">
                      <User size={16} className="auth-input-icon" />
                      <input
                        type="text"
                        className="auth-input"
                        placeholder="e.g. Somtochukwu Obi"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="auth-field">
                  <label className="auth-label">Email Address</label>
                  <div className="auth-input-wrap">
                    <Mail size={16} className="auth-input-icon" />
                    <input
                      type="email"
                      className="auth-input"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="auth-field">
                  <div className="auth-field-header">
                    <label className="auth-label">Password</label>
                    {mode === 'signin' && (
                      <button
                        type="button"
                        className="auth-forgot-link"
                        onClick={() => {
                          setForgotEmail(email);
                          setForgotSent(false);
                          setShowForgotModal(true);
                        }}
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="auth-input-wrap">
                    <Lock size={16} className="auth-input-icon" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="auth-input"
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="auth-eye-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Remember Me */}
                <div className="auth-options">
                  <label className="auth-checkbox-label">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="auth-checkbox"
                    />
                    <span>Remember me for 30 days</span>
                  </label>
                </div>

                {/* Primary Button */}
                <button
                  type="submit"
                  className="btn btn-primary auth-submit-btn"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    'Processing...'
                  ) : mode === 'signin' ? (
                    <>
                      Sign In to Lodgekeys
                      <ArrowRight size={14} />
                    </>
                  ) : (
                    <>
                      Create Free Account
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </form>

              {/* Bottom Toggle Link */}
              <div className="auth-toggle-footer">
                {mode === 'signin' ? (
                  <p>
                    Don’t have an account yet?{' '}
                    <button
                      type="button"
                      className="auth-switch-link"
                      onClick={() => {
                        setMode('signup');
                        setErrorMsg('');
                      }}
                    >
                      Sign Up
                    </button>
                  </p>
                ) : (
                  <p>
                    Already have a Lodgekeys account?{' '}
                    <button
                      type="button"
                      className="auth-switch-link"
                      onClick={() => {
                        setMode('signin');
                        setErrorMsg('');
                      }}
                    >
                      Sign In
                    </button>
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Security badge */}
        <div className="auth-footer-badge">
          <ShieldCheck size={14} />
          <span>Encrypted with 256-bit SSL · Lodgekeys Hospitality Network</span>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="forgot-modal-overlay" onClick={() => setShowForgotModal(false)}>
          <div className="forgot-modal" onClick={e => e.stopPropagation()}>
            <button 
              className="forgot-modal__close" 
              onClick={() => setShowForgotModal(false)}
            >
              <X size={16} />
            </button>

            {forgotSent ? (
              <div className="forgot-modal__success">
                <CheckCircle2 size={36} color="#0f5132" />
                <h3>Password Reset Link Sent</h3>
                <p>
                  We have dispatched instructions to <strong>{forgotEmail}</strong>. Please check your inbox and spam folder.
                </p>
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowForgotModal(false)}
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit}>
                <h3>Reset your password</h3>
                <p className="forgot-modal__desc">
                  Enter your registered Lodgekeys email address. We'll send you a secure verification link to choose a new password.
                </p>

                <div className="auth-field" style={{ marginTop: '16px' }}>
                  <label className="auth-label">Email Address</label>
                  <div className="auth-input-wrap">
                    <Mail size={16} className="auth-input-icon" />
                    <input
                      type="email"
                      className="auth-input"
                      placeholder="name@example.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="forgot-modal__actions">
                  <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                    Send Reset Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
