import { useState, useMemo, useEffect, useRef, useCallback, useDeferredValue } from 'react';
import { 
  Package, 
  Search, 
  Plus, 
  ArrowUpRight, 
  Edit3, 
  Trash2, 
  AlertCircle,
  Filter,
  Layers,
  CheckCircle2,
  X
} from 'lucide-react';
import { useProducts } from '../context/ProductContext';
import { useBlockUpdate, useTaskCompletion } from '../context/UpdateContext';
import type { Product } from '../types';
import { StockInModal } from '../components/StockInModal';
import { ProductFormModal } from '../components/ProductFormModal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';
import { formatSum } from '../utils/format';

export function TovarlarPage() {
  const { 
    products, 
    categories,
    addCategory,
    addProduct, 
    updateProduct, 
    deleteProduct, 
    stockIn 
  } = useProducts();

  // Search and Category filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Barchasi');
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  // Progressive loading limit for optimal DOM weight
  const [visibleCount, setVisibleCount] = useState(30);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [stockInProduct, setStockInProduct] = useState<Product | null>(null);
  const [isStockInModalOpen, setIsStockInModalOpen] = useState(false);

  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const markTaskComplete = useTaskCompletion();

  // Safety guard: Block silent updates while product form, stock-in, or delete modal is active
  useBlockUpdate(
    isFormModalOpen || isStockInModalOpen || isDeleteModalOpen,
    'Tovarlar modal oynasi ochiq'
  );

  // Success toast/banner notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(msg);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimerRef.current = null;
    }, 4000);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  // Duplicate check logic (case-insensitive, trimming whitespace)
  const checkDuplicate = useCallback((name: string, excludeId?: string): Product | undefined => {
    if (!name || typeof name !== 'string') return undefined;
    const trimmed = name.trim().toLowerCase();
    if (!trimmed) return undefined;
    return products.find(p => p && p.id !== excludeId && typeof p.name === 'string' && p.name.trim().toLowerCase() === trimmed);
  }, [products]);

  // Deferred search to decouple typing latency from list filtering
  const deferredSearch = useDeferredValue(searchQuery);

  // Reset pagination limit on search or category filter change
  useEffect(() => {
    setVisibleCount(30);
  }, [searchQuery, selectedCategory, onlyLowStock]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    let list = products;
    if (onlyLowStock) {
      list = list.filter(p => (Number(p?.stock) || 0) <= 5);
    }
    if (selectedCategory !== 'Barchasi') {
      list = list.filter(p => p?.category === selectedCategory);
    }
    if (deferredSearch.trim()) {
      const q = deferredSearch.toLowerCase().trim();
      list = list.filter(p => 
        (typeof p?.name === 'string' && p.name.toLowerCase().includes(q)) || 
        (typeof p?.category === 'string' && p.category.toLowerCase().includes(q)) ||
        (typeof p?.artikul === 'string' && p.artikul.toLowerCase().includes(q))
      );
    }
    return list;
  }, [products, onlyLowStock, selectedCategory, deferredSearch]);

  const visibleProducts = useMemo(() => {
    return filteredProducts.slice(0, visibleCount);
  }, [filteredProducts, visibleCount]);

  // Statistics
  const totalStockCount = useMemo(() => {
    return products.reduce((acc, p) => acc + (Number(p?.stock) || 0), 0);
  }, [products]);

  const lowStockCount = useMemo(() => {
    return products.filter(p => (Number(p?.stock) || 0) <= 5).length;
  }, [products]);

  // Handlers
  const handleOpenAddModal = useCallback(() => {
    setEditingProduct(null);
    setIsFormModalOpen(true);
  }, []);

  const handleOpenEditModal = useCallback((product: Product) => {
    setEditingProduct(product);
    setIsFormModalOpen(true);
  }, []);

  const handleOpenStockIn = useCallback((product: Product) => {
    setStockInProduct(product);
    setIsStockInModalOpen(true);
  }, []);

  const handleOpenDelete = useCallback((product: Product) => {
    setDeletingProduct(product);
    setIsDeleteModalOpen(true);
  }, []);

  const handleSaveProduct = useCallback((productData: Omit<Product, 'id'>) => {
    if (editingProduct) {
      updateProduct(editingProduct.id, productData);
      showToast(`"${productData.name}" muvaffaqiyatli tahrirlandi!`);
    } else {
      addProduct(productData);
      showToast(`"${productData.name}" muvaffaqiyatli qo'shildi!`);
    }
    markTaskComplete();
  }, [editingProduct, updateProduct, addProduct, showToast, markTaskComplete]);

  const handleStockInConfirm = useCallback((qty: number) => {
    if (!stockInProduct) return;
    stockIn(stockInProduct.id, qty);
    showToast(`"${stockInProduct.name}"ga +${qty} ${stockInProduct.unit} kirim qilindi!`);
    markTaskComplete();
  }, [stockInProduct, stockIn, showToast, markTaskComplete]);

  const handleDeleteConfirm = useCallback(() => {
    if (!deletingProduct) return;
    deleteProduct(deletingProduct.id);
    showToast(`"${deletingProduct.name}" ro'yxatdan o'chirildi!`);
    markTaskComplete();
  }, [deletingProduct, deleteProduct, showToast, markTaskComplete]);

  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-y-auto overflow-x-hidden w-full select-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 sm:right-8 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-3 duration-200 border border-slate-700">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="font-semibold text-sm sm:text-base">{toastMessage}</span>
          <button 
            onClick={() => setToastMessage(null)}
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Container */}
      <div className="p-3 sm:p-6 lg:p-8 flex flex-col gap-4 sm:gap-6 max-w-7xl mx-auto w-full">
        
        {/* Top Header & Stat Cards */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
            <div className="w-9 h-9 sm:w-12 sm:h-12 bg-brand/10 text-brand rounded-xl sm:rounded-2xl flex items-center justify-center shadow-inner shrink-0">
              <Package className="w-4.5 h-4.5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h1 className="text-base sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
                  Tovarlar Ombori
                </h1>
                <span className="bg-brand/10 text-brand text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                  {products.length} xil
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-500 font-medium mt-0.5 line-clamp-1 sm:line-clamp-none">
                Barcha santexnika mahsulotlarini boshqarish va nazorati
              </p>
            </div>
          </div>

          {/* Touch-Friendly Add Product Button */}
          <button
            onClick={handleOpenAddModal}
            className="min-h-[40px] sm:min-h-[46px] px-3.5 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-brand to-sky-600 hover:from-sky-600 hover:to-sky-700 active:scale-95 text-white font-bold text-xs sm:text-base rounded-xl sm:rounded-2xl shadow-md shadow-brand/20 transition-all flex items-center justify-center gap-1.5 sm:gap-2 shrink-0 self-stretch sm:self-auto cursor-pointer"
            aria-label="Yangi mahsulot qo'shish"
          >
            <Plus className="hidden sm:inline-block w-4.5 h-4.5 stroke-[3]" />
            <span>Mahsulot qo'shish</span>
          </button>
        </div>

        {/* Quick Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3.5">
          {/* All products card */}
          <button
            type="button"
            onClick={() => setOnlyLowStock(false)}
            className={`p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border text-left transition-all active:scale-95 flex items-center gap-2 sm:gap-3 cursor-pointer min-w-0 ${
              !onlyLowStock 
                ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-transparent shadow-md shadow-blue-600/20' 
                : 'bg-white text-slate-800 border-slate-200/80 shadow-xs hover:border-slate-300'
            }`}
          >
            <div className={`w-8 h-8 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 ${
              !onlyLowStock ? 'bg-white/20 text-white' : 'bg-blue-50 text-brand'
            }`}>
              <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className={`text-[9px] sm:text-[11px] font-bold uppercase tracking-wider truncate ${!onlyLowStock ? 'text-blue-100' : 'text-slate-400'}`}>
                Jami tovarlar
              </div>
              <div className="text-sm sm:text-lg lg:text-xl font-black leading-tight truncate mt-0.5">
                {products.length} <span className={`text-[9px] sm:text-xs font-normal ${!onlyLowStock ? 'text-blue-100' : 'text-slate-400'}`}>xil</span>
              </div>
            </div>
          </button>

          {/* Total stock card */}
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-transparent shadow-md shadow-emerald-600/20 flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl bg-white/20 text-white flex items-center justify-center shrink-0">
              <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[9px] sm:text-[11px] font-bold text-emerald-100 uppercase tracking-wider truncate">
                Jami qoldiq
              </div>
              <div className="text-sm sm:text-lg lg:text-xl font-black leading-tight truncate mt-0.5">
                {formatSum(totalStockCount)} <span className="text-[9px] sm:text-xs font-normal text-emerald-100">dona</span>
              </div>
            </div>
          </div>

          {/* Low stock card - interactive filter */}
          <button
            type="button"
            onClick={() => setOnlyLowStock(prev => !prev)}
            aria-pressed={onlyLowStock}
            className={`col-span-2 sm:col-span-1 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border text-left transition-all active:scale-95 flex items-center justify-between gap-2 cursor-pointer ${
              onlyLowStock
                ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white border-transparent shadow-md shadow-amber-500/20 ring-2 ring-amber-400'
                : 'bg-white text-slate-800 border-slate-200/80 shadow-xs hover:border-amber-300 hover:bg-amber-50/20'
            }`}
            title="Kam qolgan mahsulotlarni filtrlash"
          >
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div className={`w-8 h-8 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                onlyLowStock ? 'bg-white/20 text-white' : 'bg-amber-50 text-amber-600'
              }`}>
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className={`text-[9px] sm:text-[11px] font-bold uppercase tracking-wider truncate ${
                  onlyLowStock ? 'text-amber-100' : 'text-slate-400'
                }`}>
                  Kam qolgan (≤ 5)
                </div>
                <div className="text-sm sm:text-lg lg:text-xl font-black leading-tight truncate mt-0.5">
                  {lowStockCount} <span className={`text-[9px] sm:text-xs font-normal ${onlyLowStock ? 'text-amber-100' : 'text-slate-400'}`}>ta</span>
                </div>
              </div>
            </div>
            <div className={`px-2 py-0.5 rounded-lg text-[9px] sm:text-xs font-black uppercase tracking-wide shrink-0 ${
              onlyLowStock 
                ? 'bg-white text-amber-800 shadow-xs' 
                : 'bg-amber-100 text-amber-800'
            }`}>
              {onlyLowStock ? 'Faol ✕' : 'Filtr'}
            </div>
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col gap-4">
          {/* Active Filter notification banner if low stock filter is active */}
          {onlyLowStock && (
            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3 sm:px-4 flex items-center justify-between gap-3 text-amber-900 animate-in fade-in duration-150">
              <div className="flex items-center gap-2.5 min-w-0">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <span className="text-xs sm:text-sm font-bold truncate">
                  Faqat qoldig'i 5 yoki undan kam bo'lgan mahsulotlar ko'rsatilmoqda ({filteredProducts.length} ta)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOnlyLowStock(false)}
                className="px-3 py-1.5 min-h-[36px] bg-white hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-xl text-xs font-extrabold shrink-0 transition-all active:scale-95"
              >
                Filtrni bekor qilish ✕
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-stretch gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <label htmlFor="tovarlar-search-input" className="sr-only">
                Mahsulot nomi yoki kategoriya bo'yicha qidirish
              </label>
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
              <input
                id="tovarlar-search-input"
                name="search"
                type="text"
                aria-label="Mahsulot nomi yoki kategoriya bo'yicha qidirish"
                placeholder="Mahsulot nomi yoki kategoriya bo'yicha qidirish..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full min-h-[48px] pl-12 pr-10 py-3 bg-slate-100/90 rounded-2xl text-slate-800 font-medium placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand transition-all text-sm sm:text-base border border-transparent focus:border-brand"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                  aria-label="Qidiruvni tozalash"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Categories Horizontal Scrollable Pills */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-hide pt-0.5">
            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-0.5 sm:mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              Kategoriya:
            </span>
            {categories.map(category => {
              const active = selectedCategory === category;
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`min-h-[36px] sm:min-h-[40px] px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 active:scale-95 flex items-center gap-1.5 cursor-pointer ${
                    active
                      ? 'bg-brand text-white shadow-md shadow-brand/20'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800'
                  }`}
                >
                  <span>{category}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Cards for Mobile (<768px) and Table for Desktop (>=768px) */}
        
        {/* MOBILE CARDS VIEW (md:hidden) */}
        <div className="md:hidden flex flex-col gap-3">
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 shadow-xs">
              <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Package className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-slate-700 text-lg">Mahsulot topilmadi</h3>
              <p className="text-slate-400 text-sm mt-1">
                Kiritilgan qidiruv yoki kategoriya bo'yicha mos mahsulot mavjud emas.
              </p>
              <button
                onClick={handleOpenAddModal}
                className="mt-4 px-5 py-3 min-h-[44px] bg-brand text-white font-bold rounded-xl text-sm inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Yangi mahsulot qo'shish</span>
              </button>
            </div>
          ) : (
            visibleProducts.map(product => {
              const isLowStock = (Number(product.stock) || 0) <= 5;
              return (
                <div 
                  key={product.id}
                  className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200/90 shadow-2xs flex flex-col gap-2.5 sm:gap-3 transition-all hover:border-slate-300"
                >
                  {/* Top row: image, info, badge */}
                  <div className="flex items-start gap-2.5 sm:gap-3">
                    <img 
                      src={product.image || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&q=80'} 
                      alt={product.name} 
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover border border-slate-100 shadow-2xs shrink-0 bg-slate-100"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] sm:text-[11px] font-bold text-brand bg-brand/10 px-2 py-0.5 rounded-full">
                          {product.category}
                        </span>
                        {isLowStock && (
                          <span className="text-[10px] sm:text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                            Kam qoldi
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-slate-900 text-xs sm:text-sm leading-snug mt-1 line-clamp-2" title={product.name}>
                        {product.name}
                      </h3>
                      <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-slate-100/80">
                        <div className="flex flex-col">
                          <span className="text-xs sm:text-sm font-black text-slate-800">
                            {formatSum(product.price)} <span className="text-[10px] sm:text-xs font-semibold text-slate-500">UZS / {product.unit}</span>
                          </span>
                          {product.costPrice ? (
                            <span className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                              Asl: {formatSum(product.costPrice)} UZS
                            </span>
                          ) : null}
                        </div>
                        <div className="text-right">
                          <span className={`text-[11px] sm:text-xs font-black px-2 py-0.5 rounded-lg border ${
                            isLowStock 
                              ? 'text-amber-700 bg-amber-50 border-amber-200/80' 
                              : 'text-emerald-700 bg-emerald-50 border-emerald-200/80'
                          }`}>
                            {formatSum(product.stock)} {product.unit}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons (Touch-first: >= 40px target) */}
                  <div className="grid grid-cols-6 gap-2 pt-1 border-t border-slate-100">
                    {/* Kirim qilish button */}
                    <button
                      onClick={() => handleOpenStockIn(product)}
                      className="col-span-4 min-h-[38px] sm:min-h-[42px] px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 active:scale-95 text-emerald-700 font-extrabold rounded-xl border border-emerald-200/80 transition-all flex items-center justify-center gap-1.5 text-xs sm:text-sm"
                      title="Kirim qilish"
                    >
                      <ArrowUpRight className="hidden sm:inline-block w-4 h-4 stroke-[3]" />
                      <span>Kirim qilish</span>
                    </button>

                    {/* Edit button */}
                    <button
                      onClick={() => handleOpenEditModal(product)}
                      className="col-span-1 min-h-[38px] sm:min-h-[42px] min-w-[38px] sm:min-w-[42px] p-2 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 rounded-xl transition-all flex items-center justify-center"
                      title="Tahrirlash"
                      aria-label={`${product.name}ni tahrirlash`}
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => handleOpenDelete(product)}
                      className="col-span-1 min-h-[38px] sm:min-h-[42px] min-w-[38px] sm:min-w-[42px] p-2 bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-600 rounded-xl transition-all flex items-center justify-center"
                      title="O'chirish"
                      aria-label={`${product.name}ni o'chirish`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* DESKTOP TABLE VIEW (hidden md:block) */}
        <div className="hidden md:block bg-white rounded-3xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 border-b border-slate-200 text-xs font-bold uppercase tracking-wider">
                  <th className="p-4 pl-6">Mahsulot</th>
                  <th className="p-4">Kategoriya</th>
                  <th className="p-4">Narxi</th>
                  <th className="p-4">Qoldiq</th>
                  <th className="p-4 pr-6 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-slate-400">
                      <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                        <Package className="w-7 h-7" />
                      </div>
                      <p className="font-bold text-slate-600 text-base">Hech qanday mahsulot topilmadi</p>
                      <p className="text-xs text-slate-400 mt-1">Qidiruv so'zini o'zgartiring yoki yangi tovar qo'shing</p>
                    </td>
                  </tr>
                ) : (
                  visibleProducts.map(product => {
                    const isLowStock = (Number(product.stock) || 0) <= 5;
                    return (
                      <tr 
                        key={product.id} 
                        className="hover:bg-slate-50/70 transition-colors group"
                      >
                        <td className="p-4 pl-6">
                          <div className="flex items-center gap-3.5">
                            <img 
                              src={product.image || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&q=80'} 
                              alt={product.name} 
                              className="w-12 h-12 rounded-xl object-cover border border-slate-200/80 shadow-xs shrink-0" 
                            />
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 text-sm sm:text-base block group-hover:text-brand transition-colors line-clamp-2 max-w-md leading-snug">
                                {product.name}
                              </span>
                              <span className="text-xs text-slate-400 font-medium">
                                ID: #{String(product.id || '').slice(-6)}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-700">
                            {product.category}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className="font-extrabold text-slate-900 text-base leading-tight">
                              {formatSum(product.price)}
                              <span className="text-xs text-slate-500 font-medium ml-1">
                                UZS / {product.unit}
                              </span>
                            </span>
                            {product.costPrice ? (
                              <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1 mt-0.5">
                                <span className="text-slate-400 font-normal">Asl:</span>
                                <span>{formatSum(product.costPrice)} UZS</span>
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center font-black text-base ${
                              isLowStock ? 'text-amber-600' : 'text-emerald-700'
                            }`}>
                              {formatSum(product.stock)}
                            </span>
                            <span className="text-xs text-slate-500 font-medium">{product.unit}</span>
                            {isLowStock && (
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                                Kam
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <div className="inline-flex items-center gap-2">
                            {/* Kirim qilish button (Touch-friendly >= 44px) */}
                            <button
                              onClick={() => handleOpenStockIn(product)}
                              className="min-h-[44px] px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 active:scale-95 font-bold text-xs sm:text-sm rounded-xl border border-emerald-200/80 transition-all flex items-center gap-1.5"
                              title="Omborga kirim qilish"
                            >
                              <ArrowUpRight className="w-4 h-4 stroke-[3]" />
                              <span>Kirim qilish</span>
                            </button>

                            {/* Edit button */}
                            <button
                              onClick={() => handleOpenEditModal(product)}
                              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 transition-all flex items-center justify-center"
                              title="Tahrirlash"
                              aria-label={`${product.name}ni tahrirlash`}
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            {/* Delete button */}
                            <button
                              onClick={() => handleOpenDelete(product)}
                              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-600 transition-all flex items-center justify-center"
                              title="O'chirish"
                              aria-label={`${product.name}ni o'chirish`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Progressive Load More button */}
        {filteredProducts.length > visibleCount && (
          <div className="py-4 flex justify-center">
            <button
              type="button"
              onClick={() => setVisibleCount(prev => prev + 30)}
              className="px-6 py-2.5 bg-white hover:bg-slate-50 border border-slate-200/90 text-brand font-bold text-xs sm:text-sm rounded-xl shadow-xs hover:shadow-sm active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Ko'proq ko'rsatish (+{filteredProducts.length - visibleCount} ta)</span>
            </button>
          </div>
        )}

      </div>

      {/* Stock In Modal */}
      {stockInProduct && (
        <StockInModal
          isOpen={isStockInModalOpen}
          product={stockInProduct}
          onClose={() => {
            setIsStockInModalOpen(false);
            setStockInProduct(null);
          }}
          onConfirm={handleStockInConfirm}
        />
      )}

      {/* Add / Edit Product Modal with Duplicate Prevention */}
      <ProductFormModal
        isOpen={isFormModalOpen}
        productToEdit={editingProduct}
        categories={categories}
        onAddCategory={addCategory}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveProduct}
        checkDuplicate={checkDuplicate}
        onDuplicateAttempt={(existingProduct) => {
          // Immediately redirect to stock-in for this existing duplicate!
          setIsFormModalOpen(false);
          setEditingProduct(null);
          setStockInProduct(existingProduct);
          setIsStockInModalOpen(true);
        }}
      />

      {/* Delete Confirmation Modal */}
      {deletingProduct && (
        <DeleteConfirmModal
          isOpen={isDeleteModalOpen}
          product={deletingProduct}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setDeletingProduct(null);
          }}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
}
