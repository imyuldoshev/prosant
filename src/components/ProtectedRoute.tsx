// src/components/ProtectedRoute.tsx
// Faqat tizimga kirgan foydalanuvchilar uchun sahifalarni himoya qilish

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Sessiya xotiradan tekshirilayotgan qisqa vaqt oralig'i (agar foydalanuvchi birinchi marta kirayotgan bo'lsa)
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">SantexPro tizimi yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  // Tizimga kirmagan bo'lsa — darhol Login sahifasiga yo'naltirish
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Tizimga kirgan bo'lsa — sahifani ko'rsatish
  return <Outlet />;
}
