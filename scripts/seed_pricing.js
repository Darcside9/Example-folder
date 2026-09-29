import { Client, Databases, ID } from 'node-appwrite';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf8');
const env = Object.fromEntries(
  envContent
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => {
      const idx = l.indexOf('=');
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
    })
);

const client = new Client()
  .setEndpoint(env.VITE_APPWRITE_ENDPOINT)
  .setProject(env.VITE_APPWRITE_PROJECT_ID)
  .setKey(env.APPWRITE_API_KEY);

const databases = new Databases(client);

const DEFAULT_PRODUCTS = [
  // Carrier SMS Services
  { product_id: 'telegram', name: 'Telegram', category: 'messaging', product_type: 'sms_service', price_usd: 0.18, is_active: true, carrier_speed: '< 3.2s' },
  { product_id: 'whatsapp', name: 'WhatsApp', category: 'messaging', product_type: 'sms_service', price_usd: 0.20, is_active: true, carrier_speed: '< 4.1s' },
  { product_id: 'openai', name: 'OpenAI / ChatGPT', category: 'ai', product_type: 'sms_service', price_usd: 0.25, is_active: false, carrier_speed: 'Coming Soon' },
  { product_id: 'google', name: 'Google & Gmail', category: 'email', product_type: 'sms_service', price_usd: 0.22, is_active: false, carrier_speed: 'Coming Soon' },

  // Account Log Categories
  { product_id: 'facebook', name: 'Facebook Accounts', category: 'social_logs', product_type: 'account_log', price_usd: 1.50, is_active: true, carrier_speed: 'Instant Delivery' },
  { product_id: 'tiktok', name: 'TikTok Accounts', category: 'social_logs', product_type: 'account_log', price_usd: 2.20, is_active: true, carrier_speed: 'Instant Delivery' },
  { product_id: 'instagram', name: 'Instagram Accounts', category: 'social_logs', product_type: 'account_log', price_usd: 1.80, is_active: true, carrier_speed: 'Instant Delivery' },
  { product_id: 'twitter', name: 'Twitter / X Accounts', category: 'social_logs', product_type: 'account_log', price_usd: 2.00, is_active: true, carrier_speed: 'Instant Delivery' },
  { product_id: 'textplus', name: 'Textplus Accounts', category: 'carrier_logs', product_type: 'account_log', price_usd: 1.20, is_active: true, carrier_speed: 'Instant Delivery' },
];

async function seed() {
  console.log('Seeding products_pricing in Appwrite Cloud...');
  const colId = 'products_pricing';
  const dbId = env.VITE_APPWRITE_DATABASE_ID;

  for (const prod of DEFAULT_PRODUCTS) {
    try {
      const doc = await databases.createDocument(dbId, colId, ID.unique(), prod);
      console.log(`Seeded: ${prod.name} (${prod.product_id}) -> $${prod.price_usd}`);
    } catch (err) {
      console.error(`Error seeding ${prod.product_id}:`, err.message);
    }
  }
  console.log('Seeding complete!');
}

seed();
