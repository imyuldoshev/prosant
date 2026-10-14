// src/services/categoryService.ts
// Kategoriyalar CRUD

import { supabase } from '../lib/supabase';

export const categoryService = {
  /** Barcha kategoriyalar (name massivi — mavjud kod bilan mos) */
  getAll: async (): Promise<string[]> => {
    const { data, error } = await supabase
      .from('categories')
      .select('name')
      .order('name');

    if (error) {
      console.warn('Categories fetch error:', error.message);
      return [];
    }
    return (data ?? []).map(c => c.name);
  },

  /** Kategoriyani nom orqali topish yoki yangi yaratib id sini qaytarish */
  getOrCreate: async (name: string): Promise<string | null> => {
    const trimmed = name.trim();
    if (!trimmed) return null;

    const slug = trimmed
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\u0400-\u04FF-]/g, '');

    // 1. Avval mavjudligini tekshiramiz
    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .or(`name.eq."${trimmed}",slug.eq."${slug}"`)
      .maybeSingle();

    if (existing?.id) return existing.id;

    // 2. Yangi qo'shamiz
    const { data: inserted, error: insertError } = await supabase
      .from('categories')
      .insert({ name: trimmed, slug })
      .select('id')
      .maybeSingle();

    if (inserted?.id) return inserted.id;

    // 3. Agar boshqa so'rov bilan conflict bo'lgan bo'lsa, qayta o'qish
    if (insertError) {
      const { data: retry } = await supabase
        .from('categories')
        .select('id')
        .or(`name.eq."${trimmed}",slug.eq."${slug}"`)
        .maybeSingle();
      return retry?.id ?? null;
    }

    return null;
  },

  /** Kategoriya qo'shish */
  add: async (name: string): Promise<void> => {
    await categoryService.getOrCreate(name);
  },

  /** Kategoriya o'chirish */
  delete: async (name: string): Promise<void> => {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('name', name);

    if (error) throw error;
  },
};
