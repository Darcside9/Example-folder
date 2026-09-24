// ==========================================================================
// CHRIS SHOPPER — LOGS MARKETPLACE COMPONENT (ACCSZONE.COM MODEL)
// ==========================================================================

import React, { useState, useEffect, useMemo } from 'react';
import { 
  fetchLiveLogs, 
  getPlatformsCatalog, 
  dispenseLogChronological,
  downloadCredentialsFile,
  exportCredentialsAsText
} from '../lib/logsService';
import { useAuth } from '../lib/AuthContext';
import { siteConfig } from '../data/siteConfig';

export default function LogsMarketplace({ 
  onRequireAuth, 
  onShowToast, 
  isDashboard = false,
  onPurchaseComplete 
}) {
  const { currentUser, refreshUser } = useAuth();
  
  const [logs, setLogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    platform: null,
    loading: false,
    error: null,
  });

  const [deliveryModal, setDeliveryModal] = useState({
    isOpen: false,
    credential: null,
    showPassword: false,
    showMailPassword: false,
    copiedField: null,
  });

  // Fetch live inventory
  const loadInventory = async () => {
    setLoading(true);
    try {
      const liveLogs = await fetchLiveLogs();
      setLogs(liveLogs);
      const catalog = getPlatformsCatalog(liveLogs);
      setCategories(catalog);
    } catch (err) {
      console.error('Error loading logs catalog:', err);
      if (onShowToast) onShowToast('Failed to sync live Google Sheets inventory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const toast = (msg) => {
    if (onShowToast) onShowToast(msg);
  };

  const handleCopy = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setDeliveryModal(prev => ({ ...prev, copiedField: fieldName }));
    toast(`Copied ${fieldName}!`);
    setTimeout(() => {
      setDeliveryModal(prev => ({ ...prev, copiedField: null }));
    }, 2000);
  };

  const handleOpenBuy = (cat) => {
    if (!currentUser) {
      if (onRequireAuth) {
        onRequireAuth();
      } else {
        toast('Please log in or create an account to purchase logs.');
      }
      return;
    }

    if (cat.inStock <= 0) {
      toast(`${cat.name} logs are currently Out of Stock! Check back soon.`);
      return;
    }

    setConfirmModal({
      isOpen: true,
      platform: cat,
      loading: false,
      error: null,
    });
  };

  const handleConfirmPurchase = async () => {
    if (!confirmModal.platform || !currentUser) return;
    
    setConfirmModal(prev => ({ ...prev, loading: true, error: null }));

    try {
      const balance = Number(currentUser.balance || 0);
      const result = await dispenseLogChronological({
        platformId: confirmModal.platform.id,
        userId: currentUser.id,
        userEmail: currentUser.email,
        currentBalance: balance,
      });

      // Refresh user balance in context
      if (refreshUser) {
        await refreshUser();
      }

      // Close confirmation and show delivery
      setConfirmModal({ isOpen: false, platform: null, loading: false, error: null });
      setDeliveryModal({
        isOpen: true,
        credential: result.credential,
        showPassword: false,
        showMailPassword: false,
        copiedField: null,
      });

      toast(`🎉 Successfully purchased ${result.credential.platform} Account Log!`);

      if (onPurchaseComplete) {
        onPurchaseComplete(result.credential);
      }

      // Reload live inventory
      await loadInventory();
    } catch (err) {
      console.error('Purchase error:', err);
      setConfirmModal(prev => ({ ...prev, loading: false, error: err.message || 'Purchase failed.' }));
    }
  };

  // Filtered platforms
  const filteredCatalog = useMemo(() => {
    return categories
      .filter(cat => cat.id !== 'all')
      .filter(cat => {
        if (selectedPlatform !== 'all' && cat.id !== selectedPlatform) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = cat.name.toLowerCase().includes(q);
          const matchDesc = (cat.description || '').toLowerCase().includes(q);
          const matchFeatures = (cat.features || []).some(f => f.toLowerCase().includes(q));
          return matchName || matchDesc || matchFeatures;
        }
        return true;
      });
  }, [categories, selectedPlatform, searchQuery]);

  return (
    <section className={`logs-marketplace-section ${isDashboard ? 'in-dashboard' : 'reveal-on-scroll'}`} id="logs-marketplace">
      {/* Header Area */}
      {!isDashboard && (
        <div className="logs-header-area">
          <div className="logs-badge-pill">
            <span className="logs-live-dot" />
            <span>Google Sheets Live Inventory Two-Way Sync</span>
          </div>
          <h2 className="logs-header-title">
            Social & Platform <span className="text-gradient">Account Logs</span>
          </h2>
          <p className="logs-header-desc">
            Aged and phone-verified account credentials with 2FA authenticator secrets, email access, and instant automated FIFO delivery.
          </p>
        </div>
      )}

      {/* Demo Pricing Notice Banner */}
      <div className="logs-demo-banner">
        <div className="logs-demo-banner-content">
          <span className="logs-demo-tag">DEMO PRICING ACTIVE</span>
          <span>
            Account log listings are currently configured with <strong>indicative demo pricing ($1.00 - $1.50)</strong> for checkout and instant FIFO credential delivery verification.
          </span>
        </div>
        <button 
          className="btn-mini-copy" 
          onClick={loadInventory}
          title="Refresh inventory from Google Sheet"
        >
          {loading ? 'Syncing...' : '🔄 Live Sync'}
        </button>
      </div>

      {/* Filter and Search Controls */}
      <div className="logs-controls-bar">
        <div className="logs-platform-pills">
          {categories.map(cat => (
            <button
              key={cat.id}
              type="button"
              className={`logs-platform-pill ${selectedPlatform === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedPlatform(cat.id)}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
              <span className="logs-pill-count">{cat.inStock}</span>
            </button>
          ))}
        </div>

        <div className="logs-search-wrapper">
          <svg className="logs-search-icon" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            type="text"
            className="logs-search-input"
            placeholder="Search platform or specs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Marketplace Catalog List */}
      <div className="logs-catalog-container">
        {loading && categories.length === 0 ? (
          <div className="p-8 text-center text-muted">
            <span className="waiting-dot-pulse mr-2" /> Syncing live catalog from Google Sheets...
          </div>
        ) : filteredCatalog.length === 0 ? (
          <div className="p-8 text-center text-muted">
            No account logs found matching "{searchQuery}".
          </div>
        ) : (
          filteredCatalog.map(item => {
            const hasStock = item.inStock > 0;
            const badgeClass = `badge-${(item.badge || 'verified').toLowerCase()}`;

            return (
              <div key={item.id} className="logs-card-row">
                {/* Platform Icon */}
                <div className="logs-platform-badge">
                  <div className="logs-platform-icon-wrap" style={{ borderColor: item.color }}>
                    {item.icon}
                  </div>
                </div>

                {/* Account Details & Specs */}
                <div className="logs-details-col">
                  <div className="logs-title-wrap">
                    <h3 className="logs-item-title">{item.description || `${item.name} PVA Accounts`}</h3>
                    {item.badge && (
                      <span className={`logs-badge-spec ${badgeClass}`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <div className="logs-features-chips">
                    {(item.features || []).map((feat, idx) => (
                      <span key={idx} className="logs-chip">✓ {feat}</span>
                    ))}
                  </div>
                </div>

                {/* In Stock Count */}
                <div className="logs-stock-col">
                  <span className={`stock-count-badge ${hasStock ? 'stock-in' : 'stock-out'}`}>
                    <span className="stock-dot" />
                    {hasStock ? `${item.inStock} pcs. in stock` : 'Out of Stock'}
                  </span>
                </div>

                {/* Price Display */}
                <div className="logs-price-col">
                  <span className="logs-price-val">${Number(item.demoPrice || 1.50).toFixed(2)}</span>
                  <span className="logs-price-sub">Demo Price</span>
                </div>

                {/* Action CTA */}
                <div className="logs-actions-col">
                  <button
                    type="button"
                    className="btn-buy-log"
                    disabled={!hasStock}
                    onClick={() => handleOpenBuy(item)}
                  >
                    <span>{hasStock ? 'Buy Log 🔑' : 'Sold Out'}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CONFIRMATION PURCHASE MODAL */}
      {confirmModal.isOpen && confirmModal.platform && (
        <div className="logs-modal-overlay" onClick={() => !confirmModal.loading && setConfirmModal({ isOpen: false, platform: null, loading: false, error: null })}>
          <div className="logs-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="logs-modal-header">
              <div>
                <h3 className="logs-modal-title">Confirm Account Log Purchase</h3>
                <p className="logs-modal-subtitle">
                  Automated FIFO delivery directly from secure Google Sheets inventory
                </p>
              </div>
              <button 
                type="button" 
                className="logs-modal-close-btn"
                disabled={confirmModal.loading}
                onClick={() => setConfirmModal({ isOpen: false, platform: null, loading: false, error: null })}
              >
                ✕
              </button>
            </div>

            <div className="credentials-display-card">
              <div className="credential-field-row">
                <span className="cred-label">Platform</span>
                <span className="font-bold text-white">{confirmModal.platform.name}</span>
              </div>
              <div className="credential-field-row">
                <span className="cred-label">Item Specs</span>
                <span className="text-muted text-sm">{confirmModal.platform.description}</span>
              </div>
              <div className="credential-field-row">
                <span className="cred-label">Price (Demo)</span>
                <span className="logs-price-val">${Number(confirmModal.platform.demoPrice || 1.50).toFixed(2)}</span>
              </div>
              <div className="credential-field-row">
                <span className="cred-label">Your Balance</span>
                <span className="font-mono text-cyan">${Number(currentUser?.balance || 0).toFixed(2)}</span>
              </div>
            </div>

            <p className="text-xs text-muted leading-relaxed mb-4">
              🔒 <strong>FIFO Dispense Guarantee:</strong> The system will chronologically dispense the earliest unpurchased row, immediately lock it, and tag it as SOLD in the client's Google Sheet via Apps Script webhook.
            </p>

            {confirmModal.error && (
              <div className="p-3 bg-red-900/30 border border-red-500/40 rounded-lg text-red-300 text-sm mb-4">
                ⚠️ {confirmModal.error}
              </div>
            )}

            {Number(currentUser?.balance || 0) < Number(confirmModal.platform.demoPrice || 1.50) ? (
              <div className="delivery-actions-row">
                <a 
                  href={siteConfig.getWhatsAppTopUpUrl(10, currentUser?.email)}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-action-primary"
                >
                  💬 Top Up via WhatsApp ($10)
                </a>
                <button 
                  type="button"
                  className="btn-action-secondary"
                  onClick={() => setConfirmModal({ isOpen: false, platform: null, loading: false, error: null })}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="delivery-actions-row">
                <button
                  type="button"
                  className="btn-action-primary"
                  disabled={confirmModal.loading}
                  onClick={handleConfirmPurchase}
                >
                  {confirmModal.loading ? (
                    <>
                      <span className="waiting-dot-pulse mr-2" />
                      Dispensing & Syncing Sheet...
                    </>
                  ) : (
                    'Confirm & Dispense Credentials 🔑'
                  )}
                </button>
                <button
                  type="button"
                  className="btn-action-secondary"
                  disabled={confirmModal.loading}
                  onClick={() => setConfirmModal({ isOpen: false, platform: null, loading: false, error: null })}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREDENTIALS DELIVERY MODAL */}
      {deliveryModal.isOpen && deliveryModal.credential && (
        <div className="logs-modal-overlay">
          <div className="logs-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="logs-modal-header">
              <div>
                <h3 className="logs-modal-title text-green">🎉 Credentials Dispensed!</h3>
                <p className="logs-modal-subtitle">
                  {deliveryModal.credential.platform} Account Log • Please save or download your credentials now.
                </p>
              </div>
              <button 
                type="button" 
                className="logs-modal-close-btn"
                onClick={() => setDeliveryModal({ isOpen: false, credential: null, showPassword: false, showMailPassword: false, copiedField: null })}
              >
                ✕
              </button>
            </div>

            <div className="credentials-display-card">
              {/* Username */}
              <div className="credential-field-row">
                <span className="cred-label">Username / UID:</span>
                <div className="cred-val-wrap">
                  <span className="cred-val-mono">{deliveryModal.credential.username}</span>
                  <button 
                    type="button" 
                    className={`btn-mini-copy ${deliveryModal.copiedField === 'Username' ? 'copied' : ''}`}
                    onClick={() => handleCopy(deliveryModal.credential.username, 'Username')}
                  >
                    {deliveryModal.copiedField === 'Username' ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Password */}
              <div className="credential-field-row">
                <span className="cred-label">Password:</span>
                <div className="cred-val-wrap">
                  <span className="cred-val-mono">
                    {deliveryModal.showPassword ? deliveryModal.credential.password : '••••••••••••'}
                  </span>
                  <button
                    type="button"
                    className="btn-mini-copy"
                    onClick={() => setDeliveryModal(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                  >
                    {deliveryModal.showPassword ? 'Hide' : 'Reveal'}
                  </button>
                  <button 
                    type="button" 
                    className={`btn-mini-copy ${deliveryModal.copiedField === 'Password' ? 'copied' : ''}`}
                    onClick={() => handleCopy(deliveryModal.credential.password, 'Password')}
                  >
                    {deliveryModal.copiedField === 'Password' ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* 2FA Key */}
              {deliveryModal.credential.twoFactorKey && (
                <div className="credential-field-row">
                  <span className="cred-label">2FA Secret Key:</span>
                  <div className="cred-val-wrap">
                    <span className="cred-val-mono">{deliveryModal.credential.twoFactorKey}</span>
                    <button 
                      type="button" 
                      className={`btn-mini-copy ${deliveryModal.copiedField === '2FA' ? 'copied' : ''}`}
                      onClick={() => handleCopy(deliveryModal.credential.twoFactorKey, '2FA')}
                    >
                      {deliveryModal.copiedField === '2FA' ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              )}

              {/* Mail */}
              {deliveryModal.credential.mail && (
                <div className="credential-field-row">
                  <span className="cred-label">Mail Access:</span>
                  <div className="cred-val-wrap">
                    <span className="cred-val-mono">{deliveryModal.credential.mail}</span>
                    <button 
                      type="button" 
                      className={`btn-mini-copy ${deliveryModal.copiedField === 'Mail' ? 'copied' : ''}`}
                      onClick={() => handleCopy(deliveryModal.credential.mail, 'Mail')}
                    >
                      {deliveryModal.copiedField === 'Mail' ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              )}

              {/* Mail Password */}
              {deliveryModal.credential.mailPassword && (
                <div className="credential-field-row">
                  <span className="cred-label">Mail Password:</span>
                  <div className="cred-val-wrap">
                    <span className="cred-val-mono">
                      {deliveryModal.showMailPassword ? deliveryModal.credential.mailPassword : '••••••••••••'}
                    </span>
                    <button
                      type="button"
                      className="btn-mini-copy"
                      onClick={() => setDeliveryModal(prev => ({ ...prev, showMailPassword: !prev.showMailPassword }))}
                    >
                      {deliveryModal.showMailPassword ? 'Hide' : 'Reveal'}
                    </button>
                    <button 
                      type="button" 
                      className={`btn-mini-copy ${deliveryModal.copiedField === 'Mail Password' ? 'copied' : ''}`}
                      onClick={() => handleCopy(deliveryModal.credential.mailPassword, 'Mail Password')}
                    >
                      {deliveryModal.copiedField === 'Mail Password' ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              )}

              {/* Combo String */}
              <div className="combo-string-box">
                <div className="combo-string-label">Full Combo (user:pass:mail:mailpass:2fa):</div>
                <div className="combo-string-val">{deliveryModal.credential.comboString}</div>
              </div>
            </div>

            {/* Delivery Action Buttons */}
            <div className="delivery-actions-row">
              <button
                type="button"
                className="btn-action-primary"
                onClick={() => handleCopy(deliveryModal.credential.comboString, 'Full Combo')}
              >
                📋 Copy Full Combo
              </button>
              <button
                type="button"
                className="btn-action-secondary"
                onClick={() => downloadCredentialsFile(deliveryModal.credential)}
              >
                ⬇️ Download .txt File
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
