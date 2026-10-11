import { Client, Databases, Permission, Role } from 'node-appwrite';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const idx = trimmed.indexOf('=');
    if (idx > 0) {
      env[trimmed.substring(0, idx).trim()] = trimmed.substring(idx + 1).trim();
    }
  }
});

const client = new Client()
  .setEndpoint(env.VITE_APPWRITE_ENDPOINT)
  .setProject(env.VITE_APPWRITE_PROJECT_ID)
  .setKey(env.APPWRITE_API_KEY);

const databases = new Databases(client);
const DATABASE_ID = env.VITE_APPWRITE_DATABASE_ID;
const COLLECTION_ID = 'system_heartbeat';

async function setup() {
  console.log(`Setting up collection "${COLLECTION_ID}" in database "${DATABASE_ID}"...`);
  
  let exists = false;
  try {
    const col = await databases.getCollection(DATABASE_ID, COLLECTION_ID);
    console.log(`Collection "${COLLECTION_ID}" already exists (Name: ${col.name}).`);
    exists = true;
  } catch (err) {
    if (err.code === 404 || err.type === 'collection_not_found') {
      console.log(`Creating collection "${COLLECTION_ID}"...`);
      await databases.createCollection(
        DATABASE_ID,
        COLLECTION_ID,
        'System Heartbeat',
        [
          Permission.read(Role.any()),
          Permission.create(Role.any()),
          Permission.update(Role.any())
        ]
      );
      console.log(`Collection "${COLLECTION_ID}" created successfully!`);
      exists = true;
    } else {
      console.error('Error checking collection:', err);
      throw err;
    }
  }

  // Ensure attributes exist
  const attributesToCreate = [
    { key: 'last_ping', type: 'string', size: 64, required: false },
    { key: 'ping_count', type: 'integer', required: false, min: 0, max: 2147483647, default: 0 },
    { key: 'source', type: 'string', size: 64, required: false },
    { key: 'status', type: 'string', size: 32, required: false },
    { key: 'metadata', type: 'string', size: 500, required: false }
  ];

  for (const attr of attributesToCreate) {
    try {
      if (attr.type === 'string') {
        await databases.createStringAttribute(
          DATABASE_ID,
          COLLECTION_ID,
          attr.key,
          attr.size,
          attr.required
        );
        console.log(`Created string attribute: ${attr.key}`);
      } else if (attr.type === 'integer') {
        await databases.createIntegerAttribute(
          DATABASE_ID,
          COLLECTION_ID,
          attr.key,
          attr.required,
          attr.min,
          attr.max,
          attr.default
        );
        console.log(`Created integer attribute: ${attr.key}`);
      }
    } catch (attrErr) {
      if (attrErr.code === 409 || attrErr.type === 'attribute_already_exists') {
        console.log(`Attribute "${attr.key}" already exists.`);
      } else {
        console.warn(`Attribute "${attr.key}" notice: ${attrErr.message}`);
      }
    }
  }

  // Wait a few seconds for attributes to be ready (Appwrite creates attributes asynchronously)
  console.log('Waiting for attributes to reach available state...');
  await new Promise(r => setTimeout(r, 3000));

  // Initialize seed document if it doesn't exist
  const DOC_ID = 'appwrite_keepalive_heartbeat';
  try {
    const doc = await databases.getDocument(DATABASE_ID, COLLECTION_ID, DOC_ID);
    console.log(`Heartbeat document "${DOC_ID}" already exists:`, doc);
  } catch (dErr) {
    if (dErr.code === 404 || dErr.type === 'document_not_found') {
      console.log(`Creating initial heartbeat document "${DOC_ID}"...`);
      const newDoc = await databases.createDocument(
        DATABASE_ID,
        COLLECTION_ID,
        DOC_ID,
        {
          last_ping: new Date().toISOString(),
          ping_count: 1,
          source: 'initial_setup',
          status: 'healthy',
          metadata: JSON.stringify({ initializedAt: new Date().toISOString() })
        }
      );
      console.log(`Initial heartbeat document created successfully!`, newDoc);
    } else {
      console.warn('Document check notice:', dErr.message);
    }
  }

  console.log('Setup finished successfully!');
}

setup().catch(err => {
  console.error('Setup failed:', err);
});
