import { useState } from 'react';
import { apiLanguages, apiSnippets } from '../data/apiSnippets';

export default function ApiShowcaseSection() {
  const [activeLang, setActiveLang] = useState('curl');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const snippet = apiSnippets[activeLang];
    if (snippet) {
      navigator.clipboard?.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const features = [
    {
      title: 'Real-Time Webhooks',
      desc: 'Get instant HTTP POST callbacks the millisecond an SMS OTP payload hits our carrier gateways.',
      icon: '⚡',
    },
    {
      title: 'Automated Failover',
      desc: 'Automatic fallback across multiple Tier-1 carriers ensures zero dropped verification requests.',
      icon: '🔄',
    },
    {
      title: 'Sub-200ms API Latency',
      desc: 'Globally distributed edge endpoints for low latency programmatic number allocations.',
      icon: '🚀',
    },
  ];

  return (
    <section id="api" className="section api-showcase-section">
      <div className="section-heading">
        <span className="eyebrow">Developer First</span>
        <h2>Integrate Chris Shopper API in Minutes</h2>
        <p>
          Automate account creation and QA testing with our comprehensive REST API. Full support for webhook callbacks, automatic retries, and balance auto-topup.
        </p>
      </div>

      <div className="api-section">
        <div className="api-copy">
          <div className="api-intro-card">
            <h3>Modern REST API Architecture</h3>
            <p>
              Provision numbers, query SMS status, and receive webhooks with standard JSON payloads and simple bearer token authentication.
            </p>
            <div className="api-endpoints-preview">
              <div className="endpoint-item">
                <span className="method post">POST</span>
                <code>/v1/numbers/order</code>
                <span className="desc">Allocate temporary line</span>
              </div>
              <div className="endpoint-item">
                <span className="method get">GET</span>
                <code>/v1/numbers/status/:order_id</code>
                <span className="desc">Poll incoming SMS code</span>
              </div>
              <div className="endpoint-item">
                <span className="method delete">DELETE</span>
                <code>/v1/numbers/cancel/:order_id</code>
                <span className="desc">Release line & auto refund</span>
              </div>
            </div>
          </div>

          <div className="api-features-vertical">
            {features.map((f, i) => (
              <div key={i} className="api-feature-card">
                <span className="api-feat-icon">{f.icon}</span>
                <div>
                  <strong>{f.title}</strong>
                  <p>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="api-code-wrapper">
          <div className="api-code-header">
            <div className="api-tab-buttons">
              {apiLanguages.map((lang) => (
                <button
                  key={lang.id}
                  type="button"
                  className={`api-tab-btn ${activeLang === lang.id ? 'active' : ''}`}
                  onClick={() => setActiveLang(lang.id)}
                >
                  {lang.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              className="copy-code-btn-sm"
              onClick={handleCopy}
              title="Copy snippet"
            >
              {copied ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>

          <div className="api-code">
            <pre>
              <code>{apiSnippets[activeLang]}</code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
