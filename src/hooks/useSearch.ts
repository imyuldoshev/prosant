// src/hooks/useSearch.ts
// PostgreSQL Full-Text Search (FTS) va trigram qidiruv hooki

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productService } from '../services/productService';
import { PRODUCT_QUERY_KEYS } from './useProducts';

export function useSearch(initialQuery = '') {
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  const searchQuery = useQuery({
    queryKey: PRODUCT_QUERY_KEYS.search(debouncedQuery),
    queryFn: () => productService.fullTextSearch(debouncedQuery),
    enabled: debouncedQuery.length > 0,
    staleTime: 1000 * 60 * 2,
  });

  return {
    query,
    setQuery,
    results: searchQuery.data ?? [],
    isLoading: searchQuery.isLoading,
    error: searchQuery.error,
  };
}
