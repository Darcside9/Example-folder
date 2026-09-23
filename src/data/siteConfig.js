// ==========================================================================
// CHRIS SHOPPER — SITE CONFIGURATION & DIRECT WHATSAPP LINKS
// ==========================================================================

export const siteConfig = {
  brandName: 'Chris Shopper',
  tagline: 'Instant Non-VoIP Carrier SMS Verification & Virtual SIM Gateway',
  supportEmail: 'support@chrisshopper.com',
  // Direct WhatsApp contact for support, notifications, orders, and balance top-ups
  whatsappNumber: '+1234567890', // Replace with your live business WhatsApp number
  whatsappUrl: 'https://wa.me/1234567890?text=Hello%20Chris%20Shopper%20Support%2C%20I%20need%20assistance%20with%20SMS%20verification.',
  
  getWhatsAppSupportUrl(message) {
    const text = message ? encodeURIComponent(message) : encodeURIComponent('Hello Chris Shopper Support, I need assistance with SMS verification.');
    return `https://wa.me/1234567890?text=${text}`;
  },

  getWhatsAppTopUpUrl(amount = 10, userEmail = '') {
    const emailStr = userEmail ? ` for account (${userEmail})` : '';
    const text = encodeURIComponent(`Hi Chris Shopper, I want to add $${amount} to my account balance${emailStr}. Please provide payment details.`);
    return `https://wa.me/1234567890?text=${text}`;
  },

  telegramChannel: 'https://t.me/chrisshopper',
  pricingNotice: 'Bulk carrier line allocation is currently active for Telegram and WhatsApp.',
  
  // Google Sheets Two-Way Inventory Configuration
  googleSheetId: '1QmUVQN8FM-gjg_ZvAL3tz6ztQ6Hdg8VskEiUxJJtJNg',
  googleSheetCsvUrl: 'https://docs.google.com/spreadsheets/d/1QmUVQN8FM-gjg_ZvAL3tz6ztQ6Hdg8VskEiUxJJtJNg/export?format=csv',
  googleAppsScriptUrl: 'https://script.google.com/macros/s/AKfycbw27CrH7318BU_Ey2W-_ZwU-wJcT6hW5_XTptbk46xBGe6yxlDhD2rNNLQN6DjukwEQAg/exec',
};
