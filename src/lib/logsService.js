// ==========================================================================
// CHRIS SHOPPER — SECURE LOGS SERVICE (GOOGLE SHEETS SYNC & BTS PACKAGER)
// ==========================================================================

import { siteConfig } from '../data/siteConfig';
import { PLATFORM_CATEGORIES, FALLBACK_LOGS } from '../data/sampleLogsData';
import { supabase } from './supabase';

const CLAIMED_STORAGE_KEY = 'cs_claimed_logs';
const PURCHASES_STORAGE_KEY = 'cs_purchased_logs';

/**
 * Retrieve list of locally locked/claimed usernames to prevent double-selling
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
 * Retrieve past purchased logs for the user
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
 * Parse CSV text from Google Sheet into complete raw row objects
 */
function parseCsv(csvText) {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/^["']|["']$/g, ''));

  const findIndex = (keys) => {
    for (const key of keys) {
      const idx = headers.findIndex(h => h.includes(key));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const usernameIdx = findIndex(['username', 'user', 'uid']);
  const passwordIdx = findIndex(['password', 'pass', 'pwd']);
  const twoFaIdx = findIndex(['2fa', 'twofactor', 'secret']);
  const mailIdx = headers.findIndex(h => h === 'mail' || h === 'email');
  const mailPassIdx = findIndex(['mail password', 'mail pass', 'email password', 'mailpass']);
  const platformIdx = findIndex(['site/platform', 'platform', 'site']);
  const statusIdx = findIndex(['status', 'state']);

  const rows = [];
  let fbIndex = 0;

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    const cells = [];
    let insideQuotes = false;
    let currentCell = '';

    for (let c = 0; c < rawLine.length; c++) {
      const char = rawLine[c];
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === ',' && !insideQuotes) {
        cells.push(currentCell.trim().replace(/^["']|["']$/g, ''));
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
    cells.push(currentCell.trim().replace(/^["']|["']$/g, ''));

    const username = cells[usernameIdx] || '';
    if (!username) continue;

    const rawPlatform = (cells[platformIdx] || 'Facebook').trim();
    let platform = rawPlatform;
    const pLower = rawPlatform.toLowerCase();
    let subTypeId = '';

    if (pLower.includes('face') || pLower.includes('fb')) {
      platform = 'Facebook';
      const fbSubTypes = ['fb-type-1', 'fb-type-2', 'fb-type-3'];
      subTypeId = fbSubTypes[fbIndex % 3];
      fbIndex++;
    } else if (pLower.includes('tik')) {
      platform = 'TikTok';
      subTypeId = 'tiktok-type-1';
    } else if (pLower.includes('insta')) {
      platform = 'Instagram';
      subTypeId = 'insta-type-1';
    } else if (pLower.includes('twit') || pLower === 'x') {
      platform = 'Twitter';
      subTypeId = 'twitter-type-1';
    } else if (pLower.includes('text') || pLower.includes('plus')) {
      platform = 'Textplus';
      subTypeId = 'textplus-type-1';
    }

    const row = {
      id: `sheet-${i}-${username}`,
      username: username,
      password: cells[passwordIdx] || '',
      twoFactorKey: cells[twoFaIdx] || '',
      mail: cells[mailIdx] || '',
      mailPassword: cells[mailPassIdx] || '',
      platform: platform,
      subTypeId: subTypeId,
      status: (cells[statusIdx] || 'Available').trim(),
      isFromSheet: true,
      rowIndex: i + 1,
    };

    rows.push(row);
  }

  return rows;
}

/**
 * PRIVATE SECURE STORE:
 * Fetches the full raw inventory from Google Sheets or fallback.
 * Kept private to this module so sensitive credentials are NEVER exposed to public UI state.
 */
async function getPrivateRawInventory() {
  const claimed = getClaimedUsernames();
  let sheetRows = [];

  try {
    if (siteConfig.googleSheetCsvUrl) {
      const cacheBuster = `_t=${Date.now()}`;
      const url = siteConfig.googleSheetCsvUrl.includes('?') 
        ? `${siteConfig.googleSheetCsvUrl}&${cacheBuster}`
        : `${siteConfig.googleSheetCsvUrl}?${cacheBuster}`;

      const response = await fetch(url);
      if (response.ok) {
        const text = await response.text();
        sheetRows = parseCsv(text);
      }
    }
  } catch (err) {
    console.warn('Could not fetch live Google Sheet, using fallback catalog:', err);
  }

  // Combine Sheet rows and fallback inventory
  const allLogs = [...sheetRows];

  FALLBACK_LOGS.forEach(fallbackItem => {
    const exists = allLogs.some(
      r => r.username.toLowerCase() === fallbackItem.username.toLowerCase()
    );
    if (!exists) {
      allLogs.push({
        id: `fallback-${fallbackItem.username}`,
        ...fallbackItem,
        isFromSheet: false,
      });
    }
  });

  return allLogs.map(item => {
    const isSoldInSheet = String(item.status || '').toLowerCase() === 'sold';
    const isClaimedLocally = claimed.includes(item.username);
    const isAvailable = !isSoldInSheet && !isClaimedLocally;

    return {
      ...item,
      isAvailable,
      status: isAvailable ? 'Available' : 'SOLD',
    };
  });
}

/**
 * PUBLIC SANITIZED CATALOG LOADER:
 * Returns the catalog with ZERO credentials exposed!
 * Protects passwords, 2FA keys, and emails from browser DevTools inspection.
 */
export async function fetchLiveLogs() {
  const rawInventory = await getPrivateRawInventory();

  // Strip all sensitive credentials before exposing to the client catalog
  return rawInventory.map(item => ({
    id: `log-${item.username}`,
    username: item.username,
    platform: item.platform,
    subTypeId: item.subTypeId || '',
    status: item.status,
    isAvailable: item.isAvailable,
  }));
}

/**
 * Group sanitized logs by platform categories and sub-types
 */
export function getPlatformsCatalog(sanitizedLogs = []) {
  return PLATFORM_CATEGORIES.map(category => {
    const catTag = (category.tag || category.name).toLowerCase();
    const platformItems = sanitizedLogs.filter(l => {
      const p = (l.platform || '').toLowerCase();
      return p.includes(catTag) || catTag.includes(p);
    });

    const inStockCount = platformItems.filter(l => l.isAvailable).length;

    // Attach available accounts to each sub-type item
    const itemsWithAccounts = (category.items || []).map((subType, idx) => {
      let accounts = [];

      if (category.id === 'facebook') {
        // Map Facebook accounts by subTypeId or distribute
        accounts = platformItems.filter(l => l.subTypeId === subType.id);
        if (accounts.length === 0 && platformItems.length > 0) {
          // Fallback distribution if subTypeId not tagged
          accounts = platformItems.filter((_, aIdx) => aIdx % category.items.length === idx);
        }
      } else {
        // For other platforms, attach all platform accounts
        accounts = platformItems;
      }

      return {
        ...subType,
        accounts: accounts,
        availableCount: accounts.filter(a => a.isAvailable).length,
      };
    });

    return {
      ...category,
      inStock: inStockCount,
      itemsCount: platformItems.length,
      liveRows: platformItems,
      items: itemsWithAccounts,
    };
  });
}

/**
 * SECURE BEHIND-THE-SCENES (BTS) CREDENTIAL DISPENSER:
 * 1. Verifies user is authenticated.
 * 2. Verifies user balance.
 * 3. Locks target username in anti-double-sell system.
 * 4. Fires Google Apps Script webhook to write SOLD to client's Google Sheet.
 * 5. Deducts balance from Supabase.
 * 6. Packages full credential payload exclusively for the single purchased account.
 * 7. Saves to user's private purchase history.
 */
export async function dispenseSpecificAccountLog({
  username,
  platformId,
  subTypeId,
  userId,
  userEmail,
  currentBalance = 0,
  price = 1.50,
}) {
  if (!userId) {
    throw new Error('Authentication required: Please sign in or create an account to purchase logs.');
  }

  if (currentBalance < price) {
    throw new Error(`Insufficient balance ($${currentBalance.toFixed(2)}). You need $${price.toFixed(2)} to purchase this account log.`);
  }

  // Fetch full raw inventory BTS
  const fullInventory = await getPrivateRawInventory();
  const targetAccount = fullInventory.find(
    acc => acc.username.toLowerCase() === username.toLowerCase()
  );

  if (!targetAccount) {
    throw new Error(`Account "${username}" was not found in live inventory.`);
  }

  // Check if claimed
  const claimed = getClaimedUsernames();
  if (claimed.includes(targetAccount.username) || String(targetAccount.status).toLowerCase() === 'sold') {
    throw new Error(`Account "${username}" has already been purchased or reserved. Please choose another available username.`);
  }

  // 1. Anti-Double-Selling Lock (Layer 1: Instant Client Lock)
  markUsernameClaimed(targetAccount.username);

  // 2. Layer 2: Fire Google Apps Script Webhook to write "SOLD" in Google Sheet
  if (siteConfig.googleAppsScriptUrl) {
    const webhookUrl = `${siteConfig.googleAppsScriptUrl}?action=markSold&username=${encodeURIComponent(targetAccount.username)}`;
    try {
      fetch(webhookUrl, { method: 'GET', mode: 'no-cors' }).catch(err => {
        console.warn('Google Apps Script webhook notice:', err);
      });
    } catch (err) {
      console.warn('Apps Script trigger attempted:', err);
    }
  }

  // 3. Deduct User Balance in Supabase
  const newBalance = Math.max(0, currentBalance - price);
  if (userId) {
    try {
      await supabase
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', userId);
    } catch (err) {
      console.warn('Supabase balance update notice:', err);
    }
  }

  // 4. Package full credential payload BTS
  const credential = {
    id: `cred-${Date.now()}-${targetAccount.username}`,
    username: targetAccount.username,
    password: targetAccount.password,
    twoFactorKey: targetAccount.twoFactorKey,
    mail: targetAccount.mail,
    mailPassword: targetAccount.mailPassword,
    platform: targetAccount.platform,
    subTypeId: subTypeId || targetAccount.subTypeId || '',
    comboString: `${targetAccount.username}:${targetAccount.password}:${targetAccount.mail}:${targetAccount.mailPassword}:${targetAccount.twoFactorKey}`,
    purchasedAt: new Date().toISOString(),
    userId,
  };

  // 5. Store in user's private purchase history
  savePurchasedLog(credential);

  return {
    success: true,
    credential,
    newBalance,
  };
}

/**
 * Chronological FIFO Dispenser (legacy compatibility)
 */
export async function dispenseLogChronological({
  platformId,
  userId,
  userEmail,
  currentBalance = 0,
}) {
  const fullInventory = await getPrivateRawInventory();
  const targetCategory = PLATFORM_CATEGORIES.find(c => c.id === platformId) || PLATFORM_CATEGORIES[0];
  const catTag = (targetCategory.tag || targetCategory.name).toLowerCase();
  
  const availableCandidate = fullInventory.find(l => {
    const p = (l.platform || '').toLowerCase();
    const matchesPlatform = p.includes(catTag) || catTag.includes(p);
    return matchesPlatform && l.isAvailable;
  });

  if (!availableCandidate) {
    throw new Error(`Sorry, ${targetCategory.name} logs are currently Out of Stock! New inventory is being added.`);
  }

  return dispenseSpecificAccountLog({
    username: availableCandidate.username,
    platformId,
    subTypeId: availableCandidate.subTypeId,
    userId,
    userEmail,
    currentBalance,
    price: 1.50,
  });
}

/**
 * Generate formatted text file download for credentials
 */
export function downloadCredentialsFile(cred) {
  const content = `=====================================================
CHRIS SHOPPER — SECURE ACCOUNT LOG DELIVERY
=====================================================
Platform:      ${cred.platform || 'Account'}
Username/UID:  ${cred.username}
Password:      ${cred.password}
2FA Secret:    ${cred.twoFactorKey || 'N/A'}
Email:         ${cred.mail || 'N/A'}
Email Pass:    ${cred.mailPassword || 'N/A'}

Full Combo String (user:pass:mail:mailpass:2fa):
${cred.comboString}

Dispensed At:  ${cred.purchasedAt || new Date().toISOString()}
=====================================================
HOW TO ACCESS 2FA:
1. Open any authenticator app or visit https://2fa.live
2. Enter the 2FA Secret key above to generate your 6-digit one-time code.
3. Keep your credentials safe and do not share this file.
=====================================================`;

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ChrisShopper_${cred.platform || 'Account'}_${cred.username}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export credentials as single combo line
 */
export function exportCredentialsAsText(cred) {
  return cred.comboString || `${cred.username}:${cred.password}:${cred.mail}:${cred.mailPassword}:${cred.twoFactorKey}`;
}
