import { createContext, useContext, useState, useEffect } from 'react';
import { getSavedSession, authSignOut } from './supabase';
import { getUserProfile } from './dashboardService';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function initSession() {
      try {
        const saved = getSavedSession();
        if (saved) {
          setCurrentUser(saved);
          // Fetch fresh profile data
          const fresh = await getUserProfile(saved.id);
          if (fresh) {
            setCurrentUser((prev) => ({ ...prev, ...fresh }));
          }
        }
      } catch (err) {
        console.error("Session initialization failed", err);
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
    await authSignOut();
    setCurrentUser(null);
  };

  const refreshUser = async () => {
    if (currentUser?.id) {
      const fresh = await getUserProfile(currentUser.id);
      if (fresh) {
        setCurrentUser((prev) => ({ ...prev, ...fresh }));
      }
    }
  };

  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL || '';
  const isAdmin = Boolean(
    currentUser?.is_admin || 
    (adminEmail && currentUser?.email && currentUser.email.toLowerCase() === adminEmail.toLowerCase())
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
