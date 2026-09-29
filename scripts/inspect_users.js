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

async function run() {
  const uList = await users.list();
  console.log('Appwrite Auth Users count:', uList.total);
  uList.users.forEach(u => console.log(`  User: ${u.$id} | ${u.email} | ${u.name}`));

  const pList = await db.listDocuments(env.VITE_APPWRITE_DATABASE_ID, 'user_profiles');
  console.log('Appwrite user_profiles Docs count:', pList.total);
  pList.documents.forEach(d => console.log(`  Profile: ${d.$id} | userId=${d.user_id} | ${d.email} | balance=$${d.balance} | role=${d.role}`));
}

run();
