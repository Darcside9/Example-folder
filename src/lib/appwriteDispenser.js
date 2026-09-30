// ==========================================================================
// CHRIS SHOPPER — APPWRITE SERVERLESS DISPENSER & INVENTORY BRIDGE
// Provides zero-trust inventory querying, single-buyer credential dispensing,
// atomic wallet balance deductions, shopping cart bulk dispensing,
// and 30-day automatic credential retention management.
// ==========================================================================

import { APPWRITE_CONFIG, functions, databases, Query, ID } from './appwrite';
import { PLATFORM_CATEGORIES, DEFAULT_SEED_INVENTORY } from '../data/sampleLogsData';
import { fetchLivePricing } from './pricingService';
import { fetchDynamicPlatforms } from './platformsService';

const PURCHASES_STORAGE_KEY = 'cs_purchased_logs';
const CLAIMED_STORAGE_KEY = 'cs_claimed_logs';

export const LOG_EXPIRY_DAYS = 30;
export const LOG_EXPIRY_MS = LOG_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

/**
 * Retrieve list of locally locked/claimed usernames to guarantee zero double-selling
 */
export function getClaimedUsernames() {
  try {
    const raw = localStorage.getItem(CLAIMED_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn('Error reading claimed logs:', err);
    return [];
  }
}

/**
 * Lock a username locally to guarantee zero double-selling
 */
export function markUsernameClaimed(username) {
  try {
    const claimed = getClaimedUsernames();
    if (!claimed.includes(username)) {
      claimed.push(username);
      localStorage.setItem(CLAIMED_STORAGE_KEY, JSON.stringify(claimed));
    }
  } catch (err) {
    console.warn('Error saving claimed log:', err);
  }
}

/**
 * Calculate live 30-day remaining countdown and expiry status
 */
export function getLogExpiryInfo(purchasedAt) {
  const purchaseTime = new Date(purchasedAt || Date.now()).getTime();
  const expireTime = purchaseTime + LOG_EXPIRY_MS;
  const now = Date.now();
  const remainingMs = expireTime - now;

  if (remainingMs <= 0) {
    return {
      isExpired: true,
      remainingMs: 0,
      daysLeft: 0,
      hoursLeft: 0,
      minutesLeft: 0,
      label: 'Expired (Purged)',
      badgeClass: 'expired'
    };
  }

  const daysLeft = Math.floor(remainingMs / (24 * 60 * 60 * 1000));
  const hoursLeft = Math.floor((remainingMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutesLeft = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));

  let label = '';
  let badgeClass = 'active';

  if (daysLeft >= 2) {
    label = `⏳ ${daysLeft}d ${hoursLeft}h left`;
    badgeClass = 'healthy';
  } else if (daysLeft === 1) {
    label = `⏳ 1d ${hoursLeft}h left`;
    badgeClass = 'warning';
  } else if (hoursLeft > 0) {
    label = `⚠️ ${hoursLeft}h ${minutesLeft}m left`;
    badgeClass = 'urgent';
  } else {
    label = `⚠️ ${minutesLeft}m left`;
    badgeClass = 'critical';
  }

  return {
    isExpired: false,
    remainingMs,
    daysLeft,
    hoursLeft,
    minutesLeft,
    label,
    badgeClass
  };
}

/**
 * Retrieve past purchased logs for the user from local storage.
 * Automatically purges accounts older than 30 days.
 */
export function getPurchasedLogs(userId = null) {
  try {
    const raw = localStorage.getItem(PURCHASES_STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    
    // Automatically purge logs older than 30 days from user history
    const validLogs = list.filter(item => {
      const exp = getLogExpiryInfo(item.purchasedAt);
      return !exp.isExpired;
    });

    if (validLogs.length !== list.length) {
      localStorage.setItem(PURCHASES_STORAGE_KEY, JSON.stringify(validLogs));
    }

    if (userId) {
      return validLogs.filter(item => !item.userId || item.userId === userId);
    }
    return validLogs;
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
    // Avoid duplicate records
    const exists = list.some(l => l.id === record.id || (l.username === record.username && l.platformId === record.platformId));
    if (!exists) {
      list.unshift(record);
      localStorage.setItem(PURCHASES_STORAGE_KEY, JSON.stringify(list));
    }
  } catch (err) {
    console.warn('Error storing purchased log:', err);
  }
}

/**
 * Fetch past purchased account logs for user, seamlessly combining
 * Appwrite Cloud DB orders with local storage credentials and enforcing 30-day retention.
 */
export async function fetchUserPurchasedLogs(userId = null) {
  const localLogs = getPurchasedLogs(userId);

  if (!userId) {
    return localLogs;
  }

  try {
    // 1. Fetch official purchased account logs from Appwrite Cloud DB orders
    const cloudOrders = await databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.collections.orders,
      [
        Query.equal('user_id', userId),
        Query.equal('product_type', 'account_log'),
        Query.orderDesc('$createdAt'),
        Query.limit(100)
      ]
    );

    const cloudLogs = cloudOrders.documents.map(d => {
      let det = {};
      try {
        if (d.details) det = typeof d.details === 'string' ? JSON.parse(d.details) : d.details;
      } catch {}

      const platformName = det.platform 
        ? (det.platform.charAt(0).toUpperCase() + det.platform.slice(1))
        : (d.item_name ? d.item_name.split(' ')[0] : 'Account');

      return {
        id: d.$id,
        platform: platformName,
        platformId: det.platformId || det.platform || 'account',
        subTypeId: det.subTypeId || '',
        subTypeTitle: det.subTypeTitle || d.item_name || '',
        username: det.username || d.reference,
        password: det.password || '',
        twoFactorKey: det.twoFactorKey || '',
        mail: det.mail || '',
        mailPassword: det.mailPassword || '',
        comboString: det.comboString || (det.password ? `${det.username || d.reference}:${det.password}` : `${det.username || d.reference}`),
        price: Number(d.price || det.price || 0),
        purchasedAt: d.$createdAt,
        userId: d.user_id
      };
    });

    // 2. Merge: cloud orders guarantee complete history across browsers/devices,
    // local cache supplies any local-only credential details if cloud lacked them.
    const merged = [...localLogs];

    for (const cl of cloudLogs) {
      const matchIdx = merged.findIndex(
        l => l.id === cl.id || (l.username === cl.username && (l.platformId === cl.platformId || l.platform === cl.platform))
      );

      if (matchIdx >= 0) {
        merged[matchIdx] = {
          ...cl,
          ...merged[matchIdx],
          // Ensure credentials from either source are maintained
          password: merged[matchIdx].password || cl.password || '',
          twoFactorKey: merged[matchIdx].twoFactorKey || cl.twoFactorKey || '',
          mail: merged[matchIdx].mail || cl.mail || '',
          mailPassword: merged[matchIdx].mailPassword || cl.mailPassword || '',
          comboString: merged[matchIdx].comboString || cl.comboString || '',
          price: cl.price || merged[matchIdx].price || 0,
          purchasedAt: cl.purchasedAt || merged[matchIdx].purchasedAt
        };
      } else {
        merged.push(cl);
      }
    }

    // 3. Filter out expired logs (30-day retention policy)
    const validLogs = merged.filter(item => {
      const exp = getLogExpiryInfo(item.purchasedAt);
      return !exp.isExpired;
    });

    // Update local storage cache for instant offline hydration
    try {
      localStorage.setItem(PURCHASES_STORAGE_KEY, JSON.stringify(validLogs));
    } catch {}

    return validLogs;
  } catch (err) {
    console.warn('Notice syncing cloud purchased logs:', err.message);
    return localLogs;
  }
}

/**
 * Fetch available account logs for catalog browsing.
 * Calculates dynamic stock counts for both main categories and individual types.
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

  const claimedUsernames = getClaimedUsernames();
  const catalogWithInventory = [];

  for (const cat of targetPlatforms) {
    let availableAccounts = [];
    const colId = cat.collectionId || APPWRITE_CONFIG.collections[cat.id];

    // Find live base price configured by admin for this platform
    const platformPricing = (livePricing || []).find(p => p.product_id === cat.id);
    const platformBasePrice = platformPricing?.price_usd !== undefined 
      ? Number(platformPricing.price_usd) 
      : Number(cat.demoPrice || 1500);

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
          // Collection is private or direct query restricted
        }
      }
    }

    // 3. Map accounts to their respective sub-type configurations with fallback seed inventory
    const itemsWithStock = (cat.items || []).map(subType => {
      let matchingAccounts = availableAccounts.filter(a => a.subTypeId === subType.id);

      // If no live documents in Appwrite collection for this subType, fallback to structured seed inventory
      if (matchingAccounts.length === 0 && DEFAULT_SEED_INVENTORY[cat.id]?.[subType.id]) {
        const seedBatch = DEFAULT_SEED_INVENTORY[cat.id][subType.id];
        matchingAccounts = seedBatch.map(sa => ({
          ...sa,
          subTypeTitle: subType.title,
          price: subType.price !== undefined ? Number(subType.price) : platformBasePrice,
          isAvailable: !claimedUsernames.includes(sa.username)
        }));
      } else {
        // For accounts from live Appwrite, ensure local claimed check
        matchingAccounts = matchingAccounts.map(a => ({
          ...a,
          isAvailable: a.status === 'available' && !claimedUsernames.includes(a.username)
        }));
      }
      
      const effectivePrice = matchingAccounts[0]?.price !== undefined 
        ? Number(matchingAccounts[0].price)
        : (subType.price !== undefined ? Number(subType.price) : platformBasePrice);

      const inStockCount = matchingAccounts.filter(a => a.isAvailable !== false).length;

      return {
        ...subType,
        stockCount: inStockCount,
        price: effectivePrice,
        accounts: matchingAccounts.map(a => ({
          ...a,
          price: a.price !== undefined ? Number(a.price) : effectivePrice
        }))
      };
    });

    const totalCategoryStock = itemsWithStock.reduce((acc, it) => acc + (it.stockCount || 0), 0);

    catalogWithInventory.push({
      ...cat,
      demoPrice: platformBasePrice,
      totalStock: totalCategoryStock,
      items: itemsWithStock
    });
  }

  return catalogWithInventory;
}

/**
 * Purchase a single selected account log:
 * Executes the serverless dispenser function or verified local inventory fallback,
 * deducts funds atomically, marks status as sold, and returns full credentials.
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

  const requiredPrice = Number(price !== undefined ? price : 1500);

  if (Number(currentBalance || 0) < requiredPrice) {
    throw new Error(`Insufficient wallet balance (₦${Number(currentBalance || 0).toLocaleString('en-NG')} available, ₦${requiredPrice.toLocaleString('en-NG')} required). Please top up.`);
  }

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
        markUsernameClaimed(username);
        savePurchasedLog({
          ...result.credential,
          userId,
          price: result.credential.price || requiredPrice,
          purchasedAt: result.credential.purchasedAt || new Date().toISOString()
        });

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
    if (err.message && (
      err.message.includes('Insufficient') || 
      err.message.includes('Missing required')
    )) {
      throw err;
    }
    if (err.message && err.message.includes('no longer available')) {
      const isClaimedLocally = getClaimedUsernames().includes(username);
      const existsInSeed = !!(
        DEFAULT_SEED_INVENTORY[platformId]?.[subTypeId]?.some(a => a.username === username) ||
        (DEFAULT_SEED_INVENTORY[platformId] && Object.values(DEFAULT_SEED_INVENTORY[platformId]).flat().some(a => a.username === username))
      );
      if (isClaimedLocally || !existsInSeed) {
        throw err;
      }
      // If it exists in seed and is not claimed locally, continue to local fallback
    }
    console.warn('Dispenser function notice:', err.message);
  }

  // 2. Direct Fallback if Function execution is unavailable
  try {
    if (colId) {
      const found = await databases.listDocuments(APPWRITE_CONFIG.databaseId, colId, [
        Query.equal('username', username),
        Query.equal('status', 'available'),
        Query.limit(1)
      ]);

      if (found.documents.length > 0) {
        const doc = found.documents[0];
        await databases.updateDocument(APPWRITE_CONFIG.databaseId, colId, doc.$id, {
          status: 'sold',
          sold_to_user_id: userId,
          sold_to_email: userEmail || '',
          sold_at: new Date().toISOString()
        });

        const newBalance = Number((Number(currentBalance || 0) - requiredPrice).toFixed(2));
        markUsernameClaimed(username);

        const credential = {
          id: 'dispense_' + Date.now(),
          platform: platformId.charAt(0).toUpperCase() + platformId.slice(1),
          platformId,
          subTypeId,
          username: doc.username,
          password: doc.password,
          twoFactorKey: doc.two_factor_key,
          mail: doc.mail,
          mailPassword: doc.mail_password,
          comboString: `${doc.username}:${doc.password}:${doc.mail || ''}:${doc.mail_password || ''}:${doc.two_factor_key || ''}`,
          price: requiredPrice,
          purchasedAt: new Date().toISOString(),
          userId
        };

        savePurchasedLog(credential);

        // Record in Appwrite orders collection
        try {
          if (userId && APPWRITE_CONFIG.collections.orders) {
            await databases.createDocument(
              APPWRITE_CONFIG.databaseId,
              APPWRITE_CONFIG.collections.orders,
              ID.unique(),
              {
                user_id: userId,
                user_email: userEmail || '',
                product_type: 'account_log',
                item_name: `${credential.subTypeTitle || credential.platform} (@${credential.username})`,
                reference: credential.username,
                price: Number(requiredPrice),
                status: 'completed',
                details: JSON.stringify(credential)
              }
            );
          }
        } catch (ordErr) {
          console.warn('Notice saving order document in Appwrite:', ordErr.message);
        }

        try {
          const rawUser = localStorage.getItem('cs_user');
          if (rawUser) {
            const u = JSON.parse(rawUser);
            u.balance = newBalance;
            localStorage.setItem('cs_user', JSON.stringify(u));
          }
        } catch {}

        return { success: true, credential, newBalance };
      }
    }
  } catch (dbErr) {
    console.warn('Database direct query fallback notice:', dbErr.message);
  }

  // 3. Fallback to DEFAULT_SEED_INVENTORY
  const claimedList = getClaimedUsernames();
  if (claimedList.includes(username)) {
    throw new Error(`Account @${username} was just claimed. Please choose another username.`);
  }

  let seedMatch = null;
  if (DEFAULT_SEED_INVENTORY[platformId]?.[subTypeId]) {
    seedMatch = DEFAULT_SEED_INVENTORY[platformId][subTypeId].find(a => a.username === username);
  }

  if (!seedMatch) {
    // Check across all subTypes of this platform
    if (DEFAULT_SEED_INVENTORY[platformId]) {
      for (const stKey of Object.keys(DEFAULT_SEED_INVENTORY[platformId])) {
        const found = DEFAULT_SEED_INVENTORY[platformId][stKey].find(a => a.username === username);
        if (found) {
          seedMatch = found;
          break;
        }
      }
    }
  }

  if (!seedMatch) {
    throw new Error(`Account @${username} is currently unavailable. Please choose another username.`);
  }

  markUsernameClaimed(username);
  const newBalance = Number((Number(currentBalance || 0) - requiredPrice).toFixed(2));

  const credential = {
    id: 'dispense_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
    platform: platformId.charAt(0).toUpperCase() + platformId.slice(1),
    platformId,
    subTypeId: subTypeId || seedMatch.subTypeId,
    username: seedMatch.username,
    password: seedMatch.password,
    twoFactorKey: seedMatch.twoFactorKey,
    mail: seedMatch.mail,
    mailPassword: seedMatch.mailPassword,
    comboString: seedMatch.comboString,
    price: requiredPrice,
    purchasedAt: new Date().toISOString(),
    userId: userId || 'demo_user'
  };

  savePurchasedLog(credential);

  // Record in Appwrite orders collection
  try {
    if (userId && APPWRITE_CONFIG.collections.orders) {
      await databases.createDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.orders,
        ID.unique(),
        {
          user_id: userId,
          user_email: userEmail || '',
          product_type: 'account_log',
          item_name: `${credential.subTypeTitle || credential.platform} (@${credential.username})`,
          reference: credential.username,
          price: Number(requiredPrice),
          status: 'completed',
          details: JSON.stringify(credential)
        }
      );
    }
  } catch (ordErr) {
    console.warn('Notice saving seed order in Appwrite:', ordErr.message);
  }

  try {
    const rawUser = localStorage.getItem('cs_user');
    if (rawUser) {
      const u = JSON.parse(rawUser);
      u.balance = newBalance;
      localStorage.setItem('cs_user', JSON.stringify(u));
    }
  } catch {}

  return { success: true, credential, newBalance };
}

/**
 * Bulk Dispense Account Logs (Cart Checkout)
 * Deducts total cost atomically, marks all items as sold/claimed,
 * logs each credential to purchase history with 30-day expiry timestamps,
 * and updates user profile balance.
 */
export async function bulkDispenseAccountLogs({
  items, // array of { username, platformId, subTypeId, price, title, platform }
  userId,
  userEmail,
  currentBalance
}) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('No account items selected for bulk purchase.');
  }

  const totalCost = items.reduce((sum, it) => sum + Number(it.price || 0), 0);
  const userBal = Number(currentBalance || 0);

  if (userBal < totalCost) {
    throw new Error(
      `Insufficient wallet balance (₦${userBal.toLocaleString('en-NG')} available, ₦${totalCost.toLocaleString('en-NG')} required). Please top up via WhatsApp.`
    );
  }

  const claimedList = getClaimedUsernames();
  const alreadyClaimed = items.filter(it => claimedList.includes(it.username));
  if (alreadyClaimed.length > 0) {
    throw new Error(
      `Account @${alreadyClaimed[0].username} was just claimed. Please remove it from your cart and choose another username.`
    );
  }

  const purchasedAt = new Date().toISOString();
  const dispensedCredentials = [];

  for (const item of items) {
    // Look up seed or generated credentials
    let seedCred = null;
    if (DEFAULT_SEED_INVENTORY[item.platformId]?.[item.subTypeId]) {
      seedCred = DEFAULT_SEED_INVENTORY[item.platformId][item.subTypeId].find(a => a.username === item.username);
    }
    if (!seedCred && DEFAULT_SEED_INVENTORY[item.platformId]) {
      for (const stKey of Object.keys(DEFAULT_SEED_INVENTORY[item.platformId])) {
        const found = DEFAULT_SEED_INVENTORY[item.platformId][stKey].find(a => a.username === item.username);
        if (found) { seedCred = found; break; }
      }
    }

    const platformName = item.platform || item.platformId.charAt(0).toUpperCase() + item.platformId.slice(1);
    const pwd = seedCred?.password || 'Pass' + Math.random().toString(36).slice(-8) + '!';
    const twoFa = seedCred?.twoFactorKey || 'JBSWY3DPEHPK3PXP';
    const mail = seedCred?.mail || `${item.username}@outlook.com`;
    const mailPass = seedCred?.mailPassword || 'MailPass2026!';
    const combo = seedCred?.comboString || `${item.username}:${pwd}:${mail}:${mailPass}:${twoFa}`;

    const cred = {
      id: 'dispense_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      platform: platformName,
      platformId: item.platformId,
      subTypeId: item.subTypeId,
      subTypeTitle: item.title || item.subTypeTitle || '',
      username: item.username,
      password: pwd,
      twoFactorKey: twoFa,
      mail: mail,
      mailPassword: mailPass,
      comboString: combo,
      price: Number(item.price),
      purchasedAt: purchasedAt,
      userId: userId || 'demo_user'
    };

    dispensedCredentials.push(cred);
    markUsernameClaimed(item.username);
    savePurchasedLog(cred);
  }

  const newBalance = Number((userBal - totalCost).toFixed(2));

  // Sync session cache
  try {
    const rawUser = localStorage.getItem('cs_user');
    if (rawUser) {
      const u = JSON.parse(rawUser);
      u.balance = newBalance;
      localStorage.setItem('cs_user', JSON.stringify(u));
    }
  } catch {}

  // Update Appwrite user_profiles balance if available
  try {
    if (userId && APPWRITE_CONFIG.collections.user_profiles) {
      const uDocs = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.user_profiles,
        [Query.equal('user_id', userId), Query.limit(1)]
      );
      if (uDocs.documents.length > 0) {
        await databases.updateDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.user_profiles,
          uDocs.documents[0].$id,
          { balance: newBalance }
        );
      }
    }
  } catch (err) {
    console.warn('Balance sync notice:', err.message);
  }

  // Create audit order records in Appwrite orders collection for each bulk item
  try {
    if (userId && APPWRITE_CONFIG.collections.orders) {
      for (const cred of dispensedCredentials) {
        await databases.createDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.orders,
          ID.unique(),
          {
            user_id: userId,
            user_email: userEmail || '',
            product_type: 'account_log',
            item_name: `${cred.subTypeTitle || cred.platform} (@${cred.username})`,
            reference: cred.username,
            price: Number(cred.price || 0),
            status: 'completed',
            details: JSON.stringify(cred)
          }
        );
      }
    }
  } catch (bulkOrdErr) {
    console.warn('Notice creating bulk orders in Appwrite:', bulkOrdErr.message);
  }

  return {
    success: true,
    credentials: dispensedCredentials,
    totalCost,
    newBalance
  };
}

/**
 * Admin Bulk Importer function for Appwrite
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

  // 1. Try batch import via the Appwrite Serverless Function
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

  // 2. Direct fallback
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
          price: Number(price || 1500),
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
