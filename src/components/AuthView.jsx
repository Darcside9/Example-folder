import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { appwriteSignIn, appwriteSignUp } from '../lib/appwriteAuth';
import { siteConfig } from '../data/siteConfig';
import { useAuth } from '../lib/AuthContext';

export default function AuthView() {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') || 'login';
  
  const [mode, setMode] = useState(initialMode); // 'login' | 'signup' | 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [contact, setContact] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [forgotStep, setForgotStep] = useState(1); // 1: input, 2: success

  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    setMode(searchParams.get('mode') || 'login');
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    if (mode === 'forgot') {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        setForgotStep(2);
      }, 700);
      return;
    }

    if (!password) {
      setErrorMsg('Please enter your password.');
      return;
    }

    if (mode === 'signup') {
      if (password.length < 8) {
        setErrorMsg('Password must be at least 8 characters long.');
        return;
      }
      if (!contact.trim()) {
        setErrorMsg('Please enter your WhatsApp phone number or contact info.');
        return;
      }
      if (!termsAccepted) {
        setErrorMsg('Please accept the Terms of Service & Privacy Policy.');
        return;
      }
    }

    setIsLoading(true);
    try {
      if (mode === 'login') {
        const { user } = await appwriteSignIn(email, password);
        login(user);
        if (user.is_admin) {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      } else {
        const { user } = await appwriteSignUp(email, password, contact);
        login(user);
        if (user.is_admin) {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'An error occurred. Please verify your details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <div className="auth-page-wrapper">
      {/* Top Bar with Back Button */}
      <div className="auth-top-bar">
        <button type="button" className="auth-back-btn" onClick={handleBackToHome}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="19" y1="12" x2="5" y2="12"/>
            <polyline points="12 19 5 12 12 5"/>
          </svg>
          <span>Back to Home</span>
        </button>

        <a href="#" onClick={(e) => { e.preventDefault(); handleBackToHome(); }} className="brand auth-brand">
          <span className="brand-badge">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
          </span>
          <span className="brand-text">Chris <span className="brand-highlight">Shopper</span></span>
        </a>
      </div>

      <div className="auth-container">
        {/* Left Side: Value Proposition & Security Highlights */}
        <div className="auth-info-col">
          <span className="eyebrow">Enterprise SMS Gateway</span>
          <h1>
            {mode === 'signup' && <>Create Your <br/><span className="text-gradient">Chris Shopper Account</span></>}
            {mode === 'login' && <>Welcome Back <br/><span className="text-gradient">to Your Account</span></>}
            {mode === 'forgot' && <>Reset Your <br/><span className="text-gradient">Account Password</span></>}
          </h1>

          <p className="auth-lead-text">
            {mode === 'signup' && 'Join Chris Shopper to provision non-VoIP carrier lines, receive OTPs in real-time, and manage your verification numbers.'}
            {mode === 'login' && 'Sign in to access your dashboard, monitor active virtual numbers, copy verification codes, and manage your balance.'}
            {mode === 'forgot' && 'Enter the email address associated with your account and we will send you verification instructions.'}
          </p>

          <div className="auth-feature-list">
            <div className="auth-feature-item">
              <div className="auth-feat-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <div>
                <strong>Non-VoIP Physical SIM Routing</strong>
                <p>100% genuine carrier routing with 99.9% SMS delivery.</p>
              </div>
            </div>

            <div className="auth-feature-item">
              <div className="auth-feat-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.2">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                </svg>
              </div>
              <div>
                <strong>WhatsApp Direct Support & Notifications</strong>
                <p>Real-time account alerts and instant 1-on-1 human support.</p>
              </div>
            </div>

            <div className="auth-feature-item">
              <div className="auth-feat-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#818cf8" strokeWidth="2.2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <div>
                <strong>Zero KYC & Instant Auto-Refund</strong>
                <p>Zero balance charge if an SMS OTP is not delivered.</p>
              </div>
            </div>
          </div>

          <div className="auth-whatsapp-support-pill">
            <span>💬 Need quick help?</span>
            <a href={siteConfig.whatsappUrl} target="_blank" rel="noreferrer">
              Chat on WhatsApp →
            </a>
          </div>
        </div>

        {/* Right Side: Auth Card Form */}
        <div className="auth-form-col">
          <div className="auth-card">
            {/* Mode Switcher Tabs */}
            <div className="auth-tabs">
              <button 
                type="button" 
                className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
                onClick={() => { setMode('login'); setErrorMsg(null); navigate('/auth?mode=login', { replace: true }); }}
              >
                Sign In
              </button>
              <button 
                type="button" 
                className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
                onClick={() => { setMode('signup'); setErrorMsg(null); navigate('/auth?mode=signup', { replace: true }); }}
              >
                Create Account
              </button>
            </div>

            {errorMsg && (
              <div className="auth-error-banner">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>{errorMsg}</span>
              </div>
            )}

            {mode === 'forgot' && forgotStep === 2 ? (
              <div className="auth-success-step">
                <div className="auth-success-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <h3>Password Reset Sent</h3>
                <p>
                  Instructions have been sent to <strong>{email}</strong>. Please check your inbox or contact us on WhatsApp for rapid password recovery.
                </p>
                <button 
                  type="button" 
                  className="btn btn-primary btn-full"
                  onClick={() => { setMode('login'); setForgotStep(1); navigate('/auth?mode=login', { replace: true }); }}
                >
                  Back to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="auth-form">
                {/* Email Address */}
                <div className="auth-input-group">
                  <label htmlFor="authEmail">Email Address</label>
                  <div className="auth-input-inner">
                    <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                    <input
                      id="authEmail"
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                {/* Password (for Login and Signup) */}
                {mode !== 'forgot' && (
                  <div className="auth-input-group">
                    <label htmlFor="authPassword">Password</label>
                    <div className="auth-input-inner">
                      <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                      <input
                        id="authPassword"
                        type={passwordVisible ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        className="password-toggle-btn"
                        onClick={() => setPasswordVisible(!passwordVisible)}
                        aria-label="Toggle password visibility"
                      >
                        {passwordVisible ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                            <line x1="1" y1="1" x2="23" y2="23"/>
                          </svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                        )}
                      </button>
                    </div>
                    {mode === 'signup' && (
                      <span className="input-hint">Minimum 8 characters with letters & numbers.</span>
                    )}
                  </div>
                )}

                {/* Contact Info Field (for WhatsApp notifications on Signup) */}
                {mode === 'signup' && (
                  <div className="auth-input-group">
                    <label htmlFor="authContact">WhatsApp Number / Telegram Handle</label>
                    <div className="auth-input-inner">
                      <svg className="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                      </svg>
                      <input
                        id="authContact"
                        type="text"
                        required
                        placeholder="+1 (555) 000-0000 or @username"
                        value={contact}
                        onChange={(e) => setContact(e.target.value)}
                      />
                    </div>
                    <span className="input-hint">Used to deliver OTP notifications and direct support.</span>
                  </div>
                )}

                {/* Login Options: Remember Me & Forgot Password */}
                {mode === 'login' && (
                  <div className="auth-form-options">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                      />
                      <span>Remember me</span>
                    </label>
                    <button
                      type="button"
                      className="forgot-link-btn"
                      onClick={() => { setMode('forgot'); setErrorMsg(null); }}
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                {/* Signup Terms Checkbox */}
                {mode === 'signup' && (
                  <div className="auth-form-options">
                    <label className="checkbox-label terms-checkbox">
                      <input
                        type="checkbox"
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                      />
                      <span>
                        I agree to Chris Shopper Terms of Service & Privacy Policy
                      </span>
                    </label>
                  </div>
                )}

                {/* Submit Action Button */}
                <button
                  type="submit"
                  className="btn btn-primary btn-full btn-lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="btn-spinner" />
                      <span>Processing...</span>
                    </>
                  ) : mode === 'login' ? (
                    <span>Sign In to Account →</span>
                  ) : mode === 'signup' ? (
                    <span>Create Free Account →</span>
                  ) : (
                    <span>Send Reset Instructions</span>
                  )}
                </button>

                {/* Switcher links */}
                <div className="auth-footer-prompt">
                  {mode === 'login' ? (
                    <p>
                      Don&apos;t have an account?{' '}
                      <button type="button" onClick={() => { setMode('signup'); setErrorMsg(null); navigate('/auth?mode=signup', { replace: true }); }}>
                        Sign Up Now
                      </button>
                    </p>
                  ) : mode === 'signup' ? (
                    <p>
                      Already registered?{' '}
                      <button type="button" onClick={() => { setMode('login'); setErrorMsg(null); navigate('/auth?mode=login', { replace: true }); }}>
                        Sign In
                      </button>
                    </p>
                  ) : (
                    <p>
                      Remembered your password?{' '}
                      <button type="button" onClick={() => { setMode('login'); setErrorMsg(null); navigate('/auth?mode=login', { replace: true }); }}>
                        Back to Login
                      </button>
                    </p>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
