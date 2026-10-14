// src/lib/supabase.ts
// Supabase singleton client — butun ilovada bir marta yaratiladi

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Dev rejimda ogohlantirish — ilova to'xtamaydi
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Supabase] VITE_SUPABASE_URL yoki VITE_SUPABASE_ANON_KEY .env.local faylida topilmadi.\n' +
    '.env.example faylini nusxalab .env.local yarating va kalitlarni kiriting.'
  );
}

// Placeholder bilan yaratish (ulangungacha xato bermaydi)
export const supabase = createClient<Database>(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);

/** Supabase ulangan va sozlangan */
export const isSupabaseConfigured =
  !!supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co';
