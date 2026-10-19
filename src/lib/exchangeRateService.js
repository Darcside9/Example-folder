// ==========================================================================
// CHRIS SHOPPER — GLOBAL DOLLAR EXCHANGE RATE SERVICE (USD TO NGN)
// Stores and synchronizes the site-wide USD-to-NGN conversion rate
// between Google Firebase Firestore, localStorage, and React state.
// ==========================================================================

import { 
  db, 
  FIREBASE_COLLECTIONS,
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot, 
  serverTimestamp 
} from './firebase';

export const DEFAULT_DOLLAR_RATE = 1600;
const STORAGE_KEY = 'cs_usd_to_ngn_rate';
const EVENT_NAME = 'dollar-rate-updated';
const SETTING_PRODUCT_ID = 'usd_exchange_rate';

/**
 * Get synchronously stored dollar exchange rate (0ms latency)
 */
export function getStoredDollarRate() {
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      const num = parseFloat(cached);
      if (!isNaN(num) && num > 0) return num;
    }
  } catch (err) {
    console.warn('Unable to read cached dollar rate:', err);
  }
  return DEFAULT_DOLLAR_RATE;
}

/**
 * Fetch latest dollar exchange rate from Google Firebase Firestore
 */
export async function fetchLiveDollarRate() {
  if (!db) return getStoredDollarRate();

  try {
    const docRef = doc(db, FIREBASE_COLLECTIONS.products_pricing, SETTING_PRODUCT_ID);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      const data = snap.data();
      const rate = Number(data.price_usd);
      if (!isNaN(rate) && rate > 0) {
        try {
          localStorage.setItem(STORAGE_KEY, String(rate));
        } catch {
          // Ignore localStorage errors
        }
        return rate;
      }
    }

    return getStoredDollarRate();
  } catch (err) {
    console.warn('Firebase exchange rate fetch fallback:', err.message);
    return getStoredDollarRate();
  }
}

/**
 * Admin updates dollar exchange rate in Google Firebase Firestore and broadcasts site-wide
 */
export async function saveDollarRate(newRate) {
  const numericRate = parseFloat(newRate);
  if (isNaN(numericRate) || numericRate <= 0) {
    throw new Error('Please enter a valid positive dollar exchange rate.');
  }

  try {
    if (db) {
      const docRef = doc(db, FIREBASE_COLLECTIONS.products_pricing, SETTING_PRODUCT_ID);
      await setDoc(docRef, {
        product_id: SETTING_PRODUCT_ID,
        name: 'USD to NGN Dollar Exchange Rate',
        product_type: 'system_setting',
        category: 'currency',
        price_usd: numericRate,
        is_active: true,
        carrier_speed: 'site_wide',
        updated_at: serverTimestamp()
      }, { merge: true });
    }

    // Update local cache
    try {
      localStorage.setItem(STORAGE_KEY, String(numericRate));
    } catch {
      // Ignore
    }

    // Broadcast event across app
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { rate: numericRate } }));
    }

    return { success: true, rate: numericRate };
  } catch (err) {
    console.error('Failed to save dollar exchange rate to Firebase:', err);
    // Still save to localStorage so the admin can continue working
    try {
      localStorage.setItem(STORAGE_KEY, String(numericRate));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { rate: numericRate } }));
      }
    } catch {
      // Ignore
    }
    return { success: true, rate: numericRate, warning: 'Saved locally. DB update failed: ' + err.message };
  }
}

/**
 * Subscribe to site-wide dollar rate updates (window event & Firebase Firestore Realtime)
 */
export function subscribeToDollarRate(callback) {
  if (typeof window === 'undefined') return () => {};

  const handleCustomEvent = (e) => {
    if (e.detail && e.detail.rate) {
      callback(e.detail.rate);
    }
  };

  window.addEventListener(EVENT_NAME, handleCustomEvent);

  // Firebase Realtime onSnapshot listener
  let unsubscribeRealtime = () => {};
  if (db) {
    try {
      const docRef = doc(db, FIREBASE_COLLECTIONS.products_pricing, SETTING_PRODUCT_ID);
      unsubscribeRealtime = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          const rate = Number(docSnap.data()?.price_usd);
          if (!isNaN(rate) && rate > 0) {
            try {
              localStorage.setItem(STORAGE_KEY, String(rate));
            } catch {
              // Ignore
            }
            callback(rate);
          }
        }
      }, (err) => {
        console.warn('Realtime dollar rate listener warning:', err.message);
      });
    } catch (err) {
      console.warn('Unable to attach Firestore dollar rate listener:', err.message);
    }
  }

  return () => {
    window.removeEventListener(EVENT_NAME, handleCustomEvent);
    if (unsubscribeRealtime) unsubscribeRealtime();
  };
}

/**
 * Helper to convert USD amount to NGN using given or active rate
 */
export function convertUsdToNgn(amountUsd, rate = getStoredDollarRate()) {
  const usd = Number(amountUsd) || 0;
  const r = Number(rate) || DEFAULT_DOLLAR_RATE;
  return Math.round(usd * r * 100) / 100;
}

/**
 * Helper to calculate profit margin and percentage
 */
export function calculateProfit(retailNgn, wholesaleNgn) {
  const retail = Number(retailNgn) || 0;
  const wholesale = Number(wholesaleNgn) || 0;
  const profitNgn = Math.round((retail - wholesale) * 100) / 100;
  const marginPct = wholesale > 0 ? Math.round(((retail - wholesale) / wholesale) * 100) : 0;
  return {
    profitNgn,
    marginPct,
    isProfitable: profitNgn >= 0
  };
}

/**
 * Format USD currency helper
 */
export function formatUsd(amount) {
  const num = Number(amount) || 0;
  return `$${num.toFixed(3)}`;
}
