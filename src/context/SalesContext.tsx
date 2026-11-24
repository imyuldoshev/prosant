import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { SaleRecord } from '../types';
import { useProducts } from './ProductContext';
import { saleService } from '../services/saleService';
import { supabase } from '../lib/supabase';

const SALES_STORAGE_KEY = 'santexpro_sales_v2';

interface AddSaleParams {
  items: SaleRecord['items'];
  total: number;
  paymentMethod: SaleRecord['paymentMethod'];
  customerName?: string;
  customerPhone?: string;
  contactId?: string;
  contactName?: string;
  discount?: number;
  receivedAmount?: number;
  changeAmount?: number;
  note?: string;
  createdAt?: string;
}

interface SalesContextType {
  sales: SaleRecord[];
  isLoading: boolean;
  addSale: (params: AddSaleParams) => SaleRecord;
  deleteSale: (id: string, restoreStock?: boolean) => void;
  getSaleById: (id: string) => SaleRecord | undefined;
  clearAllSales: () => Promise<void>;
  resetToDemoSales: () => void;
  syncWithSupabase: () => Promise<void>;
}

const SalesContext = createContext<SalesContextType | undefined>(undefined);

// Sotuvlar ro'yxatida dublikatlar paydo bo'lishining oldini oluvchi funksiya
function deduplicateSales(list: SaleRecord[]): SaleRecord[] {
  const seenIds = new Set<string>();
  const seenNumbers = new Set<string>();
  const result: SaleRecord[] = [];

  for (const sale of list) {
    if (!sale || !sale.id) continue;
    if (seenIds.has(sale.id)) continue;
    seenIds.add(sale.id);

    // Rasmiylashtirilgan bir xil chek raqamlari (masalan ikkita #5) bo'lsa, ikkinchisini e'tibordan chetda qoldiramiz
    if (sale.saleNumber && !sale.id.startsWith('sale_')) {
      if (seenNumbers.has(sale.saleNumber)) continue;
      seenNumbers.add(sale.saleNumber);
    }
    result.push(sale);
  }

  return result;
}

export function SalesProvider({ children }: { children: React.ReactNode }) {
  const { deductStock, returnStock } = useProducts();
  const [isLoading, setIsLoading] = useState(false);

  const [sales, setSales] = useState<SaleRecord[]>(() => {
    try {
      const saved = localStorage.getItem(SALES_STORAGE_KEY);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return deduplicateSales(parsed);
        }
      }
    } catch (e) {
      console.error('Failed to load sales from localStorage', e);
    }
    return [];
  });

  // Supabase dan sotuvlarni sinxronlash
  const syncWithSupabase = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: serverSales, error: fetchError } = await saleService.getAll(0, 500);
      if (fetchError || serverSales === null) {
        console.warn('[Supabase] Sotuvlarni olishda xatolik, mahalliy kesh saqlanadi:', fetchError);
        return;
      }
      setSales(prev => {
        const pendingLocal = prev.filter(s =>
          s.id.startsWith('sale_') && !serverSales.some(ss => ss.id === s.id || ss.saleNumber === s.saleNumber)
        );
        const deduped = deduplicateSales([...pendingLocal, ...serverSales]);
        try {
          localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(deduped));
        } catch (e) {
          console.error(e);
        }
        return deduped;
      });
    } catch (err) {
      console.warn('[Supabase] Sotuvlarni sinxronlashda xatolik:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Dastlab yuklanganda Supabase dan eng so'nggi ma'lumotlarni olish
  useEffect(() => {
    syncWithSupabase();
  }, [syncWithSupabase]);

  // Realtime: Boshqa qurilmadan (kassa/telefon) sotuv bo'lsa, tarix darhol sinxronlashishi uchun
  useEffect(() => {
    const channel = supabase
      .channel('realtime:sales_sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sales' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newSaleId = (payload.new as any)?.id;
            if (newSaleId) {
              saleService.getById(newSaleId).then(sale => {
                if (sale) {
                  setSales(prev => {
                    // 1. Agar ushbu sotuv allaqachon mavjud bo'lsa (ID yoki saleNumber bo'yicha)
                    if (prev.some(s => s.id === sale.id || s.saleNumber === sale.saleNumber)) {
                      return deduplicateSales(prev.map(s => s.saleNumber === sale.saleNumber ? sale : s));
                    }
                    // 2. Agar bu sotuv kassa tomonidan vaqtincha (optimistic) qo'shilgan sotuvning o'zi bo'lsa
                    const tempIndex = prev.findIndex(s => 
                      s.id.startsWith('sale_') && 
                      Math.abs(s.total - sale.total) < 0.01 && 
                      s.paymentMethod === sale.paymentMethod
                    );
                    if (tempIndex !== -1) {
                      const next = [...prev];
                      next[tempIndex] = sale;
                      return deduplicateSales(next);
                    }
                    // 3. Haqiqiy yangi sotuv (boshqa qurilmadan kelgan)
                    return deduplicateSales([sale, ...prev]);
                  });
                }
              });
            }
          } else if (payload.eventType === 'UPDATE') {
            if ((payload.new as any)?.is_deleted) {
              setSales(prev => deduplicateSales(prev.filter(s => s.id !== (payload.new as any).id)));
            }
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as any)?.id;
            if (deletedId) {
              setSales(prev => deduplicateSales(prev.filter(s => s.id !== deletedId)));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Mahalliy keshni doimiy yangilab borish
  useEffect(() => {
    try {
      localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(deduplicateSales(sales)));
    } catch (e) {
      console.error('Failed to save sales to localStorage', e);
    }
  }, [sales]);

  const addSale = useCallback((params: AddSaleParams): SaleRecord => {
    // Navbatdagi chek raqamini topish (baza ketma-ketligiga mos ravishda 0 dan hisoblanadi)
    const maxNum = sales.reduce((max, s) => {
      const n = parseInt(s.saleNumber.replace(/\D/g, ''), 10);
      return isNaN(n) ? max : Math.max(max, n);
    }, 0);
    const nextNumber = maxNum > 0 ? maxNum + 1 : 1;
    const tempId = `sale_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const newSale: SaleRecord = {
      id: tempId,
      saleNumber: `#${nextNumber}`,
      createdAt: params.createdAt || new Date().toISOString(),
      items: params.items,
      total: params.total,
      paymentMethod: params.paymentMethod,
      customerName: params.customerName?.trim() || undefined,
      customerPhone: params.customerPhone?.trim() || undefined,
      contactId: params.contactId,
      contactName: params.contactName?.trim() || undefined,
      discount: params.discount || 0,
      receivedAmount: params.receivedAmount,
      changeAmount: params.changeAmount,
      note: params.note?.trim() || undefined,
    };

    // 1. Mahsulotlar qoldig'ini kamaytirish (Optimistic + Supabase)
    deductStock(
      params.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
      }))
    );

    // 2. Darhol interfeysda ko'rsatish
    setSales(prev => deduplicateSales([newSale, ...prev]));

    // 3. Supabase ga saqlash
    saleService.create({
      items: params.items,
      total: params.total,
      paymentMethod: params.paymentMethod,
      customerName: params.customerName,
      customerPhone: params.customerPhone,
      contactId: params.contactId,
      contactName: params.contactName,
      discount: params.discount,
      receivedAmount: params.receivedAmount,
      changeAmount: params.changeAmount,
      note: params.note,
      createdAt: newSale.createdAt,
    })
      .then(savedSale => {
        if (savedSale && savedSale.id) {
          setSales(prev => {
            // Agar Realtime allaqachon savedSale ni qo'shib ulgurgan bo'lsa, vaqtinchalik ID ni olib tashlaymiz
            const alreadyHasServerSale = prev.some(s => s.id === savedSale.id || s.saleNumber === savedSale.saleNumber);
            if (alreadyHasServerSale) {
              return deduplicateSales(prev.filter(s => s.id !== tempId));
            }
            return deduplicateSales(prev.map(s => (s.id === tempId ? savedSale : s)));
          });
        }
      })
      .catch(err => {
        console.error('[Supabase] Sotuvni saqlashda xatolik:', err);
      });

    return newSale;
  }, [sales, deductStock]);

  const deleteSale = useCallback((id: string, restoreStock: boolean = true) => {
    const saleToDelete = sales.find(s => s.id === id);
    if (!saleToDelete) return;

    if (restoreStock && saleToDelete.items) {
      returnStock(
        saleToDelete.items.map(it => ({
          productId: it.productId,
          quantity: it.quantity,
        }))
      );
    }

    setSales(prev => prev.filter(s => s.id !== id));

    saleService.delete(id).catch(err => {
      console.error('[Supabase] Sotuvni o‘chirishda xatolik:', err);
    });
  }, [sales, returnStock]);

  const getSaleById = useCallback((id: string): SaleRecord | undefined => {
    return sales.find(s => s.id === id);
  }, [sales]);

  const clearAllSales = useCallback(async () => {
    setSales([]);
    try {
      localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify([]));
    } catch (e) {
      console.error('Failed to clear sales in localStorage', e);
    }

    try {
      await saleService.deleteAll();
    } catch (err) {
      console.error('[Supabase] Barcha sotuvlarni tozalashda xatolik:', err);
    }
  }, []);

  const resetToDemoSales = useCallback(() => {
    setSales([]);
    try {
      localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify([]));
    } catch {}
  }, []);

  const value = useMemo(
    () => ({
      sales,
      isLoading,
      addSale,
      deleteSale,
      getSaleById,
      clearAllSales,
      resetToDemoSales,
      syncWithSupabase,
    }),
    [sales, isLoading, addSale, deleteSale, getSaleById, clearAllSales, resetToDemoSales, syncWithSupabase]
  );

  return (
    <SalesContext.Provider value={value}>
      {children}
    </SalesContext.Provider>
  );
}

export function useSales() {
  const context = useContext(SalesContext);
  if (!context) {
    throw new Error('useSales must be used within a SalesProvider');
  }
  return context;
}
