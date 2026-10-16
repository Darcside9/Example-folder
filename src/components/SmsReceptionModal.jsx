import React, { useState, useEffect } from 'react';
import BrandIcon from './BrandIcon';
import { siteConfig } from '../data/siteConfig';

export default function SmsReceptionModal({
  isOpen,
  onClose,
  order,
  onSimulateSms,
  onCancelOrder,
  onTimeoutOrder
}) {
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(15 * 60);
  const [isCancelling, setIsCancelling] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  // Initialize countdown based on order creation/expiry
  useEffect(() => {
    if (!order) return;
    const expiresAt = order.expires_at ? new Date(order.expires_at).getTime() : Date.now() + 15 * 60 * 1000;
    const initialDiff = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
    setSecondsLeft(initialDiff > 0 ? initialDiff : 15 * 60);
    setTimedOut(order.status === 'timed_out' || order.status === 'cancelled');
  }, [order?.id, order?.expires_at, order?.status]);

  // Countdown timer loop
  useEffect(() => {
    if (!isOpen || !order || order.status === 'code_received' || timedOut) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setTimedOut(true);
          if (onTimeoutOrder && order.status === 'pending') {
            onTimeoutOrder(order);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, order?.id, order?.status, timedOut, onTimeoutOrder]);

  if (!isOpen || !order) return null;

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  const isCodeReceived = order.status === 'code_received' && Boolean(order.sms_code);
  const isCancelled = order.status === 'cancelled' || order.status === 'refunded';
  const countryFlag = order.country_flag || (order.country_code === 'UK' || order.country_code === 'GB' ? '🇬🇧' : (order.country_code === 'CA' ? '🇨🇦' : '🇺🇸'));
  const countryName = order.country_name || (order.country_code === 'UK' || order.country_code === 'GB' ? 'United Kingdom' : (order.country_code === 'CA' ? 'Canada' : 'United States'));

  const handleCopyNumber = () => {
    if (!order.phone_number) return;
    navigator.clipboard.writeText(order.phone_number);
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2200);
  };

  const handleCopyCode = () => {
    if (!order.sms_code) return;
    // Extract raw digits if formatted like "123-456"
    const cleanDigits = order.sms_code.replace(/[^0-9a-zA-Z]/g, '');
    navigator.clipboard.writeText(cleanDigits || order.sms_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2200);
  };

  const handleCancelClick = async () => {
    if (isCancelling) return;
    setIsCancelling(true);
    try {
      if (onCancelOrder) {
        await onCancelOrder(order);
      }
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 10000 }}>
      <div 
        className="modal-container sms-reception-modal" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '560px', width: '92%' }}
      >
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-icon" style={{ fontSize: '1.4rem' }}>{countryFlag}</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#f8fafc' }}>
                Live SMS Carrier Reception
              </h3>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8' }}>
                {countryFlag} {countryName} • {order.service_name}
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

        {/* Body */}
        <div className="modal-body" style={{ padding: '20px' }}>
          {/* Top Status & Timer Row */}
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderRadius: '10px',
              background: isCodeReceived 
                ? 'rgba(16, 185, 129, 0.12)' 
                : timedOut || isCancelled
                  ? 'rgba(239, 68, 68, 0.12)'
                  : 'rgba(56, 189, 248, 0.1)',
              border: `1px solid ${
                isCodeReceived 
                  ? 'rgba(16, 185, 129, 0.3)' 
                  : timedOut || isCancelled
                    ? 'rgba(239, 68, 68, 0.3)'
                    : 'rgba(56, 189, 248, 0.25)'
              }`,
              marginBottom: '16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span 
                style={{
                  display: 'inline-block',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: isCodeReceived ? '#10b981' : timedOut || isCancelled ? '#ef4444' : '#38bdf8',
                  boxShadow: isCodeReceived 
                    ? '0 0 10px #10b981' 
                    : timedOut || isCancelled 
                      ? 'none' 
                      : '0 0 10px #38bdf8'
                }}
              />
              <strong style={{ fontSize: '0.88rem', color: '#f8fafc' }}>
                {isCodeReceived 
                  ? 'OTP Code Received • Verification Complete' 
                  : timedOut 
                    ? '15-Min Window Expired • Auto-Refunded' 
                    : isCancelled
                      ? 'Rental Cancelled • Refunded'
                      : 'Listening for Carrier SMS OTP...'}
              </strong>
            </div>

            {/* Countdown Badge */}
            {!isCodeReceived && !timedOut && !isCancelled && (
              <div 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background: secondsLeft < 180 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                  color: secondsLeft < 180 ? '#fca5a5' : '#38bdf8',
                  fontWeight: 700,
                  fontSize: '0.84rem'
                }}
              >
                <span>⏱️</span>
                <span>{timeFormatted}</span>
              </div>
            )}
          </div>

          {/* Allocated Number Display Card */}
          <div 
            className="allocated-phone-box"
            style={{
              padding: '16px',
              borderRadius: '12px',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(148, 163, 184, 0.15)',
              textAlign: 'center',
              marginBottom: '18px'
            }}
          >
            <span style={{ fontSize: '0.78rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Your Dedicated Virtual Line ({countryFlag} {countryName})
            </span>
            <div 
              style={{ 
                fontSize: '1.65rem', 
                fontWeight: 800, 
                color: '#f8fafc', 
                letterSpacing: '1px', 
                margin: '8px 0 12px' 
              }}
            >
              {order.phone_number}
            </div>

            <button
              type="button"
              className={`btn btn-sm ${copiedNumber ? 'btn-primary' : 'btn-secondary'}`}
              onClick={handleCopyNumber}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 16px',
                fontWeight: 600
              }}
            >
              <span>{copiedNumber ? '✓ Copied Number!' : '📋 Copy Phone Number'}</span>
            </button>
          </div>

          {/* STATE A: SMS CODE RECEIVED SUCCESS BOX */}
          {isCodeReceived && (
            <div 
              className="sms-code-arrival-card"
              style={{
                padding: '18px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 78, 59, 0.25))',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                textAlign: 'center',
                marginBottom: '18px'
              }}
            >
              <div style={{ fontSize: '0.8rem', color: '#6ee7b7', textTransform: 'uppercase', fontWeight: 700 }}>
                Verification Code Received
              </div>
              <div 
                style={{
                  fontSize: '2.5rem',
                  fontWeight: 900,
                  letterSpacing: '4px',
                  color: '#ffffff',
                  margin: '10px 0',
                  textShadow: '0 0 20px rgba(16, 185, 129, 0.6)'
                }}
              >
                {order.sms_code}
              </div>

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleCopyCode}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 24px',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  marginBottom: '14px'
                }}
              >
                <span>{copiedCode ? '✓ Copied Code!' : '📋 Copy Verification Code'}</span>
              </button>

              {order.message_body && (
                <div 
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    fontSize: '0.82rem',
                    color: '#cbd5e1',
                    textAlign: 'left'
                  }}
                >
                  <strong style={{ color: '#34d399', display: 'block', marginBottom: '2px', fontSize: '0.74rem' }}>
                    Carrier Message Text:
                  </strong>
                  "{order.message_body}"
                </div>
              )}
            </div>
          )}

          {/* STATE B: WAITING FOR SMS RADAR SCANNER */}
          {!isCodeReceived && !timedOut && !isCancelled && (
            <div 
              className="sms-waiting-radar"
              style={{
                padding: '20px',
                borderRadius: '12px',
                background: 'rgba(30, 41, 59, 0.4)',
                border: '1px dashed rgba(56, 189, 248, 0.3)',
                textAlign: 'center',
                marginBottom: '18px'
              }}
            >
              <div className="radar-sweep-animation" style={{ fontSize: '2rem', marginBottom: '8px' }}>
                📡
              </div>
              <strong style={{ fontSize: '0.95rem', color: '#f8fafc', display: 'block' }}>
                Carrier Gateway Connected
              </strong>
              <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: '6px 0 14px', lineHeight: 1.45 }}>
                1. Paste <strong>{order.phone_number}</strong> into {order.service_name}.<br/>
                2. Tap request SMS code.<br/>
                3. Your code will appear here automatically within seconds.
              </p>

              {/* Simulation test button */}
              {onSimulateSms && (
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => onSimulateSms(order.id)}
                  style={{
                    fontSize: '0.78rem',
                    padding: '5px 14px',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    color: '#38bdf8'
                  }}
                  title="Simulate SMS OTP arrival without calling external API"
                >
                  ⚡ Simulate SMS OTP Arrival (Demo Test)
                </button>
              )}
            </div>
          )}

          {/* STATE C: TIMED OUT OR CANCELLED BANNER */}
          {(timedOut || isCancelled) && (
            <div 
              style={{
                padding: '16px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                marginBottom: '18px',
                textAlign: 'center'
              }}
            >
              <span style={{ fontSize: '1.8rem', display: 'block', marginBottom: '6px' }}>💰</span>
              <strong style={{ color: '#fca5a5', fontSize: '0.95rem', display: 'block', marginBottom: '4px' }}>
                {timedOut ? 'Waiting Window Expired' : 'Line Cancelled'}
              </strong>
              <p style={{ fontSize: '0.82rem', color: '#cbd5e1', margin: 0 }}>
                {siteConfig.formatNaira(order.cost || 0)} has been automatically refunded to your wallet balance.
              </p>
            </div>
          )}

          {/* Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {!isCodeReceived && !timedOut && !isCancelled ? (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleCancelClick}
                disabled={isCancelling}
                style={{ color: '#fca5a5', borderColor: 'rgba(239, 68, 68, 0.3)' }}
              >
                {isCancelling ? 'Refunding...' : 'Cancel & Auto-Refund'}
              </button>
            ) : (
              <div />
            )}

            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={onClose}
              style={{ padding: '8px 20px', fontWeight: 600 }}
            >
              {isCodeReceived ? 'Done' : 'Close Window'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
