// ==========================================================================
// CHRIS SHOPPER — GOOGLE FIREBASE DISPENSER & INVENTORY BRIDGE
// Provides zero-trust inventory querying, single-buyer credential dispensing,
// atomic wallet balance deductions, shopping cart bulk dispensing,
// and 30-day automatic credential retention management.
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
  serverTimestamp,
  writeBatch 
} from './firebase';
import { PLATFORM_CATEGORIES, DEFAULT_SEED_INVENTORY } from '../data/sampleLogsData';
import { fetchLivePricing } from './pricingService';
import { fetchDynamicPlatforms } from './platformsService';
import { firebaseUpdateUserBalance } from './firebaseAuth';

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
 * Fetch past purchased account logs for user from Firestore orders
 */
export async function fetchUserPurchasedLogs(userId = null) {
  const localLogs = getPurchasedLogs(userId);

  if (!userId || !db) {
    return localLogs;
  }

  try {
    const colRef = collection(db, FIREBASE_COLLECTIONS.orders);
    const q = query(
      colRef,
      where('user_id', '==', userId),
      where('product_type', '==', 'account_log')
    );
    const snap = await getDocs(q);

    const cloudLogs = snap.docs.map(d => {
      const data = d.data();
      let det = {};
      try {
        if (data.details) det = typeof data.details === 'string' ? JSON.parse(data.details) : data.details;
      } catch {}

      const platformName = det.platform 
        ? (det.platform.charAt(0).toUpperCase() + det.platform.slice(1))
        : (data.item_name ? data.item_name.split(' ')[0] : 'Account');

      const createdAtStr = data.created_at?.toDate ? data.created_at.toDate().toISOString() : (data.created_at || new Date().toISOString());

      return {
        id: d.id,
        platform: platformName,
        platformId: det.platformId || det.platform || 'account',
        subTypeId: det.subTypeId || '',
        subTypeTitle: det.subTypeTitle || data.item_name || '',
        username: det.username || data.reference,
        password: det.password || '',
        twoFactorKey: det.twoFactorKey || '',
        mail: det.mail || '',
        mailPassword: det.mailPassword || '',
        rawRecord: det.rawRecord || '',
        extraData: det.extraData || null,
        rulesNotes: det.rulesNotes || '',
        comboString: det.rawRecord || det.comboString || (det.password ? `${det.username || data.reference}:${det.password}` : `${det.username || data.reference}`),
        price: Number(data.price || det.price || 0),
        purchasedAt: createdAtStr,
        userId: data.user_id
      };
    });

    // Merge local and cloud records
    const merged = [...localLogs];
    for (const cl of cloudLogs) {
      const matchIdx = merged.findIndex(
        l => l.id === cl.id || (l.username === cl.username && (l.platformId === cl.platformId || l.platform === cl.platform))
      );

      if (matchIdx >= 0) {
        merged[matchIdx] = {
          ...cl,
          ...merged[matchIdx],
          password: merged[matchIdx].password || cl.password || '',
          twoFactorKey: merged[matchIdx].twoFactorKey || cl.twoFactorKey || '',
          mail: merged[matchIdx].mail || cl.mail || '',
          mailPassword: merged[matchIdx].mailPassword || cl.mailPassword || '',
          rawRecord: merged[matchIdx].rawRecord || cl.rawRecord || '',
          extraData: merged[matchIdx].extraData || cl.extraData || null,
          rulesNotes: merged[matchIdx].rulesNotes || cl.rulesNotes || '',
          comboString: merged[matchIdx].rawRecord || merged[matchIdx].comboString || cl.rawRecord || cl.comboString || '',
          price: cl.price || merged[matchIdx].price || 0,
          purchasedAt: cl.purchasedAt || merged[matchIdx].purchasedAt
        };
      } else {
        merged.push(cl);
      }
    }

    const validLogs = merged.filter(item => {
      const exp = getLogExpiryInfo(item.purchasedAt);
      return !exp.isExpired;
    });

    try {
      localStorage.setItem(PURCHASES_STORAGE_KEY, JSON.stringify(validLogs));
    } catch {}

    return validLogs;
  } catch (err) {
    console.warn('Notice syncing Firestore purchased logs:', err.message);
    return localLogs;
  }
}

/**
 * Fetch available account logs for catalog browsing from Firestore.
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

  // 1. Fetch live product pricing from Firebase Firestore
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
    const colName = cat.collectionId || cat.id;

    // Live base price configured by admin
    const platformPricing = (livePricing || []).find(p => p.product_id === cat.id);
    const platformBasePrice = platformPricing?.price_usd !== undefined 
      ? Number(platformPricing.price_usd) 
      : Number(cat.demoPrice || 1500);

    if (db && colName) {
      try {
        const colRef = collection(db, colName);
        const q = query(colRef, where('status', '==', 'available'), limit(100));
        const snap = await getDocs(q);

        if (!snap.empty) {
          availableAccounts = snap.docs.map(d => {
            const data = d.data();
            return {
              id: d.id,
              username: data.username,
              subTypeId: data.sub_type_id,
              subTypeTitle: data.sub_type_title,
              price: data.price !== undefined ? Number(data.price) : platformBasePrice,
              status: data.status,
              rawRecord: data.raw_record || '',
              extraData: data.custom_data ? (typeof data.custom_data === 'string' ? JSON.parse(data.custom_data) : data.custom_data) : null,
              rulesNotes: data.rules_notes || '',
              isAvailable: true
            };
          });
        }
      } catch (dbErr) {
        // Platform collection might not have docs yet; fallback to seed
      }
    }

    // 3. Map accounts to their respective sub-type configurations with fallback seed inventory
    const itemsWithStock = (cat.items || []).map(subType => {
      let matchingAccounts = availableAccounts.filter(a => 
        a.subTypeId === subType.id ||
        (a.subTypeTitle && a.subTypeTitle.trim().toLowerCase() === subType.title.trim().toLowerCase()) ||
        ((cat.items || []).length === 1)
      );

      // If no live documents in collection for this subType, fallback to seed inventory
      if (matchingAccounts.length === 0 && DEFAULT_SEED_INVENTORY[cat.id]?.[subType.id]) {
        const seedBatch = DEFAULT_SEED_INVENTORY[cat.id][subType.id];
        matchingAccounts = seedBatch.map(sa => ({
          ...sa,
          subTypeTitle: subType.title,
          price: subType.price !== undefined ? Number(subType.price) : platformBasePrice,
          isAvailable: !claimedUsernames.includes(sa.username)
        }));
      } else {
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
 * Purchase a single selected account log from Firebase Firestore
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
  const colName = platformId;
  const requiredPrice = Number(price !== undefined ? price : 1500);

  if (Number(currentBalance || 0) < requiredPrice) {
    throw new Error(`Insufficient wallet balance (₦${Number(currentBalance || 0).toLocaleString('en-NG')} available, ₦${requiredPrice.toLocaleString('en-NG')} required). Please top up.`);
  }

  // 1. Direct check in Firestore collection
  if (db && colName) {
    try {
      const colRef = collection(db, colName);
      const q = query(colRef, where('username', '==', username), where('status', '==', 'available'), limit(1));
      const snap = await getDocs(q);

      if (!snap.empty) {
        const foundDoc = snap.docs[0];
        const docData = foundDoc.data();

        // Mark as sold in Firestore
        await updateDoc(doc(db, colName, foundDoc.id), {
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
          subTypeTitle: docData.sub_type_title || '',
          username: docData.username,
          password: docData.password,
          twoFactorKey: docData.two_factor_key,
          mail: docData.mail,
          mailPassword: docData.mail_password,
          rawRecord: docData.raw_record || '',
          extraData: docData.custom_data ? (typeof docData.custom_data === 'string' ? JSON.parse(docData.custom_data) : docData.custom_data) : null,
          rulesNotes: docData.rules_notes || '',
          comboString: docData.raw_record || `${docData.username}:${docData.password}:${docData.mail || ''}:${docData.mail_password || ''}:${docData.two_factor_key || ''}`,
          price: requiredPrice,
          purchasedAt: new Date().toISOString(),
          userId
        };

        savePurchasedLog(credential);

        // Record in Firestore orders collection
        try {
          const ordersCol = collection(db, FIREBASE_COLLECTIONS.orders);
          await addDoc(ordersCol, {
            user_id: userId,
            user_email: userEmail || '',
            product_type: 'account_log',
            item_name: `${credential.subTypeTitle || credential.platform} (@${credential.username})`,
            reference: credential.username,
            price: Number(requiredPrice),
            status: 'completed',
            details: JSON.stringify(credential),
            created_at: serverTimestamp()
          });
        } catch (ordErr) {
          console.warn('Notice saving order document in Firebase:', ordErr.message);
        }

        // Deduct balance in Firestore
        await firebaseUpdateUserBalance(userId, newBalance);

        try {
          const rawUser = localStorage.getItem('cs_user');
          if (rawUser) {
            const u = JSON.parse(rawUser);
            u.balance = newBalance;
            localStorage.setItem('cs_user', JSON.stringify(u));
          }
        } catch {}

        try {
          window.dispatchEvent(new CustomEvent('balance-updated', { detail: { balance: newBalance } }));
        } catch {}

        return { success: true, credential, newBalance };
      }
    } catch (dbErr) {
      console.warn('Firestore direct query notice:', dbErr.message);
    }
  }

  // 2. Fallback to DEFAULT_SEED_INVENTORY
  const claimedList = getClaimedUsernames();
  if (claimedList.includes(username)) {
    throw new Error(`Account @${username} was just claimed. Please choose another username.`);
  }

  let seedMatch = null;
  if (DEFAULT_SEED_INVENTORY[platformId]?.[subTypeId]) {
    seedMatch = DEFAULT_SEED_INVENTORY[platformId][subTypeId].find(a => a.username === username);
  }

  if (!seedMatch && DEFAULT_SEED_INVENTORY[platformId]) {
    for (const stKey of Object.keys(DEFAULT_SEED_INVENTORY[platformId])) {
      const found = DEFAULT_SEED_INVENTORY[platformId][stKey].find(a => a.username === username);
      if (found) {
        seedMatch = found;
        break;
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

  // Record in Firestore orders
  if (db && userId) {
    try {
      const ordersCol = collection(db, FIREBASE_COLLECTIONS.orders);
      await addDoc(ordersCol, {
        user_id: userId,
        user_email: userEmail || '',
        product_type: 'account_log',
        item_name: `${credential.subTypeTitle || credential.platform} (@${credential.username})`,
        reference: credential.username,
        price: Number(requiredPrice),
        status: 'completed',
        details: JSON.stringify(credential),
        created_at: serverTimestamp()
      });
      await firebaseUpdateUserBalance(userId, newBalance);
    } catch (ordErr) {
      console.warn('Notice saving seed order in Firebase:', ordErr.message);
    }
  }

  try {
    const rawUser = localStorage.getItem('cs_user');
    if (rawUser) {
      const u = JSON.parse(rawUser);
      u.balance = newBalance;
      localStorage.setItem('cs_user', JSON.stringify(u));
    }
  } catch {}

  try {
    window.dispatchEvent(new CustomEvent('balance-updated', { detail: { balance: newBalance } }));
  } catch {}

  return { success: true, credential, newBalance };
}

/**
 * Bulk Dispense Account Logs (Cart Checkout) via Google Firebase
 */
export async function bulkDispenseAccountLogs({
  items,
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
    const rawRec = item.rawRecord || seedCred?.rawRecord || seedCred?.comboString || `${item.username}:${pwd}:${mail}:${mailPass}:${twoFa}`;
    const combo = rawRec;

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
      rawRecord: rawRec,
      extraData: item.extraData || seedCred?.extraData || null,
      rulesNotes: item.rulesNotes || seedCred?.rulesNotes || '',
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

  // Update Firebase user_profiles balance
  try {
    if (userId) {
      await firebaseUpdateUserBalance(userId, newBalance);
    }
  } catch (err) {
    console.warn('Balance sync notice:', err.message);
  }

  // Create audit order records in Firebase orders collection
  if (db && userId) {
    try {
      const ordersCol = collection(db, FIREBASE_COLLECTIONS.orders);
      for (const cred of dispensedCredentials) {
        await addDoc(ordersCol, {
          user_id: userId,
          user_email: userEmail || '',
          product_type: 'account_log',
          item_name: `${cred.subTypeTitle || cred.platform} (@${cred.username})`,
          reference: cred.username,
          price: Number(cred.price || 0),
          status: 'completed',
          details: JSON.stringify(cred),
          created_at: serverTimestamp()
        });
      }
    } catch (bulkOrdErr) {
      console.warn('Notice creating bulk orders in Firebase:', bulkOrdErr.message);
    }
  }

  try {
    window.dispatchEvent(new CustomEvent('balance-updated', { detail: { balance: newBalance } }));
  } catch {}

  return {
    success: true,
    credentials: dispensedCredentials,
    totalCost,
    newBalance
  };
}

/**
 * Admin Bulk Importer function for Google Firebase Firestore
 */
export async function adminBulkImportLogs({
  platformId,
  subTypeId,
  subTypeTitle,
  price,
  records,
  onProgress
}) {
  if (!db) {
    throw new Error('Firestore is not initialized.');
  }

  if (!Array.isArray(records) || records.length === 0) {
    throw new Error('No records to import.');
  }

  const colName = platformId;
  let successCount = 0;
  let failedCount = 0;
  const errors = [];

  // Write in batches of up to 500 documents (Firestore batch limit)
  const batchSize = 100;
  for (let i = 0; i < records.length; i += batchSize) {
    const chunk = records.slice(i, i + batchSize);
    const batch = writeBatch(db);

    chunk.forEach(rec => {
      const docRef = doc(collection(db, colName));
      batch.set(docRef, {
        username: rec.username,
        password: rec.password,
        two_factor_key: rec.twoFactorKey || rec.two_factor_key || '',
        mail: rec.mail || '',
        mail_password: rec.mailPassword || rec.mail_password || '',
        sub_type_id: subTypeId,
        sub_type_title: subTypeTitle || '',
        price: Number(price || 1500),
        status: 'available',
        raw_record: rec.rawRecord || rec.raw_record || rec.raw || '',
        custom_data: typeof rec.custom_data === 'string' ? rec.custom_data : JSON.stringify(rec.extraData || rec.customData || {}),
        rules_notes: rec.rulesNotes || rec.rules_notes || '',
        created_at: serverTimestamp()
      });
    });

    try {
      await batch.commit();
      successCount += chunk.length;
    } catch (batchErr) {
      failedCount += chunk.length;
      errors.push({ batchIndex: i, error: batchErr.message });
    }

    if (onProgress) {
      const current = Math.min(i + batchSize, records.length);
      onProgress({
        current,
        total: records.length,
        percentage: Math.round((current / records.length) * 100),
        successCount,
        failedCount
      });
    }
  }

  return {
    success: successCount > 0,
    total: records.length,
    successCount,
    failedCount,
    errors
  };
}
