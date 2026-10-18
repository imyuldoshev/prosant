// src/services/saleService.ts
// Supabase orqali sotuvlar (sales) va sotuv tarkibi (sale_items) CRUD

import { supabase } from '../lib/supabase';
import type { SaleRow, SaleItemRow, SaleInsert, SaleItemInsert, StockMovementInsert } from '../types/database';
import type { SaleRecord, SaleItem, PaymentMethod } from '../types';

export function dbItemToSaleItem(item: SaleItemRow): SaleItem {
  return {
    productId: item.product_id ?? '',
    productName: item.product_name,
    category: item.category ?? undefined,
    quantity: Number(item.quantity) || 0,
    price: Number(item.price) || 0,
    total: Number(item.total) || 0,
    unit: item.unit || 'dona',
    artikul: item.artikul ?? undefined,
  };
}

export function dbToSale(row: SaleRow & { sale_items?: SaleItemRow[] }): SaleRecord {
  return {
    id: row.id,
    saleNumber: '#' + row.sale_number,
    createdAt: row.created_at,
    items: (row.sale_items ?? []).map(dbItemToSaleItem),
    total: Number(row.total) || 0,
    paymentMethod: row.payment_method as PaymentMethod,
    customerName: row.customer_name ?? undefined,
    customerPhone: row.customer_phone ?? undefined,
    discount: Number(row.discount) || 0,
    receivedAmount: row.received_amount != null ? Number(row.received_amount) : undefined,
    changeAmount: row.change_amount != null ? Number(row.change_amount) : undefined,
    note: row.note ?? undefined,
  };
}

function isValidUuid(id?: string): boolean {
  if (!id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export const saleService = {
  // --------------------------------------------------------
  // O'QISH
  // --------------------------------------------------------

  /** Barcha o'chirilmagan sotuvlarni olish (eng yangilari birinchi) */
  getAll: async (page = 0, limit = 500): Promise<{ data: SaleRecord[]; count: number }> => {
    const { data, error, count } = await supabase
      .from('sales')
      .select('*, sale_items(*)', { count: 'exact' })
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1);

    if (error) {
      console.warn('[Supabase] Sales fetch error:', error.message);
      return { data: [], count: 0 };
    }

    return {
      data: (data ?? []).map(row => dbToSale(row as SaleRow & { sale_items?: SaleItemRow[] })),
      count: count ?? 0,
    };
  },

  /** ID bo'yicha bitta sotuvni olish */
  getById: async (id: string): Promise<SaleRecord | null> => {
    const { data, error } = await supabase
      .from('sales')
      .select('*, sale_items(*)')
      .eq('id', id)
      .single();

    if (error) {
      console.warn('[Supabase] Sale fetch by ID error:', error.message);
      return null;
    }

    return dbToSale(data as SaleRow & { sale_items?: SaleItemRow[] });
  },

  // --------------------------------------------------------
  // YOZISH
  // --------------------------------------------------------

  /** Yangi sotuv va uning tarkibini Supabase ga saqlash */
  create: async (params: {
    items: SaleItem[];
    total: number;
    paymentMethod: PaymentMethod;
    customerName?: string;
    customerPhone?: string;
    discount?: number;
    receivedAmount?: number;
    changeAmount?: number;
    note?: string;
    createdAt?: string;
  }): Promise<SaleRecord> => {
    // 1. Asosiy sotuv ma'lumotlarini tayyorlash
    const subtotal = params.items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
    const saleInsert: SaleInsert = {
      payment_method: params.paymentMethod,
      subtotal: subtotal > 0 ? subtotal : params.total,
      discount: params.discount || 0,
      total: params.total,
      customer_name: params.customerName?.trim() || null,
      customer_phone: params.customerPhone?.trim() || null,
      received_amount: params.receivedAmount ?? null,
      change_amount: params.changeAmount ?? null,
      note: params.note?.trim() || null,
      is_deleted: false,
      ...(params.createdAt ? { created_at: params.createdAt } : {}),
    };

    // 2. Sales jadvaliga kiritish
    const { data: saleRow, error: saleError } = await supabase
      .from('sales')
      .insert(saleInsert)
      .select('*, sale_items(*)')
      .single();

    if (saleError || !saleRow) {
      throw saleError || new Error('Sotuvni saqlashda xatolik yuz berdi');
    }

    // 3. Sotuv tarkibi (sale_items) ni kiritish
    let savedItems: SaleItemRow[] = [];
    if (params.items.length > 0) {
      const itemsInsert: SaleItemInsert[] = params.items.map(item => ({
        sale_id: saleRow.id,
        product_id: isValidUuid(item.productId) ? item.productId : null,
        product_name: item.productName,
        category: item.category ?? null,
        quantity: item.quantity,
        price: item.price,
        total: item.total,
        unit: item.unit || 'dona',
        artikul: item.artikul ?? null,
      }));

      const { data: insertedItems, error: itemsError } = await supabase
        .from('sale_items')
        .insert(itemsInsert)
        .select('*');

      if (itemsError) {
        console.warn('[Supabase] Sale items insert warning:', itemsError.message);
      } else if (insertedItems) {
        savedItems = insertedItems;
      }
    }

    // 4. Stock harakatlari (Audit jurnali uchun)
    try {
      const stockMovements: StockMovementInsert[] = params.items
        .filter(item => isValidUuid(item.productId))
        .map(item => ({
          product_id: item.productId,
          type: 'out' as const,
          quantity: item.quantity,
          reference: saleRow.id,
          note: `Sotuv #${saleRow.sale_number}`,
        }));

      if (stockMovements.length > 0) {
        await supabase.from('stock_movements').insert(stockMovements);
      }
    } catch (e) {
      console.warn('[Supabase] Stock movements log notice:', e);
    }

    const completeSaleRow = {
      ...saleRow,
      sale_items: savedItems.length > 0 ? savedItems : (saleRow.sale_items ?? []),
    };

    return dbToSale(completeSaleRow as SaleRow & { sale_items?: SaleItemRow[] });
  },

  /** Sotuvni o'chirish (soft delete — bazadan o'chmasdan is_deleted: true qilinadi) */
  delete: async (id: string): Promise<void> => {
    if (!isValidUuid(id)) return;

    const { error } = await supabase
      .from('sales')
      .update({ is_deleted: true })
      .eq('id', id);

    if (error) throw error;
  },

  /** Barcha sotuvlarni tozalash (Tarixni to'liq o'chirish) */
  deleteAll: async (): Promise<void> => {
    const { error } = await supabase
      .from('sales')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) {
      console.warn('[Supabase] Delete all sales notice:', error.message);
      await supabase
        .from('sales')
        .update({ is_deleted: true })
        .neq('id', '00000000-0000-0000-0000-000000000000');
    }
  },
};
