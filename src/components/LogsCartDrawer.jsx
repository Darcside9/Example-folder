// ==========================================================================
// CHRIS SHOPPER — LOGS CART DRAWER COMPONENT
// Handles multi-item shopping cart review, atomic bulk dispensing,
// balance validation, and WhatsApp top-up redirects.
// ==========================================================================

import React, { useState } from 'react';
import { siteConfig } from '../data/siteConfig';
import { bulkDispenseAccountLogs } from '../lib/logsService';
import BrandIcon from './BrandIcon';

export default function LogsCartDrawer({
  isOpen,
  onClose,
  cart = [],
  onRemoveItem,
  onClearCart,
  currentUser,
  onRequireAuth,
  onShowToast,
  onBulkPurchaseSuccess
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const totalCost = cart.reduce((sum, it) => sum + Number(it.price || 0), 0);
  const userBalance = Number(currentUser?.balance || 0);
  const remainingBalance = Number((userBalance - totalCost).toFixed(2));
  const hasSufficientBalance = userBalance >= totalCost;

  const handleBulkCheckout = async () => {
    if (!currentUser) {
      if (onRequireAuth) onRequireAuth();
      return;
    }

    if (cart.length === 0) return;

    if (!hasSufficientBalance) {
      if (onShowToast) onShowToast('Insufficient wallet balance. Please top up.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await bulkDispenseAccountLogs({
        items: cart,
        userId: currentUser.id,
        userEmail: currentUser.email,
        currentBalance: userBalance
      });

      if (onClearCart) onClearCart();
      if (onClose) onClose();
      if (onBulkPurchaseSuccess) onBulkPurchaseSuccess(result);
    } catch (err) {
      console.error('Bulk checkout error:', err);
      setError(err.message || 'Bulk purchase failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="logs-cart-overlay" onClick={() => !loading && onClose && onClose()}>
      <div className="logs-cart-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="cart-drawer-header">
          <div className="cart-drawer-title-wrap">
            <span style={{ fontSize: '1.4rem' }}>🛒</span>
            <div>
              <h3 className="cart-drawer-title">Your Account Logs Cart</h3>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                {cart.length} {cart.length === 1 ? 'account' : 'accounts'} selected for bulk order
              </span>
            </div>
          </div>
          <button 
            type="button" 
            className="cart-drawer-close"
            disabled={loading}
            onClick={onClose}
            aria-label="Close cart"
          >
            ✕
          </button>
        </div>

        {/* 30-Day Retention Notice */}
        <div className="cart-retention-notice">
          <span>⏰</span>
          <span>
            <strong>30-Day Storage Notice:</strong> Purchased account credentials are retained in your Chris Shopper history for 30 days before being automatically purged.
          </span>
        </div>

        {/* Cart Items List */}
        <div className="cart-items-scroll">
          {cart.length === 0 ? (
            <div className="cart-empty-state">
              <span className="cart-empty-icon">🛒</span>
              <p className="cart-empty-text">Your bulk cart is currently empty.</p>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Select usernames from account configurations to add them to your cart.
              </span>
            </div>
          ) : (
            cart.map((item, idx) => (
              <div key={item.id || item.username || idx} className="cart-item-card">
                <div className="cart-item-left">
                  <BrandIcon iconKey={item.icon || item.platformId} name={item.platform || item.platformId} size={28} />
                  <div className="cart-item-info">
                    <span className="cart-item-user">@{item.username}</span>
                    <span className="cart-item-sub">
                      {item.title || `${item.platform} PVA Log`}
                    </span>
                  </div>
                </div>

                <div className="cart-item-right">
                  <span className="cart-item-price">
                    {siteConfig.formatNaira(item.price)}
                  </span>
                  <button
                    type="button"
                    className="cart-item-remove-btn"
                    disabled={loading}
                    onClick={() => onRemoveItem && onRemoveItem(item.id || item.username)}
                    title="Remove from cart"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {error && (
          <div style={{ margin: '0 20px', padding: '10px 14px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.35)', borderRadius: '8px', color: '#fca5a5', fontSize: '0.82rem' }}>
            ⚠️ {error}
          </div>
        )}

        {/* Footer / Summary Bar */}
        {cart.length > 0 && (
          <div className="cart-drawer-footer">
            <div className="cart-summary-table">
              <div className="cart-summary-row">
                <span>Selected Items:</span>
                <span className="font-mono text-white font-bold">{cart.length}</span>
              </div>
              <div className="cart-summary-row">
                <span>Your Wallet Balance:</span>
                <span className="font-mono text-cyan">{siteConfig.formatNaira(userBalance)}</span>
              </div>
              <div className="cart-summary-row total-row">
                <span>Total Amount:</span>
                <span className="font-mono text-green">{siteConfig.formatNaira(totalCost)}</span>
              </div>
              <div className="cart-summary-row">
                <span>Balance After Order:</span>
                <span className={`font-mono font-bold ${hasSufficientBalance ? 'text-green' : 'text-danger'}`}>
                  {siteConfig.formatNaira(remainingBalance)}
                </span>
              </div>
            </div>

            <div className="cart-checkout-actions">
              {!hasSufficientBalance ? (
                <a
                  href={siteConfig.getWhatsAppTopUpUrl(Math.max(2000, Math.ceil(totalCost - userBalance)), currentUser?.email)}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-cart-checkout"
                  style={{ background: '#25D366', textDecoration: 'none' }}
                >
                  <span>💬 Top Up via WhatsApp ({siteConfig.formatNaira(Math.max(2000, Math.ceil(totalCost - userBalance)))})</span>
                </a>
              ) : (
                <button
                  type="button"
                  className="btn-cart-checkout"
                  disabled={loading || cart.length === 0}
                  onClick={handleBulkCheckout}
                >
                  {loading ? (
                    <>
                      <span className="waiting-dot-pulse mr-2" />
                      Dispensing {cart.length} Account Logs...
                    </>
                  ) : (
                    `Confirm & Bulk Purchase (${siteConfig.formatNaira(totalCost)}) 🔑`
                  )}
                </button>
              )}

              <button
                type="button"
                className="btn-cart-clear"
                disabled={loading}
                onClick={onClearCart}
              >
                Clear Entire Cart
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
