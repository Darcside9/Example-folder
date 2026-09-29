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

async function testImport() {
  const sampleRecords = [
    {
      username: '61590748374787',
      password: 'dv4WaXTqmkR3',
      twoFactorKey: 'OQVZ ZBN2 SEHY TINT SWPA RL66 SZZK 4RWU',
      mail: 'BrandeeOats60@outlook.com',
      mailPassword: 'qvli4Ham3'
    }
  ];

  console.log('Testing admin_bulk_import via log-dispenser for facebook...');
  const res = await f.createExecution(
    'log-dispenser',
    JSON.stringify({
      action: 'admin_bulk_import',
      platformId: 'facebook',
      subTypeId: 'fb-2fa',
      subTypeTitle: 'Facebook Accounts | 2FA + Mail Access',
      price: 1.50,
      records: sampleRecords
    })
  );

  console.log('Import response:', res.responseBody);

  console.log('Querying available facebook accounts now...');
  const check = await f.createExecution('log-dispenser', JSON.stringify({ action: 'list_available', platformId: 'facebook' }));
  console.log('Available accounts:', check.responseBody);
}

testImport();
