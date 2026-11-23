import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { Contact } from '../types';
import { contactService } from '../services/contactService';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const CONTACTS_STORAGE_KEY = 'santexpro_contacts_v1';

export interface AddContactParams {
  name: string;
  storeName?: string;
  phone?: string;
  address?: string;
  note?: string;
}

export interface UpdateContactParams {
  name?: string;
  storeName?: string;
  phone?: string;
  address?: string;
  note?: string;
}

interface ContactContextType {
  contacts: Contact[];
  isLoading: boolean;
  addContact: (params: AddContactParams) => Promise<Contact>;
  updateContact: (id: string, params: UpdateContactParams) => Promise<Contact | null>;
  deleteContact: (id: string) => Promise<boolean>;
  clearAllContacts: () => Promise<void>;
  getContactById: (id: string) => Contact | undefined;
  syncWithSupabase: () => Promise<void>;
}

const ContactContext = createContext<ContactContextType | undefined>(undefined);

export function ContactProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);

  const [contacts, setContacts] = useState<Contact[]>(() => {
    try {
      const saved = localStorage.getItem(CONTACTS_STORAGE_KEY);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((c: Contact) => !c.id.startsWith('contact_demo_'));
        }
      }
    } catch (e) {
      console.error('Failed to load contacts from localStorage', e);
    }
    return [];
  });

  // LocalStorage saqlash
  useEffect(() => {
    try {
      localStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(contacts.filter(c => !c.id.startsWith('contact_demo_'))));
    } catch (e) {
      console.error('Failed to save contacts to localStorage', e);
    }
  }, [contacts]);

  // Supabase dan kontaktlarni sinxronlash
  const syncWithSupabase = useCallback(async () => {
    if (!isSupabaseConfigured) return;

    setIsLoading(true);
    try {
      const serverContacts = await contactService.getAll();
      const cleanContacts = (serverContacts || []).filter((c: Contact) => !c.id.startsWith('contact_demo_'));
      setContacts(cleanContacts);
      localStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(cleanContacts));
    } catch (err) {
      console.warn('[Supabase] Kontaktlarni sinxronlashda xatolik:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    syncWithSupabase();
  }, [syncWithSupabase]);

  // Realtime subscription
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const channel = supabase
      .channel('realtime:contacts_sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'contacts' },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const newId = (payload.new as any)?.id;
            if (newId) {
              const item = await contactService.getById(newId);
              if (item) {
                setContacts(prev => {
                  if (prev.some(c => c.id === item.id)) return prev;
                  return [item, ...prev];
                });
              }
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedId = (payload.new as any)?.id;
            if (updatedId) {
              const item = await contactService.getById(updatedId);
              if (item) {
                setContacts(prev => prev.map(c => (c.id === updatedId ? item : c)));
              }
            }
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as any)?.id;
            if (deletedId) {
              setContacts(prev => prev.filter(c => c.id !== deletedId));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addContact = useCallback(async (params: AddContactParams): Promise<Contact> => {
    const tempId = `contact_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const nowStr = new Date().toISOString();

    const localNewContact: Contact = {
      id: tempId,
      name: params.name.trim(),
      storeName: params.storeName?.trim() || undefined,
      phone: params.phone?.trim() || undefined,
      address: params.address?.trim() || undefined,
      note: params.note?.trim() || undefined,
      createdAt: nowStr,
      updatedAt: nowStr,
    };

    // Darhol UI da ko'rsatish (Optimistic)
    setContacts(prev => [localNewContact, ...prev]);

    // Supabase ga saqlash
    if (isSupabaseConfigured) {
      try {
        const saved = await contactService.create({
          name: params.name,
          storeName: params.storeName,
          phone: params.phone,
          address: params.address,
          note: params.note,
        });

        if (saved && saved.id) {
          setContacts(prev => prev.map(c => (c.id === tempId ? saved : c)));
          return saved;
        }
      } catch (err) {
        console.error('[Supabase] Kontaktni saqlashda xatolik:', err);
      }
    }

    return localNewContact;
  }, []);

  const updateContact = useCallback(async (id: string, params: UpdateContactParams): Promise<Contact | null> => {
    let updatedContact: Contact | null = null;

    setContacts(prev => {
      const idx = prev.findIndex(c => c.id === id);
      if (idx === -1) return prev;

      const next = [...prev];
      const current = next[idx];
      updatedContact = {
        ...current,
        name: params.name !== undefined ? params.name.trim() : current.name,
        storeName: params.storeName !== undefined ? params.storeName.trim() : current.storeName,
        phone: params.phone !== undefined ? params.phone.trim() : current.phone,
        address: params.address !== undefined ? params.address.trim() : current.address,
        note: params.note !== undefined ? params.note.trim() : current.note,
        updatedAt: new Date().toISOString(),
      };
      next[idx] = updatedContact;
      return next;
    });

    if (isSupabaseConfigured) {
      contactService.update(id, params).catch(err => {
        console.error('[Supabase] Kontaktni yangilashda xatolik:', err);
      });
    }

    return updatedContact;
  }, []);

  const deleteContact = useCallback(async (id: string): Promise<boolean> => {
    setContacts(prev => prev.filter(c => c.id !== id));

    if (isSupabaseConfigured) {
      contactService.delete(id).catch(err => {
        console.error('[Supabase] Kontaktni o\'chirishda xatolik:', err);
      });
    }

    return true;
  }, []);

  const clearAllContacts = useCallback(async (): Promise<void> => {
    setContacts([]);
    try {
      localStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify([]));
    } catch (e) {
      console.error('Failed to clear contacts from localStorage:', e);
    }

    if (isSupabaseConfigured) {
      contactService.deleteAll().catch(err => {
        console.error('[Supabase] Barcha kontaktlarni tozalashda xatolik:', err);
      });
    }
  }, []);

  const getContactById = useCallback((id: string): Contact | undefined => {
    return contacts.find(c => c.id === id);
  }, [contacts]);

  const value = useMemo(() => ({
    contacts,
    isLoading,
    addContact,
    updateContact,
    deleteContact,
    clearAllContacts,
    getContactById,
    syncWithSupabase,
  }), [
    contacts,
    isLoading,
    addContact,
    updateContact,
    deleteContact,
    clearAllContacts,
    getContactById,
    syncWithSupabase,
  ]);

  return (
    <ContactContext.Provider value={value}>
      {children}
    </ContactContext.Provider>
  );
}

export function useContacts(): ContactContextType {
  const context = useContext(ContactContext);
  if (!context) {
    throw new Error('useContacts must be used within a ContactProvider');
  }
  return context;
}
