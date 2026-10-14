// src/hooks/useRealtime.ts
// Supabase Realtime obuna — bir nechta kassa bir vaqtda ishlaganda stock o'zgarishini darhol sinxronlash

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { PRODUCT_QUERY_KEYS } from './useProducts';

export function useProductsRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Supabase Realtime kanaliga obuna bo'lish
    const channel = supabase
      .channel('realtime:products')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        () => {
          // Boshqa foydalanuvchi tovar qo'shsa, tahrirlasa yoki sotuv bo'lsa keshni yangilaymiz
          queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.all });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
