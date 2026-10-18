import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { Product } from '../types';
import { PRODUCTS as INITIAL_PRODUCTS, CATEGORIES as INITIAL_CATEGORIES } from '../mockData';
import { productService, dbToProduct } from '../services/productService';
import { categoryService } from '../services/categoryService';
import { supabase } from '../lib/supabase';
import { useProductsRealtime } from '../hooks/useRealtime';

interface ProductContextType {
  products: Product[];
  categories: string[];
  isLoading: boolean;
  addCategory: (newCategory: string) => void;
  addProduct: (product: Omit<Product, 'id'>) => Product;
  updateProduct: (id: string, updates: Partial<Omit<Product, 'id'>>) => void;
  deleteProduct: (id: string) => void;
  clearAllProducts: () => Promise<void>;
  stockIn: (id: string, quantityToAdd: number) => void;
  deductStock: (items: { productId: string; quantity: number }[]) => void;
  returnStock: (items: { productId: string; quantity: number }[]) => void;
  findProductByName: (name: string) => Product | undefined;
  resetToDefaults: () => void;
  syncWithSupabase: () => Promise<void>;
}

const STORAGE_KEY = 'santexpro_products_v2';
const CATEGORIES_KEY = 'santexpro_categories_v2';

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export function ProductProvider({ children }: { children: React.ReactNode }) {
  // Realtime o'zgarishlarni eshitish (barcha terminallarda stock yangilanishi)
  useProductsRealtime();

  const [categories, setCategories] = useState<string[]>(() => {
    try {
      localStorage.removeItem('santexpro_categories_v1');
      const saved = localStorage.getItem(CATEGORIES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load categories from localStorage', e);
    }
    return INITIAL_CATEGORIES;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    try {
      localStorage.removeItem('santexpro_products_v1');
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Failed to load products from localStorage', e);
    }
    return [];
  });

  const [isLoading, setIsLoading] = useState(false);

  // Realtime: Boshqa qurilmadan (telefon/kompyuter) tovar qo'shilsa yoki o'zgarsa, darhol ko'rsatish
  useEffect(() => {
    const channel = supabase
      .channel('realtime:products_sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newProd = dbToProduct(payload.new as any);
            setProducts(prev => {
              if (prev.some(p => p.id === newProd.id || (p.name.trim().toLowerCase() === newProd.name.trim().toLowerCase() && p.id.startsWith('prod_')))) {
                return prev.map(p => (p.name.trim().toLowerCase() === newProd.name.trim().toLowerCase() && p.id.startsWith('prod_')) ? (newProd as Product) : p);
              }
              return [newProd as Product, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updated = dbToProduct(payload.new as any);
            setProducts(prev => {
              if (payload.new.is_active === false) {
                return prev.filter(p => p.id !== updated.id);
              }
              return prev.map(p => p.id === updated.id ? (updated as Product) : p);
            });
          } else if (payload.eventType === 'DELETE') {
            const deletedId = (payload.old as any)?.id;
            if (deletedId) {
              setProducts(prev => prev.filter(p => p.id !== deletedId));
            }
          }
        }
      )
      .subscribe();

    const catChannel = supabase
      .channel('realtime:categories_sync')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'categories' },
        (payload) => {
          const newCat = (payload.new as any)?.name;
          if (newCat) {
            setCategories(prev => prev.includes(newCat) ? prev : [...prev, newCat]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(catChannel);
    };
  }, []);

  // 1. Supabase bilan to'liq sinxronlash (Fetch & Auto-seed if empty)
  const syncWithSupabase = useCallback(async () => {
    setIsLoading(true);
    try {
      // Kategoriyalarni olish
      const serverCategories = await categoryService.getAll();
      if (serverCategories && serverCategories.length > 0) {
        setCategories(prev => {
          const combined = Array.from(new Set(['Barchasi', ...serverCategories, ...prev]));
          if (combined.length === prev.length && combined.every((val, idx) => val === prev[idx])) {
            return prev;
          }
          return combined;
        });
      }

      // Mahsulotlarni olish
      const { data: serverProducts } = await productService.getAll(0, 500);

      // Agar bazada mahsulot bo'lsa — bazadagidan foydalanamiz
      if (serverProducts && serverProducts.length > 0) {
        setProducts(serverProducts as Product[]);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(serverProducts));
      } else {
        // Agar bazada mahsulot bo'lmasa — toza 0 holatga keltiramiz
        setProducts([]);
        localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      }
    } catch (err) {
      console.warn('[Supabase] Sinxronlashda xatolik yuz berdi, mahalliy kesh ishlatiladi:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Ilova ishga tushganda Supabase dan eng so'nggi holatni yuklash
  useEffect(() => {
    syncWithSupabase();
  }, [syncWithSupabase]);

  // Mahalliy keshni yangilab borish
  useEffect(() => {
    try {
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
    } catch (e) {
      console.error('Failed to save categories to localStorage', e);
    }
  }, [categories]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    } catch (e) {
      console.error('Failed to save products to localStorage', e);
    }
  }, [products]);

  // Kategoriya qo'shish (Optimistic + Supabase)
  const addCategory = useCallback((newCat: string) => {
    const trimmed = newCat.trim();
    if (!trimmed) return;
    setCategories(prev => {
      if (prev.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
        return prev;
      }
      categoryService.add(trimmed).catch(console.error);
      return [...prev, trimmed];
    });
  }, []);

  const findProductByName = useCallback((name: string): Product | undefined => {
    const trimmed = name.trim().toLowerCase();
    if (!trimmed) return undefined;
    return products.find(p => p.name.trim().toLowerCase() === trimmed);
  }, [products]);

  // Mahsulot qo'shish (Optimistic + Supabase)
  const addProduct = useCallback((newProd: Omit<Product, 'id'>): Product => {
    const tempId = 'prod_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const createdProduct: Product = {
      ...newProd,
      id: tempId,
      name: newProd.name.trim(),
    };

    // 1. Darhol interfeysda ko'rsatish
    setProducts(prev => [createdProduct, ...prev]);

    // 2. Supabase ga saqlash va haqiqiy UUID bilan yangilash
    productService.create({
      name: newProd.name,
      costPrice: newProd.costPrice,
      price: newProd.price,
      unit: newProd.unit,
      category: newProd.category,
      image: newProd.image,
      stock: newProd.stock,
      minStock: newProd.minStock,
      artikul: newProd.artikul,
    })
      .then(saved => {
        if (saved && saved.id) {
          setProducts(prev => prev.map(p => (p.id === tempId ? (saved as Product) : p)));
        }
      })
      .catch(err => {
        console.error('[Supabase] Mahsulot saqlashda xatolik:', err);
      });

    return createdProduct;
  }, []);

  // Mahsulotni tahrirlash (Optimistic + Supabase)
  const updateProduct = useCallback((id: string, updates: Partial<Omit<Product, 'id'>>) => {
    // 1. Darhol interfeysda yangilash
    setProducts(prev =>
      prev.map(p => {
        if (p.id === id) {
          return {
            ...p,
            ...updates,
            name: updates.name ? updates.name.trim() : p.name,
          };
        }
        return p;
      })
    );

    // 2. Supabase ga yuborish
    productService.update(id, {
      name: updates.name,
      costPrice: updates.costPrice,
      price: updates.price,
      unit: updates.unit,
      category: updates.category,
      image: updates.image,
      stock: updates.stock,
      minStock: updates.minStock,
      artikul: updates.artikul,
    }).catch(err => {
      console.error('[Supabase] Mahsulotni yangilashda xatolik:', err);
    });
  }, []);

  // Mahsulotni o'chirish (Optimistic + Supabase)
  const deleteProduct = useCallback((id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    productService.delete(id).catch(err => {
      console.error('[Supabase] Mahsulotni o‘chirishda xatolik:', err);
    });
  }, []);

  // Barcha mahsulotlarni o'chirish / tozalash (DB + Local)
  const clearAllProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      await productService.deleteAll();
    } catch (e) {
      console.warn('Failed to delete all products from DB:', e);
    }
    setProducts([]);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    } catch (e) {
      console.error('Failed to clear products from localStorage:', e);
    }
    setIsLoading(false);
  }, []);

  // Stock kirim (Optimistic + Supabase RPC)
  const stockIn = useCallback((id: string, quantityToAdd: number) => {
    if (quantityToAdd <= 0) return;
    setProducts(prev =>
      prev.map(p => {
        if (p.id === id) {
          const currentStock = Number(p.stock) || 0;
          return {
            ...p,
            stock: currentStock + quantityToAdd,
          };
        }
        return p;
      })
    );

    productService.stockIn(id, quantityToAdd, 'Kirim').catch(err => {
      console.error('[Supabase] Stock kirimda xatolik:', err);
    });
  }, []);

  // Sotuvda stock kamaytirish
  const deductStock = useCallback((items: { productId: string; quantity: number }[]) => {
    setProducts(prev => {
      const map = new Map<string, number>();
      for (const it of items) {
        map.set(it.productId, (map.get(it.productId) || 0) + it.quantity);
      }
      return prev.map(p => {
        if (map.has(p.id)) {
          const qty = map.get(p.id)!;
          return {
            ...p,
            stock: Math.max(0, (Number(p.stock) || 0) - qty),
          };
        }
        return p;
      });
    });

    productService.deductStock(items).catch(err => {
      console.warn('[Supabase] Stock kamaytirish xabari:', err);
    });
  }, []);

  // Sotuv bekor qilinganda stock qaytarish
  const returnStock = useCallback((items: { productId: string; quantity: number }[]) => {
    setProducts(prev => {
      const map = new Map<string, number>();
      for (const it of items) {
        map.set(it.productId, (map.get(it.productId) || 0) + it.quantity);
      }
      return prev.map(p => {
        if (map.has(p.id)) {
          const qty = map.get(p.id)!;
          return {
            ...p,
            stock: (Number(p.stock) || 0) + qty,
          };
        }
        return p;
      });
    });

    productService.returnStock(items).catch(err => {
      console.warn('[Supabase] Stock qaytarish xabari:', err);
    });
  }, []);

  const resetToDefaults = useCallback(() => {
    setProducts(INITIAL_PRODUCTS);
    setCategories(INITIAL_CATEGORIES);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CATEGORIES_KEY);
    syncWithSupabase();
  }, [syncWithSupabase]);

  const value = useMemo(
    () => ({
      products,
      categories,
      isLoading,
      addCategory,
      addProduct,
      updateProduct,
      deleteProduct,
      clearAllProducts,
      stockIn,
      deductStock,
      returnStock,
      findProductByName,
      resetToDefaults,
      syncWithSupabase,
    }),
    [
      products,
      categories,
      isLoading,
      addCategory,
      addProduct,
      updateProduct,
      deleteProduct,
      clearAllProducts,
      stockIn,
      deductStock,
      returnStock,
      findProductByName,
      resetToDefaults,
      syncWithSupabase,
    ]
  );

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
}
