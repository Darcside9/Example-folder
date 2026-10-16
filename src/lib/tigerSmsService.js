// ==========================================================================
// CHRIS SHOPPER — TIGER SMS API INTEGRATION & CARRIER WHOLESALE SERVICE
// Maps the client's 25 platforms to Tiger SMS service codes, manages live
// wholesale USD pricing queries, stock availability, and account status.
// ==========================================================================

export const TIGER_API_KEY = 'PMGsbovKtPd0SbJiFXTeiBNuY04X04ph';
export const TIGER_API_BASE = '/api/tiger/stubs/handler_api.php';
export const DIRECT_TIGER_BASE = 'https://tiger-sms.com/stubs/handler_api.php';

// The Client's 25 Core Verification Platforms Mapped to Tiger SMS Codes (Country ID 187 = USA)
export const CORE_USA_PLATFORMS = [
  {
    id: 'whatsapp',
    name: 'WhatsApp / WA Business',
    tigerCode: 'wa',
    category: 'messaging',
    icon: 'whatsapp',
    carrierSpeed: '< 3s',
    defaultUsd: 0.356,
    minUsd: 0.300,
    stock: 107192,
    defaultRetailNgn: 2700,
    description: 'WhatsApp & WA Business private verification line.'
  },
  {
    id: 'telegram',
    name: 'Telegram',
    tigerCode: 'tg',
    category: 'messaging',
    icon: 'telegram',
    carrierSpeed: '< 3s',
    defaultUsd: 0.250,
    minUsd: 0.250,
    stock: 120781,
    defaultRetailNgn: 2700,
    description: 'Instant Telegram login & session authorization code.'
  },
  {
    id: 'tiktok',
    name: 'TikTok / Douyin',
    tigerCode: 'lf',
    category: 'social',
    icon: 'tiktok',
    carrierSpeed: '< 4s',
    defaultUsd: 0.040,
    minUsd: 0.040,
    stock: 114302,
    defaultRetailNgn: 700,
    description: 'TikTok creator and ads account mobile verification.'
  },
  {
    id: 'google',
    name: 'Google / YouTube / Gmail',
    tigerCode: 'go',
    category: 'tech',
    icon: 'google',
    carrierSpeed: '< 4s',
    defaultUsd: 0.077,
    minUsd: 0.075,
    stock: 154704,
    defaultRetailNgn: 1020,
    description: 'Gmail, Google Account & YouTube creator SMS OTP.'
  },
  {
    id: 'instagram',
    name: 'Instagram + Threads',
    tigerCode: 'ig',
    category: 'social',
    icon: 'instagram',
    carrierSpeed: '< 4s',
    defaultUsd: 0.053,
    minUsd: 0.050,
    stock: 112913,
    defaultRetailNgn: 850,
    description: 'Instagram profile security checkpoint verification.'
  },
  {
    id: 'facebook',
    name: 'Facebook / Meta',
    tigerCode: 'fb',
    category: 'social',
    icon: 'facebook',
    carrierSpeed: '< 4s',
    defaultUsd: 0.045,
    minUsd: 0.045,
    stock: 37330,
    defaultRetailNgn: 750,
    description: 'Facebook profile & Meta Business Manager verification.'
  },
  {
    id: 'twitter',
    name: 'Twitter / X',
    tigerCode: 'tw',
    category: 'social',
    icon: 'twitter',
    carrierSpeed: '< 4s',
    defaultUsd: 0.065,
    minUsd: 0.063,
    stock: 99723,
    defaultRetailNgn: 750,
    description: 'X / Twitter handle SMS verification & 2FA setup.'
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT / OpenAI',
    tigerCode: 'dr',
    category: 'ai',
    icon: 'openai',
    carrierSpeed: '< 4s',
    defaultUsd: 0.109,
    minUsd: 0.100,
    stock: 156671,
    defaultRetailNgn: 760,
    description: 'OpenAI API & ChatGPT Plus phone registration.'
  },
  {
    id: 'apple',
    name: 'Apple / iCloud ID',
    tigerCode: 'wx',
    category: 'tech',
    icon: 'apple',
    carrierSpeed: '< 4s',
    defaultUsd: 0.063,
    minUsd: 0.060,
    stock: 135443,
    defaultRetailNgn: 500,
    description: 'Apple ID registration & iCloud 2FA trusted phone.'
  },
  {
    id: 'cashapp',
    name: 'Cash App',
    tigerCode: 'it',
    category: 'finance',
    icon: 'cashapp',
    carrierSpeed: '< 5s',
    defaultUsd: 0.504,
    minUsd: 0.491,
    stock: 1201,
    defaultRetailNgn: 1000,
    description: 'Cash App US account creation & phone binding.'
  },
  {
    id: 'paypal',
    name: 'PayPal',
    tigerCode: 'ts',
    category: 'finance',
    icon: 'paypal',
    carrierSpeed: '< 5s',
    defaultUsd: 0.176,
    minUsd: 0.163,
    stock: 59298,
    defaultRetailNgn: 1260,
    description: 'PayPal account setup and device verification.'
  },
  {
    id: 'signal',
    name: 'Signal Private Messenger',
    tigerCode: 'bw',
    category: 'messaging',
    icon: 'generic_signal',
    carrierSpeed: '< 5s',
    defaultUsd: 0.042,
    minUsd: 0.040,
    stock: 163094,
    defaultRetailNgn: 755,
    description: 'Signal encrypted messenger registration.'
  },
  {
    id: 'viber',
    name: 'Viber',
    tigerCode: 'vi',
    category: 'messaging',
    icon: 'viber',
    carrierSpeed: '< 5s',
    defaultUsd: 0.127,
    minUsd: 0.061,
    stock: 28660,
    defaultRetailNgn: 650,
    description: 'Viber instant messaging account activation.'
  },
  {
    id: 'tinder',
    name: 'Tinder (Swipe App)',
    tigerCode: 'oi',
    category: 'dating',
    icon: 'tinder',
    carrierSpeed: '< 5s',
    defaultUsd: 0.095,
    minUsd: 0.095,
    stock: 144152,
    defaultRetailNgn: 777,
    description: 'Tinder account setup & SMS security code.'
  },
  {
    id: 'badoo',
    name: 'Badoo',
    tigerCode: 'qv',
    category: 'dating',
    icon: 'badoo',
    carrierSpeed: '< 5s',
    defaultUsd: 0.608,
    minUsd: 0.540,
    stock: 52096,
    defaultRetailNgn: 1400, // Adjusted from 750 to prevent loss!
    description: 'Badoo dating profile phone confirmation.'
  },
  {
    id: 'match',
    name: 'Match.com',
    tigerCode: 'axr',
    category: 'dating',
    icon: 'match',
    carrierSpeed: '< 6s',
    defaultUsd: 0.988,
    minUsd: 0.988,
    stock: 149778,
    defaultRetailNgn: 3050,
    description: 'Match.com premium dating account registration.'
  },
  {
    id: 'okcupid',
    name: 'OkCupid',
    tigerCode: 'vm',
    category: 'dating',
    icon: 'okcupid',
    carrierSpeed: '< 5s',
    defaultUsd: 0.133,
    minUsd: 0.132,
    stock: 2201,
    defaultRetailNgn: 884,
    description: 'OkCupid dating platform registration.'
  },
  {
    id: 'snapchat',
    name: 'Snapchat',
    tigerCode: 'fu',
    category: 'social',
    icon: 'snapchat',
    carrierSpeed: '< 4s',
    defaultUsd: 0.041,
    minUsd: 0.040,
    stock: 143684,
    defaultRetailNgn: 800,
    description: 'Snapchat username verification code.'
  },
  {
    id: 'twitch',
    name: 'Twitch',
    tigerCode: 'hb',
    category: 'entertainment',
    icon: 'twitch',
    carrierSpeed: '< 5s',
    defaultUsd: 0.046,
    minUsd: 0.040,
    stock: 129139,
    defaultRetailNgn: 1532,
    description: 'Twitch live streamer and viewer verification.'
  },
  {
    id: 'netflix',
    name: 'Netflix',
    tigerCode: 'nf',
    category: 'entertainment',
    icon: 'netflix',
    carrierSpeed: '< 5s',
    defaultUsd: 0.171,
    minUsd: 0.171,
    stock: 141192,
    defaultRetailNgn: 765,
    description: 'Netflix subscription mobile verification.'
  },
  {
    id: 'microsoft',
    name: 'Microsoft / Outlook',
    tigerCode: 'mm',
    category: 'tech',
    icon: 'microsoft',
    carrierSpeed: '< 4s',
    defaultUsd: 0.014,
    minUsd: 0.014,
    stock: 144755,
    defaultRetailNgn: 718,
    description: 'Outlook, Hotmail & Office 365 security verification.'
  },
  {
    id: 'yahoo',
    name: 'Yahoo Mail',
    tigerCode: 'mb',
    category: 'tech',
    icon: 'yahoo',
    carrierSpeed: '< 4s',
    defaultUsd: 0.030,
    minUsd: 0.020,
    stock: 134587,
    defaultRetailNgn: 890,
    description: 'Yahoo Mail account registration code.'
  },
  {
    id: 'gmx',
    name: 'GMX Mail',
    tigerCode: 'abk',
    category: 'tech',
    icon: 'gmx',
    carrierSpeed: '< 6s',
    defaultUsd: 0.302,
    minUsd: 0.299,
    stock: 1200,
    defaultRetailNgn: 1830,
    description: 'GMX Mail security verification.'
  },
  {
    id: 'ebay',
    name: 'eBay',
    tigerCode: 'dh',
    category: 'commerce',
    icon: 'ebay',
    carrierSpeed: '< 5s',
    defaultUsd: 0.240,
    minUsd: 0.240,
    stock: 77626,
    defaultRetailNgn: 874,
    description: 'eBay buyer and seller security pin.'
  },
  {
    id: 'other',
    name: 'Any Other Service',
    tigerCode: 'ot',
    category: 'other',
    icon: 'other',
    carrierSpeed: '< 5s',
    defaultUsd: 0.128,
    minUsd: 0.120,
    stock: 132638,
    defaultRetailNgn: 798,
    description: 'Universal fallback line for unlisted platforms.'
  }
];

// The Client's 25 Core Verification Platforms Mapped to Tiger SMS Codes (Country ID 36 = Canada)
export const CORE_CANADA_PLATFORMS = [
  {
    id: 'tiktok',
    name: 'TikTok / Douyin',
    tigerCode: 'lf',
    category: 'social',
    icon: 'tiktok',
    carrierSpeed: '< 4s',
    defaultUsd: 0.134,
    minUsd: 0.010,
    stock: 38943,
    defaultRetailNgn: 701,
    description: 'Canadian TikTok creator and ads verification line.'
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp / WA Business',
    tigerCode: 'wa',
    category: 'messaging',
    icon: 'whatsapp',
    carrierSpeed: '< 3s',
    defaultUsd: 0.600,
    minUsd: 0.250,
    stock: 51731,
    defaultRetailNgn: 1500,
    description: 'WhatsApp & WA Business private Canadian (+1) line.'
  },
  {
    id: 'telegram',
    name: 'Telegram',
    tigerCode: 'tg',
    category: 'messaging',
    icon: 'telegram',
    carrierSpeed: '< 3s',
    defaultUsd: 0.254,
    minUsd: 0.190,
    stock: 96766,
    defaultRetailNgn: 1000,
    description: 'Instant Canadian Telegram login & authorization code.'
  },
  {
    id: 'signal',
    name: 'Signal Private Messenger',
    tigerCode: 'bw',
    category: 'messaging',
    icon: 'generic_signal',
    carrierSpeed: '< 4s',
    defaultUsd: 0.020,
    minUsd: 0.018,
    stock: 68622,
    defaultRetailNgn: 550,
    description: 'Signal encrypted messenger Canadian (+1) line.'
  },
  {
    id: 'viber',
    name: 'Viber',
    tigerCode: 'vi',
    category: 'messaging',
    icon: 'viber',
    carrierSpeed: '< 4s',
    defaultUsd: 0.107,
    minUsd: 0.015,
    stock: 79728,
    defaultRetailNgn: 770,
    description: 'Viber instant messaging Canadian activation.'
  },
  {
    id: 'apple',
    name: 'Apple / iCloud ID',
    tigerCode: 'wx',
    category: 'tech',
    icon: 'apple',
    carrierSpeed: '< 4s',
    defaultUsd: 0.035,
    minUsd: 0.030,
    stock: 104311,
    defaultRetailNgn: 600,
    description: 'Apple ID registration & Canadian iCloud 2FA line.'
  },
  {
    id: 'google',
    name: 'Google / YouTube / Gmail',
    tigerCode: 'go',
    category: 'tech',
    icon: 'google',
    carrierSpeed: '< 4s',
    defaultUsd: 0.160,
    minUsd: 0.030,
    stock: 102292,
    defaultRetailNgn: 840,
    description: 'Gmail, Google Account & YouTube Canadian OTP.'
  },
  {
    id: 'twitch',
    name: 'Twitch',
    tigerCode: 'hb',
    category: 'entertainment',
    icon: 'twitch',
    carrierSpeed: '< 5s',
    defaultUsd: 0.617,
    minUsd: 0.030,
    stock: 42203,
    defaultRetailNgn: 1550,
    description: 'Twitch live streamer Canadian phone verification.'
  },
  {
    id: 'instagram',
    name: 'Instagram + Threads',
    tigerCode: 'ig',
    category: 'social',
    icon: 'instagram',
    carrierSpeed: '< 4s',
    defaultUsd: 0.200,
    minUsd: 0.025,
    stock: 70506,
    defaultRetailNgn: 850,
    description: 'Instagram Canadian security checkpoint code.'
  },
  {
    id: 'facebook',
    name: 'Facebook / Meta',
    tigerCode: 'fb',
    category: 'social',
    icon: 'facebook',
    carrierSpeed: '< 4s',
    defaultUsd: 0.134,
    minUsd: 0.030,
    stock: 91623,
    defaultRetailNgn: 750,
    description: 'Facebook & Meta Canadian business verification.'
  },
  {
    id: 'twitter',
    name: 'Twitter / X',
    tigerCode: 'tw',
    category: 'social',
    icon: 'twitter',
    carrierSpeed: '< 4s',
    defaultUsd: 0.079,
    minUsd: 0.020,
    stock: 59369,
    defaultRetailNgn: 750,
    description: 'X / Twitter handle Canadian SMS verification.'
  },
  {
    id: 'paypal',
    name: 'PayPal',
    tigerCode: 'ts',
    category: 'finance',
    icon: 'paypal',
    carrierSpeed: '< 5s',
    defaultUsd: 0.222,
    minUsd: 0.214,
    stock: 4388,
    defaultRetailNgn: 900,
    description: 'PayPal Canada account setup and device verification.'
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT / OpenAI',
    tigerCode: 'dr',
    category: 'ai',
    icon: 'openai',
    carrierSpeed: '< 4s',
    defaultUsd: 0.374,
    minUsd: 0.027,
    stock: 104545,
    defaultRetailNgn: 2000,
    description: 'OpenAI API & ChatGPT Plus Canadian registration.'
  },
  {
    id: 'tinder',
    name: 'Tinder (Swipe App)',
    tigerCode: 'oi',
    category: 'dating',
    icon: 'tinder',
    carrierSpeed: '< 5s',
    defaultUsd: 0.198,
    minUsd: 0.015,
    stock: 103186,
    defaultRetailNgn: 800,
    description: 'Tinder Canadian account setup & security code.'
  },
  {
    id: 'match',
    name: 'Match.com',
    tigerCode: 'axr',
    category: 'dating',
    icon: 'match',
    carrierSpeed: '< 5s',
    defaultUsd: 0.227,
    minUsd: 0.206,
    stock: 42183,
    defaultRetailNgn: 900,
    description: 'Match.com Canadian dating account registration.'
  },
  {
    id: 'other',
    name: 'Any Other Service',
    tigerCode: 'ot',
    category: 'other',
    icon: 'other',
    carrierSpeed: '< 5s',
    defaultUsd: 0.240,
    minUsd: 0.240,
    stock: 43203,
    defaultRetailNgn: 860,
    description: 'Universal fallback Canadian line for unlisted platforms.'
  },
  {
    id: 'snapchat',
    name: 'Snapchat',
    tigerCode: 'fu',
    category: 'social',
    icon: 'snapchat',
    carrierSpeed: '< 4s',
    defaultUsd: 0.134,
    minUsd: 0.017,
    stock: 150269,
    defaultRetailNgn: 701,
    description: 'Snapchat Canadian mobile verification code.'
  },
  {
    id: 'yahoo',
    name: 'Yahoo Mail',
    tigerCode: 'mb',
    category: 'tech',
    icon: 'yahoo',
    carrierSpeed: '< 4s',
    defaultUsd: 0.134,
    minUsd: 0.011,
    stock: 156308,
    defaultRetailNgn: 701,
    description: 'Yahoo Mail Canadian account registration code.'
  },
  {
    id: 'gmx',
    name: 'GMX Mail',
    tigerCode: 'abk',
    category: 'tech',
    icon: 'gmx',
    carrierSpeed: '< 5s',
    defaultUsd: 0.134,
    minUsd: 0.020,
    stock: 3227,
    defaultRetailNgn: 701,
    description: 'GMX Mail Canadian security verification.'
  },
  {
    id: 'microsoft',
    name: 'Microsoft / Outlook',
    tigerCode: 'mm',
    category: 'tech',
    icon: 'microsoft',
    carrierSpeed: '< 4s',
    defaultUsd: 0.196,
    minUsd: 0.012,
    stock: 111682,
    defaultRetailNgn: 794,
    description: 'Outlook, Hotmail & Office 365 Canadian line.'
  },
  {
    id: 'netflix',
    name: 'Netflix',
    tigerCode: 'nf',
    category: 'entertainment',
    icon: 'netflix',
    carrierSpeed: '< 4s',
    defaultUsd: 0.134,
    minUsd: 0.012,
    stock: 103848,
    defaultRetailNgn: 701,
    description: 'Netflix Canadian subscription verification.'
  },
  {
    id: 'ebay',
    name: 'eBay',
    tigerCode: 'dh',
    category: 'commerce',
    icon: 'ebay',
    carrierSpeed: '< 5s',
    defaultUsd: 0.134,
    minUsd: 0.008,
    stock: 72950,
    defaultRetailNgn: 701,
    description: 'eBay Canada buyer and seller security pin.'
  },
  {
    id: 'okcupid',
    name: 'OkCupid',
    tigerCode: 'vm',
    category: 'dating',
    icon: 'okcupid',
    carrierSpeed: '< 5s',
    defaultUsd: 0.437,
    minUsd: 0.149,
    stock: 121182,
    defaultRetailNgn: 1100,
    description: 'OkCupid Canadian dating platform registration.'
  },
  {
    id: 'cashapp',
    name: 'Cash App',
    tigerCode: 'it',
    category: 'finance',
    icon: 'cashapp',
    carrierSpeed: '< 5s',
    defaultUsd: 0.190,
    minUsd: 0.190,
    stock: 1188,
    defaultRetailNgn: 785,
    description: 'Cash App account creation Canadian line.'
  },
  {
    id: 'badoo',
    name: 'Badoo',
    tigerCode: 'qv',
    category: 'dating',
    icon: 'badoo',
    carrierSpeed: '< 5s',
    defaultUsd: 0.808,
    minUsd: 0.808,
    stock: 3208,
    defaultRetailNgn: 1712,
    description: 'Badoo dating Canadian phone confirmation.'
  }
];

// The Client's 25 Core Verification Platforms Mapped to Tiger SMS Codes (Country ID 16 = United Kingdom)
export const CORE_UK_PLATFORMS = [
  {
    id: 'tiktok',
    name: 'TikTok / Douyin',
    tigerCode: 'lf',
    category: 'social',
    icon: 'tiktok',
    carrierSpeed: '< 4s',
    defaultUsd: 0.107,
    minUsd: 0.025,
    stock: 76790,
    defaultRetailNgn: 700,
    description: 'UK TikTok creator and ads verification line.'
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp / WA Business',
    tigerCode: 'wa',
    category: 'messaging',
    icon: 'whatsapp',
    carrierSpeed: '< 3s',
    defaultUsd: 1.440,
    minUsd: 0.300,
    stock: 80127,
    defaultRetailNgn: 2700,
    description: 'WhatsApp & WA Business private UK (+44) verification line.'
  },
  {
    id: 'telegram',
    name: 'Telegram',
    tigerCode: 'tg',
    category: 'messaging',
    icon: 'telegram',
    carrierSpeed: '< 3s',
    defaultUsd: 1.515,
    minUsd: 0.400,
    stock: 119365,
    defaultRetailNgn: 2700,
    description: 'Instant UK Telegram login & session authorization code.'
  },
  {
    id: 'signal',
    name: 'Signal Private Messenger',
    tigerCode: 'bw',
    category: 'messaging',
    icon: 'generic_signal',
    carrierSpeed: '< 4s',
    defaultUsd: 0.107,
    minUsd: 0.040,
    stock: 74288,
    defaultRetailNgn: 755,
    description: 'Signal encrypted messenger UK (+44) line.'
  },
  {
    id: 'viber',
    name: 'Viber',
    tigerCode: 'vi',
    category: 'messaging',
    icon: 'viber',
    carrierSpeed: '< 4s',
    defaultUsd: 0.100,
    minUsd: 0.060,
    stock: 2687,
    defaultRetailNgn: 650,
    description: 'Viber instant messaging UK activation.'
  },
  {
    id: 'apple',
    name: 'Apple / iCloud ID',
    tigerCode: 'wx',
    category: 'tech',
    icon: 'apple',
    carrierSpeed: '< 4s',
    defaultUsd: 0.054,
    minUsd: 0.029,
    stock: 74145,
    defaultRetailNgn: 500,
    description: 'Apple ID registration & UK iCloud 2FA line.'
  },
  {
    id: 'google',
    name: 'Google / YouTube / Gmail',
    tigerCode: 'go',
    category: 'tech',
    icon: 'google',
    carrierSpeed: '< 4s',
    defaultUsd: 0.347,
    minUsd: 0.050,
    stock: 81949,
    defaultRetailNgn: 1020,
    description: 'Gmail, Google Account & YouTube UK OTP.'
  },
  {
    id: 'twitch',
    name: 'Twitch',
    tigerCode: 'hb',
    category: 'entertainment',
    icon: 'twitch',
    carrierSpeed: '< 5s',
    defaultUsd: 0.688,
    minUsd: 0.688,
    stock: 72054,
    defaultRetailNgn: 1532,
    description: 'Twitch live streamer UK verification.'
  },
  {
    id: 'instagram',
    name: 'Instagram + Threads',
    tigerCode: 'ig',
    category: 'social',
    icon: 'instagram',
    carrierSpeed: '< 4s',
    defaultUsd: 0.200,
    minUsd: 0.045,
    stock: 60587,
    defaultRetailNgn: 850,
    description: 'Instagram UK security checkpoint code.'
  },
  {
    id: 'facebook',
    name: 'Facebook / Meta',
    tigerCode: 'fb',
    category: 'social',
    icon: 'facebook',
    carrierSpeed: '< 4s',
    defaultUsd: 0.134,
    minUsd: 0.030,
    stock: 82400,
    defaultRetailNgn: 750,
    description: 'Facebook & Meta UK business verification.'
  },
  {
    id: 'twitter',
    name: 'Twitter / X',
    tigerCode: 'tw',
    category: 'social',
    icon: 'twitter',
    carrierSpeed: '< 4s',
    defaultUsd: 0.083,
    minUsd: 0.014,
    stock: 12236,
    defaultRetailNgn: 750,
    description: 'X / Twitter handle UK SMS verification.'
  },
  {
    id: 'paypal',
    name: 'PayPal',
    tigerCode: 'ts',
    category: 'finance',
    icon: 'paypal',
    carrierSpeed: '< 5s',
    defaultUsd: 0.507,
    minUsd: 0.100,
    stock: 75576,
    defaultRetailNgn: 1260,
    description: 'PayPal UK account setup and device verification.'
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT / OpenAI',
    tigerCode: 'dr',
    category: 'ai',
    icon: 'openai',
    carrierSpeed: '< 4s',
    defaultUsd: 0.107,
    minUsd: 0.050,
    stock: 62890,
    defaultRetailNgn: 760,
    description: 'OpenAI API & ChatGPT Plus UK registration.'
  },
  {
    id: 'tinder',
    name: 'Tinder (Swipe App)',
    tigerCode: 'oi',
    category: 'dating',
    icon: 'tinder',
    carrierSpeed: '< 5s',
    defaultUsd: 0.118,
    minUsd: 0.100,
    stock: 79429,
    defaultRetailNgn: 777,
    description: 'Tinder UK account setup & security code.'
  },
  {
    id: 'match',
    name: 'Match.com',
    tigerCode: 'axr',
    category: 'dating',
    icon: 'match',
    carrierSpeed: '< 5s',
    defaultUsd: 1.667,
    minUsd: 0.500,
    stock: 14890,
    defaultRetailNgn: 3050,
    description: 'Match.com UK dating account registration.'
  },
  {
    id: 'other',
    name: 'Any Other Service',
    tigerCode: 'ot',
    category: 'other',
    icon: 'other',
    carrierSpeed: '< 5s',
    defaultUsd: 0.132,
    minUsd: 0.070,
    stock: 79719,
    defaultRetailNgn: 798,
    description: 'Universal fallback UK line for unlisted platforms.'
  },
  {
    id: 'snapchat',
    name: 'Snapchat',
    tigerCode: 'fu',
    category: 'social',
    icon: 'snapchat',
    carrierSpeed: '< 4s',
    defaultUsd: 0.054,
    minUsd: 0.030,
    stock: 84310,
    defaultRetailNgn: 800,
    description: 'Snapchat UK mobile verification code.'
  },
  {
    id: 'yahoo',
    name: 'Yahoo Mail',
    tigerCode: 'mb',
    category: 'tech',
    icon: 'yahoo',
    carrierSpeed: '< 4s',
    defaultUsd: 0.080,
    minUsd: 0.022,
    stock: 66110,
    defaultRetailNgn: 890,
    description: 'Yahoo Mail UK account registration code.'
  },
  {
    id: 'gmx',
    name: 'GMX Mail',
    tigerCode: 'abk',
    category: 'tech',
    icon: 'gmx',
    carrierSpeed: '< 5s',
    defaultUsd: 0.887,
    minUsd: 0.300,
    stock: 2450,
    defaultRetailNgn: 1830,
    description: 'GMX Mail UK security verification.'
  },
  {
    id: 'microsoft',
    name: 'Microsoft / Outlook',
    tigerCode: 'mm',
    category: 'tech',
    icon: 'microsoft',
    carrierSpeed: '< 4s',
    defaultUsd: 0.079,
    minUsd: 0.020,
    stock: 76190,
    defaultRetailNgn: 718,
    description: 'Outlook, Hotmail & Office 365 UK line.'
  },
  {
    id: 'netflix',
    name: 'Netflix',
    tigerCode: 'nf',
    category: 'entertainment',
    icon: 'netflix',
    carrierSpeed: '< 4s',
    defaultUsd: 0.110,
    minUsd: 0.110,
    stock: 77531,
    defaultRetailNgn: 765,
    description: 'Netflix UK subscription verification.'
  },
  {
    id: 'ebay',
    name: 'eBay',
    tigerCode: 'dh',
    category: 'commerce',
    icon: 'ebay',
    carrierSpeed: '< 5s',
    defaultUsd: 0.256,
    minUsd: 0.050,
    stock: 58200,
    defaultRetailNgn: 874,
    description: 'eBay UK buyer and seller security pin.'
  },
  {
    id: 'okcupid',
    name: 'OkCupid',
    tigerCode: 'vm',
    category: 'dating',
    icon: 'okcupid',
    carrierSpeed: '< 5s',
    defaultUsd: 0.256,
    minUsd: 0.050,
    stock: 8593,
    defaultRetailNgn: 884,
    description: 'OkCupid UK dating platform registration.'
  },
  {
    id: 'cashapp',
    name: 'Cash App',
    tigerCode: 'it',
    category: 'finance',
    icon: 'cashapp',
    carrierSpeed: '< 5s',
    defaultUsd: 0.334,
    minUsd: 0.015,
    stock: 7984,
    defaultRetailNgn: 1000,
    description: 'Cash App UK account registration.'
  },
  {
    id: 'badoo',
    name: 'Badoo',
    tigerCode: 'qv',
    category: 'dating',
    icon: 'badoo',
    carrierSpeed: '< 5s',
    defaultUsd: 0.118,
    minUsd: 0.095,
    stock: 72296,
    defaultRetailNgn: 750,
    description: 'Badoo dating UK phone confirmation.'
  }
];

export const SUPPORTED_REGIONS = {
  US: {
    code: 'US',
    countryId: '187',
    name: 'United States',
    dialCode: '+1',
    flag: '🇺🇸',
    carrierDescription: 'Real AT&T, Verizon & T-Mobile non-VoIP SIMs',
    platforms: CORE_USA_PLATFORMS
  },
  CA: {
    code: 'CA',
    countryId: '36',
    name: 'Canada',
    dialCode: '+1',
    flag: '🇨🇦',
    carrierDescription: 'Real Rogers, Bell & Telus non-VoIP SIMs',
    platforms: CORE_CANADA_PLATFORMS
  },
  UK: {
    code: 'UK',
    countryId: '16',
    name: 'United Kingdom',
    dialCode: '+44',
    flag: '🇬🇧',
    carrierDescription: 'Real EE, Vodafone & O2 non-VoIP SIMs',
    platforms: CORE_UK_PLATFORMS
  }
};

/**
 * Returns platform list for a given country code (e.g. 'US', 'CA', or 'UK')
 */
export function getPlatformsForCountry(countryCode = 'US') {
  const norm = String(countryCode).toUpperCase();
  if (norm === 'UK' || norm === 'GB' || norm === '16' || norm === 'UNITED KINGDOM') {
    return CORE_UK_PLATFORMS;
  }
  if (norm === 'CA' || norm === '36' || norm === 'CANADA') {
    return CORE_CANADA_PLATFORMS;
  }
  return CORE_USA_PLATFORMS;
}

/**
 * Fetch live default prices and stock from Tiger SMS API for USA (187), Canada (36), or UK (16)
 */
export async function fetchLiveTigerSmsRates(countryParam = '187') {
  const norm = String(countryParam).toUpperCase();
  let country = '187';
  let basePlatforms = CORE_USA_PLATFORMS;

  if (norm === '16' || norm === 'UK' || norm === 'GB') {
    country = '16';
    basePlatforms = CORE_UK_PLATFORMS;
  } else if (norm === '36' || norm === 'CA') {
    country = '36';
    basePlatforms = CORE_CANADA_PLATFORMS;
  }

  try {
    const codes1 = basePlatforms.slice(0, 13).map(p => p.tigerCode).join(',');
    const codes2 = basePlatforms.slice(13).map(p => p.tigerCode).join(',');

    const fetchBatch = async (codes) => {
      // Try Vite dev server proxy first to avoid CORS
      const url = `${TIGER_API_BASE}?api_key=${TIGER_API_KEY}&action=getOffers&countries=${country}&services=${codes}`;
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      return json?.data || {};
    };

    const [batch1, batch2] = await Promise.all([fetchBatch(codes1), fetchBatch(codes2)]);
    const liveMap = { ...batch1, ...batch2 };

    // Update and merge live data
    const updated = basePlatforms.map(p => {
      const liveItem = liveMap[p.tigerCode]?.[country];
      const liveDefaultUsd = liveItem?.prices?.default ?? liveItem?.prices?.min;
      const liveMinUsd = liveItem?.prices?.min ?? liveDefaultUsd;
      const liveStock = liveItem?.counts?.total;

      return {
        ...p,
        defaultUsd: typeof liveDefaultUsd === 'number' ? liveDefaultUsd : p.defaultUsd,
        minUsd: typeof liveMinUsd === 'number' ? liveMinUsd : p.minUsd,
        stock: typeof liveStock === 'number' ? liveStock : p.stock,
        isLiveSynced: true
      };
    });

    return { success: true, platforms: updated, country };
  } catch (err) {
    console.warn(`Tiger SMS API live query fallback for country ${country}:`, err.message);
    return { success: false, platforms: basePlatforms, country, error: err.message };
  }
}

/**
 * Fetch live account balance from Tiger SMS
 */
export async function fetchTigerBalance() {
  try {
    const url = `${TIGER_API_BASE}?api_key=${TIGER_API_KEY}&action=getBalance`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    // format: ACCESS_BALANCE:1.315
    const match = text.match(/ACCESS_BALANCE:([0-9.]+)/i);
    if (match && match[1]) {
      return parseFloat(match[1]);
    }
    return 1.315;
  } catch (err) {
    console.warn('Balance check fallback:', err.message);
    return 1.315;
  }
}
