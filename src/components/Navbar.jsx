import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { siteConfig } from '../data/siteConfig';
import { useAuth } from '../lib/AuthContext';
import { useMediaQuery } from '../hooks/useMediaQuery';

export default function Navbar({ onOpenOrderModal }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  
  const { currentUser, logout, isAdmin } = useAuth();
  const location = useLocation();
  const isDesktop = useMediaQuery('(min-width: 960px)');

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
          <Link to="/dashboard" onClick={closeMenu} className={location.pathname === '/dashboard' ? 'active-link' : ''}>Dashboard</Link>
          {isAdmin && (
            <Link to="/admin" onClick={closeMenu} className={location.pathname === '/admin' ? 'active-link text-cyan' : 'text-cyan'}>Admin Panel</Link>
          )}
        </>
      )}
      {location.pathname === '/' ? (
        <>
          <a href="#logs-marketplace" onClick={closeMenu}>Account Logs</a>
          <a href="#services" onClick={closeMenu}>Services</a>
          <a href="#pricing" onClick={closeMenu}>Pricing</a>
          <a href="#faq" onClick={closeMenu}>FAQ</a>
        </>
      ) : (
        <>
          <Link to="/#logs-marketplace" onClick={closeMenu}>Account Logs</Link>
          <Link to="/#services" onClick={closeMenu}>Services</Link>
          <Link to="/#pricing" onClick={closeMenu}>Pricing</Link>
          <Link to="/#faq" onClick={closeMenu}>FAQ</Link>
        </>
      )}
      <a href={siteConfig.whatsappUrl} target="_blank" rel="noreferrer" onClick={closeMenu}>WhatsApp Support</a>
    </>
  );

  // Close menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeMenu();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="site-header">
      <div className="header-container">
        <Link to="/" className="brand brand-full" onClick={closeMenu} aria-label="Chris Shopper Home">
          <img src="/full_logo.svg" alt="Chris Shopper Gateway" className="brand-logo-full" />
        </Link>

        {isDesktop ? (
          /* Desktop Navigation */
          <>
            <nav className="site-nav" aria-label="Primary navigation">
              {renderLinks()}
            </nav>
            <div className="header-actions">
              {currentUser ? (
                <div className="user-session-wrapper">
                  <button type="button" className="user-pill-btn" onClick={() => setUserDropdownOpen(!userDropdownOpen)}>
                    <span className="user-avatar-circle">{(currentUser.email || 'U').charAt(0).toUpperCase()}</span>
                    <span className="user-balance-pill">{siteConfig.formatNaira(currentUser.balance || 0)}</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                  </button>
                  {userDropdownOpen && (
                    <div className="user-dropdown-menu">
                      <div className="user-dropdown-header">
                        <span className="user-dropdown-email">{currentUser.email}</span>
                        <span className="user-dropdown-status"><span className="pulse-indicator" style={{ display: 'inline-block', width: 6, height: 6, marginRight: 6 }} />Verified User • {siteConfig.formatNaira(currentUser.balance || 0)}</span>
                      </div>
                      <Link to="/dashboard" className="user-dropdown-item" onClick={() => setUserDropdownOpen(false)}>User Dashboard</Link>
                      {isAdmin && <Link to="/admin" className="user-dropdown-item" onClick={() => setUserDropdownOpen(false)}>Admin Panel</Link>}
                      <button type="button" className="user-dropdown-item" onClick={() => { setUserDropdownOpen(false); if (onOpenOrderModal) onOpenOrderModal(); }}>Buy Number</button>
                      <a href={siteConfig.whatsappUrl} target="_blank" rel="noreferrer" className="user-dropdown-item" onClick={() => setUserDropdownOpen(false)}>WhatsApp Support</a>
                      <button type="button" className="user-dropdown-item text-danger" onClick={() => { setUserDropdownOpen(false); logout(); }}>Sign Out</button>
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
          /* Mobile Navigation Actions */
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
          </div>
        )}
      </div>

      {/* Mobile Drawer and Backdrop */}
      {!isDesktop && (
        <>
          {mobileMenuOpen && (
            <div 
              className="navbar-backdrop" 
              onClick={closeMenu} 
              aria-hidden="true" 
            />
          )}
          <div className={`mobile-drawer ${mobileMenuOpen ? 'open' : ''}`}>
            <nav className="mobile-nav" aria-label="Mobile navigation">
              {renderLinks()}
            </nav>
            
            <div className="mobile-drawer-footer">
              {currentUser ? (
                <div className="mobile-user-box">
                  <div className="mobile-user-info">
                    <span className="user-email-label">{currentUser.email}</span>
                    <span className="user-balance-badge">{siteConfig.formatNaira(currentUser.balance || 0)}</span>
                  </div>
                  <div className="mobile-nav-links-grid">
                    <Link to="/dashboard" className="btn btn-secondary btn-sm btn-full" onClick={closeMenu}>User Dashboard</Link>
                    {isAdmin && <Link to="/admin" className="btn btn-secondary btn-sm btn-full" onClick={closeMenu}>Admin Panel</Link>}
                  </div>
                  <button type="button" className="btn btn-ghost btn-sm btn-full text-danger" onClick={() => { closeMenu(); logout(); }}>Sign Out</button>
                </div>
              ) : (
                <div className="mobile-auth-btn-grid">
                  <Link to="/auth?mode=login" className="btn btn-secondary btn-sm" onClick={closeMenu}>Sign In</Link>
                  <Link to="/auth?mode=signup" className="btn btn-primary btn-sm" onClick={closeMenu}>Create Account</Link>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  );
}
