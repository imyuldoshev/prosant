import { useState, useMemo, useEffect, useRef, useCallback, useDeferredValue } from 'react';
import { 
  Search, ShoppingCart, Plus, X, Trash2, Mic, Minus,
  CreditCard, Banknote, Building2, Phone, Receipt, Printer, FileText, CheckCircle2, AlertCircle,
  Check, Loader2, Send
} from 'lucide-react';
import type { Product, CartItem, PaymentMethod, SaleRecord } from '../types';
import { useProducts } from '../context/ProductContext';
import { useSales } from '../context/SalesContext';
import { useAuth } from '../context/AuthContext';
import { useBlockUpdate, useTaskCompletion } from '../context/UpdateContext';
import { ReceiptModal } from '../components/ReceiptModal';
import { KassaProductCard } from '../components/KassaProductCard';
import { FormattedNumberInput } from '../components/FormattedNumberInput';
import { formatSum, parseFormattedNumber } from '../utils/format';
import { telegramService } from '../services/telegramService';
import { TelegramSettingsModal } from '../components/TelegramSettingsModal';

function formatPhoneLocal(digits: string): string {
  const d = digits.replace(/\D/g, '').slice(0, 9);
  if (d.length === 0) return '';
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 5) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2, 5)}-${d.slice(5)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 5)}-${d.slice(5, 7)}-${d.slice(7, 9)}`;
}

export function KassaPage() {
  const { user } = useAuth();
  const { products, categories } = useProducts();
  const { addSale } = useSales();
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Barchasi');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingCartProductId, setEditingCartProductId] = useState<string | null>(null);
  const [quantityStr, setQuantityStr] = useState('1');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isTelegramSettingsOpen, setIsTelegramSettingsOpen] = useState(false);
  const quantityInputRef = useRef<HTMLInputElement>(null);

  const markTaskComplete = useTaskCompletion();

  // Checkout modal holatlari
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('naqd');
  const [customerName, setCustomerName] = useState('');
  const [customerPhoneDigits, setCustomerPhoneDigits] = useState('');
  const [receivedCashStr, setReceivedCashStr] = useState<string>('');
  const [checkoutNote, setCheckoutNote] = useState('');
  const [autoPrintAfterSale, setAutoPrintAfterSale] = useState(false);
  const [completedSale, setCompletedSale] = useState<SaleRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  // Safety guard: Block silent updates while cashier has items in cart, checkout modal open, or active transaction
  useBlockUpdate(
    cart.length > 0 || isCheckoutOpen || selectedProduct !== null || completedSale !== null,
    cart.length > 0 ? 'Savatchada xarid tovarlari mavjud' : 'Kassada to\'lov/chek jarayoni davom etmoqda'
  );

  // Native input refs for direct keyboard navigation
  const cashInputRef = useRef<HTMLInputElement>(null);
  const customerPhoneInputRef = useRef<HTMLInputElement>(null);
  const customerNameInputRef = useRef<HTMLInputElement>(null);
  const checkoutNoteInputRef = useRef<HTMLInputElement>(null);

  // Toast notification state
  const [toastNotification, setToastNotification] = useState<string | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastNotification(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastNotification(null);
      toastTimeoutRef.current = null;
    }, 3000);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  const totalCartSum = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  // Reusable Sale Completion Function (Double-submit protected)
  const handleCompleteSale = useCallback(() => {
    if (isSubmittingRef.current || cart.length === 0) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      const finalTotal = totalCartSum;
      const receivedNum = paymentMethod === 'naqd' 
        ? (parseFormattedNumber(receivedCashStr) || finalTotal) 
        : finalTotal;
      const change = (paymentMethod === 'naqd' && receivedNum > finalTotal) 
        ? receivedNum - finalTotal 
        : 0;

      const saleItems = cart.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        category: item.product.category,
        quantity: item.quantity,
        price: item.product.price,
        costPrice: item.product.costPrice,
        total: item.product.price * item.quantity,
        unit: item.product.unit,
        artikul: item.product.artikul,
      }));

      const created = addSale({
        items: saleItems,
        total: finalTotal,
        paymentMethod,
        customerName: customerName.trim() || undefined,
        customerPhone: customerPhoneDigits ? `+998 ${formatPhoneLocal(customerPhoneDigits)}` : undefined,
        receivedAmount: receivedNum,
        changeAmount: change,
        note: checkoutNote.trim() || undefined,
      });

      // Telegram botga chek ma'lumotlarini jo'natish (spiska holatda)
      const cashierName = user?.profile?.full_name || user?.email?.split('@')[0] || 'Kassa';
      telegramService.sendSaleNotification(created, { cashierName })
        .then(res => {
          if (res.success) {
            showToast(`Chek #${created.saleNumber} Telegram botga yuborildi ✅`);
          }
        })
        .catch(err => {
          console.warn('[Telegram] Avtomatik xabarnoma yuborishda xatolik:', err);
        });

      setCart([]);
      setIsCheckoutOpen(false);
      setIsCartOpen(false);
      setCompletedSale(created);

      setCustomerName('');
      setCustomerPhoneDigits('');
      setReceivedCashStr('');
      setCheckoutNote('');
      setPaymentMethod('naqd');

      if (autoPrintAfterSale) {
        setTimeout(() => {
          window.print();
        }, 400);
      }
    } finally {
      setTimeout(() => {
        isSubmittingRef.current = false;
        setIsSubmitting(false);
      }, 600);
    }
  }, [
    cart, 
    totalCartSum, 
    paymentMethod, 
    receivedCashStr, 
    customerName, 
    customerPhoneDigits, 
    checkoutNote, 
    addSale, 
    autoPrintAfterSale,
    user,
    showToast
  ]);

  // Global Escape & Enter key handler for modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (completedSale) {
          setCompletedSale(null);
        } else if (isCheckoutOpen) {
          setIsCheckoutOpen(false);
        } else if (selectedProduct) {
          setSelectedProduct(null);
          setEditingCartProductId(null);
        }
      } else if (e.key === 'Enter') {
        if (completedSale) {
          e.preventDefault();
          setCompletedSale(null);
          return;
        }
        if (isCheckoutOpen && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          handleCompleteSale();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCheckoutOpen, completedSale, selectedProduct, handleCompleteSale]);

  // Hotkeys 1, 2, 3, 4 to switch payment method when Checkout Modal is open
  useEffect(() => {
    if (!isCheckoutOpen) return;
    const handleMethodHotkeys = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      // Only switch if not actively typing inside input
      if (activeTag === 'input' || activeTag === 'textarea') return;

      if (e.key === '1') handlePaymentMethodSelect('naqd');
      else if (e.key === '2') handlePaymentMethodSelect('karta');
      else if (e.key === '3') handlePaymentMethodSelect('transfer');
      else if (e.key === '4') handlePaymentMethodSelect('nasiya');
    };
    window.addEventListener('keydown', handleMethodHotkeys);
    return () => window.removeEventListener('keydown', handleMethodHotkeys);
  }, [isCheckoutOpen]);

  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    setPaymentMethod(method);
    if (method === 'naqd') {
      if (!receivedCashStr) {
        setReceivedCashStr(formatSum(totalCartSum));
      }
      setTimeout(() => {
        cashInputRef.current?.focus();
      }, 50);
    } else {
      setReceivedCashStr(formatSum(totalCartSum));
      setTimeout(() => {
        customerPhoneInputRef.current?.focus();
      }, 50);
    }
  };

  const openCheckoutModal = () => {
    if (cart.length === 0) return;
    setReceivedCashStr(formatSum(totalCartSum));
    setCustomerPhoneDigits('');
    setCustomerName('');
    setCheckoutNote('');
    setIsCheckoutOpen(true);
    setTimeout(() => {
      if (paymentMethod === 'naqd') {
        cashInputRef.current?.focus();
        cashInputRef.current?.select();
      } else {
        customerPhoneInputRef.current?.focus();
      }
    }, 60);
  };

  // Focus management for quantity input
  useEffect(() => {
    if (selectedProduct) {
      setTimeout(() => {
        quantityInputRef.current?.focus();
        quantityInputRef.current?.select();
      }, 50);
    }
  }, [selectedProduct]);

  const deferredQuery = useDeferredValue(query);

  const filteredProducts = useMemo(() => {
    let filtered = products;
    if (selectedCategory !== 'Barchasi') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }
    if (deferredQuery.trim()) {
      const lowerQuery = deferredQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(lowerQuery) || 
        (p.artikul ? p.artikul.toLowerCase().includes(lowerQuery) : false)
      );
    }
    return filtered;
  }, [deferredQuery, selectedCategory, products]);

  // Progressive rendering: initial 24 items to keep DOM lightweight and load instantly
  const [visibleCount, setVisibleCount] = useState(24);

  useEffect(() => {
    setVisibleCount(24);
  }, [query, selectedCategory]);

  const visibleProducts = useMemo(() => {
    return filteredProducts.slice(0, visibleCount);
  }, [filteredProducts, visibleCount]);

  const openQuantityModal = useCallback((product: Product) => {
    const stockNum = Number(product.stock) || 0;
    if (stockNum <= 0) {
      showToast(`"${product.name}" omborda qolmagan (0 ${product.unit})!`);
      return;
    }
    setSelectedProduct(product);
    setEditingCartProductId(null);
    setQuantityStr('1');
  }, [showToast]);

  const openCartItemEdit = (item: CartItem) => {
    setEditingCartProductId(item.product.id);
    setSelectedProduct(item.product);
    setQuantityStr(item.quantity.toString());
  };

  const closeQuantityModal = useCallback(() => {
    setSelectedProduct(null);
    setEditingCartProductId(null);
    setQuantityStr('1');
  }, []);

  const addToCart = useCallback((product: Product, qty: number) => {
    setCart(prev => {
      const newCart = [...prev];
      const existingIdx = newCart.findIndex(item => item.product.id === product.id);
      
      if (existingIdx >= 0) {
        newCart[existingIdx].quantity += qty;
      } else {
        newCart.push({ product, quantity: qty });
      }
      return newCart;
    });
  }, []);

  const handleQuickAdd = useCallback((product: Product) => {
    const stockNum = Number(product.stock) || 0;
    if (stockNum <= 0) {
      showToast(`"${product.name}" omborda qolmagan (0 ${product.unit})!`);
      return;
    }
    const existingItem = cart.find(item => item.product.id === product.id);
    const inCart = existingItem ? existingItem.quantity : 0;
    if (inCart + 1 > stockNum) {
      showToast(`Omborda boridan ortiq xarid qilib bo'lmaydi! (Mavjud: ${stockNum} ${product.unit})`);
      return;
    }
    addToCart(product, 1);
  }, [addToCart, cart, showToast]);

  const updateCartItemQuantity = useCallback((productId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const stockNum = Number(item.product.stock) || 0;
          const newQty = item.quantity + delta;
          if (delta > 0 && newQty > stockNum) {
            showToast(`Omborda faqat ${stockNum} ${item.product.unit} mavjud!`);
            return item;
          }
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  }, [showToast]);

  const removeCartItem = useCallback((productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  }, []);

  const clearCart = () => {
    if (cart.length === 0) return;
    setCart([]);
  };

  const handleConfirmQuantity = useCallback(() => {
    if (!selectedProduct) return;
    const stockNum = Number(selectedProduct.stock) || 0;
    const parsed = quantityStr ? parseFloat(quantityStr) : 1;

    if (!isNaN(parsed) && parsed > 0) {
      if (stockNum <= 0) {
        showToast(`"${selectedProduct.name}" omborda qolmagan!`);
        return;
      }
      if (parsed > stockNum) {
        showToast(`Omborda faqat ${stockNum} ${selectedProduct.unit} mavjud!`);
        return;
      }
      if (editingCartProductId !== null) {
        setCart(prev => prev.map(item => 
          item.product.id === editingCartProductId 
            ? { ...item, quantity: parsed }
            : item
        ));
      } else {
        addToCart(selectedProduct, parsed);
      }
      closeQuantityModal();
    } else if (!isNaN(parsed) && parsed === 0 && editingCartProductId !== null) {
      removeCartItem(editingCartProductId);
      closeQuantityModal();
    }
  }, [selectedProduct, quantityStr, editingCartProductId, closeQuantityModal, addToCart, removeCartItem, showToast]);

  const handleCategoryClick = (cat: string) => {
    if (selectedCategory === cat && cat !== 'Barchasi') {
      setSelectedCategory('Barchasi');
    } else {
      setSelectedCategory(cat);
    }
  };

  return (
    <div className="h-full flex flex-col xl:flex-row bg-slate-50 dark:bg-slate-950 relative">
      {/* Toast Notification (Always on top of all modals) */}
      {toastNotification && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] bg-slate-900/95 text-white text-sm sm:text-base font-bold px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-md flex items-center gap-3 animate-in fade-in slide-in-from-top-3 duration-200 border border-slate-700/80 ring-2 ring-black/20 pointer-events-auto">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          <span>{toastNotification}</span>
        </div>
      )}
      
      {/* LEFT PANEL: SEARCH & PRODUCTS LIST */}
      <div className="flex-1 flex flex-col h-full min-h-0 min-w-0">
        <h1 className="sr-only">ProSant — Santexnika Mahsulotlari Kassa va POS Tizimi</h1>
        
        {/* Search & Categories Area */}
        <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 border-b border-slate-200/80 dark:border-slate-800 z-10 flex flex-col gap-3 shrink-0 shadow-xs">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="flex-1 relative">
              <label htmlFor="product-search-input" className="sr-only">
                Mahsulot qidirish
              </label>
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 sm:w-6 sm:h-6" />
              <input 
                type="text" 
                id="product-search-input"
                name="search"
                aria-label="Mahsulot qidirish"
                autoComplete="off"
                className="w-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 rounded-xl sm:rounded-2xl py-3 sm:py-3.5 pl-11 sm:pl-12 pr-14 text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-brand focus:bg-white dark:focus:bg-slate-800 transition-all font-medium border border-transparent focus:border-brand/30"
                placeholder="Mahsulot qidirish (Masalan: tr 20)"
                value={query}
                onChange={e => setQuery(e.target.value)}
                autoFocus
              />
              <button 
                onClick={() => showToast('Ovozli qidiruv funksiyasi tez orada ishga tushadi')}
                aria-label="Ovozli qidiruv"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-brand/10 hover:bg-brand/20 active:scale-95 text-brand rounded-xl transition-all cursor-pointer"
              >
                <Mic className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Toggle (Shown on mobile & tablets, hidden on desktop POS where cart is permanently pinned) */}
            <button 
              className="xl:hidden relative p-3 sm:p-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl sm:rounded-2xl active:scale-95 transition-all shadow-xs hover:bg-slate-50 dark:hover:bg-slate-750 cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
              onClick={() => setIsCartOpen(true)}
              aria-label="Savatchani ochish"
            >
              <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-slate-700 dark:text-slate-300" />
              {cart.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white text-xs font-black px-1.5 py-0.5 rounded-full border-2 border-white dark:border-slate-800 min-w-[22px] flex items-center justify-center shadow-xs">
                  {cart.length}
                </span>
              )}
            </button>
          </div>
          
          {/* Categories */}
          <div className="flex overflow-x-auto gap-2 pb-0.5 scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => handleCategoryClick(cat)}
                className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer min-h-[40px] flex items-center justify-center ${
                  selectedCategory === cat
                    ? 'bg-brand text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid Area */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-4 pb-20 xl:pb-6">
            {visibleProducts.map(product => (
              <KassaProductCard
                key={product.id}
                product={product}
                isSelected={selectedProduct?.id === product.id}
                onSelect={openQuantityModal}
                onQuickAdd={handleQuickAdd}
              />
            ))}
            {filteredProducts.length === 0 && (
              <div className="col-span-full py-16 text-center text-slate-400">
                <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-base sm:text-lg font-bold">Mahsulot topilmadi</p>
                <p className="text-xs sm:text-sm mt-1">Boshqa so'z bilan qidirib ko'ring yoki kategoriyani o'zgartiring</p>
              </div>
            )}
          </div>

          {/* Progressive Rendering Show More button */}
          {visibleCount < filteredProducts.length && (
            <div className="flex justify-center pt-2 pb-24 xl:pb-8">
              <button
                type="button"
                onClick={() => setVisibleCount(prev => prev + 24)}
                className="px-6 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl shadow-xs transition-all text-sm cursor-pointer active:scale-95 flex items-center gap-2"
              >
                <span>Yana 24 ta mahsulot ko'rsatish</span>
                <span className="text-xs text-slate-400 dark:text-slate-500">({filteredProducts.length - visibleCount} ta qoldi)</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* QUANTITY SELECTION MODAL (Compact, Fast, Clean) */}
      {selectedProduct && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex flex-col justify-center items-center p-3 sm:p-4 transition-all overflow-y-auto"
          role="dialog"
          aria-modal="true"
          onClick={closeQuantityModal}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-2xl animate-in zoom-in-95 max-w-md w-full border border-slate-200 dark:border-slate-800 flex flex-col gap-4 my-auto"
          >
            {/* Header */}
            <div className="flex justify-between items-start">
              <div className="pr-3">
                <span className="text-xs font-bold uppercase tracking-wider text-brand dark:text-blue-400 bg-brand/10 dark:bg-blue-900/30 px-3 py-1 rounded-full inline-block mb-1.5">
                  {editingCartProductId !== null ? "Miqdorni o'zgartirish" : "Savatga qo'shish"}
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
                  {selectedProduct.name}
                </h2>
                <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs sm:text-sm">
                  <span className="font-semibold text-slate-500 dark:text-slate-400">
                    Narxi: <strong className="text-slate-800 dark:text-slate-200">{formatSum(selectedProduct.price)} UZS</strong> / {selectedProduct.unit}
                  </span>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className={`px-2 py-0.5 rounded-md font-bold text-xs ${
                    Number(selectedProduct.stock) <= 5
                      ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40'
                      : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40'
                  }`}>
                    Mavjud qoldiq: {selectedProduct.stock} {selectedProduct.unit}
                  </span>
                </div>
              </div>
              <button 
                onClick={closeQuantityModal}
                className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl text-slate-500 dark:text-slate-400 transition-colors cursor-pointer shrink-0 active:scale-95"
                aria-label="Yopish"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Interactive Quantity Box with Stepper buttons */}
            <div className="bg-slate-900 dark:bg-slate-950 text-white p-4 sm:p-5 rounded-2xl flex flex-col gap-3 shadow-inner border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                  Miqdori:
                </span>
                <span className="text-xs sm:text-sm text-emerald-400 font-bold font-mono">
                  Jami: {formatSum(((parseFloat(quantityStr) || (quantityStr === '' ? 1 : 0))) * selectedProduct.price)} UZS
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                {/* Stepper Minus */}
                <button
                  type="button"
                  onClick={() => {
                    const current = parseFloat(quantityStr) || 1;
                    const next = Math.max(1, current - 1);
                    setQuantityStr(next.toString());
                  }}
                  className="w-12 h-12 rounded-xl bg-slate-800 dark:bg-slate-900 hover:bg-slate-700 dark:hover:bg-slate-800 active:scale-95 text-slate-200 flex items-center justify-center transition-all cursor-pointer shrink-0 border border-slate-700 dark:border-slate-800"
                  aria-label="Kamaytirish"
                  title="1 ga kamaytirish"
                >
                  <Minus className="w-5 h-5 stroke-[2.5]" />
                </button>

                {/* Native Input with device keyboard support */}
                <div className="flex-1 flex items-baseline justify-center">
                  <input
                    ref={quantityInputRef}
                    type="text"
                    inputMode="decimal"
                    value={quantityStr}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9.]/g, '');
                      const parts = val.split('.');
                      const cleanVal = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : val;
                      setQuantityStr(cleanVal);
                    }}
                    onFocus={(e) => e.target.select()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleConfirmQuantity();
                      } else if (e.key === 'Escape') {
                        e.preventDefault();
                        closeQuantityModal();
                      }
                    }}
                    placeholder="1"
                    className="w-full text-center text-4xl sm:text-5xl font-mono font-black text-emerald-400 bg-transparent focus:outline-none tracking-wider select-all"
                  />
                  <span className="text-base sm:text-lg text-slate-400 font-sans font-bold ml-1 shrink-0 select-none">
                    {selectedProduct.unit}
                  </span>
                </div>

                {/* Stepper Plus */}
                <button
                  type="button"
                  onClick={() => {
                    const current = parseFloat(quantityStr) || 0;
                    const next = current + 1;
                    setQuantityStr(next.toString());
                  }}
                  className="w-12 h-12 rounded-xl bg-slate-800 dark:bg-slate-900 hover:bg-slate-700 dark:hover:bg-slate-800 active:scale-95 text-slate-200 flex items-center justify-center transition-all cursor-pointer shrink-0 border border-slate-700 dark:border-slate-800"
                  aria-label="Ko'paytirish"
                  title="1 ga oshirish"
                >
                  <Plus className="w-5 h-5 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* Quick Presets Row */}
            <div className="grid grid-cols-4 gap-2">
              {[1, 5, 10, 50].map(preset => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setQuantityStr(preset.toString());
                  }}
                  className="py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-brand/10 dark:hover:bg-blue-900/30 hover:text-brand dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700 font-black text-xs text-slate-700 dark:text-slate-300 active:scale-95 transition-all cursor-pointer select-none"
                >
                  +{preset} {selectedProduct.unit}
                </button>
              ))}
            </div>

            {/* Exceeding Stock Warning Banner */}
            {parseFloat(quantityStr) > (Number(selectedProduct.stock) || 0) && (
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs sm:text-sm font-bold animate-in fade-in duration-150">
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                <span>Omborda faqat {Number(selectedProduct.stock) || 0} {selectedProduct.unit} mavjud! Miqdorni kamaytiring.</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={closeQuantityModal}
                className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl transition-all cursor-pointer text-sm active:scale-95"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                disabled={
                  Number(selectedProduct.stock) <= 0 ||
                  parseFloat(quantityStr) > (Number(selectedProduct.stock) || 0)
                }
                onClick={handleConfirmQuantity}
                className={`flex-[2] py-3 text-white font-black rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm sm:text-base ${
                  parseFloat(quantityStr) > (Number(selectedProduct.stock) || 0) || Number(selectedProduct.stock) <= 0
                    ? 'bg-slate-300 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed shadow-none'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 shadow-emerald-600/30 cursor-pointer active:scale-95'
                }`}
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Savatga qo'shish</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CART OVERLAY (Only visible on <xl screens when drawer is open) */}
      {isCartOpen && (
        <div 
          className="xl:hidden fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setIsCartOpen(false)}
        />
      )}

      {/* RIGHT PANEL: CART (Embedded on desktop xl+, Flyout drawer on mobile/tablet) */}
      <div 
        className={`fixed xl:relative inset-y-0 right-0 w-[92%] sm:w-[420px] xl:w-[380px] 2xl:w-[420px] max-w-full bg-white dark:bg-slate-900 border-l border-slate-200/90 dark:border-slate-800 flex flex-col z-50 xl:z-20 transition-transform duration-300 ease-in-out shadow-2xl xl:shadow-none shrink-0 ${isCartOpen ? 'translate-x-0' : 'translate-x-full xl:translate-x-0'}`}
      >
        <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 text-slate-900 dark:text-white shrink-0">
          <h2 className="text-lg sm:text-xl font-black flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-brand dark:text-blue-400" /> 
            <span>Savatcha</span>
            <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-black px-2.5 py-0.5 rounded-full ml-1 border border-slate-200 dark:border-slate-700">
              {cart.length}
            </span>
          </h2>
          <button 
            className="xl:hidden p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl active:scale-95 transition-colors cursor-pointer"
            onClick={() => setIsCartOpen(false)}
            aria-label="Savatchani yopish"
          >
            <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5">
          {cart.map(item => (
            <div 
              key={item.product.id}
              className="p-3 bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl flex flex-col gap-2 hover:border-slate-300 dark:hover:border-slate-600 transition-all shadow-2xs"
            >
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0 flex-1">
                  <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm leading-snug line-clamp-2">
                    {item.product.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      {formatSum(item.product.price)} UZS
                    </span>
                    {item.product.artikul && (
                      <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded font-mono font-semibold">
                        {item.product.artikul}
                      </span>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => removeCartItem(item.product.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer shrink-0"
                  aria-label="Mahsulotni savatdan o'chirish"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Quantity Controller */}
              <div className="flex justify-between items-center pt-2 border-t border-slate-200/60 dark:border-slate-700/60 mt-0.5">
                <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-1 shadow-2xs">
                  <button 
                    onClick={() => updateCartItemQuantity(item.product.id, -1)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 active:scale-95 transition-all cursor-pointer font-bold"
                    aria-label="Bitta kamaytirish"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => openCartItemEdit(item)}
                    className="px-2 font-mono font-black text-sm text-slate-800 dark:text-slate-100 hover:text-brand dark:hover:text-blue-400 cursor-pointer select-none"
                    title="Miqdorni kiritish"
                  >
                    {formatSum(item.quantity)} <span className="text-[11px] font-sans font-medium text-slate-500 dark:text-slate-400">{item.product.unit}</span>
                  </button>
                  <button 
                    onClick={() => updateCartItemQuantity(item.product.id, 1)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 active:scale-95 transition-all cursor-pointer font-bold"
                    aria-label="Bitta ko'paytirish"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-right font-mono font-black text-sm text-slate-900 dark:text-white">
                  {formatSum(item.product.price * item.quantity)} <span className="text-[10px] font-sans font-medium text-slate-500 dark:text-slate-400">UZS</span>
                </div>
              </div>
            </div>
          ))}

          {cart.length === 0 && (
            <div className="h-full min-h-[250px] flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 p-6 text-center">
              <ShoppingCart className="w-14 h-14 mb-3 opacity-25" />
              <p className="font-bold text-slate-600 dark:text-slate-300 text-base">Savatcha bo'sh</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-[200px]">Mahsulotlarni qo'shish uchun chap tomondagi kartochkalarni bosing</p>
            </div>
          )}
        </div>

        {/* Cart Bottom Summary & Checkout Button */}
        <div className="p-4 bg-slate-50/95 dark:bg-slate-900/95 border-t border-slate-200/90 dark:border-slate-800 flex flex-col gap-3 shrink-0 shadow-lg xl:shadow-none">
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 font-semibold">
              <span>Mahsulot turlari:</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">{cart.length} xil</span>
            </div>
            <div className="flex justify-between items-baseline pt-1 border-t border-slate-200/60 dark:border-slate-800">
              <span className="text-sm font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Jami to'lov:</span>
              <span className="text-2xl font-black text-brand dark:text-blue-400 font-mono tracking-tight">
                {formatSum(totalCartSum)} <span className="text-xs font-sans font-bold text-slate-500 dark:text-slate-400">UZS</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button 
              type="button"
              disabled={cart.length === 0}
              onClick={clearCart}
              className="py-3 px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:border-rose-200 dark:hover:border-rose-800 hover:text-rose-600 dark:hover:text-rose-400 text-slate-600 dark:text-slate-300 font-bold rounded-2xl active:scale-95 transition-all text-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              <span>Tozalash</span>
            </button>
            <button 
              type="button"
              disabled={cart.length === 0}
              onClick={openCheckoutModal}
              className="col-span-2 py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black rounded-2xl active:scale-95 transition-all shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer text-sm sm:text-base"
            >
              <Receipt className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Sotish & Chek</span>
            </button>
          </div>
        </div>
      </div>

      {/* CHECKOUT MODAL: Centered, Focused, Fast */}
      {isCheckoutOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[80] flex items-center justify-center p-3 sm:p-5 transition-all overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-xl max-h-[94vh] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 my-auto">
            
            {/* Top Bar */}
            <div className="px-5 py-3.5 bg-slate-900 text-white flex justify-between items-center rounded-t-3xl shrink-0 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-brand/20 border border-brand/30 flex items-center justify-center text-brand">
                  <Receipt className="w-5 h-5 text-brand" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Kassa hisob-kitobi
                  </span>
                  <h3 className="text-base sm:text-lg font-black">Xaridni rasmiylashtirish</h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-700">
                  <kbd className="px-1 py-0.5 bg-slate-700 rounded text-slate-200 font-mono font-bold text-[10px]">Enter</kbd>
                  <span>— Keyingi</span>
                  <span className="text-slate-600">•</span>
                  <kbd className="px-1 py-0.5 bg-slate-700 rounded text-slate-200 font-mono font-bold text-[10px]">Ctrl+Enter</kbd>
                  <span>— Tasdiqlash</span>
                </div>
                <button 
                  type="button"
                  onClick={() => setIsCheckoutOpen(false)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer active:scale-95"
                  aria-label="Yopish"
                  title="Yopish (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body Form */}
            <div className="p-5 sm:p-6 overflow-y-auto flex flex-col gap-4 bg-slate-50/60 dark:bg-slate-950/60">
              
              {/* 1. Order Summary Card */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-4 shadow-sm flex items-center justify-between shrink-0 border border-slate-800">
                <div>
                  <div className="text-xs font-medium text-slate-400">
                    Savat: <span className="text-white font-bold">{cart.length} xil mahsulot</span>
                  </div>
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mt-0.5">
                    Jami to'lov:
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono tracking-tight">
                    {formatSum(totalCartSum)} <span className="text-xs sm:text-sm text-slate-300 font-sans font-bold">UZS</span>
                  </span>
                </div>
              </div>

              {/* 2. Payment Method Tabs */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider mb-1.5">
                  To'lov turi:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'naqd' as const, num: '1', label: 'Naqd', icon: Banknote, color: 'text-emerald-600 dark:text-emerald-400' },
                    { id: 'karta' as const, num: '2', label: 'Karta', icon: CreditCard, color: 'text-blue-600 dark:text-blue-400' },
                    { id: 'transfer' as const, num: '3', label: 'O\'tkazma', icon: Building2, color: 'text-purple-600 dark:text-purple-400' },
                    { id: 'nasiya' as const, num: '4', label: 'Nasiya', icon: FileText, color: 'text-amber-600 dark:text-amber-400' },
                  ].map(tab => {
                    const Icon = tab.icon;
                    const isActive = paymentMethod === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => handlePaymentMethodSelect(tab.id)}
                        className={`relative flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all font-bold text-xs gap-1.5 cursor-pointer active:scale-95 ${
                          isActive
                            ? 'border-brand dark:border-blue-500 bg-brand/10 dark:bg-blue-500/15 text-slate-900 dark:text-white shadow-sm ring-2 ring-brand/20'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900'
                        }`}
                      >
                        <span className="absolute top-1 right-1.5 text-[9px] font-mono text-slate-400 dark:text-slate-500 font-bold">
                          [{tab.num}]
                        </span>
                        <Icon className={`w-5 h-5 ${tab.color}`} />
                        <span className="text-xs">{tab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Cash Section (When Naqd) */}
              {paymentMethod === 'naqd' && (
                <div className="p-3.5 rounded-2xl border-2 border-emerald-500/70 bg-emerald-50/70 dark:bg-emerald-950/30 shadow-sm">
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold uppercase text-emerald-900 dark:text-emerald-300 tracking-wider flex items-center gap-1.5">
                      <Banknote className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      Mijoz bergan pul:
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setReceivedCashStr(formatSum(totalCartSum));
                        cashInputRef.current?.focus();
                      }}
                      className="text-[11px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/50 hover:bg-emerald-200 dark:hover:bg-emerald-900/80 px-2.5 py-0.5 rounded-lg transition-colors cursor-pointer active:scale-95"
                      title="Aniq hisoblangan summani kiritish"
                    >
                      Aniq summa
                    </button>
                  </div>

                  <div className="flex items-center justify-between bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-emerald-300 dark:border-emerald-700 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20">
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold shrink-0 mr-2 select-none">Berilgan:</span>
                    <FormattedNumberInput
                      ref={cashInputRef}
                      value={receivedCashStr}
                      onChangeValue={setReceivedCashStr}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (e.ctrlKey || e.metaKey) {
                            handleCompleteSale();
                          } else {
                            customerPhoneInputRef.current?.focus();
                          }
                        }
                      }}
                      placeholder="0"
                      className="w-full text-right text-2xl font-black text-slate-900 dark:text-white font-mono tracking-wide focus:outline-none bg-transparent"
                    />
                    <span className="text-xs font-sans font-bold text-slate-500 dark:text-slate-400 ml-2 shrink-0 select-none">UZS</span>
                  </div>

                  {/* Change Display */}
                  {parseFormattedNumber(receivedCashStr) >= totalCartSum ? (
                    <div className="mt-2.5 pt-2 border-t border-emerald-200 dark:border-emerald-800 flex justify-between items-center text-emerald-900 dark:text-emerald-300 font-bold">
                      <span className="text-xs uppercase tracking-wider">Qaytim:</span>
                      <span className="text-xl font-black text-emerald-700 dark:text-emerald-400 font-mono">
                        {formatSum(parseFormattedNumber(receivedCashStr) - totalCartSum)} <span className="text-xs font-sans">UZS</span>
                      </span>
                    </div>
                  ) : parseFormattedNumber(receivedCashStr) > 0 ? (
                    <div className="mt-2.5 pt-2 border-t border-amber-200 dark:border-amber-800 flex justify-between items-center text-amber-800 dark:text-amber-300 font-bold text-xs">
                      <span>Yetarli emas:</span>
                      <span className="font-mono text-amber-700 dark:text-amber-400 text-sm font-black">
                        {formatSum(totalCartSum - parseFormattedNumber(receivedCashStr))} UZS
                      </span>
                    </div>
                  ) : null}
                </div>
              )}

              {/* 4. Customer Phone (+998 Mask) */}
              <div className="p-3.5 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300 tracking-wider flex items-center gap-1.5 mb-1.5">
                  <Phone className="w-4 h-4 text-blue-500" />
                  Telefon raqami (ixtiyoriy):
                </label>
                <div className="flex items-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 overflow-hidden shadow-xs">
                  <span className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black text-sm border-r border-slate-200 dark:border-slate-700 select-none font-mono shrink-0">
                    +998
                  </span>
                  <input
                    ref={customerPhoneInputRef}
                    type="tel"
                    inputMode="numeric"
                    placeholder="(90) 123-45-67"
                    value={formatPhoneLocal(customerPhoneDigits)}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 9);
                      setCustomerPhoneDigits(digits);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (e.ctrlKey || e.metaKey) {
                          handleCompleteSale();
                        } else {
                          customerNameInputRef.current?.focus();
                        }
                      }
                    }}
                    className="w-full px-3.5 py-2.5 text-slate-900 dark:text-white font-black text-base font-mono focus:outline-none bg-transparent placeholder-slate-400 dark:placeholder-slate-500"
                  />
                </div>
              </div>

              {/* 5. Customer Name */}
              <div className="p-3.5 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300 tracking-wider flex items-center gap-1.5 mb-1.5">
                  <span>Mijoz ismi (ixtiyoriy):</span>
                </label>
                <input
                  ref={customerNameInputRef}
                  type="text"
                  placeholder="Masalan: Sardor aka, Jasur usta..."
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (e.ctrlKey || e.metaKey) {
                        handleCompleteSale();
                      } else {
                        checkoutNoteInputRef.current?.focus();
                      }
                    }
                  }}
                  className="w-full bg-white dark:bg-slate-900 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white text-sm focus:outline-none focus:border-brand dark:focus:border-blue-500 focus:ring-2 focus:ring-brand/20 dark:placeholder-slate-500 shadow-xs"
                />
              </div>

              {/* 6. Note */}
              <div className="p-3.5 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300 tracking-wider flex items-center gap-1.5 mb-1.5">
                  <FileText className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  Izoh / Qayd:
                </label>
                <input
                  ref={checkoutNoteInputRef}
                  type="text"
                  placeholder="Izoh yoki eslatma (ixtiyoriy)..."
                  value={checkoutNote}
                  onChange={(e) => setCheckoutNote(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCompleteSale();
                    }
                  }}
                  className="w-full bg-white dark:bg-slate-900 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white text-sm focus:outline-none focus:border-brand dark:focus:border-blue-500 focus:ring-2 focus:ring-brand/20 dark:placeholder-slate-500 shadow-xs"
                />
              </div>

              {/* 7. Print Receipt Checkbox */}
              <label className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-colors">
                <input 
                  type="checkbox"
                  checked={autoPrintAfterSale}
                  onChange={e => setAutoPrintAfterSale(e.target.checked)}
                  className="w-5 h-5 text-brand rounded focus:ring-brand cursor-pointer"
                />
                <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 select-none">
                  <Printer className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  Sotuvdan so'ng chekni avtomatik chop etish
                </span>
              </label>

              {/* 7.1 Telegram Bot Notification Info */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0">
                    <Send className="w-4 h-4 -rotate-12 translate-x-0.5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                      Telegram botga chek yuborish
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {telegramService.isConfigured() ? "Sotuv vaqtida avtomatik botga xabar boradi" : "Telegram hali sozlanmagan"}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTelegramSettingsOpen(true)}
                  className="px-2.5 py-1 text-xs font-bold text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 rounded-lg transition-colors cursor-pointer"
                >
                  {telegramService.isConfigured() ? "Sozlamalar" : "Sozlash"}
                </button>
              </div>

              {/* 8. Action Buttons */}
              <div className="pt-2 mt-auto border-t border-slate-200 dark:border-slate-800 flex gap-2.5 shrink-0 sticky bottom-0 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-sm pb-1">
                <button 
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsCheckoutOpen(false)}
                  className="flex-1 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-700 dark:text-slate-200 font-bold rounded-2xl transition-all cursor-pointer text-sm active:scale-95"
                >
                  Bekor qilish
                </button>
                <button 
                  type="button"
                  disabled={isSubmitting || cart.length === 0}
                  onClick={handleCompleteSale}
                  className="flex-[2] py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black rounded-2xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 active:scale-95 text-base cursor-pointer"
                  title="Sotishni tasdiqlash (Ctrl+Enter)"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Rasmiylashtirilmoqda...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                      <span>Sotishni tasdiqlash</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* RECEIPT MODAL */}
      {completedSale && (
        <ReceiptModal
          sale={completedSale}
          onClose={() => {
            setCompletedSale(null);
            markTaskComplete();
          }}
          autoPrint={autoPrintAfterSale}
        />
      )}

      {/* TELEGRAM SETTINGS MODAL */}
      <TelegramSettingsModal
        isOpen={isTelegramSettingsOpen}
        onClose={() => setIsTelegramSettingsOpen(false)}
      />

    </div>
  );
}
