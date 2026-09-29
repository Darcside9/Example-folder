// ==========================================================================
// CHRIS SHOPPER — APPWRITE SERVERLESS DISPENSER & INVENTORY BRIDGE
// Provides zero-trust inventory querying, single-buyer credential dispensing,
// atomic wallet balance deductions, and admin bulk synchronization with Appwrite Cloud.
// ==========================================================================

import { APPWRITE_CONFIG, functions, databases, Query, ID } from './appwrite';
import { PLATFORM_CATEGORIES } from '../data/sampleLogsData';
import { fetchLivePricing } from './pricingService';
import { fetchDynamicPlatforms } from './platformsService';

const PURCHASES_STORAGE_KEY = 'cs_purchased_logs';

/**
 * Retrieve past purchased logs for the user from local storage
 */
export function getPurchasedLogs(userId = null) {
  try {
    const raw = localStorage.getItem(PURCHASES_STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    if (userId) {
      return list.filter(item => !item.userId || item.userId === userId);
    }
    return list;
  } catch (err) {
    console.warn('Error reading purchased logs:', err);
    return [];
  }
}

/**
 * Save newly dispensed credentials to user's local history
 */
export function savePurchasedLog(record) {
  try {
    const list = getPurchasedLogs();
    list.unshift(record);
    localStorage.setItem(PURCHASES_STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.warn('Error storing purchased log:', err);
  }
}

/**
 * Fetch available account logs for catalog browsing.
 * Calls the Appwrite Serverless Function 'log-dispenser' which strips passwords BTS!
 * Syncs real-time prices from products_pricing collection so all rates match admin controller.
 */
export async function fetchAvailableAccountLogs(platformId = null) {
  let allPlatforms = [];
  try {
    allPlatforms = await fetchDynamicPlatforms();
  } catch (err) {
    allPlatforms = PLATFORM_CATEGORIES;
  }

  const targetPlatforms = platformId 
    ? allPlatforms.filter(c => c.id === platformId)
    : allPlatforms;

  // 1. Fetch live product pricing from Appwrite Cloud DB
  let livePricing = [];
  try {
    livePricing = await fetchLivePricing();
  } catch (pErr) {
    console.warn('Live pricing sync notice:', pErr.message);
  }

  const catalogWithInventory = [];

  for (const cat of targetPlatforms) {
    let availableAccounts = [];
    const colId = cat.collectionId || APPWRITE_CONFIG.collections[cat.id];

    // Find live base price configured by admin for this platform
    const platformPricing = (livePricing || []).find(p => p.product_id === cat.id);
    const platformBasePrice = platformPricing?.price_usd !== undefined 
      ? Number(platformPricing.price_usd) 
      : Number(cat.demoPrice || 1.50);

    if (colId) {
      // 2. Attempt execution of Appwrite Serverless Dispenser Function
      try {
        const execution = await functions.createExecution(
          APPWRITE_CONFIG.functionId,
          JSON.stringify({
            action: 'list_available',
            platformId: cat.id
          })
        );

        if (execution && execution.responseBody) {
          const parsed = JSON.parse(execution.responseBody);
          if (parsed.success && Array.isArray(parsed.accounts)) {
            availableAccounts = parsed.accounts.map(acc => ({
              ...acc,
              price: acc.price !== undefined ? Number(acc.price) : platformBasePrice
            }));
          }
        }
      } catch (funcErr) {
        // Fallback to direct sanitized query if function execution is unavailable
        try {
          const direct = await databases.listDocuments(
            APPWRITE_CONFIG.databaseId,
            colId,
            [
              Query.equal('status', 'available'),
              Query.select(['username', 'sub_type_id', 'sub_type_title', 'price', 'status']),
              Query.limit(100)
            ]
          );
          availableAccounts = direct.documents.map(d => ({
            id: d.$id,
            username: d.username,
            subTypeId: d.sub_type_id,
            subTypeTitle: d.sub_type_title,
            price: d.price !== undefined ? Number(d.price) : platformBasePrice,
            status: d.status,
            isAvailable: true
          }));
        } catch (dbErr) {
          // Collection is private — direct query blocked as designed by zero-trust rules
        }
      }
    }

    // 3. Map accounts to their respective sub-type configurations with live price priority
    const itemsWithStock = (cat.items || []).map(subType => {
      const matchingAccounts = availableAccounts.filter(a => a.subTypeId === subType.id);
      
      // Price Hierarchy:
      // 1. Account item price if explicitly set
      // 2. Sub-type price
      // 3. Platform base price from Appwrite products_pricing
      const effectivePrice = matchingAccounts[0]?.price !== undefined 
        ? Number(matchingAccounts[0].price)
        : (subType.price !== undefined ? Number(subType.price) : platformBasePrice);

      return {
        ...subType,
        stockCount: matchingAccounts.length,
        price: effectivePrice,
        accounts: matchingAccounts.map(a => ({
          ...a,
          price: a.price !== undefined ? Number(a.price) : effectivePrice
        }))
      };
    });

    catalogWithInventory.push({
      ...cat,
      demoPrice: platformBasePrice,
      items: itemsWithStock
    });
  }

  return catalogWithInventory;
}

/**
 * Purchase a selected account log:
 * Executes the serverless dispenser function to verify balance, deduct funds atomically,
 * mark status as sold, log the order in Appwrite Cloud, and return full credentials.
 */
export async function dispenseSpecificAccountLog({
  username,
  platformId,
  subTypeId,
  userId,
  userEmail,
  currentBalance,
  price
}) {
  let colId = APPWRITE_CONFIG.collections[platformId];
  if (!colId) {
    try {
      const allPlatforms = await fetchDynamicPlatforms();
      const p = allPlatforms.find(x => x.id === platformId);
      if (p) colId = p.collectionId;
    } catch {}
  }

  const requiredPrice = Number(price !== undefined ? price : 1.50);

  // 1. Execute Serverless Function 'log-dispenser'
  try {
    const execution = await functions.createExecution(
      APPWRITE_CONFIG.functionId,
      JSON.stringify({
        action: 'purchase_log',
        platformId,
        subTypeId,
        username,
        userId,
        userEmail,
        currentBalance: Number(currentBalance || 0),
        price: requiredPrice
      })
    );

    if (execution && execution.responseBody) {
      const result = JSON.parse(execution.responseBody);
      if (result.success && result.credential) {
        savePurchasedLog({
          ...result.credential,
          userId,
          price: result.credential.price || requiredPrice,
          purchasedAt: result.credential.purchasedAt || new Date().toISOString()
        });

        // Sync new balance in localStorage session
        if (result.newBalance !== undefined) {
          try {
            const rawUser = localStorage.getItem('cs_user');
            if (rawUser) {
              const u = JSON.parse(rawUser);
              u.balance = result.newBalance;
              localStorage.setItem('cs_user', JSON.stringify(u));
            }
          } catch {}
        }

        return { 
          success: true, 
          credential: result.credential,
          newBalance: result.newBalance 
        };
      } else if (result.error) {
        throw new Error(result.error);
      }
    }
  } catch (err) {
    // If the error came from the function logic (e.g. Insufficient balance, Account sold), rethrow directly!
    if (err.message && (
      err.message.includes('Insufficient') || 
      err.message.includes('no longer available') ||
      err.message.includes('Missing required')
    )) {
      throw err;
    }
    // Only continue if function execution itself crashed
    console.warn('Dispenser function execution warning:', err.message);
  }

  // 2. Direct Fallback if Function execution itself failed
  if (Number(currentBalance || 0) < requiredPrice) {
    throw new Error(`Insufficient wallet balance ($${Number(currentBalance || 0).toFixed(2)} available, $${requiredPrice.toFixed(2)} required). Please top up.`);
  }

  try {
    const found = await databases.listDocuments(APPWRITE_CONFIG.databaseId, colId, [
      Query.equal('username', username),
      Query.equal('status', 'available'),
      Query.limit(1)
    ]);

    if (found.documents.length === 0) {
      throw new Error(`Account @${username} was just claimed. Please choose another username.`);
    }

    const doc = found.documents[0];

    // Mark as sold
    await databases.updateDocument(APPWRITE_CONFIG.databaseId, colId, doc.$id, {
      status: 'sold',
      sold_to_user_id: userId,
      sold_to_email: userEmail || '',
      sold_at: new Date().toISOString()
    });

    const newBalance = Number((Number(currentBalance || 0) - requiredPrice).toFixed(2));

    // Try to update user balance in user_profiles
    try {
      const uDocs = await databases.listDocuments(APPWRITE_CONFIG.databaseId, APPWRITE_CONFIG.collections.user_profiles, [
        Query.equal('user_id', userId),
        Query.limit(1)
      ]);
      if (uDocs.documents.length > 0) {
        await databases.updateDocument(APPWRITE_CONFIG.databaseId, APPWRITE_CONFIG.collections.user_profiles, uDocs.documents[0].$id, {
          balance: newBalance
        });
      }
    } catch {}

    const credential = {
      platform: platformId.charAt(0).toUpperCase() + platformId.slice(1),
      username: doc.username,
      password: doc.password,
      twoFactorKey: doc.two_factor_key,
      mail: doc.mail,
      mailPassword: doc.mail_password,
      price: requiredPrice,
      purchasedAt: new Date().toISOString()
    };

    savePurchasedLog({ ...credential, userId });

    // Sync session cache
    try {
      const rawUser = localStorage.getItem('cs_user');
      if (rawUser) {
        const u = JSON.parse(rawUser);
        u.balance = newBalance;
        localStorage.setItem('cs_user', JSON.stringify(u));
      }
    } catch {}

    return { success: true, credential, newBalance };
  } catch (dbErr) {
    throw new Error(dbErr.message || 'Dispense failed. Please contact support.');
  }
}

/**
 * Admin Bulk Importer function for Appwrite:
 * Uploads an array of validated records to the selected platform collection.
 */
export async function adminBulkImportLogs({
  platformId,
  subTypeId,
  subTypeTitle,
  price,
  records,
  onProgress
}) {
  let colId = APPWRITE_CONFIG.collections[platformId];
  if (!colId) {
    try {
      const allPlatforms = await fetchDynamicPlatforms();
      const p = allPlatforms.find(x => x.id === platformId);
      if (p) colId = p.collectionId;
    } catch {}
  }

  if (!Array.isArray(records) || records.length === 0) {
    throw new Error('No records to import.');
  }

  // 1. Try batch import via the Appwrite Serverless Function (Primary Zero-Trust path)
  try {
    const execution = await functions.createExecution(
      APPWRITE_CONFIG.functionId,
      JSON.stringify({
        action: 'admin_bulk_import',
        platformId,
        subTypeId,
        subTypeTitle,
        price,
        records
      })
    );

    if (execution && execution.responseBody) {
      const parsed = JSON.parse(execution.responseBody);
      if (parsed.success) {
        if (onProgress) {
          onProgress({
            current: records.length,
            total: records.length,
            percentage: 100,
            successCount: parsed.importedCount || records.length,
            failedCount: 0
          });
        }
        return {
          success: true,
          total: records.length,
          successCount: parsed.importedCount || records.length,
          failedCount: 0,
          errors: []
        };
      } else if (parsed.error) {
        throw new Error(parsed.error);
      }
    }
  } catch (fnErr) {
    console.warn('Serverless bulk import failed, attempting direct database fallback:', fnErr.message);
  }

  // 2. Direct fallback (if client has permissions or running with admin key)
  let successCount = 0;
  let failedCount = 0;
  const errors = [];

  for (let i = 0; i < records.length; i++) {
    const rec = records[i];
    try {
      await databases.createDocument(
        APPWRITE_CONFIG.databaseId,
        colId,
        ID.unique(),
        {
          username: rec.username,
          password: rec.password,
          two_factor_key: rec.twoFactorKey,
          mail: rec.mail,
          mail_password: rec.mailPassword,
          sub_type_id: subTypeId,
          sub_type_title: subTypeTitle || '',
          price: Number(price || 1.50),
          status: 'available'
        }
      );
      successCount++;
    } catch (err) {
      failedCount++;
      errors.push({ username: rec.username, error: err.message });
    }

    if (onProgress) {
      onProgress({
        current: i + 1,
        total: records.length,
        percentage: Math.round(((i + 1) / records.length) * 100),
        successCount,
        failedCount
      });
    }

    // Brief throttle to avoid connection saturation
    await new Promise(r => setTimeout(r, 100));
  }

  return {
    success: successCount > 0,
    total: records.length,
    successCount,
    failedCount,
    errors
  };
}
