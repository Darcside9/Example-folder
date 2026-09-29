import { Client, Databases, Functions } from 'node-appwrite';
import fs from 'fs';
import path from 'path';

// Parse .env manually
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [k, ...v] = line.trim().split('=');
  if (k && !k.startsWith('#')) {
    env[k] = v.join('=');
  }
});

const client = new Client()
  .setEndpoint(env.VITE_APPWRITE_ENDPOINT)
  .setProject(env.VITE_APPWRITE_PROJECT_ID)
  .setKey(env.APPWRITE_API_KEY);

const databases = new Databases(client);
const functions = new Functions(client);

async function inspect() {
  console.log('--- Inspecting Appwrite Project ---');
  try {
    const fnList = await functions.list();
    console.log('Functions count:', fnList.total);
    fnList.functions.forEach(f => console.log(`  * Function [${f.$id}] "${f.name}": status=${f.status}, runtime=${f.runtime}`));
  } catch (err) {
    console.log('Functions check err:', err.message);
  }

  try {
    const colList = await databases.listCollections(env.VITE_APPWRITE_DATABASE_ID);
    console.log('\nCollections count:', colList.total);
    for (const c of colList.collections) {
      console.log(`- Collection [${c.$id}] "${c.name}": permissions = ${JSON.stringify(c.$permissions)}`);
    }
  } catch (err) {
    console.log('Collections check err:', err.message);
  }

  try {
    const pricing = await databases.listDocuments(env.VITE_APPWRITE_DATABASE_ID, 'products_pricing');
    console.log('\nProducts pricing docs:', pricing.total);
    pricing.documents.forEach(d => console.log(`  * ${d.name} (${d.product_id}): $${d.price_usd} [active=${d.is_active}]`));
  } catch (err) {
    console.log('Pricing check err:', err.message);
  }
}

inspect();
