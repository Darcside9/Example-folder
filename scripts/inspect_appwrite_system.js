import { Client, Databases, Functions } from 'node-appwrite';
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
const functions = new Functions(client);

async function inspect() {
  console.log('--- Inspecting Databases & Collections ---');
  try {
    const collections = await databases.listCollections(env.VITE_APPWRITE_DATABASE_ID);
    console.log(`Total collections: ${collections.total}`);
    for (const col of collections.collections) {
      console.log(`- ${col.name} (ID: ${col.$id})`);
    }
  } catch (err) {
    console.error('Error listing collections:', err.message);
  }

  console.log('\n--- Inspecting Function "log-dispenser" ---');
  try {
    const fn = await functions.get('log-dispenser');
    console.log('Function Name:', fn.name);
    console.log('Function ID:', fn.$id);
    console.log('Runtime:', fn.runtime);
    console.log('Schedule:', `"${fn.schedule}"`);
    console.log('Enabled:', fn.enabled);
  } catch (err) {
    console.error('Error getting function:', err.message);
  }
}

inspect();
