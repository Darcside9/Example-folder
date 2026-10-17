// ==========================================================================
// CHRIS SHOPPER — DYNAMIC REAL-TIME PRICING SERVICE (APPWRITE CLOUD)
// Manages live pricing for SMS carrier services and account log products.
// ==========================================================================

import { APPWRITE_CONFIG, client, databases, Query, ID } from './appwrite';

export const DEFAULT_PRODUCT_PRICING = [
  // Carrier SMS Services (Prices in NGN)
  { product_id: 'apple', name: 'Apple / iCloud ID', category: 'tech', product_type: 'sms_service', price_usd: 500, is_active: true, carrier_speed: '< 4s' },
  { product_id: 'telegram', name: 'Telegram', category: 'messaging', product_type: 'sms_service', price_usd: 1500, is_active: true, carrier_speed: '< 3s' },
  { product_id: 'signal', name: 'Signal Private Messenger', category: 'messaging', product_type: 'sms_service', price_usd: 560, is_active: true, carrier_speed: '< 4s' },
  { product_id: 'whatsapp', name: 'WhatsApp / WA Business', category: 'messaging', product_type: 'sms_service', price_usd: 2700, is_active: true, carrier_speed: '< 3s' },
  { product_id: 'chatgpt', name: 'ChatGPT / OpenAI', category: 'tech', product_type: 'sms_service', price_usd: 760, is_active: true, carrier_speed: '< 4s' },
  { product_id: 'google', name: 'Google & Gmail', code: 'go', category: 'tech', product_type: 'sms_service', price_usd: 1020, is_active: true, carrier_speed: '< 4s' },
  { product_id: 'tiktok', name: 'TikTok / Douyin', category: 'social', product_type: 'sms_service', price_usd: 700, is_active: true, carrier_speed: '< 4s' },

  // Account Log Categories (Prices in NGN)
  { product_id: 'facebook', name: 'Facebook Accounts', category: 'social_logs', product_type: 'account_log', price_usd: 1500, is_active: true, carrier_speed: 'Instant Delivery' },
  { product_id: 'tiktok_logs', name: 'TikTok Accounts', category: 'social_logs', product_type: 'account_log', price_usd: 2200, is_active: true, carrier_speed: 'Instant Delivery' },
  { product_id: 'instagram', name: 'Instagram Accounts', category: 'social_logs', product_type: 'account_log', price_usd: 1800, is_active: true, carrier_speed: 'Instant Delivery' },
  { product_id: 'twitter', name: 'Twitter / X Accounts', category: 'social_logs', product_type: 'account_log', price_usd: 2000, is_active: true, carrier_speed: 'Instant Delivery' },
  { product_id: 'textplus', name: 'Textplus Accounts', category: 'carrier_logs', product_type: 'account_log', price_usd: 1200, is_active: true, carrier_speed: 'Instant Delivery' },
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

    // Cache dollar exchange rate if present in pricing collection
    const rateDoc = res.documents.find(d => d.product_id === 'usd_exchange_rate');
    if (rateDoc && !isNaN(Number(rateDoc.price_usd))) {
      try {
        localStorage.setItem('cs_usd_to_ngn_rate', String(rateDoc.price_usd));
      } catch {
        // Ignore
      }
    }

    // Filter out internal system settings so only actual products are returned
    return res.documents
      .filter(d => d.product_type !== 'system_setting')
      .map(d => ({
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
    let existingDoc = null;
    
    // If passed a product_id (e.g. 'ca_whatsapp'), look up document
    if (!targetDocId.startsWith('6') || targetDocId.length < 15) {
      const query = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.products_pricing,
        [Query.equal('product_id', docIdOrProductId), Query.limit(1)]
      );
      if (query.documents[0]) {
        targetDocId = query.documents[0].$id;
        existingDoc = query.documents[0];
      }
    }

    const payload = {};
    if (updates.price_usd !== undefined) payload.price_usd = Number(updates.price_usd);
    if (updates.is_active !== undefined) payload.is_active = Boolean(updates.is_active);
    if (updates.carrier_speed !== undefined) payload.carrier_speed = updates.carrier_speed;

    if (existingDoc || (targetDocId.startsWith('6') && targetDocId.length >= 15)) {
      const updated = await databases.updateDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.products_pricing,
        targetDocId,
        payload
      );
      return { success: true, updated };
    } else {
      // Create new document in products_pricing if not present yet
      const created = await databases.createDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.products_pricing,
        ID.unique(),
        {
          product_id: docIdOrProductId,
          name: updates.name || docIdOrProductId,
          category: updates.category || 'messaging',
          product_type: updates.product_type || 'sms_service',
          price_usd: Number(updates.price_usd || 1000),
          is_active: updates.is_active !== undefined ? Boolean(updates.is_active) : true,
          carrier_speed: updates.carrier_speed || '< 3s'
        }
      );
      return { success: true, updated: created };
    }
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
