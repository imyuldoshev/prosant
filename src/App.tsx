import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProductProvider } from './context/ProductContext';
import { SalesProvider } from './context/SalesContext';
import { UpdateProvider } from './context/UpdateContext';
import { ThemeProvider } from './context/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';

const KassaPage = lazy(() => import('./pages/KassaPage').then(m => ({ default: m.KassaPage })));
const TovarlarPage = lazy(() => import('./pages/TovarlarPage').then(m => ({ default: m.TovarlarPage })));
const TarixPage = lazy(() => import('./pages/TarixPage').then(m => ({ default: m.TarixPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));

function PageLoading() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[50vh] p-8">
      <div className="w-8 h-8 border-3 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        {/* UpdateProvider coordinates silent deferred updates across routes */}
        <UpdateProvider>
          <ProductProvider>
            <SalesProvider>
              <Suspense fallback={<PageLoading />}>
                <Routes>
                  {/* Ochiq marshrut — Tizimga kirish sahifasi */}
                  <Route path="/login" element={<LoginPage />} />

                  {/* Himoyalangan marshrutlar — faqat login qilganlar uchun */}
                  <Route element={<ProtectedRoute />}>
                    <Route path="/" element={<Layout />}>
                      <Route index element={<KassaPage />} />
                      <Route path="tovarlar" element={<TovarlarPage />} />
                      <Route path="tarix" element={<TarixPage />} />
                    </Route>
                  </Route>

                  {/* Noma'lum manzillarni bosh sahifaga yo'naltirish */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </SalesProvider>
          </ProductProvider>
        </UpdateProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
