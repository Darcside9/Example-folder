import { Client, Functions } from 'node-appwrite';
import fs from 'fs';
import path from 'path';

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

async function createFunc() {
  try {
    const fn = await functions.create('log-dispenser', 'Log Dispenser', 'node-20.0', ['any']);
    console.log('Created function successfully:', fn.$id, fn.name);
  } catch (err) {
    console.error('Create error:', err.message, err.response);
  }
}

createFunc();
