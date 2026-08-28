import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { pricingPlans, countries } from '../data/pricingData';
import { siteConfig } from '../data/siteConfig';
import { useAuth } from '../lib/AuthContext';
import { allocateNumberLine } from '../lib/dashboardService';

export default function QuickOrderModal({ isOpen, onClose, initialPlan, onOrderSuccess }) {
  const { currentUser, refreshUser } = useAuth();
  const navigate = useNavigate();

  const activePlans = pricingPlans.filter((p) => p.isActive);
  const defaultPlanId = initialPlan?.id && pricingPlans.find((p) => p.id === initialPlan.id)?.isActive 
    ? initialPlan.id 
    : 'telegram';

  const [selectedPlanId, setSelectedPlanId] = useState(defaultPlanId);
  const [selectedCountryCode, setSelectedCountryCode] = useState(initialPlan?.country?.code || 'US');
  const [quantity, setQuantity] = useState(1);
  const [isOrdering, setIsOrdering] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [orderResult, setOrderResult] = useState(null);

  useEffect(() => {
    if (initialPlan?.id) {
      const match = pricingPlans.find((p) => p.id === initialPlan.id);
      if (match?.isActive) {
        setSelectedPlanId(match.id);
      } else {
        setSelectedPlanId('telegram');
      }
    }
    if (initialPlan?.country?.code) {
      setSelectedCountryCode(initialPlan.country.code);
    }
  }, [initialPlan]);

  if (!isOpen) return null;

  const currentPlan = pricingPlans.find((p) => p.id === selectedPlanId) || activePlans[0];
  const currentCountry = countries.find((c) => c.code === selectedCountryCode) || countries[0];

  // Calculate pricing & balance
  const unitPrice = parseFloat(currentPlan.price.replace('$', '')) || 0.18;
  const totalPrice = (unitPrice * quantity).toFixed(2);
  const userBalance = Number(currentUser?.balance || 0);
  const hasSufficientBalance = userBalance >= Number(totalPrice);

  const handleCreateOrder = async () => {
    if (!currentUser) {
      navigate('/auth?mode=signup');
      onClose();
      return;
    }

    if (!hasSufficientBalance) {
      setErrorMessage(`Insufficient balance ($${userBalance.toFixed(2)}). You need $${totalPrice} to allocate these numbers.`);
      return;
    }

    setIsOrdering(true);
    setErrorMessage(null);

    try {
      const { order } = await allocateNumberLine({
        userId: currentUser.id,
        service: {
          name: currentPlan.title,
          price: Number(totalPrice),
        },
        country: selectedCountryCode.toLowerCase(),
        currentBalance: userBalance,
      });

      // Refresh auth context so header & dashboard show updated balance immediately
      await refreshUser();

      setOrderResult({
        orderId: order.id,
        number: order.phone_number,
        service: currentPlan.title,
        country: currentCountry.name,
        cost: totalPrice,
      });

      if (onOrderSuccess) {
        onOrderSuccess(currentPlan.title);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to allocate phone number. Please try again.');
    } finally {
      setIsOrdering(false);
    }
  };

  const handleReset = () => {
    setOrderResult(null);
    setErrorMessage(null);
    onClose();
  };

  const handleGoToDashboard = () => {
    setOrderResult(null);
    onClose();
    navigate('/dashboard');
  };

  const handleGoToAuth = (mode) => {
    onClose();
    navigate(`/auth?mode=${mode}`);
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
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close Modal">
            ✕
          </button>
        </div>

        <div className="modal-body">
          {/* STATE 1: GUEST / UNAUTHENTICATED GUARD */}
          {!currentUser ? (
            <div className="modal-auth-required-view">
              <div className="auth-wall-icon">🔒</div>
              <h4>Account &amp; Funded Balance Required</h4>
              <p className="auth-wall-desc">
                Chris Shopper provides dedicated real carrier phone numbers for OTP verification. 
                Please sign in or create a free account to allocate numbers and access your live SMS inbox.
              </p>

              <div className="auth-wall-features">
                <div className="auth-wall-feat">
                  <span className="feat-check">✓</span>
                  <span>Instant real carrier non-VoIP lines</span>
                </div>
                <div className="auth-wall-feat">
                  <span className="feat-check">✓</span>
                  <span>Live SMS reception with 99.9% delivery SLA</span>
                </div>
                <div className="auth-wall-feat">
                  <span className="feat-check">✓</span>
                  <span>100% Automatic Refund if no code received</span>
                </div>
              </div>

              <div className="auth-wall-actions">
                <button
                  type="button"
                  className="btn btn-primary btn-full btn-lg"
                  onClick={() => handleGoToAuth('signup')}
                >
                  Create Free Account &amp; Order
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-full"
                  onClick={() => handleGoToAuth('login')}
                >
                  Already have an account? Sign In
                </button>
              </div>
            </div>
          ) : orderResult ? (
            /* STATE 2: ORDER SUCCESS VIEW */
            <div className="order-success-view">
              <div className="success-icon-badge">✓</div>
              <h4>Number Allocated Successfully!</h4>
              <p>Your clean carrier line is active and listening for incoming SMS codes.</p>

              <div className="allocated-number-card">
                <span className="allocated-label">Your Dedicated Number ({orderResult.service}):</span>
                <strong className="allocated-digits">{orderResult.number}</strong>
                <span className="allocated-meta">
                  Order ID: {orderResult.orderId} • Cost: ${orderResult.cost} • Active for 15 mins
                </span>
              </div>

              <div className="order-instructions">
                <p>1. Copy &amp; paste <strong>{orderResult.number}</strong> into your <strong>{orderResult.service}</strong> app.</p>
                <p>2. Request your SMS verification code.</p>
                <p>3. The OTP verification code will arrive instantly in your live dashboard.</p>
              </div>

              <div className="modal-actions-grid">
                <button type="button" className="btn btn-primary btn-full" onClick={handleGoToDashboard}>
                  📊 View in Live Dashboard
                </button>
                <button type="button" className="btn btn-secondary btn-full" onClick={handleReset}>
                  Allocate Another Number
                </button>
              </div>
            </div>
          ) : (
            /* STATE 3: LOGGED-IN ORDER CONFIGURATION FORM */
            <div className="order-form-view">
              {/* User Wallet Balance Strip */}
              <div className="modal-user-balance-bar">
                <div className="balance-info">
                  <span className="balance-label">Your Wallet Balance:</span>
                  <strong className={`balance-value ${hasSufficientBalance ? 'text-green' : 'text-danger'}`}>
                    ${userBalance.toFixed(2)}
                  </strong>
                </div>
                <a
                  href={siteConfig.whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-xs btn-whatsapp-compact"
                >
                  + Top Up Balance
                </a>
              </div>

              {/* Insufficient Balance Banner */}
              {!hasSufficientBalance && (
                <div className="insufficient-balance-alert">
                  <div className="alert-header">
                    <span className="alert-icon">⚠️</span>
                    <strong>Insufficient Wallet Balance</strong>
                  </div>
                  <p>
                    This order requires <strong>${totalPrice}</strong>, but your wallet balance is <strong>${userBalance.toFixed(2)}</strong>. 
                    Please top up your wallet via WhatsApp to proceed with allocation.
                  </p>
                  <a
                    href={siteConfig.whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-whatsapp btn-sm btn-full"
                  >
                    💬 Top Up via WhatsApp ($5, $10, $25, $50)
                  </a>
                </div>
              )}

              {/* Error message if any */}
              {errorMessage && (
                <div className="modal-error-alert">
                  <span>❌ {errorMessage}</span>
                </div>
              )}

              <div className="active-service-notice">
                <span>🟢 Active Instant Lines: <strong>Telegram</strong> &amp; <strong>WhatsApp</strong></span>
              </div>

              <div className="modal-form-group">
                <label>Choose Active Service</label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="modal-select"
                >
                  <optgroup label="Active Available Services">
                    {pricingPlans.filter((p) => p.isActive).map((p) => (
                      <option key={p.id} value={p.id}>
                        🟢 {p.title} — {p.price} (Instant Non-VoIP)
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Coming Soon (Pre-release)">
                    {pricingPlans.filter((p) => !p.isActive).map((p) => (
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
                      {c.flag} {c.name} ({c.dialCode}) — Real Physical SIM
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
                  <span>Total Due:</span>
                  <span className="total-amount">${totalPrice}</span>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-primary btn-full btn-lg"
                disabled={isOrdering || !hasSufficientBalance}
                onClick={handleCreateOrder}
              >
                {isOrdering ? (
                  <>
                    <span className="btn-spinner" />
                    <span>Allocating Carrier SIM Line...</span>
                  </>
                ) : !hasSufficientBalance ? (
                  <span>Insufficient Balance — Top Up to Order</span>
                ) : (
                  <>
                    <span>Confirm &amp; Deduct ${totalPrice} from Balance</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </>
                )}
              </button>

              <p className="modal-guarantee-text">
                🔒 100% Automatic Refund back to your balance if SMS code is not received within 15 minutes.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
