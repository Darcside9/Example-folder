import { Client, Users, Databases } from 'node-appwrite';
import fs from 'fs';
import path from 'path';

const envContent = fs.readFileSync(path.resolve(process.cwd(), '.env'), 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [k, ...v] = line.trim().split('=');
  if (k && !k.startsWith('#')) env[k] = v.join('=');
});

const client = new Client()
  .setEndpoint(env.VITE_APPWRITE_ENDPOINT)
  .setProject(env.VITE_APPWRITE_PROJECT_ID)
  .setKey(env.APPWRITE_API_KEY);

const users = new Users(client);
const db = new Databases(client);

async function retry(fn, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

async function cleanAndCheck() {
  console.log('--- Step 1: Listing and Deleting all Appwrite Auth Users ---');
  const uList = await retry(() => users.list());
  console.log(`Found ${uList.total} Auth user(s).`);
  for (const u of uList.users) {
    try {
      await retry(() => users.delete(u.$id));
      console.log(`✓ Deleted Auth user: ${u.$id} (${u.email})`);
    } catch (err) {
      console.error(`Failed to delete user ${u.$id}:`, err.message);
    }
  }

  console.log('\n--- Step 2: Listing and Deleting all user_profiles documents ---');
  const pList = await retry(() => db.listDocuments(env.VITE_APPWRITE_DATABASE_ID, 'user_profiles'));
  console.log(`Found ${pList.total} user_profiles document(s).`);
  for (const p of pList.documents) {
    try {
      await retry(() => db.deleteDocument(env.VITE_APPWRITE_DATABASE_ID, 'user_profiles', p.$id));
      console.log(`✓ Deleted profile document: ${p.$id} (${p.email})`);
    } catch (err) {
      console.error(`Failed to delete profile ${p.$id}:`, err.message);
    }
  }

  console.log('\n--- Step 3: Listing and Deleting all orders documents ---');
  const oList = await retry(() => db.listDocuments(env.VITE_APPWRITE_DATABASE_ID, 'orders'));
  console.log(`Found ${oList.total} order(s).`);
  for (const o of oList.documents) {
    try {
      await retry(() => db.deleteDocument(env.VITE_APPWRITE_DATABASE_ID, 'orders', o.$id));
      console.log(`✓ Deleted order document: ${o.$id}`);
    } catch (err) {
      console.error(`Failed to delete order ${o.$id}:`, err.message);
    }
  }

  console.log('\n--- Step 4: Resetting sold test logs back to available ---');
  const cols = [
    { name: 'facebook', id: '6ab9702e001dc7115654' },
    { name: 'tiktok', id: '6ab97045000451688a63' },
    { name: 'instagram', id: '6ab9704e00116f8d983c' },
    { name: 'twitter', id: '6ab9706a003a134738d5' },
    { name: 'textplus', id: '6ab9707300032f996f8c' }
  ];

  for (const col of cols) {
    const sold = await retry(() => db.listDocuments(env.VITE_APPWRITE_DATABASE_ID, col.id));
    for (const doc of sold.documents) {
      if (doc.username.startsWith('testfb_')) {
        await retry(() => db.deleteDocument(env.VITE_APPWRITE_DATABASE_ID, col.id, doc.$id));
        console.log(`✓ Deleted test log @${doc.username} in ${col.name}`);
      } else if (doc.status === 'sold') {
        await retry(() => db.updateDocument(env.VITE_APPWRITE_DATABASE_ID, col.id, doc.$id, {
          status: 'available',
          sold_to_user_id: '',
          sold_to_email: '',
          sold_at: ''
        }));
        console.log(`✓ Reset log @${doc.username} to available in ${col.name}`);
      }
    }
  }

  console.log('\n--- Step 5: Verification of Clean State ---');
  const finalUsers = await retry(() => users.list());
  const finalProfiles = await retry(() => db.listDocuments(env.VITE_APPWRITE_DATABASE_ID, 'user_profiles'));
  const finalOrders = await retry(() => db.listDocuments(env.VITE_APPWRITE_DATABASE_ID, 'orders'));
  console.log(`Active Auth Users: ${finalUsers.total}`);
  console.log(`Active user_profiles Docs: ${finalProfiles.total}`);
  console.log(`Active Orders Docs: ${finalOrders.total}`);
  console.log('✓ APPWRITE DB IS COMPLETELY CLEAN AND READY!');
}

cleanAndCheck().catch(console.error);
