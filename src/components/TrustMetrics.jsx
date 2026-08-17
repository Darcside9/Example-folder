import { statsData, trustHighlights } from '../data/statsData';

export default function TrustMetrics() {
  const getIconSvg = (icon) => {
    switch (icon) {
      case 'shield':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        );
      case 'zap':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
        );
      case 'refresh':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2">
            <polyline points="23 4 23 10 17 10"/>
            <polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
        );
      case 'code':
        return (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2">
            <polyline points="16 18 22 12 16 6"/>
            <polyline points="8 6 2 12 8 18"/>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <section className="section metrics-trust-section">
      {/* Stats Counter Bar */}
      <div className="stats-ticker-grid">
        {statsData.map((stat, idx) => (
          <div key={idx} className="stat-ticker-card">
            <strong className="stat-counter-number">{stat.value}</strong>
            <span className="stat-counter-label">{stat.label}</span>
            <span className="stat-counter-sub">{stat.subtext}</span>
          </div>
        ))}
      </div>

      {/* Trust Highlights Grid */}
      <div className="trust-pillars-grid">
        {trustHighlights.map((pillar, idx) => (
          <div key={idx} className="trust-pillar-card">
            <div className="trust-icon-box">{getIconSvg(pillar.icon)}</div>
            <h4>{pillar.title}</h4>
            <p>{pillar.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
