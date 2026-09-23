import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { siteConfig } from '../data/siteConfig';
import { useAuth } from '../lib/AuthContext';
import { useMediaQuery } from '../hooks/useMediaQuery';

export default function Navbar({ onOpenOrderModal }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lang, setLang] = useState('EN');
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  
  const { currentUser, logout, isAdmin } = useAuth();
  const location = useLocation();
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const languages = ['EN', 'ES', 'FR', 'DE', 'PT', 'RU', 'ZH'];

  const closeMenu = () => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  };

  // Prevent scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen && !isDesktop) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen, isDesktop]);

  // Main Links
  const renderLinks = () => (
    <>
      <Link to="/" onClick={closeMenu} className={location.pathname === '/' ? 'active-link' : ''}>Home</Link>
      {currentUser && (
        <>
          <Link to="/dashboard" onClick={closeMenu} className={location.pathname === '/dashboard' ? 'active-link' : ''}>📊 Dashboard</Link>
          {isAdmin && (
            <Link to="/admin" onClick={closeMenu} className={location.pathname === '/admin' ? 'active-link text-cyan' : 'text-cyan'}>👑 Admin Panel</Link>
          )}
        </>
      )}
      {location.pathname === '/' ? (
        <>
          <a href="#logs-marketplace" onClick={closeMenu}>🔑 Account Logs</a>
          <a href="#services" onClick={closeMenu}>Services</a>
          <a href="#pricing" onClick={closeMenu}>Pricing</a>
          <a href="#faq" onClick={closeMenu}>FAQ</a>
        </>
      ) : (
        <>
          <Link to="/#logs-marketplace" onClick={closeMenu}>🔑 Account Logs</Link>
          <Link to="/" onClick={closeMenu}>Services</Link>
          <Link to="/" onClick={closeMenu}>Pricing</Link>
          <Link to="/" onClick={closeMenu}>FAQ</Link>
        </>
      )}
      <a href={siteConfig.whatsappUrl} target="_blank" rel="noreferrer" onClick={closeMenu}>💬 WhatsApp Support</a>
    </>
  );

  return (
    <header className="site-header">
      <div className="header-container">
        <Link to="/" className="brand" onClick={closeMenu} aria-label="Chris Shopper Home">
          <span className="brand-badge">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              <path d="M14 2v4"/>
              <path d="M18 6l3-3"/>
              <path d="M18 2h4"/>
            </svg>
          </span>
          <span className="brand-text">Chris <span className="brand-highlight">Shopper</span></span>
        </Link>

        {isDesktop ? (
          /* Desktop Navigation */
          <>
            <nav className="site-nav" aria-label="Primary navigation">
              {renderLinks()}
            </nav>
            <div className="header-actions">
              <div className="lang-selector-wrapper">
                <button className="lang-btn" type="button" onClick={() => setLangDropdownOpen(!langDropdownOpen)}>
                  <span>🌐 {lang}</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                </button>
                {langDropdownOpen && (
                  <div className="lang-dropdown">
                    {languages.map((l) => (
                      <button key={l} type="button" className={`lang-option ${lang === l ? 'active' : ''}`} onClick={() => { setLang(l); setLangDropdownOpen(false); }}>{l}</button>
                    ))}
                  </div>
                )}
              </div>
              {currentUser ? (
                <div className="user-session-wrapper">
                  <button type="button" className="user-pill-btn" onClick={() => setUserDropdownOpen(!userDropdownOpen)}>
                    <span className="user-avatar-circle">{(currentUser.email || 'U').charAt(0).toUpperCase()}</span>
                    <span className="user-balance-pill">${Number(currentUser.balance || 0).toFixed(2)}</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                  </button>
                  {userDropdownOpen && (
                    <div className="user-dropdown-menu">
                      <div className="user-dropdown-header">
                        <span className="user-dropdown-email">{currentUser.email}</span>
                        <span className="user-dropdown-status">🟢 Verified User • ${Number(currentUser.balance || 0).toFixed(2)}</span>
                      </div>
                      <Link to="/dashboard" className="user-dropdown-item" onClick={() => setUserDropdownOpen(false)}>📊 User Dashboard</Link>
                      {isAdmin && <Link to="/admin" className="user-dropdown-item" onClick={() => setUserDropdownOpen(false)}>👑 Admin Panel</Link>}
                      <button type="button" className="user-dropdown-item" onClick={() => { setUserDropdownOpen(false); if (onOpenOrderModal) onOpenOrderModal(); }}>⚡ Buy Number</button>
                      <a href={siteConfig.whatsappUrl} target="_blank" rel="noreferrer" className="user-dropdown-item" onClick={() => setUserDropdownOpen(false)}>💬 WhatsApp Support</a>
                      <button type="button" className="user-dropdown-item text-danger" onClick={() => { setUserDropdownOpen(false); logout(); }}>🚪 Sign Out</button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="desktop-auth-actions">
                  <Link to="/auth?mode=login" className="btn btn-ghost btn-auth-login">Login</Link>
                  <Link to="/auth?mode=signup" className="btn btn-primary btn-sm btn-auth-signup">Sign Up</Link>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Mobile Navigation */
          <div className="header-actions">
            {!currentUser && (
              <Link to="/auth?mode=login" className="mobile-header-signin-btn" aria-label="Sign In">Sign In</Link>
            )}
            <button className="mobile-toggle" type="button" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle Menu" aria-expanded={mobileMenuOpen}>
              {mobileMenuOpen ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              )}
            </button>

            {/* Mobile Drawer */}
            <div className={`mobile-drawer ${mobileMenuOpen ? 'open' : ''}`}>
              <nav className="mobile-nav" aria-label="Mobile navigation">
                {renderLinks()}
              </nav>
              
              <div className="mobile-drawer-footer">
                <div className="lang-selector-wrapper-mobile">
                  <span className="lang-label">Language:</span>
                  <div className="lang-buttons-row">
                    {languages.slice(0, 4).map((l) => (
                      <button key={l} type="button" className={`lang-option-mobile ${lang === l ? 'active' : ''}`} onClick={() => setLang(l)}>{l}</button>
                    ))}
                  </div>
                </div>

                {currentUser ? (
                  <div className="mobile-user-box">
                    <div className="mobile-user-info">
                      <span className="user-email-label">{currentUser.email}</span>
                      <span className="user-balance-badge">${Number(currentUser.balance || 0).toFixed(2)}</span>
                    </div>
                    <div className="mobile-nav-links-grid">
                      <Link to="/dashboard" className="btn btn-secondary btn-sm btn-full" onClick={closeMenu}>📊 My Dashboard</Link>
                      {isAdmin && <Link to="/admin" className="btn btn-secondary btn-sm btn-full" onClick={closeMenu}>👑 Admin Panel</Link>}
                    </div>
                    <button type="button" className="btn btn-ghost btn-sm btn-full text-danger" onClick={() => { closeMenu(); logout(); }}>🚪 Sign Out</button>
                  </div>
                ) : (
                  <div className="mobile-auth-btn-grid">
                    <Link to="/auth?mode=login" className="btn btn-secondary btn-sm" onClick={closeMenu}>Sign In</Link>
                    <Link to="/auth?mode=signup" className="btn btn-primary btn-sm" onClick={closeMenu}>Create Account</Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
