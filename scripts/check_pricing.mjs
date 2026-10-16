import { Client, Databases } from 'node-appwrite';

const client = new Client()
  .setEndpoint('https://fra.cloud.appwrite.io/v1')
  .setProject('6ab96624002e549083d1')
  .setKey('standard_f5cd1710403af68b3d1fccabc7ae10e6c0980d52a87decc8c84004a006e4b1f8ee05033a3c9852d4c25c806dd74b6099827bbecef25ebbb0beeddd706a38ec1e4b9ac2a81f6afd75d07846ee975b440ee6374e5e7f40feaa030a59cb409a60c885e304ca0e289d8bb1af394b99f49b171d77ebacb48d31ae7dd4672da772d1ad');

const db = new Databases(client);

async function run() {
  const res = await db.listDocuments('6ab96f3c0031c3231183', 'products_pricing');
  console.log('Total documents:', res.total);
  for (const d of res.documents) {
    console.log(`- ${d.name} (${d.product_id}): price_usd=${d.price_usd}, is_active=${d.is_active}, type=${d.product_type}`);
  }
}

run().catch(console.error);
