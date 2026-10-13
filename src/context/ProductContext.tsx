import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Product } from '../types';
import { PRODUCTS as INITIAL_PRODUCTS, CATEGORIES as INITIAL_CATEGORIES } from '../mockData';

interface ProductContextType {
  products: Product[];
  categories: string[];
  addCategory: (newCategory: string) => void;
  addProduct: (product: Omit<Product, 'id'>) => Product;
  updateProduct: (id: string, updates: Partial<Omit<Product, 'id'>>) => void;
  deleteProduct: (id: string) => void;
  stockIn: (id: string, quantityToAdd: number) => void;
  deductStock: (items: { productId: string; quantity: number }[]) => void;
  returnStock: (items: { productId: string; quantity: number }[]) => void;
  findProductByName: (name: string) => Product | undefined;
  resetToDefaults: () => void;
}

const STORAGE_KEY = 'santexpro_products_v1';
const CATEGORIES_KEY = 'santexpro_categories_v1';

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export function ProductProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(CATEGORIES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load categories from localStorage', e);
    }
    return INITIAL_CATEGORIES;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load products from localStorage', e);
    }
    return INITIAL_PRODUCTS;
  });

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

  const addCategory = (newCat: string) => {
    const trimmed = newCat.trim();
    if (!trimmed) return;
    if (!categories.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      setCategories(prev => [...prev, trimmed]);
    }
  };

  const findProductByName = (name: string): Product | undefined => {
    const trimmed = name.trim().toLowerCase();
    if (!trimmed) return undefined;
    return products.find(p => p.name.trim().toLowerCase() === trimmed);
  };

  const addProduct = (newProd: Omit<Product, 'id'>): Product => {
    const newId = 'prod_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const createdProduct: Product = {
      ...newProd,
      id: newId,
      name: newProd.name.trim(),
    };
    setProducts(prev => [createdProduct, ...prev]);
    return createdProduct;
  };

  const updateProduct = (id: string, updates: Partial<Omit<Product, 'id'>>) => {
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
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const stockIn = (id: string, quantityToAdd: number) => {
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
  };

  const deductStock = (items: { productId: string; quantity: number }[]) => {
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
  };

  const returnStock = (items: { productId: string; quantity: number }[]) => {
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
  };

  const resetToDefaults = () => {
    setProducts(INITIAL_PRODUCTS);
    setCategories(INITIAL_CATEGORIES);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CATEGORIES_KEY);
  };

  return (
    <ProductContext.Provider
      value={{
        products,
        categories,
        addCategory,
        addProduct,
        updateProduct,
        deleteProduct,
        stockIn,
        deductStock,
        returnStock,
        findProductByName,
        resetToDefaults,
      }}
    >
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
