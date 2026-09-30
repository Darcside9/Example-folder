import { createContext, useContext, useState, useEffect } from 'react';
import { 
  appwriteGetSession, 
  appwriteSignOut, 
  appwriteGetUserProfile,
  getSavedSession 
} from './appwriteAuth';
import { ADMIN_CONTACT } from '../data/siteConfig';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function initSession() {
      try {
        // 1. Check active Appwrite session
        const sessionUser = await appwriteGetSession();
        if (sessionUser) {
          setCurrentUser(sessionUser);
          // 2. Fetch fresh profile from Appwrite user_profiles collection
          const freshProfile = await appwriteGetUserProfile(sessionUser.id);
          if (freshProfile) {
            setCurrentUser((prev) => ({ 
              ...prev, 
              balance: Number(freshProfile.balance || 0),
              contact: freshProfile.contact_info || prev?.contact || '',
              contact_info: freshProfile.contact_info || prev?.contact_info || '',
              role: freshProfile.role || prev?.role || 'user',
              is_admin: (freshProfile.role === 'admin') || prev?.is_admin
            }));
          }
        } else {
          // Fallback to local session storage
          const saved = getSavedSession();
          if (saved) {
            setCurrentUser(saved);
          }
        }
      } catch (err) {
        console.warn("Appwrite session initialization notice:", err.message);
        const saved = getSavedSession();
        if (saved) setCurrentUser(saved);
      } finally {
        setIsLoading(false);
      }
    }
    initSession();
  }, []);

  const login = (user) => {
    setCurrentUser(user);
  };

  const logout = async () => {
    await appwriteSignOut();
    setCurrentUser(null);
  };

  const refreshUser = async () => {
    if (currentUser?.id) {
      try {
        const fresh = await appwriteGetUserProfile(currentUser.id);
        if (fresh) {
          const updated = {
            ...currentUser,
            balance: Number(fresh.balance || 0),
            contact: fresh.contact_info || currentUser.contact || '',
            contact_info: fresh.contact_info || currentUser.contact_info || '',
            role: fresh.role || currentUser.role || 'user',
            is_admin: fresh.role === 'admin' || currentUser.is_admin
          };
          setCurrentUser(updated);
          localStorage.setItem('cs_user', JSON.stringify(updated));
        }
      } catch (err) {
        console.warn('Refresh user profile notice:', err.message);
      }
    }
  };

  const adminEmail = (import.meta.env.VITE_ADMIN_EMAIL || ADMIN_CONTACT.adminEmail || '').toLowerCase();
  const isAdmin = Boolean(
    currentUser?.role === 'admin' || 
    currentUser?.is_admin || 
    (adminEmail && currentUser?.email && currentUser.email.toLowerCase() === adminEmail)
  );

  return (
    <AuthContext.Provider value={{ currentUser, isLoading, login, logout, refreshUser, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
