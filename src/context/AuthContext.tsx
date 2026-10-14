// src/context/AuthContext.tsx
// Global auth holati — ilovaning barcha joyidan foydalanish mumkin

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, type AuthUser } from '../services/authService';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'santexpro_auth_user_v1';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // 1. Dastlabki holatni to'g'ridan-to'g'ri localStorage dan o'qiymiz — 0ms kechikish, miltillash (flicker) bo'lmaydi
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load user from localStorage', e);
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState(() => {
    // Agar mahalliy xotirada user bo'lsa, yuklashni kutmasdan darhol false qilamiz
    return !localStorage.getItem(AUTH_STORAGE_KEY);
  });

  // Holatni xotira bilan doimiy sinxronlash
  const updateUserState = (nextUser: AuthUser | null) => {
    setUser(nextUser);
    try {
      if (nextUser) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextUser));
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    } catch (e) {
      console.error('Failed to sync auth user with localStorage', e);
    }
  };

  useEffect(() => {
    // Ilova ochilganda Supabase sessiyasini fonda (background) tekshirish va yangilash
    authService.getCurrentUser()
      .then((currentUser) => {
        if (currentUser) {
          updateUserState(currentUser);
        } else {
          // Faqat Supabase da ham sessiya bo'lmaganda va mahalliy xotira bo'sh bo'lsa tozalaymiz
          const hasLocal = localStorage.getItem(AUTH_STORAGE_KEY);
          if (!hasLocal) {
            updateUserState(null);
          }
        }
      })
      .catch((err) => {
        console.warn('Session verification notice:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });

    // Auth hodisalarini kuzatish
    const { data } = authService.onAuthStateChange((authUser) => {
      if (authUser) {
        updateUserState(authUser);
      } else {
        updateUserState(null);
      }
      setIsLoading(false);
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const authUser = await authService.signIn({ email, password });
      updateUserState(authUser);
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    await authService.signInWithGoogle();
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await authService.signOut();
    } finally {
      updateUserState(null);
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        signIn,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
