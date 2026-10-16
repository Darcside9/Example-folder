import React from 'react';
import BrandIcon from './BrandIcon';
import { siteConfig } from '../data/siteConfig';

export default function SmsOrderConfirmModal({
  isOpen,
  onClose,
  service,
  country,
  userBalance,
  onConfirm,
  isAllocating
}) {
  if (!isOpen || !service) return null;

  const price = Number(service.price || service.retailPrice || service.defaultRetailNgn || 1000);
  const currentBal = Number(userBalance || 0);
  const hasSufficientBalance = currentBal >= price;
  const newBalance = hasSufficientBalance ? currentBal - price : currentBal;
  const countryFlag = country?.flag || (country?.code === 'CA' ? '🇨🇦' : '🇺🇸');
  const countryName = country?.shortName || (country?.code === 'CA' ? 'Canada' : 'United States');
  const countryDial = country?.dialCode || '+1';

  const handleOpenWhatsAppTopUp = () => {
    const needed = price - currentBal;
    const msg = `Hi Chris Shopper, I would like to top up my wallet balance with ₦${needed.toLocaleString()} to purchase a ${service.name} (${countryName}) SMS verification line.`;
    window.open(siteConfig.getWhatsAppSupportUrl(msg), '_blank');
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 9999 }}>
      <div 
        className="modal-container sms-order-confirm-modal" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '520px', width: '92%' }}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-icon" style={{ fontSize: '1.4rem' }}>{countryFlag}</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#f8fafc' }}>
                Order Summary • SMS Line
              </h3>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8' }}>
                Review verification specifications before renting
              </p>
            </div>
          </div>
          <button 
            type="button" 
            className="modal-close-btn" 
            onClick={onClose} 
            aria-label="Close Modal"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ padding: '20px' }}>
          {/* Target Service Card */}
          <div 
            className="confirm-service-card"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 18px',
              borderRadius: '12px',
              background: 'rgba(30, 41, 59, 0.7)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              marginBottom: '16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <BrandIcon name={service.name} iconKey={service.icon || service.id} size={36} />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <strong style={{ fontSize: '1.05rem', color: '#f8fafc' }}>{service.name}</strong>
                  {service.tigerCode && (
                    <span 
                      style={{ 
                        fontSize: '0.7rem', 
                        padding: '1px 6px', 
                        borderRadius: '4px', 
                        background: 'rgba(56, 189, 248, 0.2)', 
                        color: '#38bdf8', 
                        fontWeight: 700 
                      }}
                    >
                      {service.tigerCode}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>
                  {countryFlag} {countryName} ({countryDial}) • Speed {service.carrierSpeed || '< 3s'}
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase' }}>Rent Cost</div>
              <strong style={{ fontSize: '1.25rem', color: '#38bdf8', fontWeight: 800 }}>
                {siteConfig.formatNaira(price)}
              </strong>
            </div>
          </div>

          {/* Line Specs Table */}
          <div 
            className="confirm-specs-list"
            style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(148, 163, 184, 0.12)',
              borderRadius: '10px',
              padding: '12px 16px',
              marginBottom: '16px',
              fontSize: '0.84rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(148, 163, 184, 0.08)' }}>
              <span style={{ color: '#94a3b8' }}>Network / Line Quality:</span>
              <span style={{ color: '#10b981', fontWeight: 600 }}>Real Non-VoIP Physical SIM</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(148, 163, 184, 0.08)' }}>
              <span style={{ color: '#94a3b8' }}>Waiting Window Limit:</span>
              <span style={{ color: '#f8fafc', fontWeight: 600 }}>15 Minutes Active Gateway</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(148, 163, 184, 0.08)' }}>
              <span style={{ color: '#94a3b8' }}>Your Current Balance:</span>
              <span style={{ color: '#f8fafc', fontWeight: 600 }}>{siteConfig.formatNaira(currentBal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
              <span style={{ color: '#94a3b8' }}>Balance After Purchase:</span>
              <span style={{ color: hasSufficientBalance ? '#38bdf8' : '#ef4444', fontWeight: 700 }}>
                {hasSufficientBalance ? siteConfig.formatNaira(newBalance) : 'Insufficient Funds'}
              </span>
            </div>
          </div>

          {/* Refund Escrow Guarantee Banner */}
          <div 
            className="confirm-escrow-badge"
            style={{
              display: 'flex',
              gap: '10px',
              padding: '12px 14px',
              borderRadius: '10px',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              marginBottom: '20px'
            }}
          >
            <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>🛡️</span>
            <div style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.45 }}>
              <strong style={{ color: '#34d399', display: 'block', marginBottom: '2px' }}>
                Temporary Hold &amp; 100% Auto-Refund Guarantee
              </strong>
              Your wallet balance is only placed on a temporary hold while waiting. If no SMS OTP is received within the 15-minute window or if you cancel, <strong>{siteConfig.formatNaira(price)}</strong> is immediately and automatically refunded to your balance.
            </div>
          </div>

          {/* Insufficient Balance Notice */}
          {!hasSufficientBalance && (
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                marginBottom: '16px'
              }}
            >
              <div style={{ fontSize: '0.82rem', color: '#fca5a5' }}>
                ⚠️ You need <strong>{siteConfig.formatNaira(price - currentBal)}</strong> more to rent this number.
              </div>
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={handleOpenWhatsAppTopUp}
                style={{ padding: '6px 12px', fontSize: '0.78rem', whiteSpace: 'nowrap' }}
              >
                Top Up via WhatsApp
              </button>
            </div>
          )}

          {/* Modal Actions */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '10px' }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
              disabled={isAllocating}
            >
              Cancel
            </button>
            <button 
              type="button" 
              className="btn btn-primary"
              disabled={!hasSufficientBalance || isAllocating}
              onClick={() => onConfirm(service, country)}
              style={{ fontWeight: 700 }}
            >
              {isAllocating ? '⚡ Allocating Carrier Line...' : `Confirm & Rent (${siteConfig.formatNaira(price)})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
