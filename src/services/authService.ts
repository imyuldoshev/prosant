// src/services/authService.ts
// Supabase Auth — foydalanuvchi kirish/chiqish va sessiya boshqaruvi

import { supabase } from '../lib/supabase';
import type { ProfileRow } from '../types/database';

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string | undefined;
  profile: ProfileRow | null;
}

// Profilni xavfsiz olish (agar profil topilmasa xato bermaydi)
async function fetchUserProfile(userId: string): Promise<ProfileRow | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.warn('Profile fetch notice:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('Profile fetch exception:', err);
    return null;
  }
}

export const authService = {
  /**
   * Email va parol bilan tizimga kirish
   */
  signIn: async ({ email, password }: SignInCredentials): Promise<AuthUser> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) throw error;
    if (!data.user) throw new Error('Foydalanuvchi maʼlumotlari topilmadi');

    const profile = await fetchUserProfile(data.user.id);
    return {
      id: data.user.id,
      email: data.user.email,
      profile: profile ?? {
        id: data.user.id,
        full_name: data.user.email?.split('@')[0] || 'Admin',
        role: 'admin',
        store_name: 'SantexPro',
        created_at: new Date().toISOString(),
      },
    };
  },

  /**
   * Google orqali tizimga kirish (OAuth)
   */
  signInWithGoogle: async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) throw error;
    return data;
  },

  /**
   * Tizimdan chiqish
   */
  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) console.warn('Supabase signOut error:', error);
    } catch (e) {
      console.warn('Sign out exception:', e);
    }
  },

  /**
   * Joriy sessiyani olish
   */
  getSession: async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  },

  /**
   * Joriy foydalanuvchini olish (sessiya va profil bilan)
   */
  getCurrentUser: async (): Promise<AuthUser | null> => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.user) {
      return null;
    }

    const profile = await fetchUserProfile(session.user.id);
    return {
      id: session.user.id,
      email: session.user.email,
      profile: profile ?? {
        id: session.user.id,
        full_name: session.user.email?.split('@')[0] || 'Admin',
        role: 'admin',
        store_name: 'SantexPro',
        created_at: new Date().toISOString(),
      },
    };
  },

  /**
   * Auth holati o'zgarishini kuzatish (useEffect ichida ishlatiladi)
   */
  onAuthStateChange: (callback: (user: AuthUser | null) => void) => {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session?.user) {
        callback(null);
        return;
      }

      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        callback({
          id: session.user.id,
          email: session.user.email,
          profile: profile ?? {
            id: session.user.id,
            full_name: session.user.email?.split('@')[0] || 'Admin',
            role: 'admin',
            store_name: 'SantexPro',
            created_at: new Date().toISOString(),
          },
        });
      }
    });
  },

  /**
   * Parolni tiklash uchun email yuborish
   */
  resetPassword: async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
    if (error) throw error;
  },
};
