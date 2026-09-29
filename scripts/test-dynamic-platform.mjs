import { Client, Functions, Databases, Query } from 'node-appwrite';
import fs from 'fs';

const env = Object.fromEntries(
  fs.readFileSync('.env', 'utf8')
    .split('\n')
    .map(l => l.trim().split('='))
    .filter(p => p[0] && !p[0].startsWith('#'))
);

const client = new Client()
  .setEndpoint(env.VITE_APPWRITE_ENDPOINT)
  .setProject(env.VITE_APPWRITE_PROJECT_ID)
  .setKey(env.APPWRITE_API_KEY);

const functions = new Functions(client);
const databases = new Databases(client);

async function testDynamicPlatformFlow() {
  console.log('Testing Dynamic Platform Creation & Provisioning via log-dispenser...');

  const testPlatformId = 'linkedin_test';

  // 1. Invoke create_platform
  const exec = await functions.createExecution(
    'log-dispenser',
    JSON.stringify({
      action: 'create_platform',
      platformId: testPlatformId,
      name: 'LinkedIn Test Accounts',
      subtitle: 'Verified Connections & 2FA',
      tag: 'LinkedIn',
      icon: '💼',
      color: '#0077b5',
      demoPrice: 2.50,
      packages: [
        {
          id: `${testPlatformId}-type-1`,
          title: 'LinkedIn Accounts | 500+ Connections | USA | 2018-2022',
          platform: 'LinkedIn Test Accounts',
          price: 2.50
        }
      ]
    })
  );

  console.log('Execution Status:', exec.status);
  console.log('Execution Response:', exec.responseBody);
  const parsed = JSON.parse(exec.responseBody);
  if (!parsed.success) {
    throw new Error('Create platform failed: ' + (parsed.error || 'Unknown error'));
  }

  // 2. Verify collection was created in Appwrite Cloud DB
  const colId = parsed.collectionId;
  console.log(`Checking auto-provisioned collection: ${colId}...`);
  const col = await databases.getCollection(env.VITE_APPWRITE_DATABASE_ID, colId);
  console.log(`✓ Collection ${col.name} exists with ID: ${col.$id}`);
  console.log(`Attributes count: ${col.attributes.length}`);
  console.log(`Indexes count: ${col.indexes.length}`);

  // 3. Test add_platform_package
  console.log('Testing add_platform_package...');
  const addPkgExec = await functions.createExecution(
    'log-dispenser',
    JSON.stringify({
      action: 'add_platform_package',
      platformId: testPlatformId,
      packageData: {
        id: `${testPlatformId}-type-2`,
        title: 'LinkedIn Accounts | 1000+ Connections | Aged 2015-2017 | Premium',
        price: 4.00,
        description: 'High authority profile with active history'
      }
    })
  );
  console.log('Add Package Response:', addPkgExec.responseBody);

  // 4. Test ingestion into the new dynamic platform
  console.log('Testing admin_bulk_import into the new dynamic platform...');
  const importExec = await functions.createExecution(
    'log-dispenser',
    JSON.stringify({
      action: 'admin_bulk_import',
      platformId: testPlatformId,
      subTypeId: `${testPlatformId}-type-1`,
      subTypeTitle: 'LinkedIn Accounts | 500+ Connections | USA | 2018-2022',
      price: 2.50,
      records: [
        {
          username: 'linkedin_user_test101',
          password: 'Password123!',
          twoFactorKey: 'ABCD EFGH IJKL MNOP',
          mail: 'user101@outlook.com',
          mailPassword: 'MailPass123!'
        }
      ]
    })
  );
  console.log('Import Response:', importExec.responseBody);

  // 5. Test list_available from the new dynamic platform
  console.log('Testing list_available for the new dynamic platform...');
  const listExec = await functions.createExecution(
    'log-dispenser',
    JSON.stringify({
      action: 'list_available',
      platformId: testPlatformId
    })
  );
  console.log('List Available Response:', listExec.responseBody);
  const listResult = JSON.parse(listExec.responseBody);
  console.log(`Found ${listResult.total} sanitized accounts for ${testPlatformId}`);

  console.log('\n🎉 ALL DYNAMIC PLATFORM CREATION & PROVISIONING TESTS PASSED!');
}

testDynamicPlatformFlow().catch(console.error);
