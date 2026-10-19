// ==========================================================================
// CHRIS SHOPPER — GOOGLE FIREBASE CLIENT CONFIGURATION
// Zero-pause, high-availability dual backend integration (Firestore & Auth)
// ==========================================================================

import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updatePassword,
  updateProfile
} from 'firebase/auth';
import { 
  getFirestore,
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  serverTimestamp, 
  increment, 
  runTransaction,
  writeBatch
} from 'firebase/firestore';

export const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAnCubO9UbDQUiQgobrBVzq6RRD_CtAvJ0',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'myapplication-4cfcd10a.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'myapplication-4cfcd10a',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'myapplication-4cfcd10a.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '467467287592',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:467467287592:web:7daf3baf739e4e68bd491d'
};

export const FIREBASE_COLLECTIONS = {
  products_pricing: 'products_pricing',
  user_profiles: 'user_profiles',
  orders: 'orders',
  platforms_catalog: 'platforms_catalog',
  facebook: 'facebook',
  tiktok: 'tiktok',
  instagram: 'instagram',
  twitter: 'twitter',
  textplus: 'textplus',
  system_heartbeat: 'system_heartbeat'
};

// Check if Firebase configuration keys are present
export const isFirebaseConfigured = Boolean(FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.projectId);

// Initialize Firebase App singleton safely
export const firebaseApp = getApps().length === 0 && isFirebaseConfigured
  ? initializeApp(FIREBASE_CONFIG)
  : (getApps().length > 0 ? getApp() : null);

export const auth = firebaseApp ? getAuth(firebaseApp) : null;
export const db = firebaseApp ? getFirestore(firebaseApp) : null;

// Re-export core Firestore APIs for seamless usage
export {
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  serverTimestamp, 
  increment, 
  runTransaction,
  writeBatch,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updatePassword,
  updateProfile
};

export default firebaseApp;
