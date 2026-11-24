import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { Product } from '../types';
import { productService, dbToProduct, inferCategoryFromName } from '../services/productService';
import { categoryService } from '../services/categoryService';
import { supabase } from '../lib/supabase';

const DEFAULT_CATEGORIES = ['Barchasi', 'Trubalar', 'Fitinglar', 'Smesitellar', 'Isitish', 'Nasoslar', 'Katta tovarlar', 'Aksessuarlar'];

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
    return DEFAULT_CATEGORIES;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    try {
      localStorage.removeItem('santexpro_products_v1');
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((p: any) => ({
            ...p,
            category: p.category && p.category.trim() !== '' ? p.category : inferCategoryFromName(p.name),
          }));
        }
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
              const exists = prev.some(
                p => p.id === newProd.id ||
                (p.name.trim().toLowerCase() === newProd.name.trim().toLowerCase() && p.id.startsWith('prod_'))
              );
              if (exists) {
                return prev.map(p => {
                  const isMatch = p.id === newProd.id ||
                    (p.name.trim().toLowerCase() === newProd.name.trim().toLowerCase() && p.id.startsWith('prod_'));
                  if (isMatch) {
                    return {
                      ...p,
                      ...newProd,
                      // Realtime WAL dan kelganda kategoriya yoki TOAST rasm bo'sh bo'lsa, optimistik qiymatni saqlab qolish
                      category: newProd.category || p.category,
                      image: newProd.image || p.image,
                      costPrice: newProd.costPrice ?? p.costPrice,
                    } as Product;
                  }
                  return p;
                });
              }
              return [newProd as Product, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updated = dbToProduct(payload.new as any);
            setProducts(prev => {
              if (payload.new.is_active === false) {
                return prev.filter(p => p.id !== updated.id);
              }
              return prev.map(p => {
                const isMatch = p.id === updated.id ||
                  (p.id.startsWith('prod_') && p.name.trim().toLowerCase() === updated.name.trim().toLowerCase());
                if (isMatch) {
                  return {
                    ...p,
                    ...updated,
                    category: updated.category || p.category,
                    image: updated.image || p.image,
                    costPrice: updated.costPrice ?? p.costPrice,
                  } as Product;
                }
                return p;
              });
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

  // 1. Supabase bilan to'liq sinxronlash (Fetch & Merging with optimistic products)
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
      const { data: serverProducts, error: fetchError } = await productService.getAll(0, 500);

      // Agar xatolik bo'lsa yoki serverProducts null bo'lsa — hech qachon mavjud mahsulotlarni o'chirmaslik!
      if (fetchError || serverProducts === null) {
        console.warn('[Supabase] Tovar maʼlumotlarini olishda xatolik yuz berdi, mahalliy kesh saqlanadi:', fetchError);
        return;
      }

      // Agar bazada mahsulot bo'lsa — bazadagidan foydalanamiz va hali saqlanmagan optimistic tovarlarni qo'shib saqlaymiz
      if (serverProducts.length > 0) {
        setProducts(prev => {
          const pendingLocal = prev.filter(p =>
            p.id.startsWith('prod_') &&
            !serverProducts.some(sp => sp.id === p.id || sp.name.trim().toLowerCase() === p.name.trim().toLowerCase())
          );
          const normalizedServer = serverProducts.map(sp => ({
            ...sp,
            category: sp.category && sp.category.trim() !== '' ? sp.category : inferCategoryFromName(sp.name),
          }));
          const merged = [...pendingLocal, ...normalizedServer];
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          } catch (e) {
            console.error('Failed to save products to localStorage', e);
          }
          return merged;
        });

        // Orqa fonda: kategoriyasi bo'sh bo'lgan tovarlarni Supabase bazasiga ham avtomatik saqlab qo'yish
        setTimeout(() => {
          serverProducts.forEach(async (sp) => {
            if (!sp.category && sp.name) {
              const inferred = inferCategoryFromName(sp.name);
              if (inferred) {
                try {
                  await productService.update(sp.id, { category: inferred });
                } catch {
                  // silent catch
                }
              }
            }
          });
        }, 2000);
      } else {
        // Agar bazada 0 ta tovar kelsa, lekin mahalliy xotirada pending tovarlar bo'lsa, ularni yo'qotmaslik
        setProducts(prev => {
          const pendingLocal = prev.filter(p => p.id.startsWith('prod_'));
          if (pendingLocal.length > 0) {
            return pendingLocal;
          }
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
          } catch (e) {
            console.error(e);
          }
          return [];
        });
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
          setProducts(prev => prev.map(p => {
            const isMatch = p.id === tempId || p.id === saved.id || (p.name.trim().toLowerCase() === saved.name.trim().toLowerCase() && p.id.startsWith('prod_'));
            if (isMatch) {
              return {
                ...p,
                ...(saved as Product),
                image: (saved as Product).image || p.image,
                category: (saved as Product).category || p.category,
                costPrice: (saved as Product).costPrice ?? p.costPrice,
              };
            }
            return p;
          }));
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
    setProducts([]);
    setCategories(DEFAULT_CATEGORIES);
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
