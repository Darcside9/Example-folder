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

async function inspectLogs() {
  const list = await databases.listDocuments(env.VITE_APPWRITE_DATABASE_ID, 'platforms_catalog');
  console.log('--- Inspecting logs in collections ---');
  for (const d of list.documents) {
    const colId = d.collection_id;
    if (!colId) continue;
    try {
      const logs = await databases.listDocuments(env.VITE_APPWRITE_DATABASE_ID, colId);
      console.log(`Platform [${d.platform_id}] (${d.name}) -> Collection [${colId}]: Total docs: ${logs.total}`);
      logs.documents.forEach(doc => {
        console.log(`   - ID: ${doc.$id} | User: ${doc.username} | Status: ${doc.status} | sub_type_id: "${doc.sub_type_id}" | sub_type_title: "${doc.sub_type_title}"`);
      });
    } catch (err) {
      console.warn(`Platform [${d.platform_id}] collection error: ${err.message}`);
    }
  }
}

inspectLogs();
