import LiveTerminalDemo from './LiveTerminalDemo';

export default function Hero({ onOpenOrderModal }) {
  return (
    <section className="hero section-hero">
      <div className="hero-copy">
        <div className="hero-badge-pill">
          <span className="pulse-indicator" />
          <span>Next-Gen SMS Verification Gateway</span>
        </div>

        <h1>
          Instant <span className="text-gradient">US & Global Numbers</span> for SMS Verification
        </h1>

        <p className="hero-lead">
          Receive one-time verification codes and rent dedicated non-VoIP carrier phone numbers.
          Bypass strict security filters on Telegram, WhatsApp, OpenAI, Google, Apple, and 120+ platforms with 99.9% delivery.
        </p>

        <div className="hero-actions">
          <button 
            type="button" 
            className="btn btn-primary btn-lg"
            onClick={onOpenOrderModal}
          >
            <span>Buy Numbers from $0.08</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12 5 19 12 12 19"/>
            </svg>
          </button>
          
          <a href="#how-it-works" className="btn btn-secondary btn-lg">
            See How It Works
          </a>
        </div>

        <div className="hero-guarantees">
          <div className="guarantee-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="3">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span>100% Real Physical SIMs</span>
          </div>
          <div className="guarantee-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="3">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span>No KYC / Zero Logs</span>
          </div>
          <div className="guarantee-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="3">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span>Instant Auto-Refund</span>
          </div>
        </div>
      </div>

      <div className="hero-interactive-col">
        <LiveTerminalDemo />
      </div>
    </section>
  );
}
