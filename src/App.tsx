import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { KassaPage } from './pages/KassaPage';
import { TovarlarPage } from './pages/TovarlarPage';
import { TarixPage } from './pages/TarixPage';
import { ProductProvider } from './context/ProductContext';
import { SalesProvider } from './context/SalesContext';
import { UpdateProvider } from './context/UpdateContext';

export default function App() {
  return (
    <BrowserRouter>
      {/* UpdateProvider coordinates silent deferred updates across routes */}
      <UpdateProvider>
        <ProductProvider>
          <SalesProvider>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<KassaPage />} />
                <Route path="tovarlar" element={<TovarlarPage />} />
                <Route path="tarix" element={<TarixPage />} />
              </Route>
            </Routes>
          </SalesProvider>
        </ProductProvider>
      </UpdateProvider>
    </BrowserRouter>
  );
}
