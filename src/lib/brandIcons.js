import React from 'react';
import {
  FaFacebook,
  FaInstagram,
  FaTiktok,
  FaXTwitter,
  FaTelegram,
  FaDiscord,
  FaSnapchat,
  FaWhatsapp,
  FaGoogle,
  FaMicrosoft,
  FaYahoo,
  FaLinkedin,
  FaReddit,
  FaYoutube,
  FaTwitch,
  FaSteam,
  FaPlaystation,
  FaXbox,
  FaSpotify,
  FaAmazon,
  FaApple,
  FaPaypal,
  FaStripe,
  FaGithub,
  FaPinterest,
  FaSlack,
  FaSkype,
  FaGlobe,
  FaShieldHalved
} from 'react-icons/fa6';

import {
  SiIcloud,
  SiNordvpn,
  SiExpressvpn,
  SiSurfshark,
  SiProtonvpn,
  SiProtonmail,
  SiGmail,
  SiNetflix,
  SiKick,
  SiRoblox,
  SiEpicgames,
  SiBluesky,
  SiMastodon,
  SiSignal,
  SiZoom,
  SiNotion,
  SiTrello,
  SiFigma,
  SiCashapp,
  SiBinance,
  SiCoinbase,
  SiEbay,
  SiAliexpress,
  SiShopify,
  SiWordpress
} from 'react-icons/si';

import { TbBrandOpenai } from 'react-icons/tb';

// Brand icons registry with search keywords, categories, and vector components
export const BRAND_ICONS = [
  // Social & Community
  { id: 'facebook', name: 'Facebook', component: FaFacebook, category: 'Social', color: '#1877F2', keywords: ['facebook', 'fb', 'meta', 'social', 'messenger', '📘'] },
  { id: 'instagram', name: 'Instagram', component: FaInstagram, category: 'Social', color: '#E4405F', keywords: ['instagram', 'ig', 'insta', 'meta', 'photos', '📷'] },
  { id: 'tiktok', name: 'TikTok', component: FaTiktok, category: 'Social', color: '#00F2FE', keywords: ['tiktok', 'tik tok', 'douyin', 'video', 'social', '🎵'] },
  { id: 'x', name: 'X / Twitter', component: FaXTwitter, category: 'Social', color: '#FFFFFF', keywords: ['twitter', 'x', 'tweet', 'social', '🐦'] },
  { id: 'telegram', name: 'Telegram', component: FaTelegram, category: 'Messaging', color: '#26A5E4', keywords: ['telegram', 'tg', 'chat', 'messaging', '✈️'] },
  { id: 'discord', name: 'Discord', component: FaDiscord, category: 'Social', color: '#5865F2', keywords: ['discord', 'community', 'gaming', 'nitro', '🎮'] },
  { id: 'whatsapp', name: 'WhatsApp', component: FaWhatsapp, category: 'Messaging', color: '#25D366', keywords: ['whatsapp', 'wa', 'chat', 'meta', 'messaging', '💬'] },
  { id: 'snapchat', name: 'Snapchat', component: FaSnapchat, category: 'Social', color: '#FFFC00', keywords: ['snapchat', 'snap', 'social', '👻'] },
  { id: 'reddit', name: 'Reddit', component: FaReddit, category: 'Social', color: '#FF4500', keywords: ['reddit', 'social', 'forum', 'community'] },
  { id: 'linkedin', name: 'LinkedIn', category: 'Professional', component: FaLinkedin, color: '#0A66C2', keywords: ['linkedin', 'jobs', 'professional', 'business'] },
  { id: 'pinterest', name: 'Pinterest', category: 'Social', component: FaPinterest, color: '#E60023', keywords: ['pinterest', 'pins', 'images'] },
  { id: 'bluesky', name: 'Bluesky', category: 'Social', component: SiBluesky, color: '#1185FE', keywords: ['bluesky', 'bsky', 'social'] },
  { id: 'mastodon', name: 'Mastodon', category: 'Social', component: SiMastodon, color: '#6364FF', keywords: ['mastodon', 'fediverse', 'social'] },
  { id: 'signal', name: 'Signal', category: 'Messaging', component: SiSignal, color: '#3A76F0', keywords: ['signal', 'messaging', 'private'] },

  // Apple & Big Tech Ecosystems
  { id: 'apple', name: 'Apple', category: 'Tech', component: FaApple, color: '#FFFFFF', keywords: ['apple', 'ios', 'iphone', 'mac', 'appstore', '🍎'] },
  { id: 'icloud', name: 'iCloud', category: 'Cloud', component: SiIcloud, color: '#3699FF', keywords: ['icloud', 'apple', 'cloud', 'backup', 'mail', '☁️'] },
  { id: 'google', name: 'Google', category: 'Tech', component: FaGoogle, color: '#4285F4', keywords: ['google', 'search', 'workspace', 'gmail', '🔍'] },
  { id: 'gmail', name: 'Gmail', category: 'Email', component: SiGmail, color: '#EA4335', keywords: ['gmail', 'google', 'mail', 'email', '✉️'] },
  { id: 'microsoft', name: 'Microsoft / Outlook', category: 'Tech', component: FaMicrosoft, color: '#00A4EF', keywords: ['microsoft', 'ms', 'office', 'windows', 'outlook', 'hotmail'] },
  { id: 'yahoo', name: 'Yahoo', category: 'Email', component: FaYahoo, color: '#6001D2', keywords: ['yahoo', 'mail', 'email'] },

  // VPN & Security Services
  { id: 'nordvpn', name: 'NordVPN', category: 'Security', component: SiNordvpn, color: '#4687FF', keywords: ['nordvpn', 'nord', 'vpn', 'security', 'privacy', 'proxy', '🛡️'] },
  { id: 'expressvpn', name: 'ExpressVPN', category: 'Security', component: SiExpressvpn, color: '#DA3940', keywords: ['expressvpn', 'express', 'vpn', 'privacy'] },
  { id: 'surfshark', name: 'Surfshark', category: 'Security', component: SiSurfshark, color: '#17C4B5', keywords: ['surfshark', 'vpn', 'proxy', 'privacy'] },
  { id: 'protonvpn', name: 'ProtonVPN', category: 'Security', component: SiProtonvpn, color: '#6D4AFF', keywords: ['protonvpn', 'proton', 'vpn', 'privacy'] },
  { id: 'protonmail', name: 'ProtonMail', category: 'Email', component: SiProtonmail, color: '#6D4AFF', keywords: ['protonmail', 'proton', 'email', 'encrypted'] },

  // AI & Developer Tools
  { id: 'openai', name: 'OpenAI / ChatGPT', category: 'AI', component: TbBrandOpenai, color: '#10A37F', keywords: ['openai', 'chatgpt', 'gpt', 'ai', 'bot', '🤖'] },
  { id: 'github', name: 'GitHub', category: 'Developer', component: FaGithub, color: '#FFFFFF', keywords: ['github', 'code', 'git', 'developer', 'repo'] },
  { id: 'notion', name: 'Notion', category: 'Productivity', component: SiNotion, color: '#FFFFFF', keywords: ['notion', 'notes', 'workspace'] },
  { id: 'trello', name: 'Trello', category: 'Productivity', component: SiTrello, color: '#0079BF', keywords: ['trello', 'kanban', 'tasks'] },
  { id: 'figma', name: 'Figma', category: 'Design', component: SiFigma, color: '#F24E1E', keywords: ['figma', 'design', 'ui'] },
  { id: 'slack', name: 'Slack', category: 'Workplace', component: FaSlack, color: '#E01E5A', keywords: ['slack', 'chat', 'workplace'] },
  { id: 'skype', name: 'Skype', category: 'Workplace', component: FaSkype, color: '#00AFF0', keywords: ['skype', 'calls', 'microsoft'] },
  { id: 'zoom', name: 'Zoom', category: 'Workplace', component: SiZoom, color: '#2D8CFF', keywords: ['zoom', 'meetings', 'video'] },

  // Streaming & Media
  { id: 'netflix', name: 'Netflix', category: 'Streaming', component: SiNetflix, color: '#E50914', keywords: ['netflix', 'streaming', 'movies', 'series', '🎬'] },
  { id: 'spotify', name: 'Spotify', category: 'Streaming', component: FaSpotify, color: '#1DB954', keywords: ['spotify', 'music', 'streaming', 'audio', '🎧'] },
  { id: 'youtube', name: 'YouTube', category: 'Streaming', component: FaYoutube, color: '#FF0000', keywords: ['youtube', 'yt', 'video', 'streaming', '▶️'] },
  { id: 'twitch', name: 'Twitch', category: 'Streaming', component: FaTwitch, color: '#9146FF', keywords: ['twitch', 'streaming', 'live', 'gaming', '📺'] },
  { id: 'kick', name: 'Kick', category: 'Streaming', component: SiKick, color: '#53FC18', keywords: ['kick', 'streaming', 'gaming'] },

  // Gaming
  { id: 'steam', name: 'Steam', category: 'Gaming', component: FaSteam, color: '#66C0F4', keywords: ['steam', 'gaming', 'valve', 'pc', '🕹️'] },
  { id: 'roblox', name: 'Roblox', category: 'Gaming', component: SiRoblox, color: '#FFFFFF', keywords: ['roblox', 'games', 'metaverse'] },
  { id: 'epicgames', name: 'Epic Games', category: 'Gaming', component: SiEpicgames, color: '#FFFFFF', keywords: ['epicgames', 'epic', 'fortnite', 'gaming'] },
  { id: 'playstation', name: 'PlayStation', category: 'Gaming', component: FaPlaystation, color: '#003791', keywords: ['playstation', 'psn', 'ps4', 'ps5', 'sony'] },
  { id: 'xbox', name: 'Xbox', category: 'Gaming', component: FaXbox, color: '#107C10', keywords: ['xbox', 'microsoft', 'gaming', 'gamepass'] },

  // Financial & Crypto
  { id: 'paypal', name: 'PayPal', category: 'Finance', component: FaPaypal, color: '#00457C', keywords: ['paypal', 'payment', 'wallet', 'money', '💳'] },
  { id: 'cashapp', name: 'Cash App', category: 'Finance', component: SiCashapp, color: '#00D632', keywords: ['cashapp', 'cash app', 'payment', 'money'] },
  { id: 'stripe', name: 'Stripe', category: 'Finance', component: FaStripe, color: '#635BFF', keywords: ['stripe', 'payments', 'billing'] },
  { id: 'binance', name: 'Binance', category: 'Crypto', component: SiBinance, color: '#F3BA2F', keywords: ['binance', 'crypto', 'bitcoin'] },
  { id: 'coinbase', name: 'Coinbase', category: 'Crypto', component: SiCoinbase, color: '#0052FF', keywords: ['coinbase', 'crypto', 'wallet'] },

  // E-commerce & Web
  { id: 'amazon', name: 'Amazon', category: 'Shopping', component: FaAmazon, color: '#FF9900', keywords: ['amazon', 'shopping', 'prime'] },
  { id: 'ebay', name: 'eBay', category: 'Shopping', component: SiEbay, color: '#E53238', keywords: ['ebay', 'shopping', 'marketplace'] },
  { id: 'aliexpress', name: 'AliExpress', category: 'Shopping', component: SiAliexpress, color: '#FF4747', keywords: ['aliexpress', 'alibaba', 'shopping'] },
  { id: 'shopify', name: 'Shopify', category: 'Shopping', component: SiShopify, color: '#96BF48', keywords: ['shopify', 'ecommerce', 'store'] },
  { id: 'wordpress', name: 'WordPress', category: 'Web', component: SiWordpress, color: '#21759B', keywords: ['wordpress', 'wp', 'cms', 'blog'] },

  // Generic Fallbacks
  { id: 'generic_shield', name: 'Security / VPN', category: 'Generic', component: FaShieldHalved, color: '#38BDF8', keywords: ['security', 'shield', 'protect', 'vpn', 'safe', '🛡️'] },
  { id: 'generic_globe', name: 'Web / Platform', category: 'Generic', component: FaGlobe, color: '#818CF8', keywords: ['web', 'website', 'online', 'globe', '🌐'] }
];

// Emoji and keyword mapping table to auto-resolve legacy or emoji strings to official brand IDs
const EMOJI_AND_ALIAS_MAP = {
  '📘': 'facebook',
  'fb': 'facebook',
  'facebook': 'facebook',
  '🎵': 'tiktok',
  'tiktok': 'tiktok',
  'tik tok': 'tiktok',
  '📷': 'instagram',
  'ig': 'instagram',
  'instagram': 'instagram',
  '🐦': 'x',
  'twitter': 'x',
  'x': 'x',
  '🍎': 'apple',
  'apple': 'apple',
  'ios': 'apple',
  '☁️': 'icloud',
  'icloud': 'icloud',
  '🛡️': 'nordvpn',
  'vpn': 'nordvpn',
  'nordvpn': 'nordvpn',
  'nord': 'nordvpn',
  'expressvpn': 'expressvpn',
  'surfshark': 'surfshark',
  'protonvpn': 'protonvpn',
  '✈️': 'telegram',
  'telegram': 'telegram',
  'tg': 'telegram',
  '🎮': 'discord',
  'discord': 'discord',
  '💬': 'whatsapp',
  'whatsapp': 'whatsapp',
  'wa': 'whatsapp',
  '👻': 'snapchat',
  'snapchat': 'snapchat',
  '🔍': 'google',
  'google': 'google',
  '✉️': 'gmail',
  'gmail': 'gmail',
  'outlook': 'microsoft',
  'microsoft': 'microsoft',
  'yahoo': 'yahoo',
  '🎬': 'netflix',
  'netflix': 'netflix',
  '🎧': 'spotify',
  'spotify': 'spotify',
  '▶️': 'youtube',
  'youtube': 'youtube',
  '📺': 'twitch',
  'twitch': 'twitch',
  'kick': 'kick',
  '🕹️': 'steam',
  'steam': 'steam',
  'roblox': 'roblox',
  'playstation': 'playstation',
  'xbox': 'xbox',
  '🤖': 'openai',
  'openai': 'openai',
  'chatgpt': 'openai',
  'github': 'github',
  '💳': 'paypal',
  'paypal': 'paypal',
  'cashapp': 'cashapp',
  'stripe': 'stripe',
  'binance': 'binance',
  'coinbase': 'coinbase',
  'amazon': 'amazon',
  'ebay': 'ebay',
  'aliexpress': 'aliexpress',
  'shopify': 'shopify'
};

/**
 * Resolves an icon key, emoji, or title into a BRAND_ICONS entry.
 */
export function resolveBrandIcon(iconKeyOrTitle) {
  if (!iconKeyOrTitle) return BRAND_ICONS.find(b => b.id === 'generic_globe');

  const normalized = String(iconKeyOrTitle).trim().toLowerCase();

  // 1. Direct match on id
  let match = BRAND_ICONS.find(b => b.id === normalized);
  if (match) return match;

  // 2. Check alias and emoji map
  const mappedId = EMOJI_AND_ALIAS_MAP[normalized] || EMOJI_AND_ALIAS_MAP[iconKeyOrTitle.trim()];
  if (mappedId) {
    match = BRAND_ICONS.find(b => b.id === mappedId);
    if (match) return match;
  }

  // 3. Search keywords or title substrings
  match = BRAND_ICONS.find(b => {
    if (b.name.toLowerCase().includes(normalized)) return true;
    return b.keywords.some(k => normalized.includes(k) || k.includes(normalized));
  });
  if (match) return match;

  // 4. Default fallback
  return BRAND_ICONS.find(b => b.id === 'generic_globe');
}

/**
 * Fuzzy search across all brand icons.
 */
export function searchBrandIcons(searchQuery = '') {
  const q = searchQuery.trim().toLowerCase();
  if (!q) return BRAND_ICONS;

  return BRAND_ICONS.filter(brand => {
    if (brand.id.toLowerCase().includes(q)) return true;
    if (brand.name.toLowerCase().includes(q)) return true;
    if (brand.category.toLowerCase().includes(q)) return true;
    return brand.keywords.some(k => k.toLowerCase().includes(q));
  });
}
