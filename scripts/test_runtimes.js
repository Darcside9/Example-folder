import { Client, Functions } from 'node-appwrite';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf8');
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

const functions = new Functions(client);

const candidates = [
  'node-18.0',
  'node-19.0',
  'node-21.0',
  'node-22.0',
  'node-18',
  'node-20',
  'node-21',
  'node-22'
];

async function test() {
  for (const r of candidates) {
    try {
      const fn = await functions.create('test-fn', 'Test', r, ['any']);
      console.log(`SUCCESS! Runtime is: ${r}`);
      await functions.delete(fn.$id);
      return;
    } catch (e) {
      console.log(`Failed ${r}: ${e.message}`);
    }
  }
}

test();
