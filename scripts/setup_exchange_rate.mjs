import { Client, Databases, Query, ID } from 'node-appwrite';

const client = new Client()
  .setEndpoint('https://fra.cloud.appwrite.io/v1')
  .setProject('6ab96624002e549083d1')
  .setKey('standard_f5cd1710403af68b3d1fccabc7ae10e6c0980d52a87decc8c84004a006e4b1f8ee05033a3c9852d4c25c806dd74b6099827bbecef25ebbb0beeddd706a38ec1e4b9ac2a81f6afd75d07846ee975b440ee6374e5e7f40feaa030a59cb409a60c885e304ca0e289d8bb1af394b99f49b171d77ebacb48d31ae7dd4672da772d1ad');

const db = new Databases(client);
const DATABASE_ID = '6ab96f3c0031c3231183';
const COLLECTION_ID = 'products_pricing';

async function initExchangeRate() {
  const res = await db.listDocuments(DATABASE_ID, COLLECTION_ID, [
    Query.equal('product_id', 'usd_exchange_rate')
  ]);

  if (res.documents.length > 0) {
    const doc = res.documents[0];
    console.log(`Existing dollar rate document found (ID: ${doc.$id}): 1 USD = ₦${doc.price_usd}`);
  } else {
    console.log('Creating initial USD to NGN exchange rate document (default ₦1,600)...');
    const doc = await db.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), {
      product_id: 'usd_exchange_rate',
      name: 'USD to NGN Dollar Exchange Rate',
      product_type: 'system_setting',
      category: 'currency',
      price_usd: 1600,
      is_active: true,
      carrier_speed: 'site_wide'
    });
    console.log(`Created exchange rate document with ID: ${doc.$id}`);
  }
}

initExchangeRate().catch(console.error);
