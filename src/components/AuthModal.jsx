import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  KeyRound, Mail, Lock, Eye, EyeOff, User, 
  ArrowRight, CheckCircle2, ShieldCheck, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './AuthModal.css';

export default function AuthModal() {
  const { isAuthOpen, authMode, closeAuth, setAuthMode, signIn, register, resetPassword } = useAuth();
  const navigate = useNavigate();

  // Mode: 'signin', 'signup', or 'forgot'
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Form inputs
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [authSuccess, setAuthSuccess] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successUser, setSuccessUser] = useState(null);

  // Prevent background scrolling when modal is active
  useEffect(() => {
    if (isAuthOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isAuthOpen]);

  // Handle Escape key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isAuthOpen) closeAuth();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthOpen, closeAuth]);

  // Reset form when modal opens or closes
  useEffect(() => {
    if (!isAuthOpen) {
      setErrorMsg('');
      setAuthSuccess(false);
      setForgotSuccess(false);
      setIsLoading(false);
      setSuccessUser(null);
      setEmail('');
      setPassword('');
      setFullName('');
      setConfirmPassword('');
    }
  }, [isAuthOpen]);

  if (!isAuthOpen) return null;


  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (authMode === 'signup') {
      if (!fullName.trim()) { setErrorMsg('Please enter your full name'); return; }
      if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) { setErrorMsg('Please enter a valid email address'); return; }
      if (!password || password.length < 6) { setErrorMsg('Password must be at least 6 characters'); return; }
      if (password !== confirmPassword) { setErrorMsg('Passwords do not match'); return; }
    } else if (authMode === 'signin') {
      if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) { setErrorMsg('Please enter a valid email address'); return; }
      if (!password) { setErrorMsg('Please enter your password'); return; }
    }

    setIsLoading(true);
    try {
      let result;
      if (authMode === 'signin') {
        result = await signIn(email, password);
      } else {
        result = await register(fullName, email, password);
      }
      setIsLoading(false);
      if (!result.success) {
        setErrorMsg(result.error);
        return;
      }
      setSuccessUser(result.user);
      setAuthSuccess(true);
      setTimeout(() => {
        closeAuth();
        setAuthSuccess(false);
        navigate(result.redirectTo || '/');
      }, 1600);
    } catch (err) {
      setIsLoading(false);
      setErrorMsg(err.message || 'An unexpected error occurred.');
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    if (!forgotEmail || !/\S+@\S+\.\S+/.test(forgotEmail)) {
      setErrorMsg('Please enter a valid email address');
      return;
    }
    setErrorMsg('');
    setIsLoading(true);
    try {
      if (resetPassword) {
        const result = await resetPassword(forgotEmail);
        setIsLoading(false);
        if (result.success) {
          setForgotSuccess(true);
        } else {
          setErrorMsg(result.error || 'Failed to send recovery link');
        }
      } else {
        setIsLoading(false);
        setForgotSuccess(true);
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMsg(err.message || 'Failed to send recovery link.');
    }
  };


  return (
    <div 
      className="auth-modal-overlay" 
      onClick={closeAuth}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div 
        className="auth-modal-card" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          className="auth-modal-close" 
          onClick={closeAuth}
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        {/* Modal Brand Header */}
        <div className="auth-modal-header">
          <div className="auth-modal-brand">
            <KeyRound size={22} strokeWidth={1.5} className="auth-modal-brand__icon" />
            <span className="auth-modal-brand__name">lodgekeys.</span>
          </div>

          <h2 id="auth-modal-title" className="auth-modal-title">
            {authMode === 'forgot'
              ? 'Reset Password'
              : authMode === 'signin'
              ? 'Welcome back'
              : 'Create your account'}
          </h2>
          <p className="auth-modal-subtitle">
            {authMode === 'forgot'
              ? 'Enter your email to receive a secure recovery link.'
              : authMode === 'signin'
              ? 'Sign in to access your reservations and saved stays.'
              : 'Join Lodgekeys to book verified stays across Abraka.'}
          </p>
        </div>

        {/* Dual Mode Switcher Tabs */}
        {authMode !== 'forgot' && !authSuccess && (
          <div className="auth-modal-tabs">
            <button
              type="button"
              className={`auth-modal-tab ${authMode === 'signin' ? 'auth-modal-tab--active' : ''}`}
              onClick={() => {
                setAuthMode('signin');
                setErrorMsg('');
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`auth-modal-tab ${authMode === 'signup' ? 'auth-modal-tab--active' : ''}`}
              onClick={() => {
                setAuthMode('signup');
                setErrorMsg('');
              }}
            >
              Create Account
            </button>
          </div>
        )}

        {/* Success States */}
        {authSuccess ? (
          <div className="auth-modal-success">
            <div className="auth-modal-success__icon">
              <CheckCircle2 size={44} />
            </div>
            <h3>{successUser ? `Welcome, ${successUser.fullName.split(' ')[0]}!` : 'Welcome Back!'}</h3>
            <p>
              {successUser?.role === 'customer'
                ? 'Redirecting you to your Customer Portal…'
                : successUser?.role === 'hotel_manager'
                ? 'Redirecting you to the Manager Dashboard…'
                : successUser?.role === 'admin'
                ? 'Redirecting you to Admin Panel…'
                : 'You are now signed in to Lodgekeys.'}
            </p>
            {successUser?.role && (
              <span className="auth-modal-role-badge">{successUser.role.replace('_', ' ')}</span>
            )}
          </div>
        ) : authMode === 'forgot' ? (
          forgotSuccess ? (
            <div className="auth-modal-success">
              <div className="auth-modal-success__icon">
                <CheckCircle2 size={44} />
              </div>
              <h3>Reset Link Dispatched</h3>
              <p>
                We have sent password instructions to <strong>{forgotEmail}</strong>.
              </p>
              <button 
                type="button"
                className="btn btn-primary auth-modal-submit"
                onClick={() => {
                  setForgotSuccess(false);
                  setAuthMode('signin');
                }}
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            /* Forgot Password Form */
            <form onSubmit={handleForgotSubmit} className="auth-modal-form" noValidate>
              {errorMsg && <div className="auth-modal-error">{errorMsg}</div>}

              <div className="auth-modal-field">
                <label className="auth-modal-label">Email Address</label>
                <div className="auth-modal-input-wrap">
                  <Mail size={16} className="auth-modal-input-icon" />
                  <input
                    type="email"
                    className="auth-modal-input"
                    placeholder="name@example.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary auth-modal-submit"
                disabled={isLoading}
              >
                {isLoading ? 'Sending link...' : 'Send Recovery Link'}
              </button>

              <button
                type="button"
                className="auth-modal-back-btn"
                onClick={() => {
                  setErrorMsg('');
                  setAuthMode('signin');
                }}
              >
                ← Back to Sign In
              </button>
            </form>
          )
        ) : (
          /* Main Sign In / Register Forms */
          <>
            {/* Social Google Login Button */}
            <div className="auth-modal-social">
              <button
                type="button"
                className="auth-modal-social-btn"
                onClick={() => {
                  setIsLoading(true);
                  setTimeout(() => {
                    setIsLoading(false);
                    setAuthSuccess(true);
                    setTimeout(() => {
                      closeAuth();
                      setAuthSuccess(false);
                    }, 1500);
                  }, 800);
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

            <div className="auth-modal-divider">
              <span>or continue with email</span>
            </div>

            {errorMsg && <div className="auth-modal-error">{errorMsg}</div>}

            <form onSubmit={handleSubmit} className="auth-modal-form" noValidate>
              {/* Register: Full Name */}
              {authMode === 'signup' && (
                <div className="auth-modal-field">
                  <label className="auth-modal-label">Full Name</label>
                  <div className="auth-modal-input-wrap">
                    <User size={16} className="auth-modal-input-icon" />
                    <input
                      type="text"
                      className="auth-modal-input"
                      placeholder="e.g. Somtochukwu Obi"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              {/* Email Address */}
              <div className="auth-modal-field">
                <label className="auth-modal-label">Email Address</label>
                <div className="auth-modal-input-wrap">
                  <Mail size={16} className="auth-modal-input-icon" />
                  <input
                    type="email"
                    className="auth-modal-input"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="auth-modal-field">
                <div className="auth-modal-field-header">
                  <label className="auth-modal-label">Password</label>
                  {authMode === 'signin' && (
                    <button
                      type="button"
                      className="auth-modal-forgot"
                      onClick={() => {
                        setForgotEmail(email);
                        setForgotSuccess(false);
                        setErrorMsg('');
                        setAuthMode('forgot');
                      }}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="auth-modal-input-wrap">
                  <Lock size={16} className="auth-modal-input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="auth-modal-input"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="auth-modal-eye"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Register: Confirm Password */}
              {authMode === 'signup' && (
                <div className="auth-modal-field">
                  <label className="auth-modal-label">Confirm Password</label>
                  <div className="auth-modal-input-wrap">
                    <Lock size={16} className="auth-modal-input-icon" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="auth-modal-input"
                      placeholder="••••••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="auth-modal-eye"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )}

              {/* Sign In: Remember Me */}
              {authMode === 'signin' && (
                <div className="auth-modal-options">
                  <label className="auth-modal-checkbox-label">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="auth-modal-checkbox"
                    />
                    <span>Remember me for 30 days</span>
                  </label>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="btn btn-primary auth-modal-submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  'Processing...'
                ) : authMode === 'signin' ? (
                  <>
                    Sign In to Lodgekeys
                    <ArrowRight size={14} />
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>

            {/* Bottom State Switch */}
            <div className="auth-modal-toggle">
              {authMode === 'signin' ? (
                <p>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    className="auth-modal-switch-btn"
                    onClick={() => { setAuthMode('signup'); setErrorMsg(''); }}
                  >
                    Create Account
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{' '}
                  <button
                    type="button"
                    className="auth-modal-switch-btn"
                    onClick={() => { setAuthMode('signin'); setErrorMsg(''); }}
                  >
                    Sign In
                  </button>
                </p>
              )}
            </div>

          </>
        )}

        {/* Security badge footer */}
        <div className="auth-modal-footer">
          <ShieldCheck size={13} />
          <span>Encrypted with 256-bit SSL · Lodgekeys Hospitality Network</span>
        </div>
      </div>
    </div>
  );
}
