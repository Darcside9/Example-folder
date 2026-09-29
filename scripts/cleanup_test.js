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

async function cleanup() {
  const uList = await users.list();
  for (const u of uList.users) {
    if (u.email.includes('testbuyer_')) {
      await users.delete(u.$id);
      console.log('Cleaned up test user:', u.email);
    }
  }

  const pList = await db.listDocuments(env.VITE_APPWRITE_DATABASE_ID, 'user_profiles');
  for (const p of pList.documents) {
    if (p.email.includes('testbuyer_')) {
      await db.deleteDocument(env.VITE_APPWRITE_DATABASE_ID, 'user_profiles', p.$id);
      console.log('Cleaned up test profile:', p.email);
    }
  }
}

cleanup();
