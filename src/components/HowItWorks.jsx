export default function HowItWorks() {
  const steps = [
    {
      num: '01',
      title: 'Select Platform & Country',
      desc: 'Pick your desired service (OpenAI, WhatsApp, Telegram, Google, etc.) and country code (USA, UK, Canada, Europe).',
      tag: 'Instant Setup',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="2" y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
      ),
    },
    {
      num: '02',
      title: 'Paste Number in Target App',
      desc: 'Receive your temporary dedicated mobile number instantly and paste it directly into the app registration or login prompt.',
      tag: 'Clean Carrier Line',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
          <line x1="12" y1="18" x2="12.01" y2="18"/>
        </svg>
      ),
    },
    {
      num: '03',
      title: 'Receive OTP & Verify',
      desc: 'The SMS code arrives in your dashboard within seconds. Click once to copy and verify your account smoothly.',
      tag: '5-Sec Delivery',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      ),
    },
  ];

  return (
    <section id="how-it-works" className="section how-it-works-section">
      <div className="section-heading text-center">
        <span className="eyebrow">Seamless 3-Step Process</span>
        <h2>How Chris Shopper Works</h2>
        <p>Get verified on any application in under 30 seconds with zero friction or personal data.</p>
      </div>

      <div className="steps-grid">
        {steps.map((step) => (
          <div key={step.num} className="step-card">
            <div className="step-card-top">
              <span className="step-number">{step.num}</span>
              <span className="step-tag">{step.tag}</span>
            </div>
            <div className="step-icon-wrapper">{step.icon}</div>
            <h3>{step.title}</h3>
            <p>{step.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
