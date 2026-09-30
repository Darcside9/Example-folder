import { ADMIN_CONTACT, siteConfig } from '../data/siteConfig';

export { ADMIN_CONTACT, siteConfig };

/**
 * Reusable WhatsApp Chat / Support Action Component
 */
export function WhatsAppSupportButton({ 
  className = 'btn btn-primary', 
  label = 'Chat on WhatsApp', 
  message = 'Hello Chris Shopper Support, I need assistance.', 
  icon = true 
}) {
  const url = ADMIN_CONTACT.getWhatsAppSupportUrl(message);
  return (
    <a 
      href={url} 
      target="_blank" 
      rel="noreferrer" 
      className={className}
      aria-label="Direct WhatsApp Support"
    >
      {icon && <span style={{ marginRight: '6px' }}>💬</span>}
      <span>{label}</span>
    </a>
  );
}

/**
 * Reusable WhatsApp Top-Up Action Component
 */
export function WhatsAppTopUpButton({ 
  className = 'btn btn-whatsapp', 
  amount = 2000, 
  userEmail = '', 
  label = null 
}) {
  const url = ADMIN_CONTACT.getWhatsAppTopUpUrl(amount, userEmail);
  const displayLabel = label || `Top Up via WhatsApp (${siteConfig.formatNaira(amount)})`;
  return (
    <a 
      href={url} 
      target="_blank" 
      rel="noreferrer" 
      className={className}
      aria-label="Top Up Wallet via WhatsApp"
    >
      <span style={{ marginRight: '6px' }}>💬</span>
      <span>{displayLabel}</span>
    </a>
  );
}

/**
 * Clean Contact Info Card / Badges Component
 */
export function ContactInfoBlock({ showEmail = true, showPhone = true }) {
  return (
    <div className="contact-info-block" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {showPhone && (
        <a 
          href={siteConfig.whatsappUrl} 
          target="_blank" 
          rel="noreferrer" 
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#38bdf8', textDecoration: 'none' }}
        >
          <span>💬</span>
          <span className="font-mono">{ADMIN_CONTACT.formattedPhone}</span>
        </a>
      )}
      {showEmail && (
        <a 
          href={`mailto:${ADMIN_CONTACT.adminEmail}`} 
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#94a3b8', textDecoration: 'none' }}
        >
          <span>✉️</span>
          <span className="font-mono">{ADMIN_CONTACT.adminEmail}</span>
        </a>
      )}
    </div>
  );
}

export default ADMIN_CONTACT;
