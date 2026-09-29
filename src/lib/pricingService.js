// ==========================================================================
// CHRIS SHOPPER — DYNAMIC REAL-TIME PRICING SERVICE (APPWRITE CLOUD)
// Manages live pricing for SMS carrier services and account log products.
// ==========================================================================

import { APPWRITE_CONFIG, client, databases, Query, ID } from './appwrite';

export const DEFAULT_PRODUCT_PRICING = [
  // Carrier SMS Services
  { product_id: 'telegram', name: 'Telegram', category: 'messaging', product_type: 'sms_service', price_usd: 0.18, is_active: true, carrier_speed: '< 3.2s' },
  { product_id: 'whatsapp', name: 'WhatsApp', category: 'messaging', product_type: 'sms_service', price_usd: 0.20, is_active: true, carrier_speed: '< 4.1s' },
  { product_id: 'openai', name: 'OpenAI / ChatGPT', category: 'ai', product_type: 'sms_service', price_usd: 0.25, is_active: false, carrier_speed: 'Coming Soon' },
  { product_id: 'google', name: 'Google & Gmail', category: 'email', product_type: 'sms_service', price_usd: 0.22, is_active: false, carrier_speed: 'Coming Soon' },

  // Account Log Categories
  { product_id: 'facebook', name: 'Facebook Accounts', category: 'social_logs', product_type: 'account_log', price_usd: 1.50, is_active: true, carrier_speed: 'Instant Delivery' },
  { product_id: 'tiktok', name: 'TikTok Accounts', category: 'social_logs', product_type: 'account_log', price_usd: 2.20, is_active: true, carrier_speed: 'Instant Delivery' },
  { product_id: 'instagram', name: 'Instagram Accounts', category: 'social_logs', product_type: 'account_log', price_usd: 1.80, is_active: true, carrier_speed: 'Instant Delivery' },
  { product_id: 'twitter', name: 'Twitter / X Accounts', category: 'social_logs', product_type: 'account_log', price_usd: 2.00, is_active: true, carrier_speed: 'Instant Delivery' },
  { product_id: 'textplus', name: 'Textplus Accounts', category: 'carrier_logs', product_type: 'account_log', price_usd: 1.20, is_active: true, carrier_speed: 'Instant Delivery' },
];

/**
 * Fetch live pricing catalog from Appwrite Cloud DB
 */
export async function fetchLivePricing() {
  try {
    const res = await databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.collections.products_pricing,
      [Query.limit(100)]
    );

    if (res.documents.length === 0) {
      // Initialize default products if collection is fresh
      return await seedDefaultPricing();
    }

    return res.documents.map(d => ({
      $id: d.$id,
      product_id: d.product_id,
      name: d.name,
      category: d.category,
      product_type: d.product_type,
      price_usd: Number(d.price_usd),
      is_active: d.is_active,
      carrier_speed: d.carrier_speed
    }));
  } catch (err) {
    console.warn('Appwrite pricing read fallback to defaults:', err.message);
    return DEFAULT_PRODUCT_PRICING;
  }
}

/**
 * Seeds default products into products_pricing collection if empty
 */
async function seedDefaultPricing() {
  const seeded = [];
  for (const item of DEFAULT_PRODUCT_PRICING) {
    try {
      const doc = await databases.createDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.products_pricing,
        ID.unique(),
        item
      );
      seeded.push({ ...item, $id: doc.$id });
    } catch {
      seeded.push(item);
    }
  }
  return seeded;
}

/**
 * Update product price or status in Appwrite
 */
export async function adminUpdateProductPrice(docIdOrProductId, updates) {
  try {
    // Check if passed string is a document ID
    let targetDocId = docIdOrProductId;
    
    // If passed a product_id (e.g. 'facebook'), look up document
    if (!targetDocId.startsWith('6') || targetDocId.length < 15) {
      const query = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.products_pricing,
        [Query.equal('product_id', docIdOrProductId), Query.limit(1)]
      );
      if (query.documents[0]) {
        targetDocId = query.documents[0].$id;
      }
    }

    const payload = {};
    if (updates.price_usd !== undefined) payload.price_usd = Number(updates.price_usd);
    if (updates.is_active !== undefined) payload.is_active = Boolean(updates.is_active);
    if (updates.carrier_speed !== undefined) payload.carrier_speed = updates.carrier_speed;

    const updated = await databases.updateDocument(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.collections.products_pricing,
      targetDocId,
      payload
    );

    return { success: true, updated };
  } catch (err) {
    console.error('Error updating product price in Appwrite:', err);
    throw err;
  }
}

/**
 * Subscribe to real-time price updates across the site
 */
export function subscribeToPricingUpdates(callback) {
  try {
    const channel = `databases.${APPWRITE_CONFIG.databaseId}.collections.${APPWRITE_CONFIG.collections.products_pricing}.documents`;
    return client.subscribe(channel, async () => {
      try {
        const fresh = await fetchLivePricing();
        if (callback && Array.isArray(fresh)) {
          callback(fresh);
        }
      } catch (err) {
        console.warn('Failed to refresh pricing on subscription event:', err);
      }
    });
  } catch (err) {
    console.warn('Realtime subscription not supported in current environment:', err);
    return () => {};
  }
}
