// ==========================================================================
// CHRIS SHOPPER — PLATFORM LOGS CATALOG CONFIGURATION & SEED INVENTORY
// Real-time catalog with dynamic inventory calculation, stock count aggregation,
// and zero-trust sanitized username previews.
// ==========================================================================

export const PLATFORM_CATEGORIES = [
  {
    id: 'facebook',
    name: 'Facebook Accounts',
    subtitle: 'USA Facebook',
    tag: 'Facebook',
    icon: 'facebook',
    color: '#1877f2',
    collectionId: '6ab9702e001dc7115654',
    demoPrice: 3000,
    items: [
      {
        id: 'fb-type-1',
        title: 'Facebook Accounts | 2FA + Outlook Mail | 50-100 Friends | USA |Already Created 2 Page | 2016-2020',
        platform: 'Facebook',
        price: 3000,
      },
      {
        id: 'fb-type-2',
        title: 'Facebook Accounts | 2FA + Outlook Mail | 0-30 Friends | USA |Already Created 2 Page | 2016-2019',
        platform: 'Facebook',
        price: 2800,
      },
      {
        id: 'fb-type-3',
        title: 'Facebook Accounts | 2FA + Outlook Mail | 100-200+ Friends | USA |Already Created 2 Page | 2017-2021',
        platform: 'Facebook',
        price: 4500,
      },
    ],
  },
  {
    id: 'tiktok',
    name: 'TikTok Accounts',
    subtitle: 'Creator & Verified Profiles',
    tag: 'TikTok',
    icon: 'tiktok',
    color: '#ff0050',
    collectionId: '6ab97045000451688a63',
    demoPrice: 1300,
    items: [
      {
        id: 'tiktok-type-1',
        title: 'TikTok Accounts | Aged Profiles | 2FA + Mail Access | 0-30 Followers | Mixed Countries',
        platform: 'TikTok',
        price: 1300,
      },
      {
        id: 'tiktok-type-1790685692849',
        title: 'TikTok Accounts | Aged Profiles | 2FA + Mail Access | 100+ Followers | Post + Likes | Mixed Countries',
        platform: 'TikTok',
        price: 3500,
      },
      {
        id: 'tiktok-type-1790686336265',
        title: 'TikTok Accounts | Aged Profiles | 2FA + Mail Access | 50-100 Followers | mixed Countries',
        platform: 'TikTok',
        price: 2800,
      },
      {
        id: 'tiktok-type-1790709406612',
        title: 'TikTok Accounts | Aged Profiles | 2FA + Mail Access | 1000 Followers | Mixed Countries',
        platform: 'TikTok',
        price: 7500,
      },
    ],
  },
  {
    id: 'instagram',
    name: 'Instagram Accounts',
    subtitle: 'Aged PVA & 2FA Profiles',
    tag: 'Instagram',
    icon: 'instagram',
    color: '#e1306c',
    collectionId: '6ab9704e00116f8d983c',
    demoPrice: 3000,
    items: [
      {
        id: 'insta-type-1',
        title: 'Instagram Accounts | Aged PVA Profiles | 2FA + Mail Access',
        platform: 'Instagram',
        price: 3000,
      },
    ],
  },
  {
    id: 'twitter',
    name: 'Twitter Accounts',
    subtitle: 'Aged & Phone Verified',
    tag: 'Twitter',
    icon: 'twitter',
    color: '#1da1f2',
    collectionId: '6ab9706a003a134738d5',
    demoPrice: 1500,
    items: [
      {
        id: 'twitter-type-1',
        title: 'Twitter / X Accounts | Aged & Mail Verified | 2FA Secret Key Access | 5-30 Followers | random countries',
        platform: 'Twitter',
        price: 1500,
      },
      {
        id: 'twitter-type-1790689127066',
        title: 'Twitter / X Accounts | Aged & Mail Verified | 2FA Secret Key Access | 30-60 Followers | random countries',
        platform: 'Twitter',
        price: 2000,
      },
      {
        id: 'twitter-type-1790689161673',
        title: 'Twitter / X Accounts | Aged & Mail Verified | 2FA Secret Key Access | 70-100 Followers | random countries',
        platform: 'Twitter',
        price: 2500,
      },
    ],
  },
  {
    id: 'textplus',
    name: 'Textplus Accounts',
    subtitle: 'USA Carrier Line Profiles',
    tag: 'Textplus',
    icon: 'textplus',
    color: '#10b981',
    collectionId: '6ab9707300032f996f8c',
    demoPrice: 2000,
    items: [
      {
        id: 'textplus-type-1790711243993',
        title: 'Textplus Accounts | USA Carrier Phone Profiles | Full Mail Access',
        platform: 'Textplus',
        price: 2000,
      },
    ],
  },
  {
    id: 'vpn',
    name: 'VPN',
    subtitle: 'VPN Accounts',
    tag: 'VPN',
    icon: 'expressvpn',
    color: '#0ea5e9',
    collectionId: '6ab9707d00067b45cae2',
    demoPrice: 2500,
    items: [
      { id: 'vpn-type-1790615610830', title: 'Nord vpn 2-5 month', price: 2000, platform: 'VPN' },
      { id: 'vpn-type-1790615661930', title: 'Nord VPN 6-9 month', price: 5000, platform: 'VPN' },
      { id: 'vpn-type-1790615676617', title: 'Nord VPN 1-2 yr', price: 8000, platform: 'VPN' },
      { id: 'vpn-type-1790615698632', title: 'Express VPN 1-3 month', price: 2500, platform: 'VPN' },
      { id: 'vpn-type-1790615743577', title: 'Express VPN 6-9 month', price: 6000, platform: 'VPN' },
      { id: 'vpn-type-1790615751727', title: 'Express VPN 1 yr', price: 10000, platform: 'VPN' },
      { id: 'vpn-type-1790615764558', title: 'PIA VPN 1 Month', price: 2500, platform: 'VPN' },
      { id: 'vpn-type-1790615781543', title: 'PIA VPN 6-9 month', price: 5000, platform: 'VPN' },
      { id: 'vpn-type-1790615795086', title: 'PIA VPN 1 yr', price: 8000, platform: 'VPN' },
    ],
  },
  {
    id: 'usa______icloud',
    name: 'USA   iCloud',
    subtitle: 'USA   iCloud Accounts',
    tag: 'iCloud',
    icon: 'apple',
    color: '#64748b',
    collectionId: '6ab970870001f2fbc5d2',
    demoPrice: 2500,
    items: [
      { id: 'usa______icloud-type-1', title: 'USA  iCloud | Random Aged | 2FA + Fresh Apple Mail', price: 2500, platform: 'USA iCloud' },
    ],
  },
  {
    id: 'nigeria_facebook',
    name: 'Nigeria Facebook',
    subtitle: 'Nigeria Facebook Accounts',
    tag: 'Nigeria Facebook',
    icon: 'facebook',
    color: '#1877f2',
    collectionId: '6ab9709200085ba44d71',
    demoPrice: 3000,
    items: [
      { id: 'nigeria_facebook-type-1', title: 'Local Facebook with page (0-50 ) friends', price: 3000, platform: 'Nigeria Facebook' },
      { id: 'nigeria_facebook-type-1790616002642', title: 'Local Facebook with page (50-100 ) friends', price: 3000, platform: 'Nigeria Facebook' },
      { id: 'nigeria_facebook-type-1790616013681', title: 'Local Facebook with page (100-1k ) friends', price: 3000, platform: 'Nigeria Facebook' },
    ],
  },
];

/**
 * DEFAULT SEED INVENTORY:
 * Realistic verified account logs providing stock counts when Appwrite live records are queried.
 * Exactly implements the user's specification:
 * - USA Facebook:
 *   Type 1: 2 accounts
 *   Type 2: 0 accounts (Sold Out)
 *   Type 3: 7 accounts
 *   Total USA Facebook: 9 Available
 */
export const DEFAULT_SEED_INVENTORY = {
  facebook: {
    'fb-type-1': [
      {
        id: 'fb_seed_1',
        username: 'usa_sarah_pva',
        subTypeId: 'fb-type-1',
        platform: 'Facebook',
        price: 3000,
        isAvailable: true,
        password: 'Password2026!',
        twoFactorKey: 'JBSWY3DPEHPK3PXP',
        mail: 'sarah.usa99@outlook.com',
        mailPassword: 'MailPass2026!',
        comboString: 'usa_sarah_pva:Password2026!:sarah.usa99@outlook.com:MailPass2026!:JBSWY3DPEHPK3PXP',
      },
      {
        id: 'fb_seed_2',
        username: 'david_miller_fb',
        subTypeId: 'fb-type-1',
        platform: 'Facebook',
        price: 3000,
        isAvailable: true,
        password: 'Password2026!',
        twoFactorKey: 'KZXW65TBMNQXE33D',
        mail: 'david.m16@outlook.com',
        mailPassword: 'MailPass2026!',
        comboString: 'david_miller_fb:Password2026!:david.m16@outlook.com:MailPass2026!:KZXW65TBMNQXE33D',
      },
    ],
    'fb-type-2': [], // 0 in stock (Sold Out)
    'fb-type-3': [
      {
        id: 'fb_seed_3',
        username: 'james_wilson_2017',
        subTypeId: 'fb-type-3',
        platform: 'Facebook',
        price: 4500,
        isAvailable: true,
        password: 'Password2026!',
        twoFactorKey: '7N5V67KJK4L3M2N1',
        mail: 'j.wilson2017@outlook.com',
        mailPassword: 'MailPass2026!',
        comboString: 'james_wilson_2017:Password2026!:j.wilson2017@outlook.com:MailPass2026!:7N5V67KJK4L3M2N1',
      },
      {
        id: 'fb_seed_4',
        username: 'emily_clark_fb',
        subTypeId: 'fb-type-3',
        platform: 'Facebook',
        price: 4500,
        isAvailable: true,
        password: 'Password2026!',
        twoFactorKey: 'P2Q3R4S5T6U7V8W9',
        mail: 'emily.clark94@outlook.com',
        mailPassword: 'MailPass2026!',
        comboString: 'emily_clark_fb:Password2026!:emily.clark94@outlook.com:MailPass2026!:P2Q3R4S5T6U7V8W9',
      },
      {
        id: 'fb_seed_5',
        username: 'robert_taylor_usa',
        subTypeId: 'fb-type-3',
        platform: 'Facebook',
        price: 4500,
        isAvailable: true,
        password: 'Password2026!',
        twoFactorKey: 'A1B2C3D4E5F6G7H8',
        mail: 'r.taylor.usa@outlook.com',
        mailPassword: 'MailPass2026!',
        comboString: 'robert_taylor_usa:Password2026!:r.taylor.usa@outlook.com:MailPass2026!:A1B2C3D4E5F6G7H8',
      },
      {
        id: 'fb_seed_6',
        username: 'jessica_white_pva',
        subTypeId: 'fb-type-3',
        platform: 'Facebook',
        price: 4500,
        isAvailable: true,
        password: 'Password2026!',
        twoFactorKey: '9Z8Y7X6W5V4U3T2S',
        mail: 'jess.white88@outlook.com',
        mailPassword: 'MailPass2026!',
        comboString: 'jessica_white_pva:Password2026!:jess.white88@outlook.com:MailPass2026!:9Z8Y7X6W5V4U3T2S',
      },
      {
        id: 'fb_seed_7',
        username: 'brian_king_fb',
        subTypeId: 'fb-type-3',
        platform: 'Facebook',
        price: 4500,
        isAvailable: true,
        password: 'Password2026!',
        twoFactorKey: 'M1N2O3P4Q5R6S7T8',
        mail: 'brian.king.us@outlook.com',
        mailPassword: 'MailPass2026!',
        comboString: 'brian_king_fb:Password2026!:brian.king.us@outlook.com:MailPass2026!:M1N2O3P4Q5R6S7T8',
      },
      {
        id: 'fb_seed_8',
        username: 'amanda_hall_2018',
        subTypeId: 'fb-type-3',
        platform: 'Facebook',
        price: 4500,
        isAvailable: true,
        password: 'Password2026!',
        twoFactorKey: '4K5L6M7N8P9Q1R2S',
        mail: 'amanda.hall18@outlook.com',
        mailPassword: 'MailPass2026!',
        comboString: 'amanda_hall_2018:Password2026!:amanda.hall18@outlook.com:MailPass2026!:4K5L6M7N8P9Q1R2S',
      },
      {
        id: 'fb_seed_9',
        username: 'kevin_baker_usa',
        subTypeId: 'fb-type-3',
        platform: 'Facebook',
        price: 4500,
        isAvailable: true,
        password: 'Password2026!',
        twoFactorKey: '3T4U5V6W7X8Y9Z1A',
        mail: 'kevin.baker.us@outlook.com',
        mailPassword: 'MailPass2026!',
        comboString: 'kevin_baker_usa:Password2026!:kevin.baker.us@outlook.com:MailPass2026!:3T4U5V6W7X8Y9Z1A',
      },
    ],
  },
  tiktok: {
    'tiktok-type-1': [
      { id: 'tk_1', username: 'creator_vibes_us', subTypeId: 'tiktok-type-1', platform: 'TikTok', price: 1300, isAvailable: true, password: 'Password2026!', twoFactorKey: 'T1K2T3O4K5V6I7B8', mail: 'creatorvibes@outlook.com', mailPassword: 'MailPass2026!', comboString: 'creator_vibes_us:Password2026!:creatorvibes@outlook.com:MailPass2026!:T1K2T3O4K5V6I7B8' },
      { id: 'tk_2', username: 'dance_daily_trend', subTypeId: 'tiktok-type-1', platform: 'TikTok', price: 1300, isAvailable: true, password: 'Password2026!', twoFactorKey: 'D1A2N3C4E5T6R7E8', mail: 'dancedaily@outlook.com', mailPassword: 'MailPass2026!', comboString: 'dance_daily_trend:Password2026!:dancedaily@outlook.com:MailPass2026!:D1A2N3C4E5T6R7E8' },
      { id: 'tk_3', username: 'tok_verified_star', subTypeId: 'tiktok-type-1', platform: 'TikTok', price: 1300, isAvailable: true, password: 'Password2026!', twoFactorKey: 'V1E2R3I4F5I6E7D8', mail: 'tokverified@outlook.com', mailPassword: 'MailPass2026!', comboString: 'tok_verified_star:Password2026!:tokverified@outlook.com:MailPass2026!:V1E2R3I4F5I6E7D8' },
    ],
    'tiktok-type-1790685692849': [
      { id: 'tk_4', username: 'viral_pulse_media', subTypeId: 'tiktok-type-1790685692849', platform: 'TikTok', price: 3500, isAvailable: true, password: 'Password2026!', twoFactorKey: 'V2I3R4A5L6P7U8L9', mail: 'viralpulse@outlook.com', mailPassword: 'MailPass2026!', comboString: 'viral_pulse_media:Password2026!:viralpulse@outlook.com:MailPass2026!:V2I3R4A5L6P7U8L9' },
      { id: 'tk_5', username: 'sound_beat_global', subTypeId: 'tiktok-type-1790685692849', platform: 'TikTok', price: 3500, isAvailable: true, password: 'Password2026!', twoFactorKey: 'S1O2U3N4D5B6E7A8', mail: 'soundbeat@outlook.com', mailPassword: 'MailPass2026!', comboString: 'sound_beat_global:Password2026!:soundbeat@outlook.com:MailPass2026!:S1O2U3N4D5B6E7A8' },
    ],
    'tiktok-type-1790686336265': [
      { id: 'tk_6', username: 'hyper_trending_clips', subTypeId: 'tiktok-type-1790686336265', platform: 'TikTok', price: 2800, isAvailable: true, password: 'Password2026!', twoFactorKey: 'H1Y2P3E4R5T6R7E8', mail: 'hyperclips@outlook.com', mailPassword: 'MailPass2026!', comboString: 'hyper_trending_clips:Password2026!:hyperclips@outlook.com:MailPass2026!:H1Y2P3E4R5T6R7E8' },
    ],
    'tiktok-type-1790709406612': [
      { id: 'tk_7', username: 'elite_1k_verified', subTypeId: 'tiktok-type-1790709406612', platform: 'TikTok', price: 7500, isAvailable: true, password: 'Password2026!', twoFactorKey: 'E1L2I3T4E5K6V7E8', mail: 'elite1k@outlook.com', mailPassword: 'MailPass2026!', comboString: 'elite_1k_verified:Password2026!:elite1k@outlook.com:MailPass2026!:E1L2I3T4E5K6V7E8' },
      { id: 'tk_8', username: 'monetized_prime_tok', subTypeId: 'tiktok-type-1790709406612', platform: 'TikTok', price: 7500, isAvailable: true, password: 'Password2026!', twoFactorKey: 'M1O2N3E4T5I6Z7E8', mail: 'monetized@outlook.com', mailPassword: 'MailPass2026!', comboString: 'monetized_prime_tok:Password2026!:monetized@outlook.com:MailPass2026!:M1O2N3E4T5I6Z7E8' },
    ],
  },
  instagram: {
    'insta-type-1': [
      { id: 'ig_1', username: 'insta_aesthetic_us', subTypeId: 'insta-type-1', platform: 'Instagram', price: 3000, isAvailable: true, password: 'Password2026!', twoFactorKey: 'I1N2S3T4A5A6E7S8', mail: 'instaaesthetic@outlook.com', mailPassword: 'MailPass2026!', comboString: 'insta_aesthetic_us:Password2026!:instaaesthetic@outlook.com:MailPass2026!:I1N2S3T4A5A6E7S8' },
      { id: 'ig_2', username: 'visual_story_pva', subTypeId: 'insta-type-1', platform: 'Instagram', price: 3000, isAvailable: true, password: 'Password2026!', twoFactorKey: 'V1I2S3U4A5L6S7T8', mail: 'visualstory@outlook.com', mailPassword: 'MailPass2026!', comboString: 'visual_story_pva:Password2026!:visualstory@outlook.com:MailPass2026!:V1I2S3U4A5L6S7T8' },
      { id: 'ig_3', username: 'photo_lounge_2fa', subTypeId: 'insta-type-1', platform: 'Instagram', price: 3000, isAvailable: true, password: 'Password2026!', twoFactorKey: 'P1H2O3T4O5L6O7U8', mail: 'photolounge@outlook.com', mailPassword: 'MailPass2026!', comboString: 'photo_lounge_2fa:Password2026!:photolounge@outlook.com:MailPass2026!:P1H2O3T4O5L6O7U8' },
    ],
  },
  twitter: {
    'twitter-type-1': [
      { id: 'tw_1', username: 'crypto_pulse_x', subTypeId: 'twitter-type-1', platform: 'Twitter', price: 1500, isAvailable: true, password: 'Password2026!', twoFactorKey: 'C1R2Y3P4T5O6P7U8', mail: 'cryptopulse@outlook.com', mailPassword: 'MailPass2026!', comboString: 'crypto_pulse_x:Password2026!:cryptopulse@outlook.com:MailPass2026!:C1R2Y3P4T5O6P7U8' },
      { id: 'tw_2', username: 'alpha_trader_log', subTypeId: 'twitter-type-1', platform: 'Twitter', price: 1500, isAvailable: true, password: 'Password2026!', twoFactorKey: 'A1L2P3H4A5T6R7A8', mail: 'alphatrader@outlook.com', mailPassword: 'MailPass2026!', comboString: 'alpha_trader_log:Password2026!:alphatrader@outlook.com:MailPass2026!:A1L2P3H4A5T6R7A8' },
    ],
    'twitter-type-1790689127066': [
      { id: 'tw_3', username: 'trend_whisperer_x', subTypeId: 'twitter-type-1790689127066', platform: 'Twitter', price: 2000, isAvailable: true, password: 'Password2026!', twoFactorKey: 'T1R2E3N4D5W6H7I8', mail: 'trendwhisper@outlook.com', mailPassword: 'MailPass2026!', comboString: 'trend_whisperer_x:Password2026!:trendwhisper@outlook.com:MailPass2026!:T1R2E3N4D5W6H7I8' },
    ],
    'twitter-type-1790689161673': [],
  },
  textplus: {
    'textplus-type-1790711243993': [
      { id: 'tp_1', username: 'textplus_usa_direct', subTypeId: 'textplus-type-1790711243993', platform: 'Textplus', price: 2000, isAvailable: true, password: 'Password2026!', twoFactorKey: 'T2P3D4I5R6E7C8T9', mail: 'tpusadirect@outlook.com', mailPassword: 'MailPass2026!', comboString: 'textplus_usa_direct:Password2026!:tpusadirect@outlook.com:MailPass2026!:T2P3D4I5R6E7C8T9' },
      { id: 'tp_2', username: 'carrier_line_ny_212', subTypeId: 'textplus-type-1790711243993', platform: 'Textplus', price: 2000, isAvailable: true, password: 'Password2026!', twoFactorKey: 'C1A2R3R4I5E6R7L8', mail: 'carrier212@outlook.com', mailPassword: 'MailPass2026!', comboString: 'carrier_line_ny_212:Password2026!:carrier212@outlook.com:MailPass2026!:C1A2R3R4I5E6R7L8' },
    ],
  },
  vpn: {
    'vpn-type-1790615610830': [
      { id: 'vpn_1', username: 'nord_premium_sub1', subTypeId: 'vpn-type-1790615610830', platform: 'VPN', price: 2000, isAvailable: true, password: 'Password2026!', twoFactorKey: '', mail: 'nord1@securemail.com', mailPassword: 'MailPass2026!', comboString: 'nord_premium_sub1:Password2026!:nord1@securemail.com:MailPass2026!' },
    ],
    'vpn-type-1790615698632': [
      { id: 'vpn_2', username: 'express_vpn_active_key', subTypeId: 'vpn-type-1790615698632', platform: 'VPN', price: 2500, isAvailable: true, password: 'Password2026!', twoFactorKey: '', mail: 'expresskey@securemail.com', mailPassword: 'MailPass2026!', comboString: 'express_vpn_active_key:Password2026!:expresskey@securemail.com:MailPass2026!' },
      { id: 'vpn_3', username: 'express_vpn_key_2', subTypeId: 'vpn-type-1790615698632', platform: 'VPN', price: 2500, isAvailable: true, password: 'Password2026!', twoFactorKey: '', mail: 'expresskey2@securemail.com', mailPassword: 'MailPass2026!', comboString: 'express_vpn_key_2:Password2026!:expresskey2@securemail.com:MailPass2026!' },
    ],
  },
  usa______icloud: {
    'usa______icloud-type-1': [
      { id: 'icloud_1', username: 'icloud_apple_clean_usa', subTypeId: 'usa______icloud-type-1', platform: 'USA iCloud', price: 2500, isAvailable: true, password: 'Password2026!', twoFactorKey: 'I1C2L3O4U5D6U7S8', mail: 'icloudclean@apple.com', mailPassword: 'MailPass2026!', comboString: 'icloud_apple_clean_usa:Password2026!:icloudclean@apple.com:MailPass2026!:I1C2L3O4U5D6U7S8' },
    ],
  },
  nigeria_facebook: {
    'nigeria_facebook-type-1': [
      { id: 'ng_1', username: 'lagos_creator_page', subTypeId: 'nigeria_facebook-type-1', platform: 'Nigeria Facebook', price: 3000, isAvailable: true, password: 'Password2026!', twoFactorKey: 'L1A2G3O4S5F6B7P8', mail: 'lagoscreator@gmail.com', mailPassword: 'MailPass2026!', comboString: 'lagos_creator_page:Password2026!:lagoscreator@gmail.com:MailPass2026!:L1A2G3O4S5F6B7P8' },
      { id: 'ng_2', username: 'abuja_active_line', subTypeId: 'nigeria_facebook-type-1', platform: 'Nigeria Facebook', price: 3000, isAvailable: true, password: 'Password2026!', twoFactorKey: 'A1B2U3J4A5F6B7L8', mail: 'abujaline@gmail.com', mailPassword: 'MailPass2026!', comboString: 'abuja_active_line:Password2026!:abujaline@gmail.com:MailPass2026!:A1B2U3J4A5F6B7L8' },
    ],
    'nigeria_facebook-type-1790616002642': [
      { id: 'ng_3', username: 'naija_hustle_pva', subTypeId: 'nigeria_facebook-type-1790616002642', platform: 'Nigeria Facebook', price: 3000, isAvailable: true, password: 'Password2026!', twoFactorKey: 'N1A2I3J4A5H6U7S8', mail: 'naijahustle@gmail.com', mailPassword: 'MailPass2026!', comboString: 'naija_hustle_pva:Password2026!:naijahustle@gmail.com:MailPass2026!:N1A2I3J4A5H6U7S8' },
    ],
    'nigeria_facebook-type-1790616013681': [],
  },
};

// Fallback export
export const FALLBACK_LOGS = [];
