// src/hooks/useProducts.ts
// React Query orqali mahsulotlar va kategoriyalar boshqaruvi

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '../services/productService';
import { categoryService } from '../services/categoryService';
import type { Product } from '../types';

export const PRODUCT_QUERY_KEYS = {
  all: ['products'] as const,
  list: (page = 0) => ['products', 'list', page] as const,
  categories: ['categories'] as const,
  search: (q: string) => ['products', 'search', q] as const,
};

/** Barcha mahsulotlarni olish query */
export function useProductsQuery(page = 0) {
  return useQuery({
    queryKey: PRODUCT_QUERY_KEYS.list(page),
    queryFn: () => productService.getAll(page),
  });
}

/** Kategoriyalarni olish query */
export function useCategoriesQuery() {
  return useQuery({
    queryKey: PRODUCT_QUERY_KEYS.categories,
    queryFn: () => categoryService.getAll(),
  });
}

/** Yangi mahsulot qo'shish mutation */
export function useCreateProductMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newProduct: Omit<Product, 'id'>) => productService.create(newProduct),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.categories });
    },
  });
}

/** Mahsulotni yangilash mutation */
export function useUpdateProductMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Omit<Product, 'id'>> }) =>
      productService.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.all });
    },
  });
}

/** Mahsulotni o'chirish mutation */
export function useDeleteProductMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => productService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.all });
    },
  });
}

/** Stock kirim mutation */
export function useStockInMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, quantity, note }: { id: string; quantity: number; note?: string }) =>
      productService.stockIn(id, quantity, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.all });
    },
  });
}
