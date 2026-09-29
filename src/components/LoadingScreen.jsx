import React from 'react';

/**
 * LoadingScreen
 * A responsive, cyber-luxury branded loading screen for Chris Shopper.
 * Features letter-by-letter undulating wave animations, ambient glowing aura,
 * shimmering progress indicator, and zero horizontal overflow on mobile (320px+).
 */
export default function LoadingScreen({ 
  message = "Loading session...",
  subtext = "Establishing secure connection to Chris Shopper platform..." 
}) {
  const brandFirst = "Chris";
  const brandSecond = "Shopper";

  return (
    <div className="cs-loading-screen" role="status" aria-live="polite">
      {/* Ambient background glow orbs */}
      <div className="cs-loading-glow-orb cs-loading-glow-orb-1" aria-hidden="true" />
      <div className="cs-loading-glow-orb cs-loading-glow-orb-2" aria-hidden="true" />

      <div className="cs-loading-card">
        {/* Animated Brand Emblem & Aura */}
        <div className="cs-loading-badge-wrap" aria-hidden="true">
          <div className="cs-loading-badge-pulse-ring" />
          <div className="cs-loading-badge">
            <svg 
              width="30" 
              height="30" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              <path d="M14 2v4"/>
              <path d="M18 6l3-3"/>
              <path d="M18 2h4"/>
            </svg>
          </div>
        </div>

        {/* Individual Letters Glowing & Wave Animation */}
        <h1 className="cs-loading-title" aria-label="Chris Shopper">
          <span className="cs-loading-word cs-word-chris">
            {brandFirst.split('').map((char, index) => (
              <span 
                key={`c-${index}`} 
                className="cs-loading-letter" 
                style={{ animationDelay: `${index * 0.08}s` }}
              >
                {char}
              </span>
            ))}
          </span>
          <span className="cs-loading-space" aria-hidden="true">&nbsp;</span>
          <span className="cs-loading-word cs-word-shopper">
            {brandSecond.split('').map((char, index) => (
              <span 
                key={`s-${index}`} 
                className="cs-loading-letter cs-letter-highlight" 
                style={{ animationDelay: `${(brandFirst.length + index) * 0.08}s` }}
              >
                {char}
              </span>
            ))}
          </span>
        </h1>

        {/* Shimmering Progress Bar */}
        <div className="cs-loading-progress-track" aria-hidden="true">
          <div className="cs-loading-progress-bar" />
        </div>

        {/* Contextual Status Message */}
        <p className="cs-loading-message">{message}</p>
        {subtext && <p className="cs-loading-subtext">{subtext}</p>}

        {/* Real-time Security State Pill */}
        <div className="cs-loading-status-pill" aria-hidden="true">
          <span className="cs-status-indicator-dot" />
          <span>ZERO-TRUST ENCRYPTION &bull; CLOUD SYNC</span>
        </div>
      </div>
    </div>
  );
}
