import { useState, useMemo } from 'react';
import { pricingPlans, pricingCategories, countries } from '../data/pricingData';

export default function PricingCatalog({ onSelectPlan, onNotifySoon }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCountry, setSelectedCountry] = useState('US');

  const activeCountry = countries.find((c) => c.code === selectedCountry) || countries[0];

  const filteredPlans = useMemo(() => {
    return pricingPlans.filter((plan) => {
      const matchesSearch = plan.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plan.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesCat = true;
      if (selectedCategory === 'active') {
        matchesCat = plan.isActive;
      } else if (selectedCategory !== 'all') {
        matchesCat = plan.category === selectedCategory;
      }

      return matchesSearch && matchesCat;
    });
  }, [searchQuery, selectedCategory]);

  const activeCount = pricingPlans.filter((p) => p.isActive).length;

  return (
    <section id="pricing" className="section pricing-section reveal-on-scroll">
      <div className="section-heading text-center">
        <span className="eyebrow">Service Catalog & Rates</span>
        <h2>SMS Verification Pricing</h2>
        <p>
          Instant number allocation for <strong>Telegram</strong> and <strong>WhatsApp</strong>. Additional platform carrier lines are currently rolling out.
        </p>
      </div>

      {/* Country Selection Bar */}
      <div className="country-filter-container">
        <span className="filter-label">Carrier Region:</span>
        <div className="country-pills-row">
          {countries.map((c) => (
            <button
              key={c.code}
              type="button"
              className={`country-pill ${selectedCountry === c.code ? 'active' : ''}`}
              onClick={() => setSelectedCountry(c.code)}
            >
              <span className="country-flag">{c.flag}</span>
              <span className="country-name">{c.name}</span>
              <span className="country-badge">{c.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Search & Category Filter Controls */}
      <div className="catalog-controls">
        <div className="search-input-wrapper">
          <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Search service (e.g. Telegram, WhatsApp, OpenAI, Google)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              type="button" 
              className="clear-search-btn"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        <div className="category-pills">
          {pricingCategories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`category-pill ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Result stats summary */}
      <div className="catalog-meta-bar">
        <span>
          Showing <strong>{filteredPlans.length}</strong> platforms • <strong className="text-green">{activeCount} Active Now</strong> (Telegram & WhatsApp)
        </span>
        <span className="meta-auto-refund">🛡️ Zero Charge if SMS Not Received</span>
      </div>

      {/* Pricing Cards Grid */}
      {filteredPlans.length > 0 ? (
        <div className="pricing-grid">
          {filteredPlans.map((plan) => (
            <article 
              key={plan.id} 
              className={`pricing-card card-interactive ${plan.isActive ? 'pricing-card-active' : 'pricing-card-soon'}`}
            >
              <div className="pricing-card-top">
                <div className="pricing-title-group">
                  <h3>{plan.title}</h3>
                  <span className="pricing-country-tag">{activeCountry.flag} {activeCountry.dialCode}</span>
                </div>
                {plan.isActive ? (
                  <span className="pricing-badge badge-active">
                    <span className="badge-pulse-dot" /> Available Now
                  </span>
                ) : (
                  <span className="pricing-badge badge-soon">Coming Soon</span>
                )}
              </div>

              <div className="price-row">
                <div className="price">
                  {plan.price}
                  {plan.isActive && <span>{plan.label}</span>}
                </div>
                {!plan.isActive && <span className="estimated-tag">Estimated Price</span>}
              </div>

              <p className="pricing-desc">{plan.description}</p>

              <div className="pricing-meta-row">
                <div className="meta-stat">
                  <span className="meta-stat-label">Success Rate</span>
                  <span className={`meta-stat-val ${plan.isActive ? 'text-green' : 'text-muted'}`}>
                    {plan.successRate}
                  </span>
                </div>
                <div className="meta-stat">
                  <span className="meta-stat-label">Status / Speed</span>
                  <span className={`meta-stat-val ${plan.isActive ? 'text-cyan' : 'text-muted'}`}>
                    {plan.speed}
                  </span>
                </div>
              </div>

              {plan.isActive ? (
                <button
                  type="button"
                  className="btn btn-primary btn-sm btn-full"
                  onClick={() => onSelectPlan({ ...plan, country: activeCountry })}
                >
                  <span>Get Number</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm btn-full btn-soon"
                  onClick={() => {
                    if (onNotifySoon) onNotifySoon(plan.title);
                  }}
                >
                  <span>🔔 Notify When Available</span>
                </button>
              )}
            </article>
          ))}
        </div>
      ) : (
        <div className="no-results-box">
          <p>No services matched your query &quot;<strong>{searchQuery}</strong>&quot;</p>
          <button 
            type="button" 
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
          >
            Reset Filters
          </button>
        </div>
      )}

      <div className="pricing-footer">
        <div className="pricing-footer-copy">
          <h4>Need immediate custom numbers for another service?</h4>
          <p>Contact our support team to request expedited carrier provisioning for specific platforms.</p>
        </div>
        <a className="btn btn-secondary" href="#support">Request Platform Line</a>
      </div>
    </section>
  );
}
