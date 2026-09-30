// ==========================================================================
// CHRIS SHOPPER — SECURE LOGS SERVICE (APPWRITE CLOUD & SERVERLESS DISPENSER)
// Zero-trust inventory fetching, sanitized username browsing, atomic dispense,
// and 30-day credential retention lifecycle.
// ==========================================================================

import { siteConfig } from '../data/siteConfig';
import { fetchAvailableAccountLogs } from './appwriteDispenser';

export {
  getPurchasedLogs,
  fetchUserPurchasedLogs,
  savePurchasedLog,
  fetchAvailableAccountLogs,
  dispenseSpecificAccountLog,
  bulkDispenseAccountLogs,
  getLogExpiryInfo,
  LOG_EXPIRY_DAYS,
  LOG_EXPIRY_MS,
  adminBulkImportLogs
} from './appwriteDispenser';

const CLAIMED_STORAGE_KEY = 'cs_claimed_logs';

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
 * Format single credentials as downloadable .txt file content
 */
export function exportCredentialsAsText(cred) {
  const purchasedDate = cred.purchasedAt ? new Date(cred.purchasedAt).toLocaleString() : new Date().toLocaleString();
  const has2FA = Boolean(cred.twoFactorKey && cred.twoFactorKey !== 'N/A');
  const hasMail = Boolean(cred.mail && cred.mail !== 'N/A' && cred.mail !== cred.username);
  const hasMailPass = Boolean(cred.mailPassword && cred.mailPassword !== 'N/A');

  let credLines = [
    `Username / UID     : ${cred.username}`,
    `Password           : ${cred.password}`
  ];
  if (has2FA) credLines.push(`2FA Authenticator  : ${cred.twoFactorKey}`);
  if (hasMail) credLines.push(`Email Address      : ${cred.mail}`);
  if (hasMailPass) credLines.push(`Email Password     : ${cred.mailPassword}`);

  // Include any extra custom platform fields
  if (cred.extraData && typeof cred.extraData === 'object') {
    Object.entries(cred.extraData).forEach(([k, v]) => {
      if (['username', 'password', 'twoFactorKey', 'mail', 'mailPassword'].includes(k)) return;
      if (v) {
        const label = k.replace(/^custom_/, '').split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        credLines.push(`${label.padEnd(19)}: ${v}`);
      }
    });
  }

  let twoFaInstructions = has2FA ? `
=======================================================
INSTRUCTIONS FOR 2FA AUTHENTICATION:
1. Open any authenticator app or visit https://2fa.live
2. Paste the 2FA Secret Key into the generator
3. Copy the 6-digit dynamic code to log in.` : '';

  return `=======================================================
CHRIS SHOPPER — OFFICIAL ACCOUNT LOG DELIVERY
=======================================================
Service / Platform : ${cred.platform || 'Account Log'}
Order ID           : ${cred.id || 'N/A'}
Purchased Date     : ${purchasedDate}
Amount             : ₦${Number(cred.price || 1500).toLocaleString('en-NG')}
Retention Notice   : This account log is stored in your history
                     for 30 days before being automatically purged.

----------------- ACCOUNT CREDENTIALS -----------------
${credLines.join('\n')}

----------------- ONE-LINE COMBO FORMAT ----------------
${cred.comboString || `${cred.username}:${cred.password}${hasMail ? `:${cred.mail}` : ''}${hasMailPass ? `:${cred.mailPassword}` : ''}${has2FA ? `:${cred.twoFactorKey}` : ''}`}
${twoFaInstructions}
For technical support, message us on WhatsApp: ${siteConfig?.whatsappNumber || '+1234567890'}
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
    const cleanPlatform = (cred.platform || 'Log').replace(/\s+/g, '_');
    link.download = `ChrisShopper_${cleanPlatform}_${cred.username}.txt`;
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

/**
 * Format multiple purchased credentials as a bundled .txt document
 */
export function exportBulkCredentialsAsText(credentialsList) {
  let fileLines = [
    '=======================================================',
    'CHRIS SHOPPER — OFFICIAL BULK ACCOUNT LOGS DELIVERY',
    '=======================================================',
    `Total Accounts Purchased : ${credentialsList.length}`,
    `Delivery Timestamp       : ${new Date().toLocaleString()}`,
    '=======================================================',
    '30-DAY RETENTION POLICY NOTICE:',
    'Purchased account logs are securely retained in your',
    'Chris Shopper Purchase History for 30 days, after which',
    'they are permanently purged. Save this file for your records.',
    '=======================================================',
    ''
  ];

  credentialsList.forEach((cred, idx) => {
    fileLines.push(`[ACCOUNT #${idx + 1}: ${cred.platform || 'Account Log'}]`);
    fileLines.push(`Username / UID     : ${cred.username}`);
    fileLines.push(`Password           : ${cred.password}`);
    if (cred.twoFactorKey) fileLines.push(`2FA Secret Key     : ${cred.twoFactorKey}`);
    if (cred.mail) fileLines.push(`Email Address      : ${cred.mail}`);
    if (cred.mailPassword) fileLines.push(`Email Password     : ${cred.mailPassword}`);
    fileLines.push(`One-Line Combo     : ${cred.comboString || `${cred.username}:${cred.password}`}`);
    fileLines.push('-------------------------------------------------------');
  });

  fileLines.push(`Need support? Reach us on WhatsApp: ${siteConfig?.whatsappNumber || '+1234567890'}`);
  return fileLines.join('\n');
}

/**
 * Trigger download of all bulk purchased credentials (.txt)
 */
export function downloadBulkCredentialsFile(credentialsList) {
  try {
    const textContent = exportBulkCredentialsAsText(credentialsList);
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ChrisShopper_Bulk_${credentialsList.length}_Accounts_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (err) {
    console.error('Failed to download bulk credentials file:', err);
    return false;
  }
}

export async function fetchLiveLogs() {
  return await fetchAvailableAccountLogs();
}

export function getPlatformsCatalog(catalogData) {
  if (Array.isArray(catalogData)) return catalogData;
  return [];
}
