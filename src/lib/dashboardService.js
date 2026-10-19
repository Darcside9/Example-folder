// ==========================================================================
// CHRIS SHOPPER — BACKEND DASHBOARD & GOOGLE FIREBASE DATA SERVICE
// Fully integrated with Google Firebase Cloud (Always-On Firestore & Auth)
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
import { siteConfig } from '../data/siteConfig';
import { 
  firebaseGetUserProfile, 
  firebaseGetAllUsers, 
  firebaseUpdateUserBalance,
  firebaseUpdateProfile,
  firebaseUpdatePassword
} from './firebaseAuth';
import { 
  orderTigerSmsNumber, 
  checkTigerSmsStatus, 
  cancelTigerSmsActivation, 
  finishTigerSmsActivation,
  getPlatformsForCountry 
} from './tigerSmsService';

// Default / fallback services catalog matching Chris Shopper specification (25 USA Platforms)
export const DEFAULT_SERVICES = [
  { id: 'whatsapp', name: 'WhatsApp / WA Business', code: 'wa', category: 'messaging', retailPrice: 3500, price: 2700, is_active: true, carrier_speed: '< 3s' },
  { id: 'telegram', name: 'Telegram', code: 'tg', category: 'messaging', retailPrice: 2000, price: 1500, is_active: true, carrier_speed: '< 3s' },
  { id: 'tiktok', name: 'TikTok / Douyin', code: 'lf', category: 'social', retailPrice: 1200, price: 700, is_active: true, carrier_speed: '< 4s' },
  { id: 'google', name: 'Google & Gmail', code: 'go', category: 'tech', retailPrice: 1600, price: 1020, is_active: true, carrier_speed: '< 4s' },
  { id: 'chatgpt', name: 'ChatGPT / OpenAI', code: 'dr', category: 'tech', retailPrice: 1300, price: 760, is_active: true, carrier_speed: '< 4s' },
  { id: 'apple', name: 'Apple / iCloud ID', code: 'wx', category: 'tech', retailPrice: 1000, price: 500, is_active: true, carrier_speed: '< 4s' },
  { id: 'instagram', name: 'Instagram + Threads', code: 'ig', category: 'social', retailPrice: 1400, price: 850, is_active: true, carrier_speed: '< 4s' },
  { id: 'facebook', name: 'Facebook / Meta', code: 'fb', category: 'social', retailPrice: 1300, price: 750, is_active: true, carrier_speed: '< 4s' },
  { id: 'twitter', name: 'Twitter / X', code: 'tw', category: 'social', retailPrice: 1300, price: 750, is_active: true, carrier_speed: '< 4s' },
  { id: 'signal', name: 'Signal Messenger', code: 'bw', category: 'messaging', retailPrice: 1000, price: 560, is_active: true, carrier_speed: '< 4s' },
  { id: 'viber', name: 'Viber', code: 'vi', category: 'messaging', retailPrice: 1100, price: 650, is_active: true, carrier_speed: '< 5s' },
  { id: 'paypal', name: 'PayPal', code: 'ts', category: 'finance', retailPrice: 2000, price: 1260, is_active: true, carrier_speed: '< 5s' },
  { id: 'cashapp', name: 'Cash App', code: 'it', category: 'finance', retailPrice: 1800, price: 1000, is_active: true, carrier_speed: '< 5s' },
  { id: 'snapchat', name: 'Snapchat', code: 'fu', category: 'social', retailPrice: 1400, price: 800, is_active: true, carrier_speed: '< 4s' },
  { id: 'twitch', name: 'Twitch', code: 'hb', category: 'entertainment', retailPrice: 2200, price: 1532, is_active: true, carrier_speed: '< 5s' },
  { id: 'netflix', name: 'Netflix', code: 'nf', category: 'entertainment', retailPrice: 1300, price: 765, is_active: true, carrier_speed: '< 5s' },
  { id: 'microsoft', name: 'Microsoft / Outlook', code: 'mm', category: 'tech', retailPrice: 1300, price: 718, is_active: true, carrier_speed: '< 4s' },
  { id: 'yahoo', name: 'Yahoo Mail', code: 'mb', category: 'tech', retailPrice: 1400, price: 890, is_active: true, carrier_speed: '< 4s' },
  { id: 'gmx', name: 'GMX Mail', code: 'abk', category: 'tech', retailPrice: 2600, price: 1830, is_active: true, carrier_speed: '< 6s' },
  { id: 'ebay', name: 'eBay', code: 'dh', category: 'commerce', retailPrice: 1500, price: 874, is_active: true, carrier_speed: '< 5s' },
  { id: 'tinder', name: 'Tinder (Swipe App)', code: 'oi', category: 'dating', retailPrice: 1400, price: 777, is_active: true, carrier_speed: '< 4s' },
  { id: 'match', name: 'Match.com', code: 'axr', category: 'dating', retailPrice: 4200, price: 3050, is_active: true, carrier_speed: '< 6s' },
  { id: 'okcupid', name: 'OkCupid', code: 'vm', category: 'dating', retailPrice: 1500, price: 884, is_active: true, carrier_speed: '< 5s' },
  { id: 'badoo', name: 'Badoo', code: 'qv', category: 'dating', retailPrice: 1400, price: 750, is_active: true, carrier_speed: '< 5s' },
  { id: 'other', name: 'Any Other Service', code: 'ot', category: 'other', retailPrice: 1300, price: 798, is_active: true, carrier_speed: '< 5s' },
];

/**
 * Fetch all available services from Firebase Firestore products_pricing
 */
export async function getServices() {
  if (!db) return DEFAULT_SERVICES;

  try {
    const colRef = collection(db, FIREBASE_COLLECTIONS.products_pricing);
    const snap = await getDocs(colRef);

    if (snap.empty) {
      return DEFAULT_SERVICES;
    }

    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    return DEFAULT_SERVICES.map(srv => {
      const dbMatch = docs.find(d => 
        (d.product_id && d.product_id.toLowerCase() === srv.id.toLowerCase()) || 
        (d.name && d.name.toLowerCase() === srv.name.toLowerCase())
      );
      if (dbMatch) {
        return {
          ...srv,
          price: Number(dbMatch.price_usd || srv.price),
          is_active: dbMatch.is_active !== false,
          carrier_speed: dbMatch.carrier_speed || srv.carrier_speed
        };
      }
      return srv;
    });
  } catch (err) {
    console.warn('Using fallback services list:', err.message);
    return DEFAULT_SERVICES;
  }
}

/**
 * Fetch user profile & live balance from Google Firebase user_profiles
 */
export async function getUserProfile(userId) {
  return await firebaseGetUserProfile(userId);
}

/**
 * Fetch user active & historical SMS number rental orders from Firestore orders.
 * Strictly filters by product_type === 'sms_service' so account logs never mix in.
 */
export async function getUserOrders(userId) {
  if (!db || !userId) return [];

  try {
    const colRef = collection(db, FIREBASE_COLLECTIONS.orders);
    const q = query(
      colRef,
      where('user_id', '==', userId),
      where('product_type', '==', 'sms_service')
    );
    const snap = await getDocs(q);

    const orders = snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        user_id: data.user_id,
        service_name: data.item_name,
        phone_number: data.reference,
        cost: Number(data.price || 0),
        status: data.status,
        created_at: data.created_at?.toDate ? data.created_at.toDate().toISOString() : (data.created_at || new Date().toISOString()),
        details: data.details
      };
    });

    // Sort descending by created_at
    orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return orders;
  } catch (err) {
    console.warn('Error fetching SMS orders from Firebase Firestore:', err.message);
    return [];
  }
}

/**
 * Fetch user historical purchased account logs from Firestore orders
 */
export async function getUserLogOrders(userId) {
  if (!db || !userId) return [];

  try {
    const colRef = collection(db, FIREBASE_COLLECTIONS.orders);
    const q = query(
      colRef,
      where('user_id', '==', userId),
      where('product_type', '==', 'account_log')
    );
    const snap = await getDocs(q);

    const logs = snap.docs.map(d => {
      const data = d.data();
      let det = {};
      try {
        if (data.details) det = typeof data.details === 'string' ? JSON.parse(data.details) : data.details;
      } catch {}

      const platformName = det.platform 
        ? det.platform.charAt(0).toUpperCase() + det.platform.slice(1)
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
        comboString: det.comboString || `${det.username || data.reference}:${det.password || ''}`,
        price: Number(data.price || 0),
        purchasedAt: createdAtStr,
        userId: data.user_id
      };
    });

    logs.sort((a, b) => new Date(b.purchasedAt) - new Date(a.purchasedAt));
    return logs;
  } catch (err) {
    console.warn('Error fetching log orders from Firebase Firestore:', err.message);
    return [];
  }
}

/**
 * Allocate a real virtual number line from Tiger SMS API Carrier Gateway and deduct balance in Firebase
 */
export async function allocateNumberLine({ userId, service, country = 'us', currentBalance = 10 }) {
  if (currentBalance < service.price) {
    throw new Error(`Insufficient balance (${siteConfig.formatNaira(currentBalance)}). Service cost is ${siteConfig.formatNaira(service.price)}. Please top up on WhatsApp.`);
  }

  const normCountry = String(country).toUpperCase();
  const isUK = normCountry === 'UK' || normCountry === 'GB' || normCountry === '16' || normCountry.includes('KINGDOM');
  const isCanada = normCountry === 'CA' || normCountry === '36' || normCountry.includes('CANADA');

  const countryId = isUK ? '16' : (isCanada ? '36' : '187');
  const countryCode = isUK ? 'UK' : (isCanada ? 'CA' : 'US');
  const countryName = isUK ? 'United Kingdom' : (isCanada ? 'Canada' : 'United States');
  const flag = isUK ? '🇬🇧' : (isCanada ? '🇨🇦' : '🇺🇸');

  // Resolve Tiger SMS Service Code
  const platforms = getPlatformsForCountry(countryCode);
  const matchedPlat = platforms.find(p => 
    p.id === service.id || 
    (service.tigerCode && p.tigerCode === service.tigerCode) || 
    (service.name && p.name.toLowerCase() === service.name.toLowerCase())
  );
  const serviceCode = matchedPlat?.tigerCode || service.tigerCode || service.id || 'ot';

  // Request REAL Virtual Line from Tiger SMS API Carrier Gateway
  const orderResult = await orderTigerSmsNumber({ serviceCode, countryId });
  if (!orderResult.success) {
    const errorMsg = (orderResult.message || '').includes('<') 
      ? `Carrier lines temporarily unavailable for ${service.name}. Your balance was not charged.`
      : (orderResult.message || `No carrier lines currently available for ${service.name}. Your balance was not charged.`);
    throw new Error(errorMsg);
  }

  const activationId = orderResult.activationId;
  const phoneNumber = orderResult.phoneNumber;
  const rawNumber = orderResult.rawNumber;

  const newBalance = Number((currentBalance - service.price).toFixed(2));

  // Save order directly into Google Firebase Firestore
  let orderId = 'ord-' + Date.now();
  if (db) {
    try {
      const colRef = collection(db, FIREBASE_COLLECTIONS.orders);
      const docRef = await addDoc(colRef, {
        user_id: userId,
        user_email: '',
        product_type: 'sms_service',
        item_name: `${service.name} (${countryCode})`,
        reference: phoneNumber,
        price: service.price,
        status: 'pending',
        details: JSON.stringify({ 
          country: countryCode, 
          countryName, 
          flag, 
          service: service.name, 
          phoneNumber,
          activationId,
          rawNumber,
          serviceCode,
          countryId
        }),
        created_at: serverTimestamp()
      });
      orderId = docRef.id;
    } catch (err) {
      console.warn('Firebase order record notice:', err.message);
    }
  }

  // Deduct user balance in Firebase Firestore
  try {
    await firebaseUpdateUserBalance(userId, newBalance);
  } catch (bErr) {
    console.warn('Firebase balance deduct note:', bErr.message);
  }

  // Update local session
  try {
    const raw = localStorage.getItem('cs_user');
    if (raw) {
      const u = JSON.parse(raw);
      u.balance = newBalance;
      localStorage.setItem('cs_user', JSON.stringify(u));
    }
  } catch {}

  // Dispatch global balance update event
  try {
    window.dispatchEvent(new CustomEvent('balance-updated', { detail: { balance: newBalance } }));
  } catch {}

  return {
    order: {
      id: orderId,
      activation_id: activationId,
      user_id: userId,
      service_name: service.name,
      service_code: serviceCode,
      country_code: countryCode,
      country_name: countryName,
      country_flag: flag,
      country_id: countryId,
      phone_number: phoneNumber,
      raw_number: rawNumber,
      cost: service.price,
      status: 'pending',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString()
    },
    newBalance
  };
}

/**
 * Cancel and Auto-Refund an active order in Firebase (supports user cancellation or timeout)
 */
export async function cancelAndRefundOrder({ orderId, activationId, userId, cost, currentBalance, status = 'cancelled' }) {
  // If order has an activationId with Tiger SMS, cancel activation on Tiger SMS
  if (activationId) {
    try {
      const cancelRes = await cancelTigerSmsActivation(activationId);
      if (!cancelRes.success && cancelRes.error === 'EARLY_CANCEL_DENIED') {
        throw new Error(cancelRes.message || 'Carriers require a 2-minute connection window before cancellation. Please retry shortly.');
      }
    } catch (tigerErr) {
      if (tigerErr.message && (tigerErr.message.includes('2-minute') || tigerErr.message.includes('EARLY_CANCEL_DENIED'))) {
        throw tigerErr;
      }
      console.warn('Tiger SMS cancel activation note:', tigerErr.message);
    }
  }

  const newBalance = Number((currentBalance + Number(cost)).toFixed(2));

  // Update order status and refund user balance in Firebase Firestore
  if (db) {
    try {
      if (orderId && !orderId.startsWith('ord-')) {
        const orderRef = doc(db, FIREBASE_COLLECTIONS.orders, orderId);
        await updateDoc(orderRef, {
          status,
          updated_at: serverTimestamp()
        });
      }
      await firebaseUpdateUserBalance(userId, newBalance);
    } catch (err) {
      console.warn('Firebase cancel order update notice:', err.message);
    }
  }

  try {
    const raw = localStorage.getItem('cs_user');
    if (raw) {
      const u = JSON.parse(raw);
      u.balance = newBalance;
      localStorage.setItem('cs_user', JSON.stringify(u));
    }
  } catch {}

  try {
    window.dispatchEvent(new CustomEvent('balance-updated', { detail: { balance: newBalance } }));
  } catch {}

  return { newBalance };
}

/**
 * Transfer funds between users in Google Firebase Firestore
 */
export async function transferFunds({ senderId, recipientEmail, amount, currentBalance }) {
  if (amount <= 0 || currentBalance < amount) {
    throw new Error(`Insufficient funds. Your balance is ${siteConfig.formatNaira(currentBalance)}.`);
  }

  const cleanRecipientEmail = recipientEmail.trim().toLowerCase();

  if (!db) {
    throw new Error('Database connection is not available.');
  }

  try {
    // Look up recipient in Firestore user_profiles
    const colRef = collection(db, FIREBASE_COLLECTIONS.user_profiles);
    const q = query(colRef, where('email', '==', cleanRecipientEmail), limit(1));
    const snap = await getDocs(q);

    if (snap.empty) {
      throw new Error(`Recipient user "${recipientEmail}" was not found. Please verify the email.`);
    }

    const recipientDoc = snap.docs[0];
    const recipientData = recipientDoc.data();
    const recipientUserId = recipientData.user_id || recipientDoc.id;

    if (recipientUserId === senderId) {
      throw new Error('You cannot transfer funds to yourself.');
    }

    const newSenderBalance = Number((currentBalance - amount).toFixed(2));
    const newRecipientBalance = Number(((Number(recipientData.balance) || 0) + amount).toFixed(2));

    // Update sender balance in Firestore
    await firebaseUpdateUserBalance(senderId, newSenderBalance);

    // Update recipient balance in Firestore
    const recipientRef = doc(db, FIREBASE_COLLECTIONS.user_profiles, recipientDoc.id);
    await setDoc(recipientRef, {
      balance: newRecipientBalance,
      updated_at: serverTimestamp()
    }, { merge: true });

    try {
      const raw = localStorage.getItem('cs_user');
      if (raw) {
        const u = JSON.parse(raw);
        u.balance = newSenderBalance;
        localStorage.setItem('cs_user', JSON.stringify(u));
      }
    } catch {}

    try {
      window.dispatchEvent(new CustomEvent('balance-updated', { detail: { balance: newSenderBalance } }));
    } catch {}

    return {
      success: true,
      newBalance: newSenderBalance,
      recipientEmail: recipientData.email || cleanRecipientEmail
    };
  } catch (err) {
    throw err;
  }
}

/**
 * ADMIN: Fetch all registered users from Firebase Firestore
 */
export async function adminGetAllUsers() {
  return await firebaseGetAllUsers();
}

/**
 * ADMIN: Update a user's balance in Firebase Firestore
 */
export async function adminUpdateUserBalance(userId, newBalance) {
  return await firebaseUpdateUserBalance(userId, newBalance);
}

// ==========================================================================
// SETTINGS & PROFILE SECURITY OTP SERVICES (FIREBASE SYNCHRONIZED)
// ==========================================================================

const OTP_STORE_KEY = 'cs_pending_otps';

function getOtpStore() {
  try {
    const raw = sessionStorage.getItem(OTP_STORE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveOtp(key, data) {
  try {
    const store = getOtpStore();
    store[key] = {
      ...data,
      createdAt: Date.now(),
      expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes validity
    };
    sessionStorage.setItem(OTP_STORE_KEY, JSON.stringify(store));
  } catch (err) {
    console.warn('Failed to save OTP to session storage:', err);
  }
}

function getOtp(key) {
  try {
    const store = getOtpStore();
    const item = store[key];
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      delete store[key];
      sessionStorage.setItem(OTP_STORE_KEY, JSON.stringify(store));
      return null;
    }
    return item;
  } catch {
    return null;
  }
}

function clearOtp(key) {
  try {
    const store = getOtpStore();
    delete store[key];
    sessionStorage.setItem(OTP_STORE_KEY, JSON.stringify(store));
  } catch {}
}

function generate6DigitOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * 1. Request WhatsApp OTP for phone number update
 */
export async function requestWhatsAppOtp(userId, newPhoneNumber) {
  const cleanNumber = newPhoneNumber.trim();
  if (!cleanNumber || cleanNumber.length < 7) {
    throw new Error('Please enter a valid phone number with country code (e.g. +1 202 555 0143).');
  }

  const code = generate6DigitOtp();
  const key = `phone_${userId || 'current'}`;
  saveOtp(key, { target: cleanNumber, code });

  return {
    success: true,
    target: cleanNumber,
    expiresIn: 300
  };
}

/**
 * 2. Verify WhatsApp OTP and update user profile in Firebase
 */
export async function verifyWhatsAppOtp(userId, newPhoneNumber, submittedCode) {
  const key = `phone_${userId || 'current'}`;
  const record = getOtp(key);
  const cleanSubmitted = submittedCode.toString().trim().replace('-', '');
  
  if (!record) {
    throw new Error('Verification code has expired or was not requested. Please request a new code.');
  }

  if (record.code !== cleanSubmitted) {
    throw new Error('Invalid verification code. Please check the code and try again.');
  }

  // Update Firebase user_profiles
  try {
    await firebaseUpdateProfile(userId, {
      contact_info: newPhoneNumber
    });
  } catch (err) {
    console.warn('Firebase profile contact update warning:', err.message);
  }

  // Update local session storage
  try {
    const rawUser = localStorage.getItem('cs_user');
    if (rawUser) {
      const parsed = JSON.parse(rawUser);
      parsed.contact = newPhoneNumber;
      parsed.contact_info = newPhoneNumber;
      localStorage.setItem('cs_user', JSON.stringify(parsed));
    }
  } catch {}

  clearOtp(key);
  return { success: true, verifiedNumber: newPhoneNumber };
}

/**
 * 3. Request Email OTP for email update
 */
export async function requestEmailOtp(userId, newEmail) {
  const cleanEmail = newEmail.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
    throw new Error('Please enter a valid email address.');
  }

  const code = generate6DigitOtp();
  const key = `email_${userId || 'current'}`;
  saveOtp(key, { target: cleanEmail, code });

  return {
    success: true,
    target: cleanEmail,
    expiresIn: 300
  };
}

/**
 * 4. Verify Email OTP and update email in Firebase
 */
export async function verifyEmailOtp(userId, newEmail, submittedCode) {
  const key = `email_${userId || 'current'}`;
  const record = getOtp(key);
  const cleanSubmitted = submittedCode.toString().trim().replace('-', '');

  if (!record) {
    throw new Error('Verification code has expired or was not requested. Please request a new code.');
  }

  if (record.code !== cleanSubmitted) {
    throw new Error('Invalid verification code. Please check the code and try again.');
  }

  // Update Firebase user_profiles
  try {
    await firebaseUpdateProfile(userId, {
      email: newEmail
    });
  } catch (err) {
    console.warn('Firebase profile email update warning:', err.message);
  }

  // Update local session storage
  try {
    const rawUser = localStorage.getItem('cs_user');
    if (rawUser) {
      const parsed = JSON.parse(rawUser);
      parsed.email = newEmail;
      localStorage.setItem('cs_user', JSON.stringify(parsed));
    }
  } catch {}

  clearOtp(key);
  return { success: true, verifiedEmail: newEmail };
}

/**
 * 5. Update user password via Firebase Auth
 */
export async function updateUserPassword(email, currentPassword, newPassword) {
  if (!newPassword || newPassword.length < 8) {
    throw new Error('New password must be at least 8 characters long.');
  }

  return await firebaseUpdatePassword(newPassword, currentPassword);
}
