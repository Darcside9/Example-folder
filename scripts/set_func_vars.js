import { Client, Functions, ID } from 'node-appwrite';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf8');
const env = Object.fromEntries(
  envContent
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => {
      const idx = l.indexOf('=');
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
    })
);

const client = new Client()
  .setEndpoint(env.VITE_APPWRITE_ENDPOINT)
  .setProject(env.VITE_APPWRITE_PROJECT_ID)
  .setKey(env.APPWRITE_API_KEY);

const f = new Functions(client);

async function setVars() {
  const vars = {
    APPWRITE_DATABASE_ID: env.VITE_APPWRITE_DATABASE_ID,
    APPWRITE_API_KEY: env.APPWRITE_API_KEY,
    APPWRITE_ENDPOINT: env.VITE_APPWRITE_ENDPOINT,
    APPWRITE_PROJECT_ID: env.VITE_APPWRITE_PROJECT_ID
  };

  for (const [k, v] of Object.entries(vars)) {
    try {
      const res = await f.createVariable('log-dispenser', ID.unique(), k, v);
      console.log('Set variable:', k, '-> ID:', res.$id);
    } catch (e) {
      console.error('Error setting', k, e.message);
    }
  }

  const list = await f.listVariables('log-dispenser');
  console.log('All variables configured on function:');
  list.variables.forEach(v => console.log(`  - ${v.key}: ${v.value.substring(0, 10)}...`));
}

setVars();
