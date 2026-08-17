export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-top-grid">
        <div className="footer-brand-col">
          <a href="#" className="brand footer-logo">
            <span className="brand-badge">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
            </span>
            <span className="brand-text">Chris <span className="brand-highlight">Shopper</span></span>
          </a>
          <p className="footer-tagline">
            Enterprise-grade SMS verification and non-VoIP temporary phone numbers for global developer and retail authentication.
          </p>
          <div className="footer-status-pill">
            <span className="pulse-dot" />
            <span>All SIM Gateway Clusters Operational</span>
          </div>
        </div>

        <div className="footer-nav-columns">
          <div className="footer-col">
            <h4>Products</h4>
            <a href="#services">One-Time SMS Codes</a>
            <a href="#services">Dedicated Line Rental</a>
            <a href="#pricing">Volume & Wholesale</a>
            <a href="#api">Developer REST API</a>
          </div>

          <div className="footer-col">
            <h4>Supported Apps</h4>
            <a href="#pricing">OpenAI / ChatGPT</a>
            <a href="#pricing">Telegram Verification</a>
            <a href="#pricing">WhatsApp Business</a>
            <a href="#pricing">Google / Gmail</a>
            <a href="#pricing">Discord & Steam</a>
          </div>

          <div className="footer-col">
            <h4>Developers</h4>
            <a href="#api">API Documentation</a>
            <a href="#api">Webhook Guides</a>
            <a href="#api">Rate Limits & SLAs</a>
            <a href="#support">Uptime Status</a>
          </div>

          <div className="footer-col">
            <h4>Company & Legal</h4>
            <a href="#support">Contact Support</a>
            <a href="#faq">FAQ</a>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Security & Compliance</a>
          </div>
        </div>
      </div>

      <div className="footer-bottom-bar">
        <p className="copyright-text">
          © {new Date().getFullYear()} Chris Shopper Platform. All rights reserved. Real carrier SIM infrastructure.
        </p>

        <div className="payment-badges-row">
          <span className="payment-pill">💳 Visa / Mastercard</span>
          <span className="payment-pill">🍏 Apple Pay</span>
          <span className="payment-pill">⚡ Bitcoin / USDT / Crypto</span>
        </div>
      </div>
    </footer>
  );
}
