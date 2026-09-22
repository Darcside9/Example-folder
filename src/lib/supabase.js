import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 
  import.meta.env.VITE_SUPABASE_URL || 
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL || 
  '';

const supabaseAnonKey = 
  import.meta.env.VITE_SUPABASE_ANON_KEY || 
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
  '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('placeholder') &&
  !supabaseUrl.includes('your-project')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Authentication Helpers supporting live Supabase backend with local fallback
 */
export async function authSignIn(email, password) {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    
    // Fetch or initialize profile
    let balance = 10.00;
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('balance, contact_info')
        .eq('id', data.user.id)
        .single();
      if (profile && profile.balance !== undefined) {
        balance = Number(profile.balance);
      }
    } catch {
      // ignore if profiles table is not yet migrated
    }

    const user = {
      id: data.user.id,
      email: data.user.email,
      contact: data.user.user_metadata?.contact || '',
      balance,
    };
    localStorage.setItem('cs_user', JSON.stringify(user));
    return { user, session: data.session };
  }

  // Fallback Local Simulation
  await new Promise((res) => setTimeout(res, 600));
  const user = {
    id: 'local-' + Date.now(),
    email,
    contact: 'WhatsApp Contact',
    balance: 10.00,
  };
  localStorage.setItem('cs_user', JSON.stringify(user));
  return { user, session: { token: 'mock-jwt-token' } };
}

export async function authSignUp(email, password, contact) {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { contact_info: contact },
      },
    });
    if (error) throw error;

    const user = {
      id: data.user?.id || 'new-user',
      email: data.user?.email || email,
      contact,
      balance: 10.00,
    };
    localStorage.setItem('cs_user', JSON.stringify(user));
    return { user, session: data.session };
  }

  // Fallback Local Simulation
  await new Promise((res) => setTimeout(res, 700));
  const user = {
    id: 'local-' + Date.now(),
    email,
    contact,
    balance: 10.00,
  };
  localStorage.setItem('cs_user', JSON.stringify(user));
  return { user, session: { token: 'mock-jwt-token' } };
}

export async function authSignOut() {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
  }
  localStorage.removeItem('cs_user');
}

export function getSavedSession() {
  try {
    const raw = localStorage.getItem('cs_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Update user email via Supabase Auth (initiates email_change OTP)
 */
export async function authUpdateEmail(newEmail) {
  if (isSupabaseConfigured && supabase) {
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session) {
      const { data, error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      return data;
    }
  }
  return { user: { email: newEmail } };
}

/**
 * Verify Email Change OTP via Supabase Auth
 */
export async function authVerifyEmailOtp(newEmail, token) {
  if (isSupabaseConfigured && supabase) {
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session) {
      const { data, error } = await supabase.auth.verifyOtp({
        email: newEmail,
        token,
        type: 'email_change'
      });
      if (error) throw error;
      return data;
    }
  }
  return { user: { email: newEmail } };
}

/**
 * Update user password after verifying current credentials
 */
export async function authUpdatePassword(email, currentPassword, newPassword) {
  if (isSupabaseConfigured && supabase) {
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session) {
      // 1. Verify current credentials against Supabase Auth
      if (currentPassword) {
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email,
          password: currentPassword
        });
        if (signInErr) {
          throw new Error('Current password is incorrect. Please check your credentials.');
        }
      }

      // 2. Update to new password
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });
      if (error) throw error;
      return data;
    }
  }
  // Local session update / demo mode
  return { success: true };
}

/**
 * Update profile attributes in public.profiles table
 */
export async function authUpdateProfile(userId, updates) {
  if (isSupabaseConfigured && supabase && userId) {
    const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    if (isValidUuid) {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.warn('Profile DB update error:', error);
      }
      return data;
    }
  }
  return updates;
}

