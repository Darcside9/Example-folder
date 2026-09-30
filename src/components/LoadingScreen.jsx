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
            <img 
              src="/bag_logo.svg" 
              alt="Chris Shopper" 
              className="cs-loading-logo-img" 
            />
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
