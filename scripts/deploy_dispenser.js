import { Client, Functions } from 'node-appwrite';
import { InputFile } from 'node-appwrite/file';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

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

async function deploy() {
  const functionId = 'log-dispenser';
  const name = 'Log Dispenser';
  const runtime = 'node-18.0';

  console.log(`Checking if function "${functionId}" exists...`);
  let fn = null;
  try {
    fn = await functions.get(functionId);
    console.log(`Function already exists: ${fn.$id}`);
  } catch (err) {
    if (err.code === 404 || err.type === 'function_not_found') {
      console.log(`Creating function "${functionId}"...`);
      fn = await functions.create(
        functionId,
        name,
        runtime,
        ['any'], // Execute permissions
        [], // Events
        '', // Schedule
        60, // Timeout (seconds)
        true, // Enabled
        true // Logging
      );
      console.log(`Function created: ${fn.$id}`);
    } else {
      console.log(`Function check returned: ${err.message} (${err.code}), fetching directly...`);
      try {
        fn = await functions.get(functionId);
      } catch (e2) {
        console.error('Failed to get function:', e2);
        throw err;
      }
    }
  }

  // Set environment variables on the function
  console.log('Configuring function environment variables...');
  const varsToSet = {
    APPWRITE_DATABASE_ID: env.VITE_APPWRITE_DATABASE_ID,
    APPWRITE_API_KEY: env.APPWRITE_API_KEY,
    APPWRITE_ENDPOINT: env.VITE_APPWRITE_ENDPOINT,
    APPWRITE_PROJECT_ID: env.VITE_APPWRITE_PROJECT_ID
  };

  for (const [key, value] of Object.entries(varsToSet)) {
    try {
      await functions.createVariable(functionId, key, value);
      console.log(`Created variable ${key}`);
    } catch (err) {
      if (err.code === 409) {
        // Variable already exists, update it
        try {
          // List variables to get variable ID
          const vars = await functions.listVariables(functionId);
          const existing = vars.variables.find(v => v.key === key);
          if (existing) {
            await functions.updateVariable(functionId, existing.$id, key, value);
            console.log(`Updated variable ${key}`);
          }
        } catch (uErr) {
          console.log(`Variable ${key} update error:`, uErr.message);
        }
      } else {
        console.log(`Variable ${key} notice:`, err.message);
      }
    }
  }

  // Create tar.gz archive of functions/log-dispenser
  const archivePath = path.resolve('code.tar.gz');
  if (fs.existsSync(archivePath)) {
    fs.unlinkSync(archivePath);
  }

  console.log('Archiving function code into code.tar.gz...');
  // Use bsdtar to create code.tar.gz with package.json and src/main.js
  const fnDir = path.resolve('functions/log-dispenser');
  execSync(`tar -czf "${archivePath}" -C "${fnDir}" package.json src`, { stdio: 'inherit' });
  console.log(`Archive created: ${fs.statSync(archivePath).size} bytes`);

  // Upload deployment
  console.log('Uploading and creating deployment on Appwrite Cloud...');
  const deployment = await functions.createDeployment(
    functionId,
    InputFile.fromPath(archivePath, 'code.tar.gz'),
    true, // activate immediately
    'src/main.js',
    'npm install'
  );

  console.log(`Deployment created: ${deployment.$id}, status: ${deployment.status}`);
  console.log('Waiting for build to complete...');

  let status = deployment.status;
  let attempts = 0;
  while (status === 'processing' || status === 'building' || status === 'waiting') {
    await new Promise(r => setTimeout(r, 3000));
    attempts++;
    const current = await functions.getDeployment(functionId, deployment.$id);
    status = current.status;
    console.log(`[Attempt ${attempts}] Deployment status: ${status}`);
    if (status === 'ready' || status === 'failed') break;
    if (attempts > 30) break;
  }

  if (status === 'ready') {
    console.log('🎉 Function deployment is READY and active!');
  } else {
    console.warn(`Deployment ended with status: ${status}`);
    const dep = await functions.getDeployment(functionId, deployment.$id);
    if (dep.buildStderr) console.error('Build Stderr:', dep.buildStderr);
    if (dep.buildStdout) console.log('Build Stdout:', dep.buildStdout);
  }

  // Clean up archive
  if (fs.existsSync(archivePath)) {
    fs.unlinkSync(archivePath);
  }
}

deploy().catch(err => {
  console.error('Deployment fatal error:', err);
});
