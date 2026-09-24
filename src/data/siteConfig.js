// ==========================================================================
// CHRIS SHOPPER — SITE CONFIGURATION & DIRECT WHATSAPP LINKS
// ==========================================================================

const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '+1234567890';
const cleanWhatsappNumber = whatsappNumber.replace(/[^0-9]/g, '');

const googleSheetId = import.meta.env.VITE_GOOGLE_SHEET_ID || '';
const googleSheetCsvUrl = 
  import.meta.env.VITE_GOOGLE_SHEET_CSV_URL || 
  (googleSheetId ? `https://docs.google.com/spreadsheets/d/${googleSheetId}/export?format=csv` : '');
const googleAppsScriptUrl = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL || '';

export const siteConfig = {
  brandName: 'Chris Shopper',
  tagline: 'Instant Non-VoIP Carrier SMS Verification & Virtual SIM Gateway',
  supportEmail: 'support@chrisshopper.com',
  // Direct WhatsApp contact for support, notifications, orders, and balance top-ups
  whatsappNumber,
  whatsappUrl: `https://wa.me/${cleanWhatsappNumber}?text=Hello%20Chris%20Shopper%20Support%2C%20I%20need%20assistance%20with%20SMS%20verification.`,
  
  getWhatsAppSupportUrl(message) {
    const text = message ? encodeURIComponent(message) : encodeURIComponent('Hello Chris Shopper Support, I need assistance with SMS verification.');
    return `https://wa.me/${cleanWhatsappNumber}?text=${text}`;
  },

  getWhatsAppTopUpUrl(amount = 10, userEmail = '') {
    const emailStr = userEmail ? ` for account (${userEmail})` : '';
    const text = encodeURIComponent(`Hi Chris Shopper, I want to add $${amount} to my account balance${emailStr}. Please provide payment details.`);
    return `https://wa.me/${cleanWhatsappNumber}?text=${text}`;
  },

  telegramChannel: 'https://t.me/chrisshopper',
  pricingNotice: 'Bulk carrier line allocation is currently active for Telegram and WhatsApp.',
  
  // Google Sheets Two-Way Inventory Configuration (sourced securely from environment variables)
  googleSheetId,
  googleSheetCsvUrl,
  googleAppsScriptUrl,
};

