// ==========================================================================
// CHRIS SHOPPER — ADMIN INVENTORY & LOGS DATABASE SERVICE
// Manages deep database inspection of uploaded account logs across all
// platforms, status breakdown (available vs sold), and single/bulk deletion.
// ==========================================================================

import { APPWRITE_CONFIG, functions, databases, Query } from './appwrite';
import { fetchDynamicPlatforms } from './platformsService';
import { PLATFORM_CATEGORIES } from '../data/sampleLogsData';

/**
 * Helper to resolve collection ID for a given platformId
 */
export async function resolvePlatformCollectionId(platformId) {
  if (!platformId || platformId === 'all') return null;

  // 1. Static config mapping
  if (APPWRITE_CONFIG.collections && APPWRITE_CONFIG.collections[platformId]) {
    return APPWRITE_CONFIG.collections[platformId];
  }

  // 2. Dynamic platforms catalog
  try {
    const platforms = await fetchDynamicPlatforms();
    const match = platforms.find(p => p.id === platformId);
    if (match && match.collectionId) {
      return match.collectionId;
    }
  } catch (err) {
    console.warn(`[InventoryService] Error resolving collection for ${platformId}:`, err.message);
  }

  return null;
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
 * Fetch logs for an admin database view.
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

  for (const plat of targets) {
    const colId = plat.collectionId || APPWRITE_CONFIG.collections[plat.id];
    if (!colId) continue;

    let platDocs = [];

    // 1. Attempt Serverless Function 'log-dispenser' execution
    try {
      const execution = await functions.createExecution(
        APPWRITE_CONFIG.functionId,
        JSON.stringify({
          action: 'admin_list_platform_logs',
          platformId: plat.id,
          status,
          subTypeId,
          limit,
          offset
        }),
        false
      );

      if (execution && execution.responseBody) {
        const parsed = JSON.parse(execution.responseBody);
        if (parsed.success && Array.isArray(parsed.documents)) {
          platDocs = parsed.documents;
        }
      }
    } catch (funcErr) {
      // 2. Direct Database Fallback query
      try {
        const queries = [Query.limit(limit), Query.orderDesc('$createdAt')];
        if (status && status !== 'all') {
          queries.push(Query.equal('status', status));
        }
        if (subTypeId) {
          queries.push(Query.equal('sub_type_id', subTypeId));
        }
        const direct = await databases.listDocuments(APPWRITE_CONFIG.databaseId, colId, queries);
        platDocs = direct.documents || [];
      } catch (dbErr) {
        console.warn(`[InventoryService] Query error for ${plat.name} (${colId}):`, dbErr.message);
      }
    }

    // Format & normalize documents
    platDocs.forEach(d => {
      let customDataObj = null;
      if (d.custom_data) {
        try {
          customDataObj = typeof d.custom_data === 'string' ? JSON.parse(d.custom_data) : d.custom_data;
        } catch {}
      }

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
        createdAt: d.$createdAt,
        updatedAt: d.$updatedAt
      });
    });
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
 * Delete a single log from Appwrite database
 */
export async function adminDeleteLog({ platformId, collectionId, documentId }) {
  if (!documentId) throw new Error('Document ID is required for deletion.');

  const colId = collectionId || (platformId ? await resolvePlatformCollectionId(platformId) : null);
  if (!colId) throw new Error(`Could not resolve collection for deletion.`);

  // 1. Try serverless function
  try {
    const execution = await functions.createExecution(
      APPWRITE_CONFIG.functionId,
      JSON.stringify({
        action: 'admin_delete_log',
        platformId,
        collectionId: colId,
        documentId
      }),
      false
    );

    if (execution && execution.responseBody) {
      const parsed = JSON.parse(execution.responseBody);
      if (parsed.success) {
        window.dispatchEvent(new CustomEvent('inventory-updated', { detail: { platformId, documentId } }));
        return { success: true, deletedDocId: documentId };
      } else if (parsed.error) {
        throw new Error(parsed.error);
      }
    }
  } catch (fnErr) {
    console.warn('[InventoryService] Serverless delete notice, trying direct fallback:', fnErr.message);
  }

  // 2. Direct fallback
  await databases.deleteDocument(APPWRITE_CONFIG.databaseId, colId, documentId);
  window.dispatchEvent(new CustomEvent('inventory-updated', { detail: { platformId, documentId } }));
  return { success: true, deletedDocId: documentId };
}

/**
 * Delete multiple logs in bulk from Appwrite database
 */
export async function adminBulkDeleteLogs({ platformId, collectionId, documentIds = [] }) {
  if (!Array.isArray(documentIds) || documentIds.length === 0) {
    throw new Error('No document IDs provided for bulk deletion.');
  }

  const colId = collectionId || (platformId ? await resolvePlatformCollectionId(platformId) : null);
  if (!colId) throw new Error(`Could not resolve collection for bulk deletion.`);

  // 1. Try serverless function
  try {
    const execution = await functions.createExecution(
      APPWRITE_CONFIG.functionId,
      JSON.stringify({
        action: 'admin_bulk_delete_logs',
        platformId,
        collectionId: colId,
        documentIds
      }),
      false
    );

    if (execution && execution.responseBody) {
      const parsed = JSON.parse(execution.responseBody);
      if (parsed.success) {
        window.dispatchEvent(new CustomEvent('inventory-updated', { detail: { platformId, count: parsed.deletedCount } }));
        return parsed;
      } else if (parsed.error) {
        throw new Error(parsed.error);
      }
    }
  } catch (fnErr) {
    console.warn('[InventoryService] Serverless bulk delete notice, trying direct fallback:', fnErr.message);
  }

  // 2. Direct fallback
  let deletedCount = 0;
  let failedCount = 0;
  const errors = [];

  for (const docId of documentIds) {
    try {
      await databases.deleteDocument(APPWRITE_CONFIG.databaseId, colId, docId);
      deletedCount++;
    } catch (delErr) {
      failedCount++;
      errors.push({ id: docId, error: delErr.message });
    }
  }

  window.dispatchEvent(new CustomEvent('inventory-updated', { detail: { platformId, count: deletedCount } }));
  return {
    success: deletedCount > 0,
    deletedCount,
    failedCount,
    errors
  };
}
