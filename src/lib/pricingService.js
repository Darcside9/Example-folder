// ==========================================================================
// CHRIS SHOPPER — DYNAMIC REAL-TIME PRICING SERVICE (GOOGLE FIREBASE FIRESTORE)
// Manages live pricing for SMS carrier services and account log products.
// High-availability, zero-pause cloud infrastructure.
// ==========================================================================

import { db, collection, doc, setDoc, onSnapshot } from './firebase';
import { firebaseFetchPricing, firebaseUpdatePricing } from './firebaseDb';

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
 * Fetch live pricing catalog from Google Firebase Firestore
 */
export async function fetchLivePricing() {
  try {
    const docs = await firebaseFetchPricing();
    if (Array.isArray(docs) && docs.length > 0) {
      return docs;
    }
    return DEFAULT_PRODUCT_PRICING;
  } catch (err) {
    console.warn('Firebase pricing fetch note, using defaults:', err.message);
    return DEFAULT_PRODUCT_PRICING;
  }
}

/**
 * Update product price or status in Firebase Firestore
 */
export async function adminUpdateProductPrice(docIdOrProductId, updates) {
  try {
    const productId = docIdOrProductId;
    const priceUsd = Number(updates.price_usd !== undefined ? updates.price_usd : 1000);

    if (db) {
      const docRef = doc(db, 'products_pricing', productId);
      await setDoc(docRef, {
        product_id: productId,
        name: updates.name || productId,
        category: updates.category || 'messaging',
        product_type: updates.product_type || 'sms_service',
        price_usd: priceUsd,
        is_active: updates.is_active !== undefined ? Boolean(updates.is_active) : true,
        carrier_speed: updates.carrier_speed || '< 3s',
        updated_at: new Date().toISOString()
      }, { merge: true });
    }

    return { 
      success: true, 
      updated: {
        product_id: productId,
        price_usd: priceUsd
      } 
    };
  } catch (err) {
    console.error('Error updating product price in Firestore:', err);
    throw err;
  }
}

/**
 * Subscribe to real-time price updates across the site using Firestore snapshot listener
 */
export function subscribeToPricingUpdates(callback) {
  if (!db) return () => {};

  try {
    const colRef = collection(db, 'products_pricing');
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      try {
        const fresh = snapshot.docs
          .map(d => ({ $id: d.id, ...d.data() }))
          .filter(d => d.product_type !== 'system_setting')
          .map(d => ({
            $id: d.$id,
            product_id: d.product_id,
            name: d.name,
            category: d.category,
            product_type: d.product_type,
            price_usd: Number(d.price_usd),
            is_active: d.is_active !== false,
            carrier_speed: d.carrier_speed || '< 4s'
          }));

        if (callback && Array.isArray(fresh)) {
          callback(fresh);
        }
      } catch (err) {
        console.warn('Failed to parse pricing update on snapshot:', err);
      }
    }, (error) => {
      console.warn('Firestore pricing snapshot error:', error.message);
    });

    return unsubscribe;
  } catch (err) {
    console.warn('Realtime subscription not supported:', err);
    return () => {};
  }
}
