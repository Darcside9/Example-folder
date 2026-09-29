// ==========================================================================
// CHRIS SHOPPER — PLATFORM LOGS CATALOG CONFIGURATION (METADATA ONLY)
// Zero credentials stored offline in client code.
// All real inventory is fetched dynamically from Appwrite Cloud DB.
// ==========================================================================

export const PLATFORM_CATEGORIES = [
  {
    id: 'facebook',
    name: 'Facebook Accounts',
    subtitle: 'USA Facebook',
    tag: 'Facebook',
    icon: '📘',
    color: '#1877f2',
    collectionId: '6ab9702e001dc7115654',
    demoPrice: 1.50,
    items: [
      {
        id: 'fb-type-1',
        title: 'Facebook Accounts | 2FA + Outlook Mail | 50-100 Friends | USA | 2016-2020',
        platform: 'Facebook',
        price: 1.50,
      },
      {
        id: 'fb-type-2',
        title: 'Facebook Accounts | 2FA + Outlook Mail | 0-30 Friends | USA | 2016-2019',
        platform: 'Facebook',
        price: 1.50,
      },
      {
        id: 'fb-type-3',
        title: 'Facebook Accounts | 2FA + Outlook Mail | 100-200+ Friends | USA | 2017-2021',
        platform: 'Facebook',
        price: 1.50,
      },
    ],
  },
  {
    id: 'tiktok',
    name: 'TikTok Accounts',
    subtitle: 'Creator & Verified Profiles',
    tag: 'TikTok',
    icon: '🎵',
    color: '#ff0050',
    collectionId: '6ab97045000451688a63',
    demoPrice: 2.20,
    items: [
      {
        id: 'tiktok-type-1',
        title: 'TikTok Accounts | Creator & Aged Profiles | 2FA + Mail Access',
        platform: 'TikTok',
        price: 2.20,
      },
    ],
  },
  {
    id: 'instagram',
    name: 'Instagram Accounts',
    subtitle: 'Aged PVA & 2FA Profiles',
    tag: 'Instagram',
    icon: '📷',
    color: '#e1306c',
    collectionId: '6ab9704e00116f8d983c',
    demoPrice: 1.80,
    items: [
      {
        id: 'insta-type-1',
        title: 'Instagram Accounts | Aged PVA Profiles | 2FA + Mail Access',
        platform: 'Instagram',
        price: 1.80,
      },
    ],
  },
  {
    id: 'twitter',
    name: 'Twitter Accounts',
    subtitle: 'Aged & Phone Verified',
    tag: 'Twitter',
    icon: '🐦',
    color: '#1da1f2',
    collectionId: '6ab9706a003a134738d5',
    demoPrice: 2.00,
    items: [
      {
        id: 'twitter-type-1',
        title: 'Twitter / X Accounts | Aged & Phone Verified | 2FA Secret Key Access',
        platform: 'Twitter',
        price: 2.00,
      },
    ],
  },
  {
    id: 'textplus',
    name: 'Textplus Accounts',
    subtitle: 'US/CA Carrier Line Profiles',
    tag: 'Textplus',
    icon: '💬',
    color: '#10b981',
    collectionId: '6ab9707300032f996f8c',
    demoPrice: 1.20,
    items: [
      {
        id: 'textplus-type-1',
        title: 'Textplus Accounts | US/CA Carrier Phone Profiles | Full Mail Access',
        platform: 'Textplus',
        price: 1.20,
      },
    ],
  },
];

// Empty fallback for safety — zero credentials stored offline
export const FALLBACK_LOGS = [];
