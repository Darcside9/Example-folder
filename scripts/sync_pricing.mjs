import { Client, Databases, Query, ID } from 'node-appwrite';

const client = new Client()
  .setEndpoint('https://fra.cloud.appwrite.io/v1')
  .setProject('6ab96624002e549083d1')
  .setKey('standard_f5cd1710403af68b3d1fccabc7ae10e6c0980d52a87decc8c84004a006e4b1f8ee05033a3c9852d4c25c806dd74b6099827bbecef25ebbb0beeddd706a38ec1e4b9ac2a81f6afd75d07846ee975b440ee6374e5e7f40feaa030a59cb409a60c885e304ca0e289d8bb1af394b99f49b171d77ebacb48d31ae7dd4672da772d1ad');

const db = new Databases(client);
const DATABASE_ID = '6ab96f3c0031c3231183';
const COLLECTION_ID = 'products_pricing';

export const USA_SERVICES = [
  { id: 'tiktok', name: 'TikTok / Douyin', tigerCode: 'lf', category: 'social', price: 700, carrierSpeed: '< 4s' },
  { id: 'whatsapp', name: 'WhatsApp / WA Business', tigerCode: 'wa', category: 'messaging', price: 2700, carrierSpeed: '< 3s' },
  { id: 'telegram', name: 'Telegram', tigerCode: 'tg', category: 'messaging', price: 2700, carrierSpeed: '< 3s' },
  { id: 'signal', name: 'Signal Private Messenger', tigerCode: 'bw', category: 'messaging', price: 755, carrierSpeed: '< 5s' },
  { id: 'viber', name: 'Viber', tigerCode: 'vi', category: 'messaging', price: 650, carrierSpeed: '< 5s' },
  { id: 'apple', name: 'Apple / iCloud ID', tigerCode: 'wx', category: 'tech', price: 500, carrierSpeed: '< 4s' },
  { id: 'google', name: 'Google / YouTube / Gmail', tigerCode: 'go', category: 'tech', price: 1020, carrierSpeed: '< 4s' },
  { id: 'twitch', name: 'Twitch', tigerCode: 'hb', category: 'entertainment', price: 1532, carrierSpeed: '< 5s' },
  { id: 'instagram', name: 'Instagram + Threads', tigerCode: 'ig', category: 'social', price: 850, carrierSpeed: '< 4s' },
  { id: 'facebook', name: 'Facebook / Meta', tigerCode: 'fb', category: 'social', price: 750, carrierSpeed: '< 4s' },
  { id: 'twitter', name: 'Twitter / X', tigerCode: 'tw', category: 'social', price: 750, carrierSpeed: '< 4s' },
  { id: 'paypal', name: 'PayPal', tigerCode: 'ts', category: 'finance', price: 1260, carrierSpeed: '< 6s' },
  { id: 'chatgpt', name: 'ChatGPT / OpenAI', tigerCode: 'dr', category: 'ai', price: 760, carrierSpeed: '< 4s' },
  { id: 'tinder', name: 'Tinder (Swipe App)', tigerCode: 'oi', category: 'dating', price: 777, carrierSpeed: '< 5s' },
  { id: 'match', name: 'Match.com', tigerCode: 'axr', category: 'dating', price: 3050, carrierSpeed: '< 6s' },
  { id: 'other', name: 'Any Other Service', tigerCode: 'ot', category: 'other', price: 798, carrierSpeed: '< 5s' },
  { id: 'snapchat', name: 'Snapchat', tigerCode: 'fu', category: 'social', price: 800, carrierSpeed: '< 4s' },
  { id: 'yahoo', name: 'Yahoo Mail', tigerCode: 'mb', category: 'tech', price: 890, carrierSpeed: '< 5s' },
  { id: 'gmx', name: 'GMX Mail', tigerCode: 'abk', category: 'tech', price: 1830, carrierSpeed: '< 6s' },
  { id: 'microsoft', name: 'Microsoft / Outlook', tigerCode: 'mm', category: 'tech', price: 718, carrierSpeed: '< 4s' },
  { id: 'netflix', name: 'Netflix', tigerCode: 'nf', category: 'entertainment', price: 765, carrierSpeed: '< 5s' },
  { id: 'ebay', name: 'eBay', tigerCode: 'dh', category: 'commerce', price: 874, carrierSpeed: '< 5s' },
  { id: 'okcupid', name: 'OkCupid', tigerCode: 'vm', category: 'dating', price: 884, carrierSpeed: '< 5s' },
  { id: 'cashapp', name: 'Cash App', tigerCode: 'it', category: 'finance', price: 1000, carrierSpeed: '< 6s' },
  { id: 'badoo', name: 'Badoo', tigerCode: 'qv', category: 'dating', price: 750, carrierSpeed: '< 5s' },
];

async function syncPricing() {
  console.log('Fetching existing products_pricing...');
  const existing = await db.listDocuments(DATABASE_ID, COLLECTION_ID, [
    Query.equal('product_type', 'sms_service'),
    Query.limit(100)
  ]);

  const existingMap = new Map();
  for (const doc of existing.documents) {
    existingMap.set(doc.product_id, doc);
  }

  for (const srv of USA_SERVICES) {
    const existingDoc = existingMap.get(srv.id);
    const payload = {
      product_id: srv.id,
      name: srv.name,
      product_type: 'sms_service',
      price_usd: srv.price,
      is_active: true,
      carrier_speed: srv.carrierSpeed,
      category: srv.category
    };

    if (existingDoc) {
      console.log(`Updating ${srv.name} (ID: ${existingDoc.$id}) to ₦${srv.price}...`);
      await db.updateDocument(DATABASE_ID, COLLECTION_ID, existingDoc.$id, payload);
    } else {
      console.log(`Creating ${srv.name} at ₦${srv.price}...`);
      await db.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), payload);
    }
  }

  console.log('\n✅ Successfully synced all 25 USA SMS services to Appwrite products_pricing!');
}

syncPricing().catch(console.error);
