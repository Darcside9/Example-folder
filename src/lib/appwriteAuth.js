// ==========================================================================
// CHRIS SHOPPER — APPWRITE NATIVE AUTH & PROFILE SERVICE
// Fully replaces legacy Supabase auth with native Appwrite Cloud accounts,
// sessions, and real-time user profiles with live balance tracking.
// ==========================================================================

import { account, databases, APPWRITE_CONFIG, ID, Query } from './appwrite';
import { ADMIN_CONTACT } from '../data/siteConfig';

const SESSION_USER_KEY = 'cs_user';
const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL || ADMIN_CONTACT.adminEmail || 'darcside999@gmail.com').toLowerCase();

/**
 * Helper to get currently cached session user from localStorage
 */
export function getSavedSession() {
  try {
    const raw = localStorage.getItem(SESSION_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Register a new user with Appwrite Auth & create their user_profiles document
 */
export async function appwriteSignUp(email, password, contactInfo = '', name = '') {
  const cleanEmail = email.trim().toLowerCase();
  const userName = name.trim() || cleanEmail.split('@')[0];

  // 1. Create Appwrite Account
  const newAccount = await account.create(
    ID.unique(),
    cleanEmail,
    password,
    userName
  );

  // 2. Create Session (log in immediately)
  let session = null;
  try {
    session = await account.createEmailPasswordSession(cleanEmail, password);
  } catch (sessErr) {
    console.warn('Session creation notice:', sessErr.message);
  }

  // 3. Determine Role (First registered account OR configured admin email gets 'admin')
  let role = 'user';
  if (cleanEmail === ADMIN_EMAIL) {
    role = 'admin';
  } else {
    try {
      const existingProfiles = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.user_profiles,
        [Query.limit(1)]
      );
      if (existingProfiles.total === 0) {
        role = 'admin';
      }
    } catch {
      // fallback
    }
  }
  const initialBalance = 10.00;

  // 4. Create document in user_profiles collection
  let profileDoc = null;
  try {
    profileDoc = await databases.createDocument(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.collections.user_profiles,
      ID.unique(),
      {
        user_id: newAccount.$id,
        email: cleanEmail,
        contact_info: contactInfo || '',
        balance: initialBalance,
        role: role
      }
    );
  } catch (err) {
    console.error('Error creating user profile in Appwrite:', err);
  }

  const userObj = {
    id: newAccount.$id,
    email: cleanEmail,
    name: userName,
    contact: contactInfo,
    contact_info: contactInfo,
    balance: initialBalance,
    role: role,
    is_admin: role === 'admin' || cleanEmail === ADMIN_EMAIL,
    profileDocId: profileDoc?.$id || null
  };

  localStorage.setItem(SESSION_USER_KEY, JSON.stringify(userObj));
  return { user: userObj, session };
}

/**
 * Sign in an existing user with Appwrite Auth & retrieve live profile + balance
 */
export async function appwriteSignIn(email, password) {
  const cleanEmail = email.trim().toLowerCase();

  // 1. Clean up dangling local session if present
  try {
    if (localStorage.getItem(SESSION_USER_KEY)) {
      await account.deleteSession('current');
    }
  } catch {
    // No active session to delete
  }

  // 2. Create Email/Password Session
  let session;
  try {
    session = await account.createEmailPasswordSession(cleanEmail, password);
  } catch (err) {
    console.error('Appwrite signIn error:', err);
    if (err.message && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
      throw new Error('Connection to Appwrite Cloud failed (Failed to fetch). Please check your internet connection or verify domain settings.');
    }
    throw err;
  }

  // 3. Fetch active Appwrite Account
  const authUser = await account.get();

  // 4. Query user_profiles in Appwrite Cloud DB
  let profileDoc = null;
  try {
    const res = await databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.collections.user_profiles,
      [Query.equal('user_id', authUser.$id), Query.limit(1)]
    );
    if (res.documents.length > 0) {
      profileDoc = res.documents[0];
    } else {
      // Fallback query by email if user_id was registered with another client
      const resByEmail = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.user_profiles,
        [Query.equal('email', cleanEmail), Query.limit(1)]
      );
      if (resByEmail.documents.length > 0) {
        profileDoc = resByEmail.documents[0];
        // Link user_id to document
        await databases.updateDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.user_profiles,
          profileDoc.$id,
          { user_id: authUser.$id }
        );
      }
    }
  } catch (err) {
    console.warn('Error reading profile:', err.message);
  }

  // If user profile doc still doesn't exist, create it now
  const role = (profileDoc?.role || (cleanEmail === ADMIN_EMAIL ? 'admin' : 'user'));
  const balance = profileDoc?.balance !== undefined ? Number(profileDoc.balance) : 10.00;
  const contact = profileDoc?.contact_info || '';

  if (!profileDoc) {
    try {
      profileDoc = await databases.createDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.user_profiles,
        ID.unique(),
        {
          user_id: authUser.$id,
          email: cleanEmail,
          contact_info: contact,
          balance: balance,
          role: role
        }
      );
    } catch (err) {
      console.warn('Auto profile create note:', err.message);
    }
  }

  const userObj = {
    id: authUser.$id,
    email: cleanEmail,
    name: authUser.name || cleanEmail.split('@')[0],
    contact: contact,
    contact_info: contact,
    balance: balance,
    role: role,
    is_admin: role === 'admin' || cleanEmail === ADMIN_EMAIL,
    profileDocId: profileDoc?.$id || null
  };

  localStorage.setItem(SESSION_USER_KEY, JSON.stringify(userObj));
  return { user: userObj, session };
}

/**
 * Sign out current user from Appwrite & clear local cache
 */
export async function appwriteSignOut() {
  try {
    await account.deleteSession('current');
  } catch (err) {
    console.warn('Appwrite signout session warning:', err.message);
  }
  localStorage.removeItem(SESSION_USER_KEY);
  return true;
}

/**
 * Get active session user with live profile and balance
 */
export async function appwriteGetSession() {
  try {
    const authUser = await account.get();
    if (authUser && authUser.$id) {
      const profile = await appwriteGetUserProfile(authUser.$id);
      const cleanEmail = authUser.email.toLowerCase();
      const role = profile?.role || (cleanEmail === ADMIN_EMAIL ? 'admin' : 'user');
      const balance = profile?.balance !== undefined ? Number(profile.balance) : 10.00;

      const userObj = {
        id: authUser.$id,
        email: cleanEmail,
        name: authUser.name || cleanEmail.split('@')[0],
        contact: profile?.contact_info || '',
        contact_info: profile?.contact_info || '',
        balance: balance,
        role: role,
        is_admin: role === 'admin' || cleanEmail === ADMIN_EMAIL,
        profileDocId: profile?.$id || null
      };
      localStorage.setItem(SESSION_USER_KEY, JSON.stringify(userObj));
      return userObj;
    }
  } catch {
    // If Appwrite session has expired or guest, check local storage fallback
  }

  return getSavedSession();
}

/**
 * Fetch a single user profile from Appwrite user_profiles collection
 */
export async function appwriteGetUserProfile(userId) {
  try {
    const res = await databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.collections.user_profiles,
      [Query.equal('user_id', userId), Query.limit(1)]
    );
    if (res.documents.length > 0) {
      const doc = res.documents[0];
      return {
        ...doc,
        balance: Number(doc.balance || 0)
      };
    }
    return null;
  } catch (err) {
    console.warn('Error fetching Appwrite user profile:', err.message);
    return null;
  }
}

/**
 * ADMIN: Update a user's wallet balance in Appwrite Cloud
 */
export async function appwriteUpdateUserBalance(userId, newBalance) {
  try {
    const res = await databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.collections.user_profiles,
      [Query.equal('user_id', userId), Query.limit(1)]
    );

    const numericBalance = Number(Number(newBalance).toFixed(2));

    if (res.documents.length > 0) {
      const doc = res.documents[0];
      await databases.updateDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.user_profiles,
        doc.$id,
        { balance: numericBalance }
      );
      return true;
    }
    return false;
  } catch (err) {
    console.error('Appwrite update user balance error:', err);
    return false;
  }
}

/**
 * ADMIN: Fetch all registered users from Appwrite user_profiles
 */
export async function appwriteGetAllUsers() {
  try {
    const res = await databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.collections.user_profiles,
      [Query.limit(100), Query.orderDesc('$createdAt')]
    );

    return res.documents.map(d => ({
      id: d.user_id || d.$id,
      user_id: d.user_id,
      email: d.email,
      contact_info: d.contact_info,
      balance: Number(d.balance || 0).toFixed(2),
      role: d.role || 'user',
      created_at: d.$createdAt
    }));
  } catch (err) {
    console.error('Appwrite admin get all users error:', err);
    return [];
  }
}

/**
 * Update user profile attributes (contact info, email)
 */
export async function appwriteUpdateProfile(userId, updates) {
  try {
    const res = await databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.collections.user_profiles,
      [Query.equal('user_id', userId), Query.limit(1)]
    );

    if (res.documents.length > 0) {
      const doc = res.documents[0];
      const payload = {};
      if (updates.contact_info !== undefined) payload.contact_info = updates.contact_info;
      if (updates.email !== undefined) payload.email = updates.email;
      if (updates.balance !== undefined) payload.balance = Number(updates.balance);

      const updated = await databases.updateDocument(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.collections.user_profiles,
        doc.$id,
        payload
      );
      return updated;
    }
    return null;
  } catch (err) {
    console.error('Appwrite profile update error:', err);
    throw err;
  }
}

/**
 * Update user password via Appwrite Account
 */
export async function appwriteUpdatePassword(newPassword, oldPassword = '') {
  try {
    return await account.updatePassword(newPassword, oldPassword);
  } catch (err) {
    throw new Error(err.message || 'Failed to update password.');
  }
}
