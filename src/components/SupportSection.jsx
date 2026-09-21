import { useState } from 'react';
import { siteConfig } from '../data/siteConfig';

export default function SupportSection() {
  const [formState, setFormState] = useState({ name: '', service: '', details: '' });

  const handleWhatsAppSend = (e) => {
    e.preventDefault();
    const text = encodeURIComponent(
      `Hello Chris Shopper Support!\n\nName: ${formState.name || 'Customer'}\nService Needed: ${formState.service || 'Bulk Carrier Numbers'}\nDetails: ${formState.details || 'Inquiry regarding SMS verification.'}`
    );
    window.open(`https://wa.me/1234567890?text=${text}`, '_blank');
  };

  return (
    <section id="support" className="section support-section">
      <div className="section-heading text-center">
        <span className="eyebrow">Direct WhatsApp Support</span>
        <h2>Need Help or Custom Platform Lines?</h2>
        <p>
          Connect directly with Chris Shopper on WhatsApp for rapid number provisioning, custom carrier requests, or account assistance.
        </p>
      </div>

      <div className="support-layout-grid">
        {/* Left Side: Support Channels */}
        <div className="support-channels-col">
          <div className="support-card-elevated">
            <div className="support-card-top">
              <div className="support-icon-badge whatsapp-badge">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                </svg>
              </div>
              <span className="live-status-pill">
                <span className="pulse-dot" /> Online on WhatsApp
              </span>
            </div>
            <h3>WhatsApp Direct Support</h3>
            <p>Chat directly with Chris Shopper for instant assistance with carrier lines, order status, or custom requests.</p>
            <a 
              href={siteConfig.whatsappUrl} 
              target="_blank" 
              rel="noreferrer"
              className="btn btn-primary btn-sm btn-full"
            >
              <span>Open WhatsApp Chat →</span>
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
              <span className="support-meta-tag">Developer Docs</span>
            </div>
            <h3>REST API Documentation</h3>
            <p>Explore code examples in cURL, Node.js, and Python to automate number ordering into your applications.</p>
            <a href="#api" className="support-link-docs">
              View API Documentation →
            </a>
          </div>
        </div>

        {/* Right Side: Quick WhatsApp Message Form */}
        <div className="support-form-col">
          <div className="contact-form-card">
            <h3>Send a Direct Inquiry</h3>
            <p className="form-subtext">Fill in your request details and click below to start a pre-filled WhatsApp conversation.</p>

            <form onSubmit={handleWhatsAppSend} className="ticket-form">
              <div className="form-group">
                <label htmlFor="supportName">Your Name</label>
                <input
                  id="supportName"
                  type="text"
                  required
                  placeholder="e.g. Alex"
                  value={formState.name}
                  onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label htmlFor="supportService">Platform / Service Needed</label>
                <input
                  id="supportService"
                  type="text"
                  required
                  placeholder="e.g. Bulk Telegram, WhatsApp, Custom Carrier Pool"
                  value={formState.service}
                  onChange={(e) => setFormState({ ...formState, service: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label htmlFor="supportDetails">Message Details</label>
                <textarea
                  id="supportDetails"
                  rows="4"
                  required
                  placeholder="Describe how many numbers you need, target countries, or API integration details..."
                  value={formState.details}
                  onChange={(e) => setFormState({ ...formState, details: e.target.value })}
                />
              </div>

              <button type="submit" className="btn btn-primary btn-full">
                <span>💬 Chat on WhatsApp with Message →</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
