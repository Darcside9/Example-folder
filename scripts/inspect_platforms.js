import { Client, Databases } from 'node-appwrite';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const idx = trimmed.indexOf('=');
    if (idx > 0) {
      env[trimmed.substring(0, idx).trim()] = trimmed.substring(idx + 1).trim();
    }
  }
});

const client = new Client()
  .setEndpoint(env.VITE_APPWRITE_ENDPOINT)
  .setProject(env.VITE_APPWRITE_PROJECT_ID)
  .setKey(env.APPWRITE_API_KEY);

const databases = new Databases(client);

async function inspect() {
  console.log('Fetching platforms_catalog from Appwrite...');
  try {
    const list = await databases.listDocuments(env.VITE_APPWRITE_DATABASE_ID, 'platforms_catalog');
    console.log(`Found ${list.total} platforms in catalog:`);
    for (const d of list.documents) {
      console.log(`- Platform: "${d.name}" | ID: "${d.platform_id}" | ColID: "${d.collection_id}"`);
      console.log(`  Packages: ${d.packages_json}`);
    }
  } catch (err) {
    console.error('Failed to list platforms_catalog:', err);
  }
}

inspect();
