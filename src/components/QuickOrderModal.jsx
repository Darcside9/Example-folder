import { useState, useEffect } from 'react';
import { pricingPlans, countries } from '../data/pricingData';

export default function QuickOrderModal({ isOpen, onClose, initialPlan, onOrderSuccess }) {
  const activePlans = pricingPlans.filter((p) => p.isActive);
  const defaultPlanId = initialPlan?.id && pricingPlans.find(p => p.id === initialPlan.id)?.isActive 
    ? initialPlan.id 
    : 'telegram';

  const [selectedPlanId, setSelectedPlanId] = useState(defaultPlanId);
  const [selectedCountryCode, setSelectedCountryCode] = useState(initialPlan?.country?.code || 'US');
  const [quantity, setQuantity] = useState(1);
  const [isOrdering, setIsOrdering] = useState(false);
  const [orderResult, setOrderResult] = useState(null);

  useEffect(() => {
    if (initialPlan?.id) {
      const match = pricingPlans.find(p => p.id === initialPlan.id);
      if (match?.isActive) {
        setSelectedPlanId(match.id);
      } else {
        setSelectedPlanId('telegram');
      }
    }
  }, [initialPlan]);

  if (!isOpen) return null;

  const currentPlan = pricingPlans.find((p) => p.id === selectedPlanId) || activePlans[0];
  const currentCountry = countries.find((c) => c.code === selectedCountryCode) || countries[0];

  // Calculate total
  const unitPrice = parseFloat(currentPlan.price.replace('$', '')) || 0.18;
  const totalPrice = (unitPrice * quantity).toFixed(2);

  const handleCreateOrder = () => {
    setIsOrdering(true);
    setTimeout(() => {
      setIsOrdering(false);
      const fakeNumber = `+1 (${Math.floor(Math.random() * 800) + 200}) ${Math.floor(Math.random() * 800) + 200}-${Math.floor(Math.random() * 9000) + 1000}`;
      setOrderResult({
        orderId: `ORD-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        number: fakeNumber,
        service: currentPlan.title,
        country: currentCountry.name,
      });
      if (onOrderSuccess) onOrderSuccess(currentPlan.title);
    }, 1200);
  };

  const handleReset = () => {
    setOrderResult(null);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-icon">📱</span>
            <div>
              <h3>Instant Number Allocation</h3>
              <p>Chris Shopper Instant Carrier Gateway</p>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          {orderResult ? (
            <div className="order-success-view">
              <div className="success-icon-badge">✓</div>
              <h4>Number Allocated Successfully!</h4>
              <p>Your clean carrier line is active and listening for incoming SMS codes.</p>

              <div className="allocated-number-card">
                <span className="allocated-label">Your Dedicated Number ({orderResult.service}):</span>
                <strong className="allocated-digits">{orderResult.number}</strong>
                <span className="allocated-meta">Order ID: {orderResult.orderId} • Active for 20 mins</span>
              </div>

              <div className="order-instructions">
                <p>1. Paste this number into your <strong>{orderResult.service}</strong> app.</p>
                <p>2. Request your SMS verification code.</p>
                <p>3. The OTP code will arrive instantly in your live dashboard.</p>
              </div>

              <button type="button" className="btn btn-primary btn-full" onClick={handleReset}>
                Done / Allocate Another
              </button>
            </div>
          ) : (
            <div className="order-form-view">
              <div className="active-service-notice">
                <span>🟢 Active Services: <strong>Telegram</strong> &amp; <strong>WhatsApp</strong></span>
              </div>

              <div className="modal-form-group">
                <label>Choose Active Service</label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="modal-select"
                >
                  <optgroup label="Active Available Services">
                    {pricingPlans.filter(p => p.isActive).map((p) => (
                      <option key={p.id} value={p.id}>
                        🟢 {p.title} — {p.price} (Instant)
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Coming Soon (Pre-release)">
                    {pricingPlans.filter(p => !p.isActive).map((p) => (
                      <option key={p.id} value={p.id} disabled>
                        ⏳ {p.title} — Coming Soon
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              <div className="modal-form-group">
                <label>Country / Carrier Region</label>
                <select
                  value={selectedCountryCode}
                  onChange={(e) => setSelectedCountryCode(e.target.value)}
                  className="modal-select"
                >
                  {countries.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.name} ({c.dialCode}) — Active
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-form-group">
                <label>Quantity of Numbers</label>
                <div className="quantity-counter">
                  <button
                    type="button"
                    className="counter-btn"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <span className="counter-val">{quantity}</span>
                  <button
                    type="button"
                    className="counter-btn"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="order-summary-box">
                <div className="summary-row">
                  <span>Service:</span>
                  <strong>{currentPlan.title}</strong>
                </div>
                <div className="summary-row">
                  <span>Region:</span>
                  <span>{currentCountry.flag} {currentCountry.name} ({currentCountry.dialCode})</span>
                </div>
                <div className="summary-row">
                  <span>Carrier Type:</span>
                  <span className="tag-clean-sim">Real Physical SIM (Non-VoIP)</span>
                </div>
                <div className="summary-row total-row">
                  <span>Total Amount:</span>
                  <span className="total-amount">${totalPrice}</span>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-primary btn-full btn-lg"
                disabled={isOrdering}
                onClick={handleCreateOrder}
              >
                {isOrdering ? (
                  <>
                    <span className="btn-spinner" />
                    <span>Allocating Carrier SIM...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm &amp; Get Number (${totalPrice})</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </>
                )}
              </button>

              <p className="modal-guarantee-text">
                🔒 100% Automatic Refund if SMS code is not received within 15 minutes.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
