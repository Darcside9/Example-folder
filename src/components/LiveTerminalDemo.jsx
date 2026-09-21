import { useState } from 'react';

const mockServices = [
  { id: 'telegram', name: 'Telegram', dial: '+1 (415) 892-0194', code: '784-921', prefix: 'Telegram code: ' },
  { id: 'whatsapp', name: 'WhatsApp', dial: '+1 (312) 640-8812', code: '492-301', prefix: 'Your WhatsApp verification code is ' },
  { id: 'openai', name: 'OpenAI / ChatGPT', dial: '+1 (206) 554-7109', code: '819204', prefix: 'OpenAI security code: ' },
  { id: 'google', name: 'Google', dial: '+1 (650) 419-3320', code: '503819', prefix: 'G-' },
];

export default function LiveTerminalDemo() {
  const [selectedService, setSelectedService] = useState('telegram');
  const [stage, setStage] = useState(3); // 0: requesting, 1: allocated, 2: waiting SMS, 3: code received
  const [copied, setCopied] = useState(false);
  const [latency, setLatency] = useState(118);

  const activeMock = mockServices.find((s) => s.id === selectedService) || mockServices[0];

  const handleSimulate = (serviceId) => {
    setSelectedService(serviceId);
    setStage(0);
    setCopied(false);
    setLatency(Math.floor(Math.random() * 40) + 95);

    setTimeout(() => {
      setStage(1);
    }, 600);

    setTimeout(() => {
      setStage(2);
    }, 1300);

    setTimeout(() => {
      setStage(3);
    }, 2400);
  };

  const handleCopy = () => {
    if (activeMock) {
      navigator.clipboard?.writeText(activeMock.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="hero-panel">
      <div className="panel-header">
        <div className="panel-header-left">
          <span className="panel-live-pulse" />
          <span className="panel-tag">Live Verification Simulator</span>
        </div>
        <span className="panel-status">
          Ping: <strong>{latency}ms</strong>
        </span>
      </div>

      <div className="terminal-controls">
        <span className="control-label">Select App:</span>
        <div className="service-pills">
          {mockServices.map((srv) => (
            <button
              key={srv.id}
              type="button"
              className={`pill-btn ${selectedService === srv.id ? 'active' : ''}`}
              onClick={() => handleSimulate(srv.id)}
            >
              {srv.name}
            </button>
          ))}
        </div>
      </div>

      <div className="terminal">
        <div className="terminal-bar">
          <div className="terminal-dots">
            <span className="dot dot-red" />
            <span className="dot dot-yellow" />
            <span className="dot dot-green" />
          </div>
          <span className="terminal-title">stream // direct-sim</span>
          <button 
            type="button" 
            className="terminal-refresh-btn"
            onClick={() => handleSimulate(selectedService)}
            title="Re-run simulation"
          >
            ↻ Re-test
          </button>
        </div>

        <div className="terminal-body">
          <div className="terminal-line">
            <span className="prompt">›</span>
            <span className="cmd">GET /v1/numbers/order?app={selectedService}</span>
          </div>

          {stage >= 1 && (
            <div className="terminal-line fade-in">
              <span className="log-badge badge-success">READY</span>
              <span className="log-text">
                Line: <strong className="highlight-text">{activeMock.dial}</strong>
              </span>
            </div>
          )}

          {stage >= 2 && (
            <div className="terminal-line fade-in">
              <span className="prompt">›</span>
              <span className="cmd">Awaiting remote SMS gateway packet...</span>
              <span className="terminal-spinner" />
            </div>
          )}

          {stage >= 3 ? (
            <div className="terminal-line line-received fade-in">
              <div className="sms-card-preview">
                <div className="sms-card-header">
                  <span className="sms-sender">SMS FROM: {selectedService.toUpperCase()}</span>
                  <span className="sms-time">JUST NOW</span>
                </div>
                <div className="sms-card-body">
                  &quot;{activeMock.prefix}<strong>{activeMock.code}</strong>. Never share this code.&quot;
                </div>
                <div className="sms-card-action">
                  <button type="button" className="copy-code-btn" onClick={handleCopy}>
                    {copied ? (
                      <>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                        Copy OTP: <strong>{activeMock.code}</strong>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : stage > 0 ? (
            <div className="terminal-line terminal-waiting">
              <span className="waiting-pulse" />
              <span>Listening for SMS code...</span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="panel-footer-ticker">
        <div className="footer-ticker-item">
          <span className="ticker-icon">⚡</span>
          <span>Avg Speed: <strong>&lt; 4.5s</strong></span>
        </div>
        <div className="footer-ticker-item">
          <span className="ticker-icon">🛡️</span>
          <span>Delivery SLA: <strong>99.9%</strong></span>
        </div>
        <div className="footer-ticker-item">
          <span className="ticker-icon">🟢</span>
          <span>Carrier: <strong>Non-VoIP SIM</strong></span>
        </div>
      </div>
    </div>
  );
}
