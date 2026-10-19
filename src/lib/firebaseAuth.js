// ==========================================================================
// CHRIS SHOPPER — GOOGLE FIREBASE AUTHENTICATION & PROFILE SERVICE
// Native Firebase Auth and Firestore user profile / wallet balance management.
// 24/7 Always-On, zero-pause infrastructure.
// ==========================================================================

import { 
  auth, 
  db, 
  FIREBASE_COLLECTIONS,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  updatePassword,
  doc, 
  getDoc, 
  setDoc, 
  getDocs, 
  collection, 
  query, 
  orderBy, 
  limit, 
  serverTimestamp 
} from './firebase';
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
 * Register a new user with Firebase Auth & create their user_profiles document
 */
export async function firebaseSignUp(email, password, contactInfo = '', name = '') {
  const cleanEmail = email.trim().toLowerCase();
  const userName = name.trim() || cleanEmail.split('@')[0];

  if (!auth) {
    throw new Error('Firebase Auth is not initialized. Please verify configuration.');
  }

  // 1. Create Firebase Auth user
  const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
  const fbUser = userCredential.user;

  // 2. Determine Role (Admin email gets 'admin', otherwise 'user')
  const role = (cleanEmail === ADMIN_EMAIL) ? 'admin' : 'user';
  const initialBalance = 10.00;

  // 3. Create document in user_profiles collection in Firestore
  if (db) {
    try {
      const userDocRef = doc(db, FIREBASE_COLLECTIONS.user_profiles, fbUser.uid);
      await setDoc(userDocRef, {
        user_id: fbUser.uid,
        email: cleanEmail,
        name: userName,
        contact_info: contactInfo || '',
        balance: initialBalance,
        role: role,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.error('Error creating user profile in Firestore:', err);
    }
  }

  const userObj = {
    id: fbUser.uid,
    email: cleanEmail,
    name: userName,
    contact: contactInfo,
    contact_info: contactInfo,
    balance: initialBalance,
    role: role,
    is_admin: role === 'admin'
  };

  localStorage.setItem(SESSION_USER_KEY, JSON.stringify(userObj));
  return { user: userObj };
}

/**
 * Sign in an existing user with Firebase Auth
 * Includes seamless migration: if an existing Appwrite user logs in with matching credentials,
 * Firebase Auth self-provisions the account seamlessly.
 */
export async function firebaseSignIn(email, password) {
  const cleanEmail = email.trim().toLowerCase();

  if (!auth) {
    throw new Error('Firebase Auth is not initialized.');
  }

  let fbUser = null;
  try {
    const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
    fbUser = userCredential.user;
  } catch (err) {
    // If account not yet in Firebase Auth (e.g. migrating from Appwrite), provision it seamlessly
    if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
      try {
        const newCred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        fbUser = newCred.user;
      } catch (signupErr) {
        throw new Error('Invalid email or password. Please check your credentials.');
      }
    } else {
      throw err;
    }
  }

  // Fetch user profile from Firestore user_profiles
  let profileData = null;
  if (db && fbUser) {
    try {
      // 1. Try finding by uid
      const userDocRef = doc(db, FIREBASE_COLLECTIONS.user_profiles, fbUser.uid);
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        profileData = snap.data();
      } else {
        // 2. Try finding by email (migrated accounts from Appwrite)
        const colRef = collection(db, FIREBASE_COLLECTIONS.user_profiles);
        const allUsersSnap = await getDocs(colRef);
        const match = allUsersSnap.docs.find(d => (d.data().email || '').toLowerCase() === cleanEmail);
        if (match) {
          profileData = match.data();
          // Update doc to use the new fbUser.uid for fast lookups
          await setDoc(userDocRef, { ...profileData, user_id: fbUser.uid }, { merge: true });
        }
      }
    } catch (err) {
      console.warn('Error fetching Firestore user profile on sign in:', err.message);
    }
  }

  const role = profileData?.role || (cleanEmail === ADMIN_EMAIL ? 'admin' : 'user');
  const userObj = {
    id: fbUser?.uid || 'user-' + Date.now(),
    email: cleanEmail,
    name: profileData?.name || cleanEmail.split('@')[0],
    contact: profileData?.contact_info || '',
    contact_info: profileData?.contact_info || '',
    balance: Number(profileData?.balance ?? 0),
    role: role,
    is_admin: role === 'admin' || cleanEmail === ADMIN_EMAIL
  };

  localStorage.setItem(SESSION_USER_KEY, JSON.stringify(userObj));
  return { user: userObj };
}

/**
 * Get active session user
 */
export async function firebaseGetSession() {
  if (auth && auth.currentUser) {
    const current = auth.currentUser;
    const profile = await firebaseGetUserProfile(current.uid);
    return {
      id: current.uid,
      email: current.email,
      name: profile?.name || current.email?.split('@')[0] || 'User',
      contact: profile?.contact_info || '',
      contact_info: profile?.contact_info || '',
      balance: Number(profile?.balance ?? 0),
      role: profile?.role || (current.email?.toLowerCase() === ADMIN_EMAIL ? 'admin' : 'user'),
      is_admin: profile?.role === 'admin' || current.email?.toLowerCase() === ADMIN_EMAIL
    };
  }
  return getSavedSession();
}

/**
 * Sign out current user
 */
export async function firebaseSignOut() {
  try {
    if (auth) {
      await signOut(auth);
    }
  } catch (err) {
    console.warn('Firebase sign out note:', err.message);
  } finally {
    localStorage.removeItem(SESSION_USER_KEY);
  }
}

/**
 * Fetch a user's profile from Firestore user_profiles
 */
export async function firebaseGetUserProfile(userId) {
  if (!db || !userId) return null;

  try {
    const userDocRef = doc(db, FIREBASE_COLLECTIONS.user_profiles, userId);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      return snap.data();
    }

    // Fallback: check by email if userId looks like an email or search query
    const colRef = collection(db, FIREBASE_COLLECTIONS.user_profiles);
    const allUsersSnap = await getDocs(colRef);
    const match = allUsersSnap.docs.find(d => d.id === userId || d.data().user_id === userId || d.data().email === userId);
    return match ? match.data() : null;
  } catch (err) {
    console.warn('Error fetching Firestore user profile:', err.message);
    return null;
  }
}

/**
 * Update a user's wallet balance in Firestore
 */
export async function firebaseUpdateUserBalance(userId, newBalance) {
  if (!db || !userId) return false;

  const numericBalance = Number(Number(newBalance).toFixed(2));

  try {
    const userDocRef = doc(db, FIREBASE_COLLECTIONS.user_profiles, userId);
    await setDoc(userDocRef, { 
      balance: numericBalance,
      updated_at: serverTimestamp()
    }, { merge: true });
    return true;
  } catch (err) {
    console.error('Firestore update user balance error:', err);
    return false;
  }
}

/**
 * ADMIN: Fetch all registered users from Firestore user_profiles
 */
export async function firebaseGetAllUsers() {
  if (!db) return [];

  try {
    const colRef = collection(db, FIREBASE_COLLECTIONS.user_profiles);
    const snap = await getDocs(colRef);

    return snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        user_id: data.user_id || d.id,
        email: data.email || 'No Email',
        contact_info: data.contact_info || '',
        balance: Number(data.balance || 0),
        role: data.role || 'user',
        created_at: data.created_at || ''
      };
    });
  } catch (err) {
    console.error('Error fetching all users from Firestore:', err);
    return [];
  }
}

/**
 * Update user profile attributes (contact info, email)
 */
export async function firebaseUpdateProfile(userId, updates) {
  if (!db || !userId) return null;

  try {
    const userDocRef = doc(db, FIREBASE_COLLECTIONS.user_profiles, userId);
    const payload = {
      ...updates,
      updated_at: serverTimestamp()
    };
    await setDoc(userDocRef, payload, { merge: true });
    return payload;
  } catch (err) {
    console.error('Firestore profile update error:', err);
    throw err;
  }
}

/**
 * Update user password via Firebase Auth
 */
export async function firebaseUpdatePassword(newPassword) {
  if (!auth || !auth.currentUser) {
    throw new Error('No authenticated user session found to update password.');
  }

  await updatePassword(auth.currentUser, newPassword);
  return true;
}
