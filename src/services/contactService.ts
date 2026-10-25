// src/services/contactService.ts
// Supabase orqali kontaktlar (contacts) CRUD

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { ContactRow, ContactInsert } from '../types/database';
import type { Contact } from '../types';

export function dbToContact(row: ContactRow): Contact {
  return {
    id: row.id,
    name: row.name,
    storeName: row.store_name ?? undefined,
    phone: row.phone ?? undefined,
    address: row.address ?? undefined,
    note: row.note ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function isValidUuid(id?: string): boolean {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export const contactService = {
  /** Barcha kontaktlarni olish (eng yangilari birinchi) */
  getAll: async (): Promise<Contact[]> => {
    if (!isSupabaseConfigured) return [];

    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.warn('[Supabase] Contacts fetch error:', error.message);
        return [];
      }

      return (data ?? []).map(row => dbToContact(row as ContactRow));
    } catch (err) {
      console.warn('[Supabase] Contacts fetch exception:', err);
      return [];
    }
  },

  /** ID bo'yicha bitta kontaktni olish */
  getById: async (id: string): Promise<Contact | null> => {
    if (!isSupabaseConfigured || !isValidUuid(id)) return null;

    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.warn('[Supabase] Contact fetch by ID error:', error.message);
        return null;
      }

      return dbToContact(data as ContactRow);
    } catch (err) {
      console.warn('[Supabase] Contact fetch exception:', err);
      return null;
    }
  },

  /** Yangi kontakt qo'shish */
  create: async (params: {
    name: string;
    storeName?: string;
    phone?: string;
    address?: string;
    note?: string;
  }): Promise<Contact | null> => {
    if (!isSupabaseConfigured) return null;

    try {
      const insertData: ContactInsert = {
        name: params.name.trim(),
        store_name: params.storeName?.trim() || null,
        phone: params.phone?.trim() || null,
        address: params.address?.trim() || null,
        note: params.note?.trim() || null,
      };

      const { data, error } = await supabase
        .from('contacts')
        .insert(insertData)
        .select('*')
        .single();

      if (error || !data) {
        console.warn('[Supabase] Contact create error:', error?.message);
        return null;
      }

      return dbToContact(data as ContactRow);
    } catch (err) {
      console.warn('[Supabase] Contact create exception:', err);
      return null;
    }
  },

  /** Kontaktni yangilash */
  update: async (
    id: string,
    params: {
      name?: string;
      storeName?: string;
      phone?: string;
      address?: string;
      note?: string;
    }
  ): Promise<Contact | null> => {
    if (!isSupabaseConfigured || !isValidUuid(id)) return null;

    try {
      const updateData: Partial<ContactInsert> = {
        ...(params.name !== undefined ? { name: params.name.trim() } : {}),
        ...(params.storeName !== undefined ? { store_name: params.storeName?.trim() || null } : {}),
        ...(params.phone !== undefined ? { phone: params.phone?.trim() || null } : {}),
        ...(params.address !== undefined ? { address: params.address?.trim() || null } : {}),
        ...(params.note !== undefined ? { note: params.note?.trim() || null } : {}),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('contacts')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single();

      if (error || !data) {
        console.warn('[Supabase] Contact update error:', error?.message);
        return null;
      }

      return dbToContact(data as ContactRow);
    } catch (err) {
      console.warn('[Supabase] Contact update exception:', err);
      return null;
    }
  },

  /** Kontaktni o'chirish */
  delete: async (id: string): Promise<boolean> => {
    if (!isSupabaseConfigured || !isValidUuid(id)) return false;

    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id);

      if (error) {
        console.warn('[Supabase] Contact delete error:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('[Supabase] Contact delete exception:', err);
      return false;
    }
  },
};
