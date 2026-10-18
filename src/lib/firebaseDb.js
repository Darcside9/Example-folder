// ==========================================================================
// CHRIS SHOPPER — FIREBASE FIRESTORE DATA ACCESS LAYER
// High-availability database service (Zero-Pause Cloud Integration)
// ==========================================================================

import { 
  db, 
  FIREBASE_COLLECTIONS,
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp 
} from './firebase';

/**
 * Fetch live pricing catalog from Firebase Firestore
 */
export async function firebaseFetchPricing() {
  if (!db) {
    throw new Error('Firestore is not initialized.');
  }

  const colRef = collection(db, FIREBASE_COLLECTIONS.products_pricing);
  const snap = await getDocs(colRef);

  if (snap.empty) {
    return [];
  }

  const docs = snap.docs.map(d => ({
    $id: d.id,
    ...d.data()
  }));

  // Sync exchange rate if present
  const rateDoc = docs.find(d => d.product_id === 'usd_exchange_rate');
  if (rateDoc && !isNaN(Number(rateDoc.price_usd))) {
    try {
      localStorage.setItem('cs_usd_to_ngn_rate', String(rateDoc.price_usd));
    } catch {
      // Ignore
    }
  }

  return docs
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
}

/**
 * Update product pricing in Firestore
 */
export async function firebaseUpdatePricing(productId, newPriceNgn) {
  if (!db) return false;

  const docRef = doc(db, FIREBASE_COLLECTIONS.products_pricing, productId);
  await setDoc(docRef, {
    product_id: productId,
    price_usd: Number(newPriceNgn),
    updated_at: serverTimestamp()
  }, { merge: true });

  return true;
}

/**
 * Record a new order in Firestore
 */
export async function firebaseSaveOrder(orderData) {
  if (!db) return 'ord-' + Date.now();

  const colRef = collection(db, FIREBASE_COLLECTIONS.orders);
  const docRef = await addDoc(colRef, {
    ...orderData,
    created_at: serverTimestamp()
  });

  return docRef.id;
}

/**
 * Update user balance in Firestore user_profiles
 */
export async function firebaseUpdateUserBalance(userId, newBalance) {
  if (!db || !userId) return false;

  const docRef = doc(db, FIREBASE_COLLECTIONS.user_profiles, userId);
  await setDoc(docRef, {
    balance: Number(newBalance),
    updated_at: serverTimestamp()
  }, { merge: true });

  return true;
}

/**
 * Fetch user order history from Firestore
 */
export async function firebaseGetUserOrders(userId) {
  if (!db || !userId) return [];

  const colRef = collection(db, FIREBASE_COLLECTIONS.orders);
  const q = query(
    colRef,
    where('user_id', '==', userId),
    orderBy('created_at', 'desc'),
    limit(50)
  );

  const snap = await getDocs(q);
  return snap.docs.map(d => ({
    $id: d.id,
    ...d.data()
  }));
}

/**
 * 1-Click Migration / Sync from Appwrite Cloud DB to Google Firebase Firestore
 */
export async function syncAppwriteToFirebase() {
  if (!db) {
    throw new Error('Firebase Firestore is not initialized.');
  }

  // Import appwrite on-demand to avoid circular dependencies
  const { databases, APPWRITE_CONFIG, Query } = await import('./appwrite');

  const results = {
    pricingCount: 0,
    errors: []
  };

  try {
    // 1. Fetch all documents from Appwrite products_pricing
    const res = await databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.collections.products_pricing,
      [Query.limit(100)]
    );

    for (const docItem of res.documents) {
      try {
        const docId = docItem.product_id || docItem.$id;
        const targetRef = doc(db, FIREBASE_COLLECTIONS.products_pricing, docId);
        await setDoc(targetRef, {
          product_id: docItem.product_id,
          name: docItem.name,
          category: docItem.category,
          product_type: docItem.product_type,
          price_usd: Number(docItem.price_usd),
          is_active: docItem.is_active !== false,
          carrier_speed: docItem.carrier_speed || '< 4s',
          synced_from_appwrite_at: serverTimestamp()
        }, { merge: true });
        results.pricingCount++;
      } catch (itemErr) {
        results.errors.push(`Error syncing ${docItem.product_id}: ${itemErr.message}`);
      }
    }
  } catch (err) {
    throw new Error(`Failed to read from Appwrite: ${err.message}`);
  }

  return results;
}

