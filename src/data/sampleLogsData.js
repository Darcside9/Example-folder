// ==========================================================================
// CHRIS SHOPPER — PLATFORM LOGS CATALOG & SAMPLE INVENTORY
// Schema matches client's Google Sheet:
// [username, password, 2fa key, mail, mail password, site/platform, status]
// ==========================================================================

export const PLATFORM_CATEGORIES = [
  {
    id: 'facebook',
    name: 'Facebook Accounts',
    subtitle: 'USA Facebook',
    tag: 'Facebook',
    icon: '📘',
    color: '#1877f2',
    items: [
      {
        id: 'fb-type-1',
        title: 'Facebook Accounts | 2FA + Outlook Mail | 50-100 Friends | USA | 2016-2020',
        platform: 'Facebook',
      },
      {
        id: 'fb-type-2',
        title: 'Facebook Accounts | 2FA + Outlook Mail | 0-30 Friends | USA | 2016-2019',
        platform: 'Facebook',
      },
      {
        id: 'fb-type-3',
        title: 'Facebook Accounts | 2FA + Outlook Mail | 100-200+ Friends | USA | 2017-2021',
        platform: 'Facebook',
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
    items: [
      {
        id: 'tiktok-type-1',
        title: 'TikTok Accounts | Creator & Aged Profiles | 2FA + Mail Access',
        platform: 'TikTok',
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
    items: [
      {
        id: 'insta-type-1',
        title: 'Instagram Accounts | Aged PVA Profiles | 2FA + Mail Access',
        platform: 'Instagram',
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
    items: [
      {
        id: 'twitter-type-1',
        title: 'Twitter / X Accounts | Aged & Phone Verified | 2FA Secret Key Access',
        platform: 'Twitter',
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
    items: [
      {
        id: 'textplus-type-1',
        title: 'Textplus Accounts | US/CA Carrier Phone Profiles | Full Mail Access',
        platform: 'Textplus',
      },
    ],
  },
];

// Fallback mirror of the Google Sheet inventory (for offline or initial load safety)
export const FALLBACK_LOGS = [
  // Facebook Live Inventory
  {
    username: '61590748374787',
    password: 'dv4WaXTqmkR3',
    twoFactorKey: 'OQVZ ZBN2 SEHY TINT SWPA RL66 SZZK 4RWU',
    mail: 'BrandeeOats60@outlook.com',
    mailPassword: 'qvli4Ham3',
    platform: 'Facebook',
    subTypeId: 'fb-type-1',
    status: 'Available',
  },
  {
    username: '61590829143821',
    password: 'kR3vT9mPxL21',
    twoFactorKey: 'MNTY KLPQ VXRT ABCE ZHYU QOPL MNXZ 8KJW',
    mail: 'marcus.vance42@outlook.com',
    mailPassword: 'px9!Vb29Lm',
    platform: 'Facebook',
    subTypeId: 'fb-type-2',
    status: 'Available',
  },
  {
    username: '61590938471209',
    password: 'pQ8wZs7LkN43',
    twoFactorKey: 'BRTQ VXMN KLOP YTRE ZWQU ASDF GHJK 2PLX',
    mail: 'elena.rostova88@outlook.com',
    mailPassword: 'qw8#Mn55Kx',
    platform: 'Facebook',
    subTypeId: 'fb-type-3',
    status: 'Available',
  },

  // TikTok Live Inventory
  {
    username: 'tok_zenith99',
    password: 'mB4xT8vWqL12',
    twoFactorKey: 'LKJH GFDS QWER TYUI ZXCV BNMA SDRF 5TYU',
    mail: 'zenithcreatives@gmail.com',
    mailPassword: 'vb4!Lp77Qz',
    platform: 'TikTok',
    subTypeId: 'tiktok-type-1',
    status: 'Available',
  },
  {
    username: 'hyper_luna_vibe',
    password: 'xN9mK2vR8pL5',
    twoFactorKey: 'POIU YTRE WQAS DFGH JKLZ XCVB NMQW 7IKL',
    mail: 'lunavibes2026@outlook.com',
    mailPassword: 'mn2@Pw99Xs',
    platform: 'TikTok',
    subTypeId: 'tiktok-type-1',
    status: 'Available',
  },
  {
    username: 'blaze_pulse01',
    password: 'qL5vR9xM2nP8',
    twoFactorKey: 'XCVB NMAS DFGH JKLQ WERT YUIO PLMN 3VBN',
    mail: 'blazepulse@hotmail.com',
    mailPassword: 'ty8$Km33Vb',
    platform: 'TikTok',
    subTypeId: 'tiktok-type-1',
    status: 'Available',
  },

  // Instagram Live Inventory
  {
    username: 'charlotte.designs_',
    password: 'vR8xM3nP9qL2',
    twoFactorKey: 'QWET YUIP LKJH GFDS ZXCV BNMA SPOI 9LKJ',
    mail: 'charlotte.designhub@gmail.com',
    mailPassword: 'gh5!Qz88Mv',
    platform: 'Instagram',
    subTypeId: 'insta-type-1',
    status: 'Available',
  },
  {
    username: 'wanderlust.ethan',
    password: 'zW7kP2qM9vL4',
    twoFactorKey: 'MNAS DFGH JKLQ WERT YUIO PLZX CVBN 4QWE',
    mail: 'ethanwanders@outlook.com',
    mailPassword: 'kl3#Vw44Px',
    platform: 'Instagram',
    subTypeId: 'insta-type-1',
    status: 'Available',
  },
  {
    username: 'maya_urban_art',
    password: 'tY4nL8vP2qM6',
    twoFactorKey: 'ASDF GHJK LZXC VBNM QWER TYUI OPLK 6BNM',
    mail: 'mayaurbanstudio@gmail.com',
    mailPassword: 'pl9&Nx22Lt',
    platform: 'Instagram',
    subTypeId: 'insta-type-1',
    status: 'Available',
  },

  // Twitter / X Live Inventory
  {
    username: 'echo_fintech',
    password: 'bN6xV8mP3qL9',
    twoFactorKey: 'ZXCV BNMQ WERT YUIO PLAS DFGH JKLP 1MNB',
    mail: 'echofintech@outlook.com',
    mailPassword: 'cv7!Wk88Zq',
    platform: 'Twitter',
    subTypeId: 'twitter-type-1',
    status: 'Available',
  },
  {
    username: 'nexus_crypto_ins',
    password: 'wQ2mR9vL4xN7',
    twoFactorKey: 'LKJH GFDS QWER TYUI OPLM NBVC XZAS 8HJK',
    mail: 'nexuscryptoinsights@gmail.com',
    mailPassword: 'rt4#Lm66Vp',
    platform: 'Twitter',
    subTypeId: 'twitter-type-1',
    status: 'Available',
  },
  {
    username: 'dev_daily_wire',
    password: 'kP8vM2qW7nL3',
    twoFactorKey: 'POIU YTRE WQAS DFGH JKMN BVCX ZASD 2WQE',
    mail: 'devdailywire@outlook.com',
    mailPassword: 'bn9@Pq11Mz',
    platform: 'Twitter',
    subTypeId: 'twitter-type-1',
    status: 'Available',
  },

  // Textplus Live Inventory
  {
    username: 'tp_user_310842',
    password: 'sL3vN8qM2xR6',
    twoFactorKey: 'QAZW SXED CRFV TGBA YHNU JMKI OLPE 4RFV',
    mail: 'tpuser310842@gmail.com',
    mailPassword: 'we6!Nx99Kl',
    platform: 'Textplus',
    subTypeId: 'textplus-type-1',
    status: 'Available',
  },
  {
    username: 'tp_user_415903',
    password: 'vM9qR2xL7nP4',
    twoFactorKey: 'WSXE DCRF VTGB YHNU JMKI OLPA ZSXD 5TGB',
    mail: 'tpuser415903@outlook.com',
    mailPassword: 'yu2#Kq44Mb',
    platform: 'Textplus',
    subTypeId: 'textplus-type-1',
    status: 'Available',
  },
  {
    username: 'tp_user_702581',
    password: 'mR4xL8vP3qN9',
    twoFactorKey: 'EDCR FVTG BYHN UJMK IOLA ZSXE DCFV 7UJM',
    mail: 'tpuser702581@hotmail.com',
    mailPassword: 'io8$Vb77Qn',
    platform: 'Textplus',
    subTypeId: 'textplus-type-1',
    status: 'Available',
  },
  {
    username: 'tp_user_832109',
    password: 'xP7nL2vM8qR5',
    twoFactorKey: 'RFVT GBYH NUJM KIOL AZSX EDCR FVTB 9OLP',
    mail: 'tpuser832109@gmail.com',
    mailPassword: 'pa5@Lm33Wx',
    platform: 'Textplus',
    subTypeId: 'textplus-type-1',
    status: 'Available',
  },
];
