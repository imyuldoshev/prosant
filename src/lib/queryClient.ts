// src/lib/queryClient.ts
// React Query client konfiguratsiyasi — global sozlamalar

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 5 daqiqa: ma'lumot "fresh" hisoblanadi, qayta so'rov yuborilmaydi
      staleTime: 1000 * 60 * 5,
      // 30 daqiqa: komponent unmount bo'lgandan keyin cache saqlanadi
      gcTime: 1000 * 60 * 30,
      // Xato bo'lsa 2 marta qayta urinadi
      retry: 2,
      // Oyna focus bo'lganda avtomatik yangilash
      refetchOnWindowFocus: false,
    },
    mutations: {
      // Mutation xatolari uchun qayta urinmaslik
      retry: 0,
    },
  },
});
