import { useState, useEffect, useMemo } from 'react';
import LiveTerminalDemo from './LiveTerminalDemo';
import { fetchLivePricing, subscribeToPricingUpdates } from '../lib/pricingService';
import { CORE_USA_PLATFORMS, CORE_CANADA_PLATFORMS, CORE_UK_PLATFORMS } from '../lib/tigerSmsService';
import { siteConfig } from '../data/siteConfig';

export default function Hero({ onOpenOrderModal }) {
  const [livePricingDocs, setLivePricingDocs] = useState([]);

  useEffect(() => {
    fetchLivePricing().then(items => {
      if (Array.isArray(items)) setLivePricingDocs(items);
    }).catch(() => {});

    const unsubscribe = subscribeToPricingUpdates(items => {
      if (Array.isArray(items)) setLivePricingDocs(items);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Compute minimum live price across all marketplace carrier services
  const minLivePrice = useMemo(() => {
    // 1. Check all platforms in core catalog
    const allPlatforms = [
      ...CORE_USA_PLATFORMS,
      ...CORE_CANADA_PLATFORMS,
      ...CORE_UK_PLATFORMS
    ];

    const catalogPrices = allPlatforms
      .map(p => Number(p.defaultRetailNgn))
      .filter(p => !isNaN(p) && p > 0);

    const defaultMin = catalogPrices.length > 0 ? Math.min(...catalogPrices) : 500;

    // 2. Check live overrides from Google Firebase
    const liveSmsPrices = (livePricingDocs || [])
      .filter(d => d.product_type === 'sms_service' && d.is_active !== false && typeof d.price_usd === 'number' && d.price_usd > 0)
      .map(d => d.price_usd);

    if (liveSmsPrices.length > 0) {
      return Math.min(...liveSmsPrices);
    }

    return defaultMin;
  }, [livePricingDocs]);

  return (
    <section className="hero section-hero reveal-on-scroll">
      <div className="hero-copy">
        <div className="hero-badge-pill">
          <span className="pulse-indicator" />
          <span>Next-Gen SMS Verification Gateway</span>
        </div>

        <h1>
          Instant <span className="text-gradient">US & Global Numbers</span> for SMS Verification
        </h1>

        <p className="hero-lead">
          Get your Facebook Logs, TikTok Logs, Instagram Logs as well as your numbers for platform verifications.
          Bypass strict security filters on Telegram, WhatsApp, OpenAI, Google, Apple, and 120+ platforms with 99.9% delivery.
        </p>

        <div className="hero-actions">
          <button 
            type="button" 
            className="btn btn-primary btn-lg"
            onClick={onOpenOrderModal}
          >
            <span>Rent Numbers from {siteConfig.formatNaira(minLivePrice)}</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12 5 19 12 12 19"/>
            </svg>
          </button>
          
          <a href="#logs-marketplace" className="btn btn-secondary btn-lg">
            <span>Explore Account Logs</span>
          </a>

          <a href="#how-it-works" className="btn btn-ghost btn-lg">
            How It Works
          </a>
        </div>

        <div className="hero-guarantees">
          <div className="guarantee-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="3">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span>100% Real Physical SIMs</span>
          </div>
          <div className="guarantee-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="3">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span>No KYC / Zero Logs</span>
          </div>
          <div className="guarantee-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="3">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span>Instant Auto-Refund</span>
          </div>
        </div>
      </div>

      <div className="hero-interactive-col">
        <LiveTerminalDemo />
      </div>
    </section>
  );
}
