import { services } from '../data/servicesData';

export default function ServicesSection({ onSelectService }) {
  const getServiceSvg = (id) => {
    switch (id) {
      case 'buy':
        return (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
            <line x1="12" y1="18" x2="12.01" y2="18"/>
            <path d="M9 7h6"/>
          </svg>
        );
      case 'rent':
        return (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
        );
      case 'bulk':
        return (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="12 2 2 7 12 12 22 7 12 2"/>
            <polyline points="2 17 12 22 22 17"/>
            <polyline points="2 12 12 17 22 12"/>
          </svg>
        );
      case 'logs':
        return (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <section id="services" className="section services-section">
      <div className="section-heading">
        <span className="eyebrow">Carrier Solutions</span>
        <h2>Enterprise & Retail SMS Services</h2>
        <p>
          Whether you need a quick one-time code for social login or large-scale wholesale verifications, Chris Shopper delivers.
        </p>
      </div>

      <div className="service-grid">
        {services.map((service) => (
          <article
            key={service.id}
            className={`service-card ${service.popular ? 'featured-service' : ''}`}
          >
            {service.popular && <span className="featured-badge">Most Popular</span>}
            <div className="service-header">
              <div className="service-icon-box">{getServiceSvg(service.id)}</div>
              <span className="service-sub-badge">{service.badge}</span>
            </div>

            <h3>{service.title}</h3>
            <p>{service.description}</p>

            <ul className="service-features">
              {service.items.map((item, idx) => (
                <li key={idx}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="service-card-footer">
              <a 
                href={service.href} 
                className="btn btn-outline-card"
                onClick={() => {
                  if (onSelectService && service.id === 'buy') onSelectService();
                }}
              >
                {service.cta}
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
