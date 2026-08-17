import { useState } from 'react';

export default function SupportSection({ onTriggerChat }) {
  const [ticketSent, setTicketSent] = useState(false);
  const [formState, setFormState] = useState({ name: '', email: '', subject: '', message: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    setTicketSent(true);
    setTimeout(() => {
      setTicketSent(false);
      setFormState({ name: '', email: '', subject: '', message: '' });
    }, 4000);
  };

  return (
    <section id="support" className="section support-section">
      <div className="section-heading">
        <span className="eyebrow">24/7 Dedicated Support</span>
        <h2>Need Help or Custom Integration?</h2>
        <p>
          Our technical support engineers and carrier account managers are available around the clock to assist you.
        </p>
      </div>

      <div className="support-layout-grid">
        {/* Support Channels */}
        <div className="support-channels-col">
          <div className="support-card-elevated">
            <div className="support-card-top">
              <div className="support-icon-badge">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <span className="live-status-pill">
                <span className="pulse-dot" /> Live Agents Online
              </span>
            </div>
            <h3>Instant Live Chat</h3>
            <p>Connect with our engineering support directly. Average response time is under 90 seconds.</p>
            <button 
              type="button" 
              className="btn btn-secondary btn-sm"
              onClick={onTriggerChat}
            >
              Launch Live Chat →
            </button>
          </div>

          <div className="support-card-elevated">
            <div className="support-card-top">
              <div className="support-icon-badge">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <span className="support-meta-tag">&lt; 2hr SLA</span>
            </div>
            <h3>Email & Ticketing</h3>
            <p>Send in-depth queries regarding wholesale rates, custom carrier pools, or billing.</p>
            <a href="mailto:support@chrisshopper.com" className="support-link-email">
              support@chrisshopper.com →
            </a>
          </div>

          <div className="support-card-elevated">
            <div className="support-card-top">
              <div className="support-icon-badge">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                </svg>
              </div>
              <span className="support-meta-tag">Self Service</span>
            </div>
            <h3>Developer Documentation</h3>
            <p>Explore step-by-step guides for SDKs, webhook signatures, error codes, and examples.</p>
            <a href="#api" className="support-link-docs">
              Read Documentation →
            </a>
          </div>
        </div>

        {/* Quick Ticket Form */}
        <div className="support-form-col">
          <div className="contact-form-card">
            <h3>Send Us a Quick Message</h3>
            <p className="form-subtext">Have a special request or questions about bulk numbers? Leave a note below.</p>

            {ticketSent ? (
              <div className="ticket-success-box">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                  <polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                <h4>Message Received!</h4>
                <p>A Chris Shopper representative will contact you shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="ticket-form">
                <div className="form-group">
                  <label htmlFor="name">Your Name</label>
                  <input
                    id="name"
                    type="text"
                    required
                    placeholder="Alex Smith"
                    value={formState.name}
                    onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="alex@company.com"
                    value={formState.email}
                    onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="subject">Subject / Service Needed</label>
                  <input
                    id="subject"
                    type="text"
                    required
                    placeholder="e.g. Bulk WhatsApp numbers, Custom API limits"
                    value={formState.subject}
                    onChange={(e) => setFormState({ ...formState, subject: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="message">Message Details</label>
                  <textarea
                    id="message"
                    rows="4"
                    required
                    placeholder="Describe your requirements or questions..."
                    value={formState.message}
                    onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                  />
                </div>

                <button type="submit" className="btn btn-primary btn-full">
                  Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
