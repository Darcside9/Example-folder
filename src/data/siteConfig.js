// ==========================================================================
// CHRIS SHOPPER — SITE CONFIGURATION, CURRENCY & DIRECT WHATSAPP LINKS
// ==========================================================================

const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '+1234567890';
const cleanWhatsappNumber = whatsappNumber.replace(/[^0-9]/g, '');

export function formatNaira(amount) {
  const num = Number(amount) || 0;
  return `₦${num.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function formatCurrency(amount) {
  return formatNaira(amount);
}

export const siteConfig = {
  brandName: 'Chris Shopper',
  tagline: 'Instant Non-VoIP Carrier SMS Verification & Premium Account Gateway',
  supportEmail: 'support@chrisshopper.com',
  whatsappNumber,
  whatsappUrl: `https://wa.me/${cleanWhatsappNumber}?text=Hello%20Chris%20Shopper%20Support%2C%20I%20need%20assistance.`,
  
  // Universal Currency Settings
  currency: {
    symbol: '₦',
    code: 'NGN',
    name: 'Nigerian Naira'
  },

  formatNaira,
  formatCurrency,

  getWhatsAppSupportUrl(message) {
    const text = message ? encodeURIComponent(message) : encodeURIComponent('Hello Chris Shopper Support, I need assistance.');
    return `https://wa.me/${cleanWhatsappNumber}?text=${text}`;
  },

  getWhatsAppTopUpUrl(amount = 2000, userEmail = '') {
    const emailStr = userEmail ? ` for account (${userEmail})` : '';
    const formattedAmount = Number(amount).toLocaleString('en-NG');
    const text = encodeURIComponent(`Hi Chris Shopper, I want to add ₦${formattedAmount} to my account balance${emailStr}. Please provide payment details.`);
    return `https://wa.me/${cleanWhatsappNumber}?text=${text}`;
  },

  telegramChannel: 'https://t.me/chrisshopper',
  pricingNotice: 'Bulk carrier line allocation is currently active.',
};
