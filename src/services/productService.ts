// src/services/productService.ts
// Supabase orqali mahsulotlar CRUD + stock + qidiruv

import { supabase } from '../lib/supabase';
import type { ProductRow, ProductInsert } from '../types/database';

import { categoryService } from './categoryService';

// Frontend Product tipiga mos o'girish
export function dbToProduct(row: ProductRow) {
  let categoryName = '';
  if (row.categories) {
    if (Array.isArray(row.categories) && row.categories.length > 0) {
      categoryName = (row.categories[0] as any)?.name ?? '';
    } else if (typeof row.categories === 'object' && 'name' in (row.categories as any)) {
      categoryName = (row.categories as any).name ?? '';
    }
  }
  if (!categoryName && (row as any).category) {
    categoryName = String((row as any).category).trim();
  }

  // Agar bazada kategoriya berilmagan bo'lsa, mahsulot nomidan avtomatik aniqlash
  if (!categoryName && row.name) {
    categoryName = inferCategoryFromName(row.name);
  }

  return {
    id: row.id,
    name: row.name,
    costPrice: row.cost_price != null ? Number(row.cost_price) : undefined,
    price: Number(row.price),
    unit: row.unit,
    category: categoryName,
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

/**
 * Mahsulot nomidan avtomatik kategoriya aniqlash (frontend avto-katalogi)
 * Santexnika mahsulotlarining standart nomlariga asoslangan
 */
export function inferCategoryFromName(name: string): string {
  const n = (name || '').toLowerCase().trim();
  if (!n) return '';

  // 1. Fitinglar (troynik, mufta, ugolnik, krestovina, fiting, otvod va boshqalar)
  if (/troynik|troyynik|mufta|ugolnik|krestovin|fiting|otvod|amerikank|zaglushk|perehodnik|shtutser|nippel|futorka|koleno|kombinirov/i.test(n)) {
    return 'Fitinglar';
  }
  // 2. Trubalar (quvurlar, shlanglar, gofralar, sifonlar)
  if (/truba|shlang|gofra|quvur|sliv|kanalizats|polietilen/i.test(n)) {
    return 'Trubalar';
  }
  // 3. Smesitellar (jo'mraklar, kranlar, dushlar, leykalar)
  if (/smesitel|kran|dush|leyka|jo'mrak|aralashtir|gusak|kartrij/i.test(n)) {
    return 'Smesitellar';
  }
  // 4. Nasoslar (suv nasoslari, pompalar, gidroforlar)
  if (/nasos|pompa|gidrofor|motor/i.test(n)) {
    return 'Nasoslar';
  }
  // 5. Isitish (radiator, kotyol, termostat, kollektor, boyler)
  if (/radiator|kotyol|isitish|termostat|kollektor|boyler|tyoply|pechka/i.test(n)) {
    return 'Isitish';
  }
  // 6. Katta tovarlar (vanna, unitaz, rakovina, moyka, bak, bochka)
  if (/vanna|unitaz|rakovina|moyka|bochka|bak|poddon|kabina|tyulpan/i.test(n)) {
    return 'Katta tovarlar';
  }
  // 7. Aksessuarlar (fum lenta, germetik, klapan, filtr, rezinka, gayka)
  if (/fum|lenta|germetik|klapan|filtr|podvodka|rezinka|bolt|gayka|aksessuar|izolyats|silikon|prokladk/i.test(n)) {
    return 'Aksessuarlar';
  }

  return '';
}

export const productService = {
  // --------------------------------------------------------
  // O'QISH
  // --------------------------------------------------------

  /** Barcha aktiv mahsulotlarni olish (standart 500 ta — butun do'kon) */
  getAll: async (page = 0, limit = 500): Promise<{ data: ReturnType<typeof dbToProduct>[] | null; error: string | null; count: number }> => {
    // 1. Avval categories join orqali faol yoki is_active null bo'lgan tovarlarni olamiz
    let res: any = await (supabase
      .from('products') as any)
      .select('*, categories(name)', { count: 'exact' })
      .or('is_active.is.null,is_active.eq.true')
      .order('name', { ascending: true })
      .range(page * limit, (page + 1) * limit - 1);

    // 2. Agar join xatolik bersa (masalan, schema cache yoki relation muammosi), oddiy select bilan fallback
    if (res.error) {
      console.warn('Products fetch with join error, falling back to plain select:', res.error.message);
      res = await (supabase
        .from('products') as any)
        .select('*', { count: 'exact' })
        .or('is_active.is.null,is_active.eq.true')
        .order('name', { ascending: true })
        .range(page * limit, (page + 1) * limit - 1);
    }

    if (res.error) {
      console.warn('Products fetch error:', res.error.message);
      return { data: null, error: res.error.message, count: 0 };
    }

    // Kategoriyalar xaritasini olamiz (agar join bo'lmagan bo'lsa nomlarini to'ldirish uchun)
    let categoryMap = new Map<string, string>();
    try {
      const { data: catList } = await (supabase.from('categories') as any).select('id, name');
      if (catList) {
        catList.forEach((c: any) => categoryMap.set(c.id, c.name));
      }
    } catch {
      // ignore
    }

    const prods = (res.data ?? []).map((row: any) => {
      const prod = dbToProduct(row as ProductRow);
      if (!prod.category && prod.categoryId && categoryMap.has(prod.categoryId)) {
        prod.category = categoryMap.get(prod.categoryId)!;
      }
      return prod;
    });

    return { data: prods, error: null, count: res.count ?? 0 };
  },

  /** ID bo'yicha bitta mahsulot */
  getById: async (id: string) => {
    let res: any = await (supabase
      .from('products') as any)
      .select('*, categories(name)')
      .eq('id', id)
      .maybeSingle();

    if (res.error) {
      res = await (supabase
        .from('products') as any)
        .select('*')
        .eq('id', id)
        .single();
    }

    if (res.error) throw res.error;
    return res.data ? dbToProduct(res.data as ProductRow) : null;
  },

  /** Tez qidiruv (ILIKE) — 30 ta natija */
  search: async (query: string) => {
    if (!query.trim()) return [];
    let res: any = await (supabase
      .from('products') as any)
      .select('*, categories(name)')
      .or('is_active.is.null,is_active.eq.true')
      .or(`name.ilike.%${query.trim()}%,artikul.ilike.%${query.trim()}%`)
      .order('name')
      .limit(30);

    if (res.error) {
      res = await (supabase
        .from('products') as any)
        .select('*')
        .or('is_active.is.null,is_active.eq.true')
        .or(`name.ilike.%${query.trim()}%,artikul.ilike.%${query.trim()}%`)
        .order('name')
        .limit(30);
    }

    if (res.error) throw res.error;
    return (res.data ?? []).map((r: any) => dbToProduct(r));
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

  /** Barcha mahsulotlarni o'chirish (DB dan tozalash) */
  deleteAll: async () => {
    const { error } = await supabase
      .from('products')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) {
      console.warn('Delete all products DB error:', error.message);
    }
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
    const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (!isValidUuid) return null;

    const { data, error } = await supabase.rpc('stock_in', {
      p_product_id: id,
      p_quantity:   quantity,
      p_note:       note ?? null,
    });

    if (error) throw error;
    return dbToProduct(data as ProductRow);
  },

  /** Stock kamaytirish (sotuv) — atomik batch RPC yoki alohida fallback */
  deductStock: async (items: { productId: string; quantity: number }[]) => {
    const validItems = items.filter(it =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(it.productId)
    );
    if (!validItems.length) return;

    // 1. Birinchi navbatda atomik batch RPC sinab ko'ramiz
    const { error: batchError } = await supabase.rpc('stock_in_batch', {
      p_items: validItems.map(it => ({
        productId: it.productId,
        quantity: -it.quantity,
      })),
      p_note: 'Sotuv',
    });

    if (!batchError) return;

    // 2. Agar RPC topilmasa yoki xato bersa, har birini alohida stock_in ga fallback qilamiz
    const promises = validItems.map(({ productId, quantity }) =>
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

  /** Stock qaytarish — atomik batch RPC yoki alohida fallback */
  returnStock: async (items: { productId: string; quantity: number }[]) => {
    const validItems = items.filter(it =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(it.productId)
    );
    if (!validItems.length) return;

    // 1. Birinchi navbatda atomik batch RPC sinab ko'ramiz
    const { error: batchError } = await supabase.rpc('stock_in_batch', {
      p_items: validItems.map(it => ({
        productId: it.productId,
        quantity: it.quantity,
      })),
      p_note: 'Qaytarildi',
    });

    if (!batchError) return;

    // 2. Fallback
    const promises = validItems.map(({ productId, quantity }) =>
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
