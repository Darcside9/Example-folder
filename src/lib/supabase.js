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
