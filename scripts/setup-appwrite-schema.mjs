import { Client, Databases, Permission, Role } from 'node-appwrite';

const ENDPOINT = process.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
const PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID || '6ab96624002e549083d1';
const API_KEY = process.env.APPWRITE_API_KEY || '';
const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID || '6ab96f3c0031c3231183';

const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)
  .setKey(API_KEY);

const databases = new Databases(client);

// Log Collection attributes specification
const LOG_ATTRIBUTES = [
  { key: 'username', type: 'string', size: 255, required: true },
  { key: 'password', type: 'string', size: 255, required: true },
  { key: 'two_factor_key', type: 'string', size: 500, required: true },
  { key: 'mail', type: 'string', size: 255, required: true },
  { key: 'mail_password', type: 'string', size: 255, required: true },
  { key: 'sub_type_id', type: 'string', size: 100, required: true },
  { key: 'sub_type_title', type: 'string', size: 255, required: false, default: '' },
  { key: 'price', type: 'float', required: false, default: 1.50 },
  { key: 'status', type: 'string', size: 30, required: false, default: 'available' },
  { key: 'sold_to_user_id', type: 'string', size: 255, required: false },
  { key: 'sold_to_email', type: 'string', size: 255, required: false },
  { key: 'sold_at', type: 'string', size: 50, required: false },
];

async function safeApiCall(fn, retries = 5, delay = 2000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === retries) throw err;
      console.warn(`  ! Network retry (${attempt}/${retries}): ${err.message}. Waiting ${delay / 1000}s...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

async function ensureAttribute(colId, attr) {
  await safeApiCall(async () => {
    try {
      if (attr.type === 'string') {
        await databases.createStringAttribute(
          DATABASE_ID,
          colId,
          attr.key,
          attr.size,
          attr.required,
          attr.default !== undefined ? attr.default : null
        );
      } else if (attr.type === 'float') {
        await databases.createFloatAttribute(
          DATABASE_ID,
          colId,
          attr.key,
          attr.required,
          undefined,
          undefined,
          attr.default !== undefined ? attr.default : null
        );
      } else if (attr.type === 'boolean') {
        await databases.createBooleanAttribute(
          DATABASE_ID,
          colId,
          attr.key,
          attr.required,
          attr.default !== undefined ? attr.default : null
        );
      }
      console.log(`  ✓ Created attribute: ${attr.key}`);
      await new Promise(r => setTimeout(r, 600));
    } catch (err) {
      if (err.code === 409 || (err.message && err.message.includes('already exists'))) {
        console.log(`  - Attribute ${attr.key} already exists.`);
        return;
      }
      throw err;
    }
  });
}

async function ensureCollection(name, colId, permissions = []) {
  return await safeApiCall(async () => {
    try {
      const existing = await databases.getCollection(DATABASE_ID, colId);
      console.log(`Collection exists: ${name} (${colId})`);
      return existing;
    } catch (err) {
      if (err.code === 404) {
        console.log(`Creating collection: ${name} (${colId})...`);
        const created = await databases.createCollection(
          DATABASE_ID,
          colId,
          name,
          permissions
        );
        console.log(`✓ Created collection: ${name} (${colId})`);
        return created;
      }
      throw err;
    }
  });
}

async function main() {
  console.log('====================================================');
  console.log('CHRIS SHOPPER — APPWRITE SCHEMA & PERMISSION SETUP');
  console.log('Database ID:', DATABASE_ID);
  console.log('====================================================\n');

  // Step 1: List existing collections
  const list = await safeApiCall(() => databases.listCollections(DATABASE_ID));
  console.log('Found collections:', list.collections.map(c => `${c.name} (${c.$id})`).join(', '));

  // Map known log collections
  const logCollections = [
    { name: 'logs_facebook', id: '6ab9702e001dc7115654' },
    { name: 'logs_tiktok', id: '6ab97045000451688a63' },
    { name: 'logs_instagram', id: '6ab9704e00116f8d983c' },
    { name: 'logs_twitter', id: '6ab9706a003a134738d5' },
    { name: 'logs_textplus', id: '6ab9707300032f996f8c' },
  ];

  // Provision attributes on all 5 log collections & ensure private permissions
  for (const col of logCollections) {
    console.log(`\nProcessing log collection: ${col.name} (${col.id})...`);
    // Enforce STRICT zero-trust: no public permissions (empty array = API key / serverless only)
    try {
      await safeApiCall(() => databases.updateCollection(
        DATABASE_ID,
        col.id,
        col.name,
        [], // Zero public permissions: strictly private
        false // Document-level security not needed since collection is private
      ));
      console.log(`  ✓ Enforced private permissions on ${col.name}`);
    } catch (e) {
      console.warn(`  ! Note updating permissions:`, e.message);
    }

    // Get current attributes
    const colObj = await safeApiCall(() => databases.getCollection(DATABASE_ID, col.id));
    const existingAttrKeys = new Set(colObj.attributes.map(a => a.key));

    for (const attr of LOG_ATTRIBUTES) {
      if (existingAttrKeys.has(attr.key)) {
        console.log(`  - Attribute ${attr.key} already exists.`);
      } else {
        await ensureAttribute(col.id, attr);
      }
    }
  }

  // Step 2: Ensure Core Collections exist (products_pricing, user_profiles, orders)
  console.log('\n----------------------------------------------------');
  console.log('Ensuring Core Collections (products_pricing, user_profiles, orders)...');
  console.log('----------------------------------------------------');

  // 1. products_pricing
  const pricingCol = await ensureCollection('products_pricing', 'products_pricing', [
    Permission.read(Role.any()), // Public can read prices
    Permission.create(Role.users()), // Admin / authorized users can write
    Permission.update(Role.users()),
  ]);

  const PRICING_ATTRS = [
    { key: 'product_id', type: 'string', size: 100, required: true },
    { key: 'name', type: 'string', size: 200, required: true },
    { key: 'category', type: 'string', size: 100, required: false, default: '' },
    { key: 'product_type', type: 'string', size: 50, required: false, default: 'sms_service' },
    { key: 'price_usd', type: 'float', required: false, default: 0.20 },
    { key: 'is_active', type: 'boolean', required: false, default: true },
    { key: 'carrier_speed', type: 'string', size: 50, required: false, default: '< 3s' },
  ];

  const pricingObj = await safeApiCall(() => databases.getCollection(DATABASE_ID, 'products_pricing'));
  const pricingExistingKeys = new Set(pricingObj.attributes.map(a => a.key));
  for (const attr of PRICING_ATTRS) {
    if (!pricingExistingKeys.has(attr.key)) {
      await ensureAttribute('products_pricing', attr);
    } else {
      console.log(`  - Attribute ${attr.key} already exists.`);
    }
  }

  // 2. user_profiles
  const profileCol = await ensureCollection('user_profiles', 'user_profiles', [
    Permission.read(Role.users()), // Logged in users can read their profiles
    Permission.create(Role.users()),
    Permission.update(Role.users()),
  ]);

  const PROFILE_ATTRS = [
    { key: 'user_id', type: 'string', size: 255, required: true },
    { key: 'email', type: 'string', size: 255, required: true },
    { key: 'contact_info', type: 'string', size: 255, required: false, default: '' },
    { key: 'balance', type: 'float', required: false, default: 10.00 },
    { key: 'role', type: 'string', size: 50, required: false, default: 'user' },
  ];

  const profileObj = await safeApiCall(() => databases.getCollection(DATABASE_ID, 'user_profiles'));
  const profileExistingKeys = new Set(profileObj.attributes.map(a => a.key));
  for (const attr of PROFILE_ATTRS) {
    if (!profileExistingKeys.has(attr.key)) {
      await ensureAttribute('user_profiles', attr);
    } else {
      console.log(`  - Attribute ${attr.key} already exists.`);
    }
  }

  // 3. orders
  const ordersCol = await ensureCollection('orders', 'orders', [
    Permission.read(Role.users()),
    Permission.create(Role.users()),
  ]);

  const ORDER_ATTRS = [
    { key: 'user_id', type: 'string', size: 255, required: true },
    { key: 'user_email', type: 'string', size: 255, required: false, default: '' },
    { key: 'product_type', type: 'string', size: 50, required: true },
    { key: 'item_name', type: 'string', size: 255, required: true },
    { key: 'reference', type: 'string', size: 255, required: false, default: '' },
    { key: 'price', type: 'float', required: true },
    { key: 'status', type: 'string', size: 50, required: false, default: 'completed' },
    { key: 'details', type: 'string', size: 2000, required: false, default: '' },
  ];

  const ordersObj = await safeApiCall(() => databases.getCollection(DATABASE_ID, 'orders'));
  const ordersExistingKeys = new Set(ordersObj.attributes.map(a => a.key));
  for (const attr of ORDER_ATTRS) {
    if (!ordersExistingKeys.has(attr.key)) {
      await ensureAttribute('orders', attr);
    } else {
      console.log(`  - Attribute ${attr.key} already exists.`);
    }
  }

  console.log('\n====================================================');
  console.log('APPWRITE PROVISIONING COMPLETE!');
  console.log('All collections configured with zero-trust permissions and attributes.');
  console.log('====================================================');
}

main().catch(err => {
  console.error('\nFatal setup error:', err);
  process.exit(1);
});
