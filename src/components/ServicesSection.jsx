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
      case 'api':
        return (
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="16 18 22 12 16 6"/>
            <polyline points="8 6 2 12 8 18"/>
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
          Whether you need a quick one-time code for social login or hundreds of thousands of automated API requests, Chris Shopper delivers.
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
