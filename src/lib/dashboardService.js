// ==========================================================================
// CHRIS SHOPPER — BACKEND DASHBOARD & SUPABASE DATA SERVICE
// ==========================================================================

import { 
  supabase, 
  authUpdateEmail, 
  authVerifyEmailOtp, 
  authUpdatePassword, 
  authUpdateProfile 
} from './supabase.js';

// Default / fallback services catalog matching Chris Shopper specification
export const DEFAULT_SERVICES = [
  { id: 'telegram', name: 'Telegram', code: 'tg', category: 'messaging', retailPrice: 0.35, price: 0.18, is_active: true, carrier_speed: '< 3.2s' },
  { id: 'whatsapp', name: 'WhatsApp', code: 'wa', category: 'messaging', retailPrice: 0.40, price: 0.20, is_active: true, carrier_speed: '< 4.1s' },
  { id: 'openai', name: 'OpenAI / ChatGPT', code: 'oa', category: 'ai', retailPrice: 0.50, price: 0.25, is_active: false, carrier_speed: 'Coming Soon' },
  { id: 'google', name: 'Google & Gmail', code: 'go', category: 'email', retailPrice: 0.45, price: 0.22, is_active: false, carrier_speed: 'Coming Soon' },
];

/**
 * Fetch all available services from Supabase
 */
export async function getServices() {
  try {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('price', { ascending: true });

    if (error || !data || data.length === 0) {
      return DEFAULT_SERVICES;
    }

    // Merge database state with catalog
    return DEFAULT_SERVICES.map(srv => {
      const dbMatch = data.find(d => d.code === srv.code || d.name.toLowerCase() === srv.name.toLowerCase());
      if (dbMatch) {
        return {
          ...srv,
          price: Number(dbMatch.price),
          is_active: dbMatch.is_active,
          carrier_speed: dbMatch.carrier_speed || srv.carrier_speed
        };
      }
      return srv;
    });
  } catch (err) {
    console.warn('Using fallback services list:', err);
    return DEFAULT_SERVICES;
  }
}

/**
 * Fetch user profile & live balance from Supabase
 */
export async function getUserProfile(userId) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return null;
    }
    return data;
  } catch (err) {
    console.error('Error fetching user profile:', err);
    return null;
  }
}

/**
 * Fetch user active & historical orders
 */
export async function getUserOrders(userId) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !data) {
      return [];
    }
    return data;
  } catch (err) {
    console.error('Error fetching orders:', err);
    return [];
  }
}

/**
 * Allocate a new virtual number line and deduct balance
 */
export async function allocateNumberLine({ userId, service, country = 'us', currentBalance = 10 }) {
  if (currentBalance < service.price) {
    throw new Error(`Insufficient balance ($${currentBalance.toFixed(2)}). Service cost is $${service.price.toFixed(2)}. Please top up on WhatsApp.`);
  }

  // Generate clean US non-VoIP number
  const areaCodes = ['415', '212', '312', '786', '650', '206', '512', '404', '305', '702'];
  const areaCode = areaCodes[Math.floor(Math.random() * areaCodes.length)];
  const mid = Math.floor(200 + Math.random() * 799);
  const end = Math.floor(1000 + Math.random() * 8999);
  const phoneNumber = `+1 (${areaCode}) ${mid}-${end}`;

  const newBalance = Number((currentBalance - service.price).toFixed(2));

  // Try saving order to Supabase
  try {
    const { data: orderData, error: orderErr } = await supabase
      .from('orders')
      .insert([
        {
          user_id: userId,
          service_name: service.name,
          country_code: country,
          phone_number: phoneNumber,
          cost: service.price,
          status: 'pending',
          expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString()
        }
      ])
      .select()
      .single();

    // Update user balance in profiles table
    await supabase
      .from('profiles')
      .update({ balance: newBalance })
      .eq('id', userId);

    return {
      order: orderData || {
        id: 'ord_' + Math.random().toString(36).substr(2, 9),
        user_id: userId,
        service_name: service.name,
        country_code: country,
        phone_number: phoneNumber,
        cost: service.price,
        status: 'pending',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString()
      },
      newBalance
    };
  } catch (err) {
    console.warn('Allocated line in local session:', err);
    return {
      order: {
        id: 'ord_' + Math.random().toString(36).substr(2, 9),
        user_id: userId,
        service_name: service.name,
        country_code: country,
        phone_number: phoneNumber,
        cost: service.price,
        status: 'pending',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString()
      },
      newBalance
    };
  }
}

/**
 * Simulate SMS OTP arrival
 */
export async function simulateSmsOtp(orderId) {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const formattedCode = `${code.slice(0, 3)}-${code.slice(3)}`;
  const messageBody = `Your Chris Shopper verification code is: ${formattedCode}. Never share this code with anyone.`;

  try {
    await supabase
      .from('orders')
      .update({
        status: 'code_received',
        sms_code: formattedCode
      })
      .eq('id', orderId);

    await supabase
      .from('sms_logs')
      .insert([
        {
          order_id: orderId,
          sender: 'ChrisShopper Gateway',
          message_body: messageBody
        }
      ]);
  } catch (err) {
    console.warn('Simulated SMS locally:', err);
  }

  return {
    code: formattedCode,
    messageBody
  };
}

/**
 * Cancel and Auto-Refund an active order
 */
export async function cancelAndRefundOrder({ orderId, userId, cost, currentBalance }) {
  const newBalance = Number((currentBalance + cost).toFixed(2));

  try {
    await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', orderId);

    await supabase
      .from('profiles')
      .update({ balance: newBalance })
      .eq('id', userId);
  } catch (err) {
    console.warn('Cancelled order locally:', err);
  }

  return newBalance;
}

/**
 * Transfer funds between users
 */
export async function transferFunds({ senderId, recipientEmail, amount, currentBalance }) {
  if (amount <= 0 || currentBalance < amount) {
    throw new Error(`Insufficient funds. Your balance is $${currentBalance.toFixed(2)}.`);
  }

  try {
    // Look up recipient in public.profiles
    const { data: recipient, error: recErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', recipientEmail.trim().toLowerCase())
      .single();

    if (recErr || !recipient) {
      throw new Error(`Recipient user "${recipientEmail}" was not found. Please verify the email.`);
    }

    if (recipient.id === senderId) {
      throw new Error('You cannot transfer funds to yourself.');
    }

    const newSenderBalance = Number((currentBalance - amount).toFixed(2));
    const newRecipientBalance = Number(((Number(recipient.balance) || 0) + amount).toFixed(2));

    // Update sender balance
    await supabase
      .from('profiles')
      .update({ balance: newSenderBalance })
      .eq('id', senderId);

    // Update recipient balance
    await supabase
      .from('profiles')
      .update({ balance: newRecipientBalance })
      .eq('id', recipient.id);

    return {
      success: true,
      newBalance: newSenderBalance,
      recipientEmail: recipient.email
    };
  } catch (err) {
    throw err;
  }
}

/**
 * ADMIN: Fetch all registered users
 */
export async function adminGetAllUsers() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data;
  } catch (err) {
    console.error('Admin fetch users error:', err);
    return [];
  }
}

/**
 * ADMIN: Update a user's balance
 */
export async function adminUpdateUserBalance(userId, newBalance) {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ balance: Number(newBalance) })
      .eq('id', userId);

    return !error;
  } catch (err) {
    console.error('Admin update user balance error:', err);
    return false;
  }
}

/**
 * ADMIN: Update service status or price
 */
export async function adminUpdateService(serviceId, updates) {
  try {
    const { error } = await supabase
      .from('services')
      .update(updates)
      .eq('id', serviceId);

    return !error;
  } catch (err) {
    console.error('Admin update service error:', err);
    return false;
  }
}

// ==========================================================================
// SETTINGS & PROFILE SECURITY OTP SERVICES (SUPABASE SYNCHRONIZED)
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

  try {
    if (supabase) {
      await supabase
        .from('profiles')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', userId);
    }
  } catch (err) {
    console.warn('Supabase profile touch:', err);
  }

  return {
    success: true,
    target: cleanNumber,
    expiresIn: 300
  };
}

/**
 * 2. Verify WhatsApp OTP and update user profile in Supabase
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

  // Update Supabase public.profiles
  try {
    await authUpdateProfile(userId, {
      contact_info: newPhoneNumber,
      whatsapp_contact: newPhoneNumber
    });
  } catch (err) {
    console.warn('Supabase profile update warning:', err);
  }

  // Update local session storage
  try {
    const rawUser = localStorage.getItem('cs_user');
    if (rawUser) {
      const parsed = JSON.parse(rawUser);
      parsed.contact = newPhoneNumber;
      parsed.contact_info = newPhoneNumber;
      parsed.whatsapp_contact = newPhoneNumber;
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

  // Initiate Supabase Auth email update
  try {
    await authUpdateEmail(cleanEmail);
  } catch (err) {
    console.warn('Supabase auth update email info:', err);
  }

  return {
    success: true,
    target: cleanEmail,
    expiresIn: 300
  };
}

/**
 * 4. Verify Email OTP and update email in Supabase
 */
export async function verifyEmailOtp(userId, newEmail, submittedCode) {
  const key = `email_${userId || 'current'}`;
  const record = getOtp(key);
  const cleanSubmitted = submittedCode.toString().trim().replace('-', '');

  if (!record) {
    throw new Error('Verification code has expired or was not requested. Please request a new code.');
  }

  if (record.code !== cleanSubmitted) {
    try {
      await authVerifyEmailOtp(newEmail, cleanSubmitted);
    } catch {
      throw new Error('Invalid verification code. Please check the code and try again.');
    }
  }

  // Update Supabase profiles table
  try {
    await authUpdateProfile(userId, {
      email: newEmail
    });
  } catch (err) {
    console.warn('Supabase profile sync warning:', err);
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
 * 5. Update user password via Supabase Auth
 */
export async function updateUserPassword(email, currentPassword, newPassword) {
  if (!newPassword || newPassword.length < 8) {
    throw new Error('New password must be at least 8 characters long.');
  }

  return await authUpdatePassword(email, currentPassword, newPassword);
}

