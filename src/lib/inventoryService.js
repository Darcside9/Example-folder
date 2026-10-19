// ==========================================================================
// CHRIS SHOPPER — ADMIN INVENTORY & LOGS DATABASE SERVICE
// Manages deep database inspection of uploaded account logs across all
// platforms in Google Firebase Firestore, status breakdown (available vs sold),
// and single/bulk deletion.
// ==========================================================================

import { 
  db, 
  FIREBASE_COLLECTIONS,
  collection, 
  doc, 
  getDocs, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit as firestoreLimit,
  writeBatch 
} from './firebase';
import { fetchDynamicPlatforms } from './platformsService';
import { PLATFORM_CATEGORIES } from '../data/sampleLogsData';

/**
 * Helper to resolve collection name for a given platformId
 */
export async function resolvePlatformCollectionId(platformId) {
  if (!platformId || platformId === 'all') return null;
  return platformId;
}

/**
 * Fetch all platform catalog definitions
 */
export async function getAllPlatformMeta() {
  try {
    const list = await fetchDynamicPlatforms();
    if (list && list.length > 0) return list;
  } catch {}
  return PLATFORM_CATEGORIES;
}

/**
 * Fetch logs for an admin database view from Google Firebase Firestore.
 * Supports filtering by platform, status ('all' | 'available' | 'sold'), package/subTypeId, and search query.
 */
export async function adminFetchPlatformLogs({
  platformId = 'all',
  status = 'all',
  subTypeId = '',
  searchQuery = '',
  limit = 200,
  offset = 0
} = {}) {
  const allPlatforms = await getAllPlatformMeta();

  // If "all" platforms selected, query across every known platform
  const targets = (platformId && platformId !== 'all')
    ? allPlatforms.filter(p => p.id === platformId)
    : allPlatforms;

  const aggregatedLogs = [];

  if (db) {
    for (const plat of targets) {
      const colId = plat.collectionId || plat.id;
      if (!colId) continue;

      let platDocs = [];

      try {
        const colRef = collection(db, colId);
        let q = query(colRef, firestoreLimit(limit));

        if (status && status !== 'all') {
          q = query(colRef, where('status', '==', status), firestoreLimit(limit));
        }

        const snap = await getDocs(q);
        platDocs = snap.docs.map(d => ({ $id: d.id, ...d.data() }));

        if (subTypeId) {
          platDocs = platDocs.filter(d => d.sub_type_id === subTypeId);
        }
      } catch (dbErr) {
        // Collection might not exist yet if no logs were uploaded
      }

      // Format & normalize documents
      platDocs.forEach(d => {
        let customDataObj = null;
        if (d.custom_data) {
          try {
            customDataObj = typeof d.custom_data === 'string' ? JSON.parse(d.custom_data) : d.custom_data;
          } catch {}
        }

        const createdAtStr = d.created_at?.toDate ? d.created_at.toDate().toISOString() : (d.created_at || new Date().toISOString());
        const updatedAtStr = d.updated_at?.toDate ? d.updated_at.toDate().toISOString() : (d.updated_at || createdAtStr);

        aggregatedLogs.push({
          id: d.$id,
          collectionId: colId,
          platformId: plat.id,
          platformName: plat.name,
          platformIcon: plat.icon || plat.id,
          subTypeId: d.sub_type_id || '',
          subTypeTitle: d.sub_type_title || plat.name,
          username: d.username || 'N/A',
          password: d.password || '',
          twoFactorKey: d.two_factor_key || '',
          mail: d.mail || '',
          mailPassword: d.mail_password || '',
          price: Number(d.price !== undefined ? d.price : (plat.demoPrice || 1500)),
          status: d.status || 'available',
          soldToEmail: d.sold_to_email || '',
          soldToUserId: d.sold_to_user_id || '',
          soldAt: d.sold_at || null,
          rawRecord: d.raw_record || '',
          customData: customDataObj,
          rulesNotes: d.rules_notes || '',
          createdAt: createdAtStr,
          updatedAt: updatedAtStr
        });
      });
    }
  }

  // Client-side search query filter (username, email, or purchaser email)
  let filtered = aggregatedLogs;
  if (searchQuery && searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(item => {
      return (
        item.username.toLowerCase().includes(q) ||
        (item.mail && item.mail.toLowerCase().includes(q)) ||
        (item.soldToEmail && item.soldToEmail.toLowerCase().includes(q)) ||
        (item.subTypeTitle && item.subTypeTitle.toLowerCase().includes(q)) ||
        (item.rawRecord && item.rawRecord.toLowerCase().includes(q))
      );
    });
  }

  return filtered;
}

/**
 * Delete a single log from Google Firebase Firestore
 */
export async function adminDeleteLog({ platformId, collectionId, documentId }) {
  if (!documentId) throw new Error('Document ID is required for deletion.');
  if (!db) throw new Error('Firestore is not initialized.');

  const colId = collectionId || platformId;
  if (!colId) throw new Error('Could not resolve collection for deletion.');

  try {
    const docRef = doc(db, colId, documentId);
    await deleteDoc(docRef);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('inventory-updated', { detail: { platformId, documentId } }));
    }
    return { success: true, deletedDocId: documentId };
  } catch (err) {
    console.error('Delete log error in Firebase:', err);
    throw err;
  }
}

/**
 * Delete multiple logs in bulk from Google Firebase Firestore
 */
export async function adminBulkDeleteLogs({ platformId, collectionId, documentIds = [] }) {
  if (!Array.isArray(documentIds) || documentIds.length === 0) {
    throw new Error('No document IDs provided for bulk deletion.');
  }
  if (!db) throw new Error('Firestore is not initialized.');

  const colId = collectionId || platformId;
  if (!colId) throw new Error('Could not resolve collection for bulk deletion.');

  let deletedCount = 0;
  let failedCount = 0;
  const errors = [];

  // Delete in batches of 100
  const batchSize = 100;
  for (let i = 0; i < documentIds.length; i += batchSize) {
    const chunk = documentIds.slice(i, i + batchSize);
    const batch = writeBatch(db);

    chunk.forEach(docId => {
      const docRef = doc(db, colId, docId);
      batch.delete(docRef);
    });

    try {
      await batch.commit();
      deletedCount += chunk.length;
    } catch (batchErr) {
      failedCount += chunk.length;
      errors.push({ batchIndex: i, error: batchErr.message });
    }
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('inventory-updated', { detail: { platformId, count: deletedCount } }));
  }

  return {
    success: deletedCount > 0,
    deletedCount,
    failedCount,
    errors
  };
}
