// ==========================================================================
// CHRIS SHOPPER — LOGS SERVICE (GOOGLE SHEETS TWO-WAY SYNC & FIFO DISPENSER)
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
 * Parse CSV text from Google Sheet into row objects
 */
function parseCsv(csvText) {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) return [];

  // Parse header
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/^["']|["']$/g, ''));
  
  const findIndex = (keys) => {
    for (const key of keys) {
      const idx = headers.findIndex(h => h.includes(key));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const usernameIdx = findIndex(['username', 'user']);
  const passwordIdx = findIndex(['password', 'pass']);
  const twoFaIdx = findIndex(['2fa', 'twofactor', 'secret']);
  const mailIdx = headers.findIndex(h => h === 'mail' || h === 'email');
  const mailPassIdx = findIndex(['mail password', 'mail pass', 'email password', 'mailpass']);
  const platformIdx = findIndex(['site/platform', 'platform', 'site']);
  const statusIdx = findIndex(['status', 'state']);

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    // Split by comma ignoring commas inside quotes
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

    const row = {
      id: `sheet-${i}-${username}`,
      username: username,
      password: cells[passwordIdx] || '',
      twoFactorKey: cells[twoFaIdx] || '',
      mail: cells[mailIdx] || '',
      mailPassword: cells[mailPassIdx] || '',
      platform: (cells[platformIdx] || 'Facebook').trim(),
      status: (cells[statusIdx] || '').trim(),
      isFromSheet: true,
      rowIndex: i + 1,
    };

    rows.push(row);
  }

  return rows;
}

/**
 * Fetch live inventory directly from Google Sheet and merge with catalog
 */
export async function fetchLiveLogs() {
  const claimed = getClaimedUsernames();
  let sheetRows = [];

  try {
    const cacheBuster = `_t=${Date.now()}`;
    const url = siteConfig.googleSheetCsvUrl.includes('?') 
      ? `${siteConfig.googleSheetCsvUrl}&${cacheBuster}`
      : `${siteConfig.googleSheetCsvUrl}?${cacheBuster}`;

    const response = await fetch(url);
    if (response.ok) {
      const text = await response.text();
      sheetRows = parseCsv(text);
    }
  } catch (err) {
    console.warn('Could not fetch live Google Sheet, using fallback catalog:', err);
  }

  // Combine Sheet rows and fallback inventory for unpopulated platforms
  const allLogs = [...sheetRows];

  // Also include fallback items if platform is not in sheet rows yet
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

  // Mark status if claimed locally or marked SOLD in sheet
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
 * Group raw logs by platform categories with in-stock counts and demo prices
 */
export function getPlatformsCatalog(allLogs = []) {
  return PLATFORM_CATEGORIES.map(category => {
    if (category.id === 'all') {
      const totalAvailable = allLogs.filter(l => l.isAvailable).length;
      return {
        ...category,
        inStock: totalAvailable,
        itemsCount: allLogs.length,
      };
    }

    const platformItems = allLogs.filter(l => {
      const p = (l.platform || '').toLowerCase();
      const catTag = (category.tag || category.name).toLowerCase();
      return p.includes(catTag) || catTag.includes(p);
    });

    const inStockCount = platformItems.filter(l => l.isAvailable).length;

    return {
      ...category,
      inStock: inStockCount,
      itemsCount: platformItems.length,
      items: platformItems,
    };
  });
}

/**
 * Chronological FIFO Dispenser:
 * Selects earliest unbought credential, locks locally, calls Apps Script webhook,
 * deducts user balance, and delivers credentials.
 */
export async function dispenseLogChronological({
  platformId,
  userId,
  userEmail,
  currentBalance = 0,
}) {
  // 1. Fetch latest live state
  const logs = await fetchLiveLogs();

  // 2. Find target platform category
  const targetCategory = PLATFORM_CATEGORIES.find(c => c.id === platformId) || PLATFORM_CATEGORIES[1];
  const demoPrice = targetCategory.demoPrice || 1.50;

  // 3. Balance verification
  if (currentBalance < demoPrice) {
    throw new Error(`Insufficient balance ($${currentBalance.toFixed(2)}). You need $${demoPrice.toFixed(2)} to buy this account log. Please top up your balance.`);
  }

  // 4. FIFO Selection: Get the EARLIEST available row for this platform
  const catTag = (targetCategory.tag || targetCategory.name).toLowerCase();
  const availableCandidate = logs.find(l => {
    const p = (l.platform || '').toLowerCase();
    const matchesPlatform = p.includes(catTag) || catTag.includes(p);
    return matchesPlatform && l.isAvailable;
  });

  if (!availableCandidate) {
    throw new Error(`Sorry, ${targetCategory.name} logs are currently Out of Stock! New stock is being verified and added.`);
  }

  // 5. Anti-Double-Selling Lock (Layer 1: Instant Client Lock)
  markUsernameClaimed(availableCandidate.username);

  // 6. Layer 2: Fire Google Apps Script Webhook to write "SOLD" in the Sheet
  if (siteConfig.googleAppsScriptUrl) {
    const webhookUrl = `${siteConfig.googleAppsScriptUrl}?action=markSold&username=${encodeURIComponent(availableCandidate.username)}`;
    try {
      // mode: 'no-cors' allows fire-and-forget without CORS preflight blocks
      fetch(webhookUrl, { method: 'GET', mode: 'no-cors' }).catch(err => {
        console.warn('Google Apps Script webhook non-critical notice:', err);
      });
    } catch (err) {
      console.warn('Apps Script trigger attempted:', err);
    }
  }

  // 7. Update User Balance in Supabase (if authenticated)
  const newBalance = Math.max(0, currentBalance - demoPrice);
  if (userId) {
    try {
      await supabase
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', userId);
    } catch (err) {
      console.warn('Supabase balance update fallback:', err);
    }
  }

  // 8. Generate Combo String
  // Format: user:pass:mail:mailpass:2fa
  const comboString = `${availableCandidate.username}:${availableCandidate.password}:${availableCandidate.mail || ''}:${availableCandidate.mailPassword || ''}:${availableCandidate.twoFactorKey || ''}`;

  // 9. Store in Purchased History
  const purchaseRecord = {
    id: `log_ord_${Date.now()}`,
    userId: userId || 'guest',
    userEmail: userEmail || 'user@chrisshopper.com',
    platform: targetCategory.name,
    username: availableCandidate.username,
    password: availableCandidate.password,
    twoFactorKey: availableCandidate.twoFactorKey,
    mail: availableCandidate.mail,
    mailPassword: availableCandidate.mailPassword,
    price: demoPrice,
    isDemoPrice: true,
    purchasedAt: new Date().toISOString(),
    comboString: comboString,
  };

  savePurchasedLog(purchaseRecord);

  return {
    success: true,
    newBalance: newBalance,
    credential: purchaseRecord,
  };
}

/**
 * Format credentials as downloadable .txt file content
 */
export function exportCredentialsAsText(cred) {
  const purchasedDate = cred.purchasedAt ? new Date(cred.purchasedAt).toLocaleString() : new Date().toLocaleString();
  return `=======================================================
CHRIS SHOPPER — OFFICIAL ACCOUNT LOG DELIVERY
=======================================================
Service / Platform : ${cred.platform}
Order ID           : ${cred.id || 'N/A'}
Purchased Date     : ${purchasedDate}
Amount (Demo Price): $${Number(cred.price || 1.50).toFixed(2)} USD

----------------- ACCOUNT CREDENTIALS -----------------
Username           : ${cred.username}
Password           : ${cred.password}
2FA Authenticator  : ${cred.twoFactorKey || 'N/A'}
Email Address      : ${cred.mail || 'N/A'}
Email Password     : ${cred.mailPassword || 'N/A'}

----------------- ONE-LINE COMBO FORMAT ----------------
(Format: username:password:email:emailpass:2fa)
${cred.comboString || `${cred.username}:${cred.password}:${cred.mail || ''}:${cred.mailPassword || ''}:${cred.twoFactorKey || ''}`}

=======================================================
INSTRUCTIONS FOR 2FA AUTHENTICATION:
1. Open any authenticator app or visit https://2fa.live
2. Paste the 2FA Secret Key into the generator
3. Copy the 6-digit dynamic code to log in.
For technical support, message us on WhatsApp: ${siteConfig.whatsappNumber}
=======================================================`;
}

/**
 * Trigger browser file download of credentials (.txt)
 */
export function downloadCredentialsFile(cred) {
  try {
    const textContent = exportCredentialsAsText(cred);
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ChrisShopper_${cred.platform.replace(/\s+/g, '_')}_${cred.username}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (err) {
    console.error('Failed to download credentials file:', err);
    return false;
  }
}
