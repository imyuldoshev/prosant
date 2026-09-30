import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { supabase } from './supabase';
import { Session, User } from '@supabase/supabase-js';

export type StaffRole = 'admin' | 'xodim';

export interface Staff {
  id: string;
  ism: string;
  telefon: string | null;
  role: StaffRole;
  faol: boolean;
  email?: string;
}

interface AuthContextType {
  user: Staff | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, parol: string) => Promise<void>;
  signOut: () => Promise<void>;
  devRoleOverride: StaffRole | null;
  setDevRoleOverride: (role: StaffRole | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Staff | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [devRoleOverride, setDevRoleOverride] = useState<StaffRole | null>(null);

  useEffect(() => {
    // Dastur ishga tushganda sessiyani olish
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user);
      } else {
        setIsLoading(false);
      }
    });

    // Sessiya o'zgarganda (login/logout bo'lganda) xabar topish
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (authUser: User) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();
      
      if (error) {
        // Profil topilmasa ham tizimga kirishga ruxsat beramiz va vaqtincha admin qilib qo'yamiz 
        // (keyinchalik profilni to'g'rilab olish mumkin)
        setUser({
          id: authUser.id,
          ism: authUser.email?.split('@')[0] || 'Foydalanuvchi',
          telefon: null,
          role: 'admin',
          faol: true,
          email: authUser.email
        });
      } else {
        setUser({
          ...data,
          email: authUser.email
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, parol: string) => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: parol,
    });
    if (error) {
      setIsLoading(false);
      throw error;
    }
    setDevRoleOverride(null);
  };

  const signOut = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    setDevRoleOverride(null);
  };

  const currentUser = useMemo(() => {
    if (!user) return null;
    if (devRoleOverride) {
      return { ...user, role: devRoleOverride };
    }
    return user;
  }, [user, devRoleOverride]);

  return (
    <AuthContext.Provider value={{ user: currentUser, session, isLoading, signIn, signOut, devRoleOverride, setDevRoleOverride }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
