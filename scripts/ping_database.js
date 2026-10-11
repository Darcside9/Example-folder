// ============================================================================
// CHRIS SHOPPER — APPWRITE DATABASE DAILY KEEP-ALIVE PING
// Standalone script for GitHub Actions, cron jobs, and external pinging
// Prevents Appwrite Cloud from pausing the project database due to inactivity
// ============================================================================

import { Client, Databases, Functions } from 'node-appwrite';
import fs from 'fs';
import path from 'path';

// Load local .env if present (e.g. running locally or on server)
if (fs.existsSync('.env')) {
  const envContent = fs.readFileSync('.env', 'utf8');
  envContent.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx > 0) {
        const k = trimmed.substring(0, idx).trim();
        const v = trimmed.substring(idx + 1).trim();
        if (!process.env[k]) {
          process.env[k] = v;
        }
      }
    }
  });
}

const ENDPOINT = process.env.VITE_APPWRITE_ENDPOINT || process.env.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
const PROJECT_ID = process.env.VITE_APPWRITE_PROJECT_ID || process.env.APPWRITE_PROJECT_ID || '6ab96624002e549083d1';
const DATABASE_ID = process.env.VITE_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID || '6ab96f3c0031c3231183';
const API_KEY = process.env.APPWRITE_API_KEY || 'standard_f5cd1710403af68b3d1fccabc7ae10e6c0980d52a87decc8c84004a006e4b1f8ee05033a3c9852d4c25c806dd74b6099827bbecef25ebbb0beeddd706a38ec1e4b9ac2a81f6afd75d07846ee975b440ee6374e5e7f40feaa030a59cb409a60c885e304ca0e289d8bb1af394b99f49b171d77ebacb48d31ae7dd4672da772d1ad';
const FUNCTION_ID = 'log-dispenser';
const COLLECTION_ID = 'system_heartbeat';
const DOC_ID = 'appwrite_keepalive_heartbeat';

const source = process.env.GITHUB_ACTIONS ? 'github_actions' : (process.argv[2] || 'external_ping_script');
const timestamp = new Date().toISOString();

console.log(`[Keep-Alive] 🚀 Starting Appwrite Database Keep-Alive Ping at ${timestamp}`);
console.log(`[Keep-Alive] 🎯 Endpoint: ${ENDPOINT}`);
console.log(`[Keep-Alive] 📦 Project ID: ${PROJECT_ID}`);
console.log(`[Keep-Alive] 🗄️ Database ID: ${DATABASE_ID}`);
console.log(`[Keep-Alive] 📡 Source: ${source}`);

async function ping() {
  const client = new Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID);

  if (API_KEY) {
    client.setKey(API_KEY);
  }

  const databases = new Databases(client);
  const functions = new Functions(client);

  let dbSuccess = false;
  let fnSuccess = false;

  // 1. DIRECT DATABASE MUTATION (Guarantees actual data write and read in Appwrite Cloud DB)
  try {
    console.log(`[Keep-Alive] Reading document "${DOC_ID}" from collection "${COLLECTION_ID}"...`);
    let doc = null;
    try {
      doc = await databases.getDocument(DATABASE_ID, COLLECTION_ID, DOC_ID);
    } catch (gErr) {
      if (gErr.code !== 404 && gErr.type !== 'document_not_found') {
        throw gErr;
      }
    }

    const nextCount = doc ? (Number(doc.ping_count || 0) + 1) : 1;
    const payload = {
      last_ping: timestamp,
      ping_count: nextCount,
      source: source,
      status: 'healthy',
      metadata: JSON.stringify({
        pingAt: timestamp,
        runner: process.env.RUNNER_OS || process.platform,
        source: source
      })
    };

    if (doc) {
      await databases.updateDocument(DATABASE_ID, COLLECTION_ID, DOC_ID, payload);
    } else {
      await databases.createDocument(DATABASE_ID, COLLECTION_ID, DOC_ID, payload);
    }

    console.log(`[Keep-Alive] ✅ Database heartbeat record updated! New Ping Count: ${nextCount}`);
    dbSuccess = true;
  } catch (dbErr) {
    console.warn(`[Keep-Alive] ⚠️ Direct database update note: ${dbErr.message}`);
  }

  // 2. SERVERLESS FUNCTION EXECUTION (Generates serverless execution activity)
  try {
    console.log(`[Keep-Alive] Executing serverless function "${FUNCTION_ID}" with action: "keep_alive"...`);
    const execution = await functions.createExecution(
      FUNCTION_ID,
      JSON.stringify({ action: 'keep_alive', source: source }),
      false // synchronous execution
    );

    console.log(`[Keep-Alive] Function response code: ${execution.responseStatusCode}, status: ${execution.status}`);
    if (execution.responseBody) {
      console.log(`[Keep-Alive] Response body: ${execution.responseBody}`);
    }
    if (execution.status === 'completed' || execution.responseStatusCode === 200) {
      fnSuccess = true;
    }
  } catch (fnErr) {
    console.warn(`[Keep-Alive] ⚠️ Function execution note: ${fnErr.message}`);
  }

  if (dbSuccess || fnSuccess) {
    console.log(`[Keep-Alive] 🎉 SUCCESS! Database keep-alive ping completed at ${new Date().toISOString()}`);
    process.exit(0);
  } else {
    console.error(`[Keep-Alive] ❌ Both database write and function ping failed!`);
    process.exit(1);
  }
}

ping().catch(err => {
  console.error('[Keep-Alive] ❌ Fatal ping error:', err);
  process.exit(1);
});
