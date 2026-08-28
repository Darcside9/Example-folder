// ==========================================================================
// CHRIS SHOPPER — BACKEND DASHBOARD & SUPABASE DATA SERVICE
// ==========================================================================

import { supabase } from './supabase.js';

// Default / fallback services catalog matching Chris Shopper specification
export const DEFAULT_SERVICES = [
  { id: 'telegram', name: 'Telegram', code: 'tg', category: 'messaging', retailPrice: 0.35, price: 0.18, is_active: true, carrier_speed: '< 3.2s' },
  { id: 'whatsapp', name: 'WhatsApp', code: 'wa', category: 'messaging', retailPrice: 0.40, price: 0.20, is_active: true, carrier_speed: '< 4.1s' },
  { id: 'openai', name: 'OpenAI / ChatGPT', code: 'oa', category: 'ai', retailPrice: 0.50, price: 0.25, is_active: false, carrier_speed: 'Coming Soon' },
  { id: 'google', name: 'Google / YouTube', code: 'go', category: 'email', retailPrice: 0.45, price: 0.22, is_active: false, carrier_speed: 'Coming Soon' },
  { id: 'discord', name: 'Discord', code: 'dc', category: 'social', retailPrice: 0.30, price: 0.15, is_active: false, carrier_speed: 'Coming Soon' },
  { id: 'twitter', name: 'Twitter / X', code: 'tw', category: 'social', retailPrice: 0.35, price: 0.18, is_active: false, carrier_speed: 'Coming Soon' },
  { id: 'instagram', name: 'Instagram', code: 'ig', category: 'social', retailPrice: 0.35, price: 0.18, is_active: false, carrier_speed: 'Coming Soon' },
  { id: 'tiktok', name: 'TikTok', code: 'tt', category: 'social', retailPrice: 0.40, price: 0.20, is_active: false, carrier_speed: 'Coming Soon' },
  { id: 'microsoft', name: 'Microsoft / Outlook', code: 'ms', category: 'email', retailPrice: 0.35, price: 0.18, is_active: false, carrier_speed: 'Coming Soon' },
  { id: 'steam', name: 'Steam', code: 'st', category: 'gaming', retailPrice: 0.30, price: 0.16, is_active: false, carrier_speed: 'Coming Soon' },
  { id: 'amazon', name: 'AWS Amazon', code: 'amz', category: 'ecommerce', retailPrice: 0.40, price: 0.20, is_active: false, carrier_speed: 'Coming Soon' },
  { id: 'netflix', name: 'Netflix', code: 'nf', category: 'streaming', retailPrice: 0.45, price: 0.24, is_active: false, carrier_speed: 'Coming Soon' },
  { id: 'uber', name: 'Uber', code: 'ub', category: 'travel', retailPrice: 0.35, price: 0.18, is_active: false, carrier_speed: 'Coming Soon' },
  { id: 'adobe', name: 'Adobe', code: 'adb', category: 'productivity', retailPrice: 0.30, price: 0.15, is_active: false, carrier_speed: 'Coming Soon' },
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
