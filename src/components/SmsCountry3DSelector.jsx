import React, { useState, useMemo } from 'react';
import BrandIcon from './BrandIcon';
import { siteConfig } from '../data/siteConfig';
import { CORE_USA_PLATFORMS, CORE_CANADA_PLATFORMS, CORE_UK_PLATFORMS } from '../lib/tigerSmsService';

export default function SmsCountry3DSelector({
  pricingProducts = [],
  onSelectPlatform,
  currentUserBalance = 0
}) {
  const [expandedCountry, setExpandedCountry] = useState(null); // 'US' | 'CA' | 'UK' | null (collapsed by default, prevents automatic drop down)
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const countriesList = [
    {
      code: 'US',
      name: 'United States Carrier Lines (+1)',
      shortName: 'United States',
      dialCode: '+1',
      flag: '🇺🇸',
      badge: '25 Active Platforms',
      carriers: 'Real AT&T, Verizon & T-Mobile non-VoIP SIMs',
      platforms: CORE_USA_PLATFORMS,
      isActive: true,
      accentColor: '#38bdf8'
    },
    {
      code: 'CA',
      name: 'Canada Carrier Lines (+1)',
      shortName: 'Canada',
      dialCode: '+1',
      flag: '🇨🇦',
      badge: '25 Active Platforms',
      carriers: 'Real Rogers, Bell & Telus non-VoIP SIMs',
      platforms: CORE_CANADA_PLATFORMS,
      isActive: true,
      accentColor: '#ef4444'
    },
    {
      code: 'UK',
      name: 'United Kingdom Carrier Lines (+44)',
      shortName: 'United Kingdom',
      dialCode: '+44',
      flag: '🇬🇧',
      badge: '25 Active Platforms',
      carriers: 'Real EE, Vodafone & O2 non-VoIP SIMs',
      platforms: CORE_UK_PLATFORMS,
      isActive: true,
      accentColor: '#6366f1'
    }
  ];

  const handleToggleCountry = (countryCode) => {
    if (expandedCountry === countryCode) {
      setExpandedCountry(null);
    } else {
      setExpandedCountry(countryCode);
      setSearchQuery('');
      setActiveCategory('all');
    }
  };

  // Resolve dynamic retail price for a platform within a country
  const resolvePlatformPrice = (plat, countryCode) => {
    const docKey = countryCode === 'UK' ? 'uk_' + plat.id : (countryCode === 'CA' ? 'ca_' + plat.id : plat.id);
    const match = pricingProducts.find(
      (p) => (p.product_id === docKey || (countryCode === 'US' && p.product_id === 'us_' + plat.id)) && p.product_type === 'sms_service'
    );
    if (match && typeof match.price_usd === 'number' && match.price_usd > 0) {
      return match.price_usd;
    }
    return plat.defaultRetailNgn;
  };

  // Resolve active status
  const resolvePlatformStatus = (plat, countryCode) => {
    const docKey = countryCode === 'UK' ? 'uk_' + plat.id : (countryCode === 'CA' ? 'ca_' + plat.id : plat.id);
    const match = pricingProducts.find(
      (p) => (p.product_id === docKey || (countryCode === 'US' && p.product_id === 'us_' + plat.id)) && p.product_type === 'sms_service'
    );
    if (match && match.is_active !== undefined) {
      return match.is_active;
    }
    return true;
  };

  const categories = [
    { id: 'all', label: 'All Services (25)' },
    { id: 'messaging', label: 'Messaging' },
    { id: 'social', label: 'Social' },
    { id: 'tech', label: 'AI & Tech' },
    { id: 'finance', label: 'Finance' },
    { id: 'dating', label: 'Dating' },
    { id: 'entertainment', label: 'Streaming' },
    { id: 'other', label: 'Other' }
  ];

  return (
    <div className="sms-3d-market-container">
      {countriesList.map((country) => {
        const isExpanded = expandedCountry === country.code;
        const countryPlatforms = country.platforms;

        // Filter platforms
        const filtered = countryPlatforms.filter((plat) => {
          const q = searchQuery.toLowerCase().trim();
          const matchesQuery =
            !q ||
            plat.name.toLowerCase().includes(q) ||
            plat.tigerCode.toLowerCase().includes(q) ||
            plat.category.toLowerCase().includes(q);
          const matchesCat = activeCategory === 'all' || plat.category === activeCategory;
          return matchesQuery && matchesCat;
        });

        return (
          <div
            key={country.code}
            className={`sms-country-3d-card ${isExpanded ? 'is-expanded' : ''} ${!country.isActive ? 'is-disabled' : ''}`}
          >
            {/* 3D Header Bar (Accordion Trigger) */}
            <div
              className="country-3d-header"
              onClick={() => country.isActive && handleToggleCountry(country.code)}
              role="button"
              tabIndex={country.isActive ? 0 : -1}
              aria-expanded={isExpanded}
            >
              <div className="country-header-left">
                <span className="country-flag-3d">{country.flag}</span>
                <div>
                  <div className="country-title-row">
                    <strong className="country-name-text">{country.name}</strong>
                    <span className={`country-badge-pill ${country.isActive ? 'active' : 'coming-soon'}`}>
                      {country.badge}
                    </span>
                  </div>
                  <span className="country-carriers-sub">{country.carriers}</span>
                </div>
              </div>

              <div className="country-header-right">
                {country.isActive ? (
                  <div className="country-chevron-indicator">
                    <span className="view-services-label">
                      {isExpanded ? 'Collapse Services' : 'View Services'}
                    </span>
                    <span className={`chevron-arrow ${isExpanded ? 'open' : ''}`}>▼</span>
                  </div>
                ) : (
                  <span className="country-soon-tag">Coming Soon</span>
                )}
              </div>
            </div>

            {/* Expanded 3D Platform Stack */}
            {country.isActive && isExpanded && (
              <div className="country-3d-expanded-panel">
                {/* Search & Category Filter Row */}
                <div className="sms-stack-filters-row">
                  <div className="sms-stack-search-wrap">
                    <svg 
                      className="sms-search-svg" 
                      width="16" 
                      height="16" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2.2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      aria-hidden="true"
                    >
                      <circle cx="11" cy="11" r="8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <input
                      type="text"
                      className="sms-stack-search-input"
                      placeholder={`Filter ${country.shortName} platforms (e.g. WhatsApp, TikTok)...`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        className="btn-clear-search"
                        onClick={() => setSearchQuery('')}
                        aria-label="Clear search"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <div className="sms-stack-category-pills">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        className={`sms-category-chip ${activeCategory === cat.id ? 'active' : ''}`}
                        onClick={() => setActiveCategory(cat.id)}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3D Platform Card Grid / Stack */}
                <div className="sms-3d-stack-grid">
                  {filtered.map((plat) => {
                    const retailPrice = resolvePlatformPrice(plat, country.code);
                    const isActive = resolvePlatformStatus(plat, country.code);

                    return (
                      <div
                        key={plat.id}
                        className={`sms-platform-3d-tile ${isActive ? 'is-active' : 'is-inactive'}`}
                        onClick={() => {
                          if (!isActive) return;
                          onSelectPlatform({
                            ...plat,
                            price: retailPrice,
                            countryCode: country.code,
                            countryName: country.shortName,
                            countryFlag: country.flag
                          }, country);
                        }}
                      >
                        {/* Tile Top */}
                        <div className="sms-tile-top">
                          <BrandIcon name={plat.name} iconKey={plat.icon || plat.id} size={34} />
                          <div className="sms-tile-info">
                            <div className="sms-tile-title-row">
                              <strong>{plat.name}</strong>
                              <span className="sms-code-pill">{plat.tigerCode}</span>
                            </div>
                            <span className="sms-tile-meta">
                              {plat.category} • Speed {plat.carrierSpeed || '< 3s'}
                            </span>
                          </div>
                        </div>

                        {/* Tile Metrics */}
                        <div className="sms-tile-metrics">
                          <div className="sms-tile-stock">
                            <span className="stock-dot"></span>
                            <span>{plat.stock ? `${plat.stock.toLocaleString()} lines pool` : 'In Stock'}</span>
                          </div>
                          <div className="sms-tile-price-box">
                            <span className="price-prefix">Price</span>
                            <strong className="price-amount">{siteConfig.formatNaira(retailPrice)}</strong>
                          </div>
                        </div>

                        {/* Tile Action */}
                        <div className="sms-tile-action">
                          {isActive ? (
                            <button
                              type="button"
                              className="btn btn-primary btn-sm btn-full"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectPlatform({
                                  ...plat,
                                  price: retailPrice,
                                  countryCode: country.code,
                                  countryName: country.shortName,
                                  countryFlag: country.flag
                                }, country);
                              }}
                            >
                              Rent Line ({siteConfig.formatNaira(retailPrice)})
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm btn-full"
                              disabled
                            >
                              Temporarily Paused
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {filtered.length === 0 && (
                    <div className="no-platforms-matched">
                      <span style={{ fontSize: '1.8rem', display: 'block', marginBottom: '8px' }}>🔎</span>
                      <strong>No verification services found matching "{searchQuery}"</strong>
                      <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: '4px 0 10px' }}>
                        Try clearing your search query or switching category filters.
                      </p>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setSearchQuery('');
                          setActiveCategory('all');
                        }}
                      >
                        Reset Filters
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
