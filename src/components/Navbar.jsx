import { useState } from 'react';

export default function Navbar({ onOpenOrderModal }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [lang, setLang] = useState('EN');
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  const languages = ['EN', 'ES', 'FR', 'DE', 'PT', 'RU', 'ZH'];

  return (
    <header className="site-header">
      <div className="header-container">
        <a href="#" className="brand" aria-label="Chris Shopper Home">
          <span className="brand-badge">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              <path d="M14 2v4"/>
              <path d="M18 6l3-3"/>
              <path d="M18 2h4"/>
            </svg>
          </span>
          <span className="brand-text">Chris <span className="brand-highlight">Shopper</span></span>
        </a>

        <nav className={`site-nav ${mobileMenuOpen ? 'mobile-open' : ''}`} aria-label="Primary navigation">
          <a href="#services" onClick={() => setMobileMenuOpen(false)}>Services</a>
          <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
          <a href="#pricing" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
          <a href="#api" onClick={() => setMobileMenuOpen(false)}>API Docs</a>
          <a href="#support" onClick={() => setMobileMenuOpen(false)}>Support</a>
          <a href="#faq" onClick={() => setMobileMenuOpen(false)}>FAQ</a>

          <div className="mobile-nav-actions">
            <button 
              type="button" 
              className="btn btn-primary btn-sm"
              onClick={() => {
                setMobileMenuOpen(false);
                if (onOpenOrderModal) onOpenOrderModal();
              }}
            >
              Get Number
            </button>
          </div>
        </nav>

        <div className="header-actions">
          <div className="lang-selector-wrapper">
            <button
              className="lang-btn"
              type="button"
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              aria-label="Select Language"
            >
              <span>🌐 {lang}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
            {langDropdownOpen && (
              <div className="lang-dropdown">
                {languages.map((l) => (
                  <button
                    key={l}
                    type="button"
                    className={`lang-option ${lang === l ? 'active' : ''}`}
                    onClick={() => {
                      setLang(l);
                      setLangDropdownOpen(false);
                    }}
                  >
                    {l}
                  </button>
                ))}
              </div>
            )}
          </div>

          <a href="#api" className="btn btn-ghost">Developer API</a>
          <button 
            type="button" 
            className="btn btn-primary btn-header"
            onClick={onOpenOrderModal}
          >
            Buy Number
          </button>

          <button
            className="mobile-toggle"
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
