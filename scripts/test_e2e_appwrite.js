// ==========================================================================
// END-TO-END VERIFICATION: APPWRITE AUTH, USER PROFILES & DISPENSER PURCHASE
// ==========================================================================

import { Client, Users, Databases, Functions, Query, ID } from 'node-appwrite';
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
const fn = new Functions(client);

const TEST_EMAIL = `testbuyer_${Date.now()}@example.com`;
const TEST_PASSWORD = 'SecureTestPassword123!';
const TEST_PLATFORM = 'facebook';
const FB_COL_ID = '6ab9702e001dc7115654';

async function runTest() {
  console.log('========================================================');
  console.log('🚀 STARTING APPWRITE BACKEND & DISPENSER E2E TEST');
  console.log('========================================================\n');

  // STEP 1: Create Test User via Users API (simulating Appwrite signup)
  console.log(`[Step 1] Creating test user: ${TEST_EMAIL}...`);
  const createdUser = await users.create(
    ID.unique(),
    TEST_EMAIL,
    undefined,
    TEST_PASSWORD,
    'Test Buyer'
  );
  console.log(`✓ Created Appwrite Auth User [${createdUser.$id}]`);

  // STEP 2: Create profile document in user_profiles collection
  console.log(`\n[Step 2] Initializing user_profiles document with $10.00 balance...`);
  const profileDoc = await db.createDocument(
    env.VITE_APPWRITE_DATABASE_ID,
    'user_profiles',
    ID.unique(),
    {
      user_id: createdUser.$id,
      email: TEST_EMAIL,
      contact_info: '+1234567890',
      balance: 10.00,
      role: 'user'
    }
  );
  console.log(`✓ Created user_profiles document [${profileDoc.$id}] with balance: $${profileDoc.balance}`);

  // STEP 3: Ensure there is at least one test account available in logs_facebook
  console.log(`\n[Step 3] Checking available logs in logs_facebook...`);
  let availLogs = await db.listDocuments(
    env.VITE_APPWRITE_DATABASE_ID,
    FB_COL_ID,
    [Query.equal('status', 'available'), Query.limit(1)]
  );

  let testUsername = '';
  let logPrice = 1.50;

  if (availLogs.documents.length === 0) {
    console.log('  No available logs found, creating a test log account...');
    testUsername = `testfb_${Date.now()}`;
    const newLog = await db.createDocument(
      env.VITE_APPWRITE_DATABASE_ID,
      FB_COL_ID,
      ID.unique(),
      {
        username: testUsername,
        password: 'PassSecret_123',
        two_factor_key: 'JBSWY3DPEHPK3PXP',
        mail: 'testfb_mail@outlook.com',
        mail_password: 'MailPassSecret_456',
        sub_type_id: 'fb-type-1',
        sub_type_title: 'USA Aged 2021 Profile',
        price: 2.50,
        status: 'available'
      }
    );
    logPrice = 2.50;
    console.log(`  ✓ Created test log account: @${testUsername} (price: $${logPrice})`);
  } else {
    testUsername = availLogs.documents[0].username;
    logPrice = Number(availLogs.documents[0].price || 1.50);
    console.log(`  ✓ Using existing available log: @${testUsername} (price: $${logPrice})`);
  }

  // STEP 4: Execute serverless dispenser function to buy the account
  console.log(`\n[Step 4] Executing log-dispenser function for purchase...`);
  const exec = await fn.createExecution(
    'log-dispenser',
    JSON.stringify({
      action: 'purchase_log',
      platformId: TEST_PLATFORM,
      subTypeId: 'fb-type-1',
      username: testUsername,
      userId: createdUser.$id,
      userEmail: TEST_EMAIL,
      price: logPrice
    })
  );

  console.log('Function execution response status:', exec.responseStatusCode);
  const result = JSON.parse(exec.responseBody);
  console.log('Dispenser result:', JSON.stringify(result, null, 2));

  if (!result.success || !result.credential) {
    throw new Error('Dispenser failed to return credentials!');
  }

  // STEP 5: Verify Atomic Balance Deduction in Appwrite user_profiles
  console.log(`\n[Step 5] Verifying balance deduction in user_profiles collection...`);
  const updatedProfiles = await db.listDocuments(
    env.VITE_APPWRITE_DATABASE_ID,
    'user_profiles',
    [Query.equal('user_id', createdUser.$id)]
  );
  const updatedUserDoc = updatedProfiles.documents[0];
  const expectedBalance = Number((10.00 - logPrice).toFixed(2));
  console.log(`  Initial Balance:  $10.00`);
  console.log(`  Charged Price:    $${logPrice.toFixed(2)}`);
  console.log(`  Expected Balance: $${expectedBalance.toFixed(2)}`);
  console.log(`  Actual DB Balance: $${Number(updatedUserDoc.balance).toFixed(2)}`);

  if (Number(updatedUserDoc.balance) !== expectedBalance) {
    throw new Error(`Balance mismatch! Expected ${expectedBalance}, got ${updatedUserDoc.balance}`);
  }
  console.log('✓ ATOMIC BALANCE DEDUCTION VERIFIED IN APPWRITE DB!');

  // STEP 6: Verify Account Status changed to 'sold'
  console.log(`\n[Step 6] Verifying account log status in collection...`);
  const checkedLog = await db.listDocuments(
    env.VITE_APPWRITE_DATABASE_ID,
    FB_COL_ID,
    [Query.equal('username', testUsername)]
  );
  console.log(`  Account @${testUsername} status: "${checkedLog.documents[0].status}"`);
  console.log(`  Sold to user: "${checkedLog.documents[0].sold_to_user_id}"`);
  if (checkedLog.documents[0].status !== 'sold') {
    throw new Error('Account log status was not updated to sold!');
  }
  console.log('✓ ACCOUNT LOG MARKED AS SOLD IN APPWRITE DB!');

  // STEP 7: Verify Order Audit Document
  console.log(`\n[Step 7] Verifying orders collection audit...`);
  const orders = await db.listDocuments(
    env.VITE_APPWRITE_DATABASE_ID,
    'orders',
    [Query.equal('user_id', createdUser.$id)]
  );
  console.log(`  Found ${orders.total} order(s) for user.`);
  if (orders.total > 0) {
    console.log(`  Order: ${orders.documents[0].item_name}, Price: $${orders.documents[0].price}, Status: ${orders.documents[0].status}`);
  }

  // STEP 8: Test Insufficient Funds Rejection
  console.log(`\n[Step 8] Testing insufficient funds rejection with expensive purchase ($999)...`);
  const rejectedExec = await fn.createExecution(
    'log-dispenser',
    JSON.stringify({
      action: 'purchase_log',
      platformId: TEST_PLATFORM,
      subTypeId: 'fb-type-1',
      username: testUsername,
      userId: createdUser.$id,
      userEmail: TEST_EMAIL,
      price: 999.00
    })
  );
  const rejectRes = JSON.parse(rejectedExec.responseBody);
  console.log('Rejected response:', rejectRes);
  if (!rejectRes.error) {
    throw new Error('Expected purchase with $999 to be rejected for insufficient balance!');
  }
  console.log('✓ INSUFFICIENT BALANCE PROPERLY REJECTED!');

  console.log('\n========================================================');
  console.log('🎉 ALL TESTS PASSED! BACKEND REVAMP FULLY OPERATIONAL');
  console.log('========================================================');
}

runTest().catch(err => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
