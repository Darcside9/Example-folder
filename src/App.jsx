import { useState } from 'react';

const services = [
  {
    icon: '📱',
    title: 'Buy SMS Numbers',
    description: 'Purchase verified US phone numbers for one-time use with all major platforms.',
    items: ['Real US phone numbers', 'Instant activation', 'All major platforms supported'],
    href: '#pricing',
    cta: 'View pricing →',
  },
  {
    icon: '⏳',
    title: 'Rent SMS Numbers',
    description: 'Temporary access to dedicated phone numbers for development and testing.',
    items: ['Hourly, daily or weekly rental', 'Perfect for developers', 'Extend or cancel anytime'],
    href: '#pricing',
    cta: 'View pricing →',
  },
  {
    icon: '💵',
    title: 'Sell Your Numbers',
    description: 'Turn your unused phone numbers into profit. We buy US phone numbers for our verification service.',
    items: ['Competitive rates', 'Fast payment processing', 'Multiple payment methods'],
    href: '#support',
    cta: 'Learn more →',
  },
];

const pricingPlans = [
  { title: 'Google', price: '$0.08', label: '/ verification', description: 'Verify your Google accounts with our reliable US numbers.' },
  { title: 'Facebook', price: '$0.20', label: '/ verification', description: 'Create and verify Facebook accounts with our premium service.' },
  { title: 'WhatsApp', price: '$0.20', label: '/ verification', description: 'Instant WhatsApp verification with our reliable SMS system.' },
  { title: 'Telegram', price: '$0.20', label: '/ verification', description: 'Fast and reliable Telegram verification service.' },
  { title: 'Tinder', price: '$0.08', label: '/ verification', description: 'Verify your Tinder account with our dedicated service.' },
  { title: 'YouTube', price: '$0.10', label: '/ verification', description: 'Verify YouTube accounts with our fast SMS service.' },
  { title: 'Spotify', price: '$0.08', label: '/ verification', description: 'Verify Spotify accounts with our reliable SMS system.' },
  { title: 'Twitter', price: '$0.08', label: '/ verification', description: 'Verify Twitter accounts with our premium SMS service.' },
];

const faqs = [
  {
    question: 'How long is a phone number active?',
    answer: 'Most numbers remain active for the duration of your purchase window. Active sessions can be renewed as needed.',
  },
  {
    question: 'Can I use the same number for different services?',
    answer: 'Numbers are typically service-specific for verification, but our platform supports multiple services with dynamic allocation.',
  },
  {
    question: 'What payment methods are supported?',
    answer: 'We offer credit card, crypto, and bank transfer options for flexible checkout and bulk purchases.',
  },
  {
    question: 'Is it safe to use this service for verification?',
    answer: 'Yes. We use SSL encryption, reliable routing, and proven delivery methods to ensure verification messages arrive securely.',
  },
];

export default function App() {
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <div className="page-shell">
      <header className="site-header">
        <div className="brand">
          <span className="brand-mark">Chris</span>
          <span className="brand-text">Shopper</span>
        </div>

        <nav className="site-nav" aria-label="Primary navigation">
          <a href="#services">Services</a>
          <a href="#pricing">Pricing</a>
          <a href="#support">Support</a>
        </nav>

        <div className="header-actions">
          <button className="lang-btn" type="button">EN</button>
        </div>
      </header>

      <main>
        <section className="hero section-hero">
          <div className="hero-copy">
            <span className="eyebrow">Premium verification platform</span>
            <h1>Premium US Phone Numbers for SMS Verification</h1>
            <p>Get instant access to real US numbers for verifying Telegram, WhatsApp, Facebook, Google Voice and more. Retail and wholesale solutions with ultra-fast delivery.</p>
            <div className="hero-actions">
              <a className="btn btn-primary" href="#pricing">Buy Numbers Now</a>
            </div>
          </div>

          <div className="hero-panel">
            <div className="panel-header">
              <span className="panel-tag">Live verification demo</span>
              <span className="panel-status">Response Time: <strong>127ms</strong></span>
            </div>
            <div className="terminal">
              <div className="terminal-bar">
                <span />
                <span />
                <span />
              </div>
              <div className="terminal-body">
                <p><span className="prompt">›</span> Getting US number...</p>
                <p className="success">Success! Number: <strong>+1 (415) 555-0192</strong></p>
                <p><span className="prompt">›</span> Waiting for SMS...</p>
                <p className="success">Received: &quot;Telegram code: 784921&quot;</p>
              </div>
            </div>
            <div className="hero-stats">
              <div>
                <span>Instant activation</span>
                <strong>58 min active</strong>
              </div>
              <div>
                <span>Uptime</span>
                <strong>99.9%</strong>
              </div>
            </div>
          </div>
        </section>

        <section id="services" className="section services-section">
          <div className="section-heading">
            <h2>Our Premium SMS Services</h2>
            <p>Choose from our extensive range of services tailored to meet all your verification needs.</p>
          </div>
          <div className="service-grid">
            {services.map((service) => (
              <article key={service.title} className="service-card">
                <div className="service-icon">{service.icon}</div>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
                <ul>
                  {service.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <a href={service.href} className="card-link">{service.cta}</a>
              </article>
            ))}
          </div>
        </section>

        <section id="pricing" className="section pricing-section">
          <div className="section-heading">
            <h2>Our Pricing</h2>
            <p>Affordable SMS verification services for all your needs. Volume discounts available for businesses.</p>
          </div>
          <div className="pricing-grid">
            {pricingPlans.map((plan) => (
              <article key={plan.title} className="pricing-card">
                <h3>{plan.title}</h3>
                <div className="price">
                  {plan.price}
                  <span>{plan.label}</span>
                </div>
                <p>{plan.description}</p>
              </article>
            ))}
          </div>
          <div className="pricing-footer">
            <p>Need bulk pricing or custom solutions? Contact our sales team for special offers.</p>
            <a className="btn btn-secondary" href="#support">View All Services</a>
          </div>
        </section>

        <section id="support" className="section support-section">
          <div className="support-copy">
            <span className="eyebrow">Support</span>
            <h2>Find answers to common questions</h2>
            <p>Our customer support team is available 24/7 to help you with any questions or issues you may have.</p>
          </div>
          <div className="support-content">
            <div className="faq-panel">
              <h3>Frequently Asked Questions</h3>
              {faqs.map((faq, index) => (
                <div key={faq.question} className={`faq-item ${openFaq === index ? 'open' : ''}`}>
                  <button type="button" className="faq-toggle" onClick={() => setOpenFaq(openFaq === index ? -1 : index)}>
                    {faq.question}
                  </button>
                  <div className="faq-content">{faq.answer}</div>
                </div>
              ))}
            </div>
            <div className="support-panel">
              <div className="contact-card">
                <strong>Live Chat Support</strong>
                <p>Get real-time assistance from our support team. Average response time under 2 minutes.</p>
                <a className="card-link" href="#">Start Chat →</a>
              </div>
              <div className="contact-card">
                <strong>Email Support</strong>
                <p>Send us a detailed message and we&apos;ll get back to you within 24 hours.</p>
                <a className="card-link" href="mailto:support@mtelsms.com">support@mtelsms.com</a>
              </div>
              <div className="contact-card">
                <strong>Knowledge Base</strong>
                <p>Browse our extensive documentation, tutorials, and troubleshooting guides.</p>
                <a className="card-link" href="#">Open Docs →</a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-brand">
          <span className="brand-mark">Chris</span>
          <span className="brand-text">Shopper</span>
          <p>Enterprise SMS solutions</p>
        </div>
        <div className="footer-links">
          <div>
            <h4>Legal</h4>
            <a href="#">Terms</a>
            <a href="#">Privacy</a>
            <a href="#">Cookies</a>
          </div>
          <div>
            <h4>Support</h4>
            <a href="#support">Help Center</a>
            <a href="#support">Contact</a>
            <a href="#pricing">Docs</a>
          </div>
        </div>
        <div className="footer-meta">
          <p>© 2026 mTelSMS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
