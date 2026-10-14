// src/services/productService.ts
// Supabase orqali mahsulotlar CRUD + stock + qidiruv

import { supabase } from '../lib/supabase';
import type { ProductRow, ProductInsert } from '../types/database';

import { categoryService } from './categoryService';

// Frontend Product tipiga mos o'girish
export function dbToProduct(row: ProductRow) {
  return {
    id: row.id,
    name: row.name,
    costPrice: row.cost_price != null ? Number(row.cost_price) : undefined,
    price: Number(row.price),
    unit: row.unit,
    category: (row.categories as { name: string } | null)?.name ?? '',
    image: row.image_url ?? row.image_key ?? '',
    stock: row.stock,
    minStock: row.min_stock,
    artikul: row.artikul ?? undefined,
    // qo'shimcha DB maydonlar
    categoryId: row.category_id,
    imageKey: row.image_key,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const productService = {
  // --------------------------------------------------------
  // O'QISH
  // --------------------------------------------------------

  /** Barcha aktiv mahsulotlarni olish (standart 500 ta — butun do'kon) */
  getAll: async (page = 0, limit = 500) => {
    const { data, error, count } = await supabase
      .from('products')
      .select('*, categories(name)', { count: 'exact' })
      .eq('is_active', true)
      .order('name', { ascending: true })
      .range(page * limit, (page + 1) * limit - 1);

    if (error) {
      console.warn('Products fetch error:', error.message);
      return { data: [], count: 0 };
    }
    return { data: (data ?? []).map(dbToProduct), count: count ?? 0 };
  },

  /** ID bo'yicha bitta mahsulot */
  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(name)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return dbToProduct(data);
  },

  /** Tez qidiruv (ILIKE) — 30 ta natija */
  search: async (query: string) => {
    if (!query.trim()) return [];
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(name)')
      .eq('is_active', true)
      .or(`name.ilike.%${query.trim()}%,artikul.ilike.%${query.trim()}%`)
      .order('name')
      .limit(30);

    if (error) throw error;
    return (data ?? []).map(dbToProduct);
  },

  /** Full-text qidiruv (PostgreSQL FTS + trigram) */
  fullTextSearch: async (query: string) => {
    if (!query.trim()) return [];
    const { data, error } = await supabase
      .rpc('search_products', { search_query: query.trim() });

    if (error) {
      // FTS ishlamasa oddiy ILIKE ga fallback
      return productService.search(query);
    }
    return (data ?? []).map((row: ProductRow) => dbToProduct(row));
  },

  // --------------------------------------------------------
  // YOZISH
  // --------------------------------------------------------

  /** Yangi mahsulot qo'shish (kategoriya nomini avtomatik id ga bog'laydi) */
  create: async (product: {
    name: string;
    costPrice?: number;
    price: number;
    unit?: string;
    category?: string;
    categoryId?: string | null;
    image?: string | null;
    imageUrl?: string | null;
    imageKey?: string | null;
    stock?: number;
    minStock?: number;
    artikul?: string | null;
  }) => {
    let resolvedCategoryId = product.categoryId ?? null;
    if (!resolvedCategoryId && product.category) {
      resolvedCategoryId = await categoryService.getOrCreate(product.category);
    }

    const insert: ProductInsert = {
      name:        product.name.trim(),
      cost_price:  product.costPrice ?? null,
      price:       product.price,
      unit:        product.unit || 'dona',
      category_id: resolvedCategoryId,
      image_url:   product.imageUrl ?? product.image ?? null,
      image_key:   product.imageKey ?? null,
      stock:       product.stock ?? 0,
      min_stock:   product.minStock ?? 0,
      artikul:     product.artikul?.trim() || null,
      is_active:   true,
    };

    let res = await supabase
      .from('products')
      .insert(insert)
      .select('*, categories(name)')
      .single();

    if (res.error && res.error.message?.includes('cost_price')) {
      const fallbackInsert = { ...insert };
      delete fallbackInsert.cost_price;
      res = await supabase
        .from('products')
        .insert(fallbackInsert)
        .select('*, categories(name)')
        .single();
    }

    if (res.error) throw res.error;
    return dbToProduct(res.data);
  },

  /** Mahsulotni yangilash */
  update: async (id: string, updates: {
    name?: string;
    costPrice?: number;
    price?: number;
    unit?: string;
    category?: string;
    categoryId?: string | null;
    image?: string | null;
    imageUrl?: string | null;
    imageKey?: string | null;
    stock?: number;
    minStock?: number;
    artikul?: string | null;
  }) => {
    let resolvedCategoryId = updates.categoryId;
    if (resolvedCategoryId === undefined && updates.category) {
      resolvedCategoryId = await categoryService.getOrCreate(updates.category);
    }

    const patch: Partial<ProductInsert> = {};
    if (updates.name !== undefined)       patch.name        = updates.name.trim();
    if (updates.costPrice !== undefined)  patch.cost_price  = updates.costPrice;
    if (updates.price !== undefined)      patch.price       = updates.price;
    if (updates.unit !== undefined)       patch.unit        = updates.unit;
    if (resolvedCategoryId !== undefined) patch.category_id = resolvedCategoryId;
    if (updates.imageUrl !== undefined || updates.image !== undefined) {
      patch.image_url = updates.imageUrl ?? updates.image ?? null;
    }
    if (updates.imageKey !== undefined)   patch.image_key   = updates.imageKey;
    if (updates.stock !== undefined)      patch.stock       = updates.stock;
    if (updates.minStock !== undefined)   patch.min_stock   = updates.minStock;
    if (updates.artikul !== undefined)    patch.artikul     = updates.artikul?.trim() || null;

    let res = await supabase
      .from('products')
      .update(patch)
      .eq('id', id)
      .select('*, categories(name)')
      .single();

    if (res.error && res.error.message?.includes('cost_price')) {
      const fallbackPatch = { ...patch };
      delete fallbackPatch.cost_price;
      res = await supabase
        .from('products')
        .update(fallbackPatch)
        .eq('id', id)
        .select('*, categories(name)')
        .single();
    }

    if (res.error) throw res.error;
    return dbToProduct(res.data);
  },

  /** Mahsulotni o'chirish (soft delete) */
  delete: async (id: string) => {
    const { error } = await supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', id);

    if (error) throw error;
  },

  /** Boshlang'ich mahsulotlarni Supabase ga ko'chirish / yuklash (Seed) */
  seedFromList: async (list: {
    name: string;
    price: number;
    unit: string;
    category: string;
    image: string;
    stock: number;
    minStock?: number;
    artikul?: string;
  }[]) => {
    // 1. Kategoriyalarni noyoblab olib Supabase ga kiritamiz
    const categoryNames = Array.from(new Set(list.map(p => p.category).filter(Boolean)));
    const categoryMap = new Map<string, string>();

    for (const catName of categoryNames) {
      const catId = await categoryService.getOrCreate(catName);
      if (catId) categoryMap.set(catName, catId);
    }

    // 2. Mahsulotlarni tayyorlaymiz
    const inserts: ProductInsert[] = list.map(p => ({
      name: p.name.trim(),
      price: p.price,
      unit: p.unit || 'dona',
      category_id: categoryMap.get(p.category) ?? null,
      image_url: p.image || null,
      stock: p.stock || 0,
      min_stock: p.minStock || 0,
      artikul: p.artikul?.trim() || null,
      is_active: true,
    }));

    // Bo'laklarga bo'lib (chunks of 50) kiritamiz
    const chunkSize = 50;
    for (let i = 0; i < inserts.length; i += chunkSize) {
      const chunk = inserts.slice(i, i + chunkSize);
      const { error } = await supabase.from('products').insert(chunk);
      if (error) {
        console.warn('Batch insert chunk error:', error.message);
      }
    }
  },

  // --------------------------------------------------------
  // STOCK
  // --------------------------------------------------------

  /** Stock kirim — atomik (stored procedure orqali) */
  stockIn: async (id: string, quantity: number, note?: string) => {
    const { data, error } = await supabase.rpc('stock_in', {
      p_product_id: id,
      p_quantity:   quantity,
      p_note:       note ?? null,
    });

    if (error) throw error;
    return dbToProduct(data as ProductRow);
  },

  /** Stock kamaytirish (sotuv) — to'g'ridan-to'g'ri update */
  deductStock: async (items: { productId: string; quantity: number }[]) => {
    // Har birini alohida update — kelajakda RPC ga o'tkazish mumkin
    const promises = items.map(({ productId, quantity }) =>
      supabase.rpc('stock_in', {
        p_product_id: productId,
        p_quantity:   -quantity,   // manfiy = kamaytirish
        p_note:       'Sotuv',
      })
    );
    const results = await Promise.all(promises);
    const failed = results.find(r => r.error);
    if (failed?.error) throw failed.error;
  },

  /** Stock qaytarish */
  returnStock: async (items: { productId: string; quantity: number }[]) => {
    const promises = items.map(({ productId, quantity }) =>
      supabase.rpc('stock_in', {
        p_product_id: productId,
        p_quantity:   quantity,
        p_note:       'Qaytarildi',
      })
    );
    const results = await Promise.all(promises);
    const failed = results.find(r => r.error);
    if (failed?.error) throw failed.error;
  },
};
