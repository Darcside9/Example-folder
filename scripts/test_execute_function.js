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

async function testExec() {
  console.log('Testing execution of "log-dispenser"...');
  try {
    const execution = await f.createExecution(
      'log-dispenser',
      JSON.stringify({
        action: 'list_available',
        platformId: 'facebook'
      }),
      false, // async = false (synchronous)
      '/',
      'POST'
    );
    console.log('Execution Status:', execution.status);
    console.log('Response status code:', execution.responseStatusCode);
    console.log('Response body:', execution.responseBody);
    if (execution.errors) {
      console.log('Execution errors:', execution.errors);
    }
  } catch (err) {
    console.error('Execution error:', err.message);
  }
}

testExec();
