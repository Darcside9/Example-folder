import { Client, Functions } from 'node-appwrite';
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

async function testPlatforms() {
  const platforms = ['facebook', 'tiktok', 'instagram', 'twitter', 'textplus'];
  for (const p of platforms) {
    const res = await f.createExecution('log-dispenser', JSON.stringify({ action: 'list_available', platformId: p }));
    console.log(`${p}:`, res.responseBody);
  }
}

testPlatforms();
