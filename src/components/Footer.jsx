import { siteConfig } from '../data/siteConfig';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-top-grid">
        <div className="footer-brand-col">
          <a href="#" className="brand footer-logo brand-full" aria-label="Chris Shopper Home">
            <img src="/full_logo.svg" alt="Chris Shopper Gateway" className="brand-logo-full" />
          </a>
          <p className="footer-tagline">
            Enterprise-grade SMS verification and non-VoIP temporary phone numbers for private and retail authentication.
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
            <a href="#how-it-works">How It Works</a>
          </div>

          <div className="footer-col">
            <h4>Supported Apps</h4>
            <a href="#pricing">Telegram Verification</a>
            <a href="#pricing">WhatsApp Business</a>
            <a href="#pricing">OpenAI / ChatGPT</a>
            <a href="#pricing">Google & Gmail</a>
          </div>

          <div className="footer-col">
            <h4>Help & Guidance</h4>
            <a href={siteConfig.whatsappUrl} target="_blank" rel="noreferrer">
              WhatsApp: {siteConfig.formattedPhone}
            </a>
            <a href={`mailto:${siteConfig.adminEmail}`}>
              Email: {siteConfig.adminEmail}
            </a>
            <a href="#support">Direct Support Inquiry</a>
            <a href="#faq">Frequently Answered Questions</a>
            <a href="#how-it-works">Verification Guide</a>
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
