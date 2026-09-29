// ==========================================================================
// CHRIS SHOPPER — SETUP PLATFORMS CATALOG COLLECTION & SEED DEFAULTS
// Provisions platforms_catalog in Appwrite Cloud DB and seeds initial 5 platforms.
// ==========================================================================

import { Client, Databases, Permission, Role, ID, Query } from 'node-appwrite';
import fs from 'fs';
import path from 'path';

const envContent = fs.readFileSync(path.resolve(process.cwd(), '.env'), 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [k, ...v] = line.trim().split('=');
  if (k && !k.startsWith('#')) env[k] = v.join('=');
});

const DATABASE_ID = env.VITE_APPWRITE_DATABASE_ID;
const client = new Client()
  .setEndpoint(env.VITE_APPWRITE_ENDPOINT)
  .setProject(env.VITE_APPWRITE_PROJECT_ID)
  .setKey(env.APPWRITE_API_KEY);

const databases = new Databases(client);

const CATALOG_COL_ID = 'platforms_catalog';

async function safeApiCall(fn, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (err.code === 404 || err.code === 409) {
        throw err; // don't retry expected not-found or conflict codes
      }
      console.log(`[Network warning] ${err.message}. Retrying (${i + 1}/${retries})...`);
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, 1500));
    }
  }
}

const INITIAL_PLATFORMS = [
  {
    platform_id: 'facebook',
    name: 'Facebook Accounts',
    subtitle: 'USA Facebook',
    tag: 'Facebook',
    icon: '📘',
    color: '#1877f2',
    collection_id: '6ab9702e001dc7115654',
    demo_price: 1.50,
    packages_json: JSON.stringify([
      { id: 'fb-type-1', title: 'Facebook Accounts | 2FA + Outlook Mail | 50-100 Friends | USA | 2016-2020', platform: 'Facebook', price: 1.50 },
      { id: 'fb-type-2', title: 'Facebook Accounts | 2FA + Outlook Mail | 0-30 Friends | USA | 2016-2019', platform: 'Facebook', price: 1.50 },
      { id: 'fb-type-3', title: 'Facebook Accounts | 2FA + Outlook Mail | 100-200+ Friends | USA | 2017-2021', platform: 'Facebook', price: 1.50 }
    ]),
    is_active: true
  },
  {
    platform_id: 'tiktok',
    name: 'TikTok Accounts',
    subtitle: 'Creator & Verified Profiles',
    tag: 'TikTok',
    icon: '🎵',
    color: '#ff0050',
    collection_id: '6ab97045000451688a63',
    demo_price: 2.20,
    packages_json: JSON.stringify([
      { id: 'tiktok-type-1', title: 'TikTok Accounts | Creator & Aged Profiles | 2FA + Mail Access', platform: 'TikTok', price: 2.20 }
    ]),
    is_active: true
  },
  {
    platform_id: 'instagram',
    name: 'Instagram Accounts',
    subtitle: 'Aged PVA & 2FA Profiles',
    tag: 'Instagram',
    icon: '📷',
    color: '#e1306c',
    collection_id: '6ab9704e00116f8d983c',
    demo_price: 1.80,
    packages_json: JSON.stringify([
      { id: 'insta-type-1', title: 'Instagram Accounts | Aged PVA Profiles | 2FA + Mail Access', platform: 'Instagram', price: 1.80 }
    ]),
    is_active: true
  },
  {
    platform_id: 'twitter',
    name: 'Twitter Accounts',
    subtitle: 'Aged & Phone Verified',
    tag: 'Twitter',
    icon: '🐦',
    color: '#1da1f2',
    collection_id: '6ab9706a003a134738d5',
    demo_price: 2.00,
    packages_json: JSON.stringify([
      { id: 'twitter-type-1', title: 'Twitter / X Accounts | Aged & Phone Verified | 2FA Secret Key Access', platform: 'Twitter', price: 2.00 }
    ]),
    is_active: true
  },
  {
    platform_id: 'textplus',
    name: 'Textplus Accounts',
    subtitle: 'US/CA Carrier Line Profiles',
    tag: 'Textplus',
    icon: '💬',
    color: '#10b981',
    collection_id: '6ab9707300032f996f8c',
    demo_price: 1.20,
    packages_json: JSON.stringify([
      { id: 'textplus-type-1', title: 'Textplus Accounts | US/CA Carrier Phone Profiles | Full Mail Access', platform: 'Textplus', price: 1.20 }
    ]),
    is_active: true
  }
];

const ATTRIBUTES = [
  { key: 'platform_id', type: 'string', size: 100, required: true },
  { key: 'name', type: 'string', size: 200, required: true },
  { key: 'subtitle', type: 'string', size: 255, required: false, default: '' },
  { key: 'tag', type: 'string', size: 100, required: false, default: '' },
  { key: 'icon', type: 'string', size: 50, required: false, default: '📦' },
  { key: 'color', type: 'string', size: 50, required: false, default: '#38bdf8' },
  { key: 'collection_id', type: 'string', size: 100, required: true },
  { key: 'demo_price', type: 'float', required: false, default: 1.50 },
  { key: 'packages_json', type: 'string', size: 10000, required: false, default: '[]' },
  { key: 'is_active', type: 'boolean', required: false, default: true }
];

async function main() {
  console.log('====================================================');
  console.log('CHRIS SHOPPER — PLATFORMS CATALOG SETUP');
  console.log('====================================================\n');

  // Step 1: Ensure collection platforms_catalog exists
  let collection = null;
  try {
    collection = await safeApiCall(() => databases.getCollection(DATABASE_ID, CATALOG_COL_ID));
    console.log(`✓ Collection ${CATALOG_COL_ID} already exists.`);
  } catch (err) {
    if (err.code === 404) {
      console.log(`Creating collection: ${CATALOG_COL_ID}...`);
      collection = await safeApiCall(() => databases.createCollection(
        DATABASE_ID,
        CATALOG_COL_ID,
        'Platforms Catalog',
        [
          Permission.read(Role.any()),
          Permission.create(Role.any()),
          Permission.update(Role.any()),
          Permission.delete(Role.any())
        ]
      ));
      console.log(`✓ Created collection ${CATALOG_COL_ID}`);
    } else {
      throw err;
    }
  }

  // Step 2: Ensure attributes
  const existingCol = await safeApiCall(() => databases.getCollection(DATABASE_ID, CATALOG_COL_ID));
  const existingAttrs = new Set(existingCol.attributes.map(a => a.key));

  for (const attr of ATTRIBUTES) {
    if (existingAttrs.has(attr.key)) {
      console.log(`- Attribute "${attr.key}" already exists.`);
      continue;
    }
    console.log(`Creating attribute "${attr.key}" (${attr.type})...`);
    if (attr.type === 'string') {
      await safeApiCall(() => databases.createStringAttribute(
        DATABASE_ID,
        CATALOG_COL_ID,
        attr.key,
        attr.size,
        attr.required,
        attr.default !== undefined ? attr.default : null
      ));
    } else if (attr.type === 'float') {
      await safeApiCall(() => databases.createFloatAttribute(
        DATABASE_ID,
        CATALOG_COL_ID,
        attr.key,
        attr.required,
        undefined,
        undefined,
        attr.default !== undefined ? attr.default : null
      ));
    } else if (attr.type === 'boolean') {
      await safeApiCall(() => databases.createBooleanAttribute(
        DATABASE_ID,
        CATALOG_COL_ID,
        attr.key,
        attr.required,
        attr.default !== undefined ? attr.default : null
      ));
    }
    console.log(`✓ Created attribute: ${attr.key}`);
    await new Promise(r => setTimeout(r, 600));
  }

  // Step 3: Ensure index on platform_id
  try {
    await safeApiCall(() => databases.createIndex(
      DATABASE_ID,
      CATALOG_COL_ID,
      'idx_platform_id',
      'key',
      ['platform_id']
    ));
    console.log('✓ Created index on platform_id');
  } catch (e) {
    console.log('Index note:', e.message);
  }

  // Step 4: Seed default platforms
  console.log('\n--- Seeding initial platforms ---');
  for (const plat of INITIAL_PLATFORMS) {
    try {
      const existing = await safeApiCall(() => databases.listDocuments(DATABASE_ID, CATALOG_COL_ID, [
        Query.equal('platform_id', plat.platform_id),
        Query.limit(1)
      ]));
      if (existing.documents.length === 0) {
        await safeApiCall(() => databases.createDocument(
          DATABASE_ID,
          CATALOG_COL_ID,
          ID.unique(),
          plat
        ));
        console.log(`✓ Seeded platform: ${plat.name} (${plat.platform_id})`);
      } else {
        console.log(`- Platform ${plat.name} (${plat.platform_id}) already seeded.`);
      }
    } catch (sErr) {
      console.log(`Note seeding ${plat.platform_id}:`, sErr.message);
    }
  }

  console.log('\n====================================================');
  console.log('🎉 PLATFORMS CATALOG SETUP COMPLETE!');
  console.log('====================================================');
}

main().catch(console.error);
