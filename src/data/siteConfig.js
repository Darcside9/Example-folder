// ==========================================================================
// CHRIS SHOPPER — CENTRAL SITE CONFIGURATION & OFFICIAL CONTACT CONSTANTS
// Stores official WhatsApp numbers, admin/support emails, and Naira currency helpers
// ==========================================================================

export const DEFAULT_WHATSAPP_NUMBER = '+2349135560229';
export const DEFAULT_WHATSAPP_FORMATTED = '+234 913 556 0229';
export const DEFAULT_ADMIN_EMAIL = 'darcside999@gmail.com';
export const DEFAULT_SUPPORT_EMAIL = 'darcside999@gmail.com';

const rawWhatsapp = (import.meta.env.VITE_WHATSAPP_NUMBER || DEFAULT_WHATSAPP_NUMBER).trim();
const cleanWhatsapp = rawWhatsapp.replace(/[^0-9]/g, '');

const rawAdminEmail = (import.meta.env.VITE_ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL).trim().toLowerCase();
const rawSupportEmail = (import.meta.env.VITE_SUPPORT_EMAIL || DEFAULT_SUPPORT_EMAIL).trim().toLowerCase();

/**
 * Universal Naira currency formatter
 */
export function formatNaira(amount) {
  const num = Number(amount) || 0;
  return `₦${num.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function formatCurrency(amount) {
  return formatNaira(amount);
}

/**
 * Centralized Contact and Admin Information Object
 * Import this anywhere you need phone numbers, WhatsApp, or admin credentials.
 */
export const ADMIN_CONTACT = {
  whatsappNumber: rawWhatsapp,
  whatsappDigits: cleanWhatsapp,
  formattedPhone: DEFAULT_WHATSAPP_FORMATTED,
  adminEmail: rawAdminEmail,
  supportEmail: rawSupportEmail,
  brandName: 'Chris Shopper',
  getWhatsAppSupportUrl(message) {
    const text = message 
      ? encodeURIComponent(message) 
      : encodeURIComponent('Hello Chris Shopper Support, I need assistance.');
    return `https://wa.me/${cleanWhatsapp}?text=${text}`;
  },
  getWhatsAppTopUpUrl(amount = 2000, userEmail = '') {
    const emailStr = userEmail ? ` for account (${userEmail})` : '';
    const formattedAmount = Number(amount).toLocaleString('en-NG');
    const text = encodeURIComponent(`Hi Chris Shopper, I want to add ₦${formattedAmount} to my account balance${emailStr}. Please provide payment details.`);
    return `https://wa.me/${cleanWhatsapp}?text=${text}`;
  }
};

export const CONTACT_INFO = ADMIN_CONTACT;

/**
 * Primary site configuration object
 */
export const siteConfig = {
  brandName: 'Chris Shopper',
  tagline: 'Instant Non-VoIP Carrier SMS Verification & Premium Account Gateway',
  supportEmail: rawSupportEmail,
  adminEmail: rawAdminEmail,
  whatsappNumber: rawWhatsapp,
  whatsappDigits: cleanWhatsapp,
  formattedPhone: DEFAULT_WHATSAPP_FORMATTED,
  whatsappUrl: `https://wa.me/${cleanWhatsapp}?text=Hello%20Chris%20Shopper%20Support%2C%20I%20need%20assistance.`,
  
  // Universal Currency Settings
  currency: {
    symbol: '₦',
    code: 'NGN',
    name: 'Nigerian Naira'
  },

  formatNaira,
  formatCurrency,

  getWhatsAppSupportUrl(message) {
    return ADMIN_CONTACT.getWhatsAppSupportUrl(message);
  },

  getWhatsAppTopUpUrl(amount = 2000, userEmail = '') {
    return ADMIN_CONTACT.getWhatsAppTopUpUrl(amount, userEmail);
  },

  telegramChannel: 'https://t.me/chrisshopper',
  pricingNotice: 'Bulk carrier line allocation is currently active.',
};

export default siteConfig;
