import { useState, useMemo, useEffect, useRef, useCallback, useDeferredValue } from 'react';
import { 
  Search, ShoppingCart, Plus, X, Trash2, Mic, Delete, Minus,
  CreditCard, Banknote, Building2, User, Phone, Receipt, Printer, FileText, CheckCircle2, AlertCircle,
  Keyboard, Hash, Check, CornerDownLeft
} from 'lucide-react';
import type { Product, CartItem, PaymentMethod, SaleRecord } from '../types';
import { useProducts } from '../context/ProductContext';
import { useSales } from '../context/SalesContext';
import { useBlockUpdate, useTaskCompletion } from '../context/UpdateContext';
import { ReceiptModal } from '../components/ReceiptModal';
import { KassaProductCard } from '../components/KassaProductCard';

type KeyboardLang = 'uz' | 'en' | 'ru';

const KEYBOARD_LAYOUTS: Record<KeyboardLang, string[][]> = {
  uz: [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', "O'", "G'"],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Sh', 'Ch'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
  ],
  en: [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
  ],
  ru: [
    ['Й', 'Ц', 'У', 'К', 'Е', 'Н', 'Г', 'Ш', 'Щ', 'З', 'Х', 'Ъ'],
    ['Ф', 'Ы', 'В', 'А', 'П', 'Р', 'О', 'Л', 'Д', 'Ж', 'Э'],
    ['Я', 'Ч', 'С', 'М', 'И', 'Т', 'Ь', 'Б', 'Ю']
  ]
};

const TOUCH_KEYBOARD_SYMBOLS = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['@', '#', '$', '%', '&', '*', '-', '+', '(', ')'],
  ['/', '\\', ':', ';', '"', "'", '!', '?', '_', '№']
];

function formatPhoneLocal(digits: string): string {
  const d = digits.replace(/\D/g, '').slice(0, 9);
  if (d.length === 0) return '';
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 5) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2, 5)}-${d.slice(5)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 5)}-${d.slice(5, 7)}-${d.slice(7, 9)}`;
}

export function KassaPage() {
  const { products, categories } = useProducts();
  const { addSale } = useSales();
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Barchasi');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingCartProductId, setEditingCartProductId] = useState<string | null>(null);
  const [numpadValue, setNumpadValue] = useState('');
  const [isNumpadFresh, setIsNumpadFresh] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const numpadRef = useRef<HTMLDivElement>(null);
  const quantityInputRef = useRef<HTMLInputElement>(null);

  const markTaskComplete = useTaskCompletion();

  // Checkout modal holatlari
  type CheckoutField = 'cash' | 'customerName' | 'customerPhone' | 'checkoutNote';
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('naqd');
  const [customerName, setCustomerName] = useState('');
  const [customerPhoneDigits, setCustomerPhoneDigits] = useState('');
  const [receivedCashStr, setReceivedCashStr] = useState<string>('');
  const [checkoutNote, setCheckoutNote] = useState('');
  const [autoPrintAfterSale, setAutoPrintAfterSale] = useState(false);
  const [completedSale, setCompletedSale] = useState<SaleRecord | null>(null);

  // Safety guard: Block silent updates while cashier has items in cart, checkout modal open, or active transaction
  useBlockUpdate(
    cart.length > 0 || isCheckoutOpen || selectedProduct !== null || completedSale !== null,
    cart.length > 0 ? 'Savatchada xarid tovarlari mavjud' : 'Kassada to\'lov/chek jarayoni davom etmoqda'
  );

  // Native input refs for direct cursor / caret management
  const cashInputRef = useRef<HTMLInputElement>(null);
  const customerNameInputRef = useRef<HTMLInputElement>(null);
  const customerPhoneInputRef = useRef<HTMLInputElement>(null);
  const checkoutNoteInputRef = useRef<HTMLInputElement>(null);

  // Sensor ekran klaviatura va numpad holatlari (O'ng tarafdagi split-screen panel)
  const [activeCheckoutField, setActiveCheckoutField] = useState<CheckoutField>('cash');
  const [keyboardTab, setKeyboardTab] = useState<'numpad' | 'keyboard'>('numpad');
  const [touchSymbolsMode, setTouchSymbolsMode] = useState(false);
  const [isCapsOn, setIsCapsOn] = useState(false);
  const [keyboardLang, setKeyboardLang] = useState<KeyboardLang>('uz');

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

  // Reusable Sale Completion Function (called by on-screen Enter, physical Enter key, or modal button)
  const handleCompleteSale = useCallback(() => {
    if (cart.length === 0) return;
    const finalTotal = totalCartSum;
    const receivedNum = paymentMethod === 'naqd' 
      ? (parseFloat(receivedCashStr) || finalTotal) 
      : finalTotal;
    const change = (paymentMethod === 'naqd' && receivedNum > finalTotal) 
      ? receivedNum - finalTotal 
      : 0;

    const saleItems = cart.map(item => ({
      productId: item.product.id,
      productName: item.product.name,
      category: item.product.category,
      artikul: item.product.artikul,
      quantity: item.quantity,
      costPrice: item.product.costPrice,
      price: item.product.price,
      unit: item.product.unit,
      total: item.product.price * item.quantity,
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
  }, [
    cart, 
    totalCartSum, 
    paymentMethod, 
    receivedCashStr, 
    customerName, 
    customerPhoneDigits, 
    checkoutNote, 
    addSale, 
    autoPrintAfterSale
  ]);

  const getFieldOrder = useCallback((): CheckoutField[] => {
    return paymentMethod === 'naqd'
      ? ['cash', 'customerPhone', 'customerName', 'checkoutNote']
      : ['customerPhone', 'customerName', 'checkoutNote'];
  }, [paymentMethod]);

  // Sensorli checkout panel maydonini tanlash
  const handleSelectField = useCallback((field: CheckoutField) => {
    setActiveCheckoutField(field);
    let targetEl: HTMLInputElement | null = null;
    if (field === 'cash') {
      setKeyboardTab('numpad');
      targetEl = cashInputRef.current;
    } else if (field === 'customerPhone') {
      setKeyboardTab('numpad');
      targetEl = customerPhoneInputRef.current;
    } else if (field === 'customerName') {
      setKeyboardTab('keyboard');
      targetEl = customerNameInputRef.current;
    } else if (field === 'checkoutNote') {
      setKeyboardTab('keyboard');
      targetEl = checkoutNoteInputRef.current;
    }
    setTimeout(() => {
      if (targetEl) {
        targetEl.focus();
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 40);
  }, []);

  // Professional ketma-ketlik: Enter bosilganda keyingi inputga fokus qilish, oxirgisida esa sotishni yakunlash
  const handleAdvanceFieldOrSubmit = useCallback(() => {
    const fields = getFieldOrder();
    const currentIndex = fields.indexOf(activeCheckoutField);
    if (currentIndex !== -1 && currentIndex < fields.length - 1) {
      handleSelectField(fields[currentIndex + 1]);
    } else {
      handleCompleteSale();
    }
  }, [getFieldOrder, activeCheckoutField, handleSelectField, handleCompleteSale]);

  const handlePrevField = useCallback(() => {
    const fields = getFieldOrder();
    const idx = fields.indexOf(activeCheckoutField);
    const prev = (idx - 1 + fields.length) % fields.length;
    handleSelectField(fields[prev]);
  }, [getFieldOrder, activeCheckoutField, handleSelectField]);

  const handleNextField = useCallback(() => {
    const fields = getFieldOrder();
    const idx = fields.indexOf(activeCheckoutField);
    const next = (idx + 1) % fields.length;
    handleSelectField(fields[next]);
  }, [getFieldOrder, activeCheckoutField, handleSelectField]);

  // Global Escape & Enter key handler for checkout modal and completed sale receipt
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (completedSale) {
          setCompletedSale(null);
        } else if (isCheckoutOpen) {
          setIsCheckoutOpen(false);
        }
      } else if (e.key === 'Enter') {
        if (completedSale) {
          e.preventDefault();
          setCompletedSale(null);
          return;
        }
        if (isCheckoutOpen) {
          e.preventDefault();
          // Ctrl+Enter yoki Cmd+Enter: istalgan maydondan to'g'ridan-to'g'ri sotishni yakunlash
          if (e.ctrlKey || e.metaKey) {
            handleCompleteSale();
            return;
          }
          // Oddiy Enter: professional POS kassa ketma-ketligida keyingi inputga fokus
          handleAdvanceFieldOrSubmit();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCheckoutOpen, completedSale, handleAdvanceFieldOrSubmit, handleCompleteSale]);

  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    setPaymentMethod(method);
    if (method === 'naqd') {
      setActiveCheckoutField('cash');
      setKeyboardTab('numpad');
      if (!receivedCashStr) {
        setReceivedCashStr(totalCartSum.toString());
      }
      setTimeout(() => {
        cashInputRef.current?.focus();
      }, 50);
    } else {
      setActiveCheckoutField('customerPhone');
      setKeyboardTab('numpad');
      setReceivedCashStr(totalCartSum.toString());
      setTimeout(() => {
        customerPhoneInputRef.current?.focus();
      }, 50);
    }
  };

  const handleCheckoutKeyInput = (char: string) => {
    // ENTER: Sequential advance to next field or final sale confirmation
    if (char === 'ENTER') {
      handleAdvanceFieldOrSubmit();
      return;
    }

    if (activeCheckoutField === 'cash') {
      const input = cashInputRef.current;
      const val = receivedCashStr;
      const start = input?.selectionStart ?? val.length;
      const end = input?.selectionEnd ?? val.length;

      if (char === 'C') {
        setReceivedCashStr('');
        setTimeout(() => {
          if (input) {
            input.focus();
            input.setSelectionRange(0, 0);
          }
        }, 0);
      } else if (char === 'BACKSPACE') {
        if (start !== end) {
          const newVal = val.slice(0, start) + val.slice(end);
          setReceivedCashStr(newVal);
          setTimeout(() => {
            if (input) {
              input.focus();
              input.setSelectionRange(start, start);
            }
          }, 0);
        } else if (start > 0) {
          const newVal = val.slice(0, start - 1) + val.slice(start);
          setReceivedCashStr(newVal);
          setTimeout(() => {
            if (input) {
              input.focus();
              input.setSelectionRange(start - 1, start - 1);
            }
          }, 0);
        } else {
          input?.focus();
        }
      } else if (char === '.') {
        if (val.includes('.') && !val.slice(start, end).includes('.')) {
          input?.focus();
          return;
        }
        const newVal = val.slice(0, start) + '.' + val.slice(end);
        setReceivedCashStr(newVal);
        setTimeout(() => {
          if (input) {
            input.focus();
            input.setSelectionRange(start + 1, start + 1);
          }
        }, 0);
      } else {
        const newVal = val.slice(0, start) + char + val.slice(end);
        setReceivedCashStr(newVal);
        setTimeout(() => {
          if (input) {
            input.focus();
            input.setSelectionRange(start + char.length, start + char.length);
          }
        }, 0);
      }
    } else if (activeCheckoutField === 'customerPhone') {
      const input = customerPhoneInputRef.current;
      const digits = customerPhoneDigits;

      if (char === 'C') {
        setCustomerPhoneDigits('');
        setTimeout(() => input?.focus(), 0);
      } else if (char === 'BACKSPACE') {
        if (digits.length > 0) {
          setCustomerPhoneDigits(prev => prev.slice(0, -1));
        }
        setTimeout(() => input?.focus(), 0);
      } else if (char >= '0' && char <= '9') {
        if (digits.length < 9) {
          setCustomerPhoneDigits(prev => (prev + char).slice(0, 9));
        }
        setTimeout(() => input?.focus(), 0);
      }
    } else if (activeCheckoutField === 'customerName') {
      const input = customerNameInputRef.current;
      const val = customerName;
      const start = input?.selectionStart ?? val.length;
      const end = input?.selectionEnd ?? val.length;

      if (char === 'C') {
        setCustomerName('');
        setTimeout(() => {
          if (input) {
            input.focus();
            input.setSelectionRange(0, 0);
          }
        }, 0);
      } else if (char === 'BACKSPACE') {
        if (start !== end) {
          const newVal = val.slice(0, start) + val.slice(end);
          setCustomerName(newVal);
          setTimeout(() => {
            if (input) {
              input.focus();
              input.setSelectionRange(start, start);
            }
          }, 0);
        } else if (start > 0) {
          const newVal = val.slice(0, start - 1) + val.slice(start);
          setCustomerName(newVal);
          setTimeout(() => {
            if (input) {
              input.focus();
              input.setSelectionRange(start - 1, start - 1);
            }
          }, 0);
        } else {
          input?.focus();
        }
      } else if (char === 'SPACE') {
        const newVal = val.slice(0, start) + ' ' + val.slice(end);
        setCustomerName(newVal);
        setTimeout(() => {
          if (input) {
            input.focus();
            input.setSelectionRange(start + 1, start + 1);
          }
        }, 0);
      } else {
        const newVal = val.slice(0, start) + char + val.slice(end);
        setCustomerName(newVal);
        setTimeout(() => {
          if (input) {
            input.focus();
            input.setSelectionRange(start + char.length, start + char.length);
          }
        }, 0);
      }
    } else if (activeCheckoutField === 'checkoutNote') {
      const input = checkoutNoteInputRef.current;
      const val = checkoutNote;
      const start = input?.selectionStart ?? val.length;
      const end = input?.selectionEnd ?? val.length;

      if (char === 'C') {
        setCheckoutNote('');
        setTimeout(() => {
          if (input) {
            input.focus();
            input.setSelectionRange(0, 0);
          }
        }, 0);
      } else if (char === 'BACKSPACE') {
        if (start !== end) {
          const newVal = val.slice(0, start) + val.slice(end);
          setCheckoutNote(newVal);
          setTimeout(() => {
            if (input) {
              input.focus();
              input.setSelectionRange(start, start);
            }
          }, 0);
        } else if (start > 0) {
          const newVal = val.slice(0, start - 1) + val.slice(start);
          setCheckoutNote(newVal);
          setTimeout(() => {
            if (input) {
              input.focus();
              input.setSelectionRange(start - 1, start - 1);
            }
          }, 0);
        } else {
          input?.focus();
        }
      } else if (char === 'SPACE') {
        const newVal = val.slice(0, start) + ' ' + val.slice(end);
        setCheckoutNote(newVal);
        setTimeout(() => {
          if (input) {
            input.focus();
            input.setSelectionRange(start + 1, start + 1);
          }
        }, 0);
      } else {
        const newVal = val.slice(0, start) + char + val.slice(end);
        setCheckoutNote(newVal);
        setTimeout(() => {
          if (input) {
            input.focus();
            input.setSelectionRange(start + char.length, start + char.length);
          }
        }, 0);
      }
    }
  };

  const openCheckoutModal = () => {
    if (cart.length === 0) return;
    setReceivedCashStr(totalCartSum.toString());
    setCustomerPhoneDigits('');
    setActiveCheckoutField(paymentMethod === 'naqd' ? 'cash' : 'customerName');
    setKeyboardTab(paymentMethod === 'naqd' ? 'numpad' : 'keyboard');
    setIsCapsOn(false);
    setTouchSymbolsMode(false);
    setIsCheckoutOpen(true);
    setTimeout(() => {
      if (paymentMethod === 'naqd') {
        cashInputRef.current?.focus();
        cashInputRef.current?.select();
      } else {
        customerNameInputRef.current?.focus();
      }
    }, 50);
  };

  // Focus management for quantity input / numpad
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

  const openProductNumpad = useCallback((product: Product) => {
    setSelectedProduct(product);
    setEditingCartProductId(null);
    setNumpadValue('1');
    setIsNumpadFresh(true);
  }, []);

  const openCartItemNumpad = (item: CartItem) => {
    setEditingCartProductId(item.product.id);
    setSelectedProduct(item.product);
    setNumpadValue(item.quantity.toString());
    setIsNumpadFresh(true);
  };

  const closeNumpad = useCallback(() => {
    setSelectedProduct(null);
    setEditingCartProductId(null);
    setNumpadValue('');
    setIsNumpadFresh(false);
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
    closeNumpad();
  }, [closeNumpad]);

  const handleQuickAdd = useCallback((product: Product) => {
    addToCart(product, 1);
  }, [addToCart]);

  const updateCartItemQuantity = useCallback((productId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          return { ...item, quantity: item.quantity + delta };
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  }, []);

  const removeCartItem = useCallback((productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  }, []);

  const handleNumpadInput = useCallback((val: string) => {
    if (val === 'C') {
      setNumpadValue('');
      setIsNumpadFresh(false);
    } else if (val === 'BACKSPACE') {
      if (isNumpadFresh) {
        setNumpadValue('');
        setIsNumpadFresh(false);
      } else {
        setNumpadValue(prev => prev.slice(0, -1));
      }
    } else if (val === 'OK') {
      if (selectedProduct) {
        // Default to 1 if no number typed, so pressing Enter/OK immediately confirms 1 unit!
        const parsed = numpadValue ? parseFloat(numpadValue) : 1;
        if (!isNaN(parsed) && parsed > 0) {
          if (editingCartProductId !== null) {
            setCart(prev => prev.map(item => 
              item.product.id === editingCartProductId 
                ? { ...item, quantity: parsed }
                : item
            ));
            closeNumpad();
          } else {
            addToCart(selectedProduct, parsed);
          }
        } else if (!isNaN(parsed) && parsed === 0 && editingCartProductId !== null) {
          removeCartItem(editingCartProductId);
          closeNumpad();
        }
      }
    } else {
      // Don't allow multiple decimals
      if (val === '.' && numpadValue.includes('.') && !isNumpadFresh) return;

      if (isNumpadFresh) {
        setIsNumpadFresh(false);
        if (val === '.') {
          setNumpadValue('0.');
        } else {
          setNumpadValue(val);
        }
      } else {
        setNumpadValue(prev => prev + val);
      }
    }
  }, [selectedProduct, numpadValue, editingCartProductId, isNumpadFresh, closeNumpad, addToCart, removeCartItem]);

  // Global keyboard listener for Numpad
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedProduct) return;

      // Escape har qanday holatda modalni yopadi
      if (e.key === 'Escape') {
        e.preventDefault();
        closeNumpad();
        return;
      }

      // Enter kiritilgan miqdorni tasdiqlab savatga qo'shadi
      if (e.key === 'Enter') {
        e.preventDefault();
        handleNumpadInput('OK');
        return;
      }

      // Agar fokus miqdor inputida (quantityInputRef) bo'lsa:
      // Klaviatura terish (0-9 raqamlari, NumLock, nuqta, backspace va h.k.) inputning o'zi
      // tomonidan tabiiy ravishda (native onChange orqali) amalga oshiriladi.
      // Global listener ularni qayta ushlamasligi shart, aks holda raqamlar 2 tadan yozilib ketadi (masalan, 5 -> 55)!
      const isInputFocused = document.activeElement === quantityInputRef.current;
      if (isInputFocused) {
        return;
      }

      // Agar input fokusda bo'lmasa, raqamni kiritib, inputni fokuslaymiz:
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleNumpadInput(e.key);
        quantityInputRef.current?.focus();
      } else if (e.key === '.' || e.key === ',') {
        e.preventDefault();
        handleNumpadInput('.');
        quantityInputRef.current?.focus();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleNumpadInput('BACKSPACE');
      } else if (e.key === 'Delete' || e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handleNumpadInput('C');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedProduct, handleNumpadInput, closeNumpad]);

  const handleCategoryClick = (cat: string) => {
    // Issue 18: toggle category
    if (selectedCategory === cat && cat !== 'Barchasi') {
      setSelectedCategory('Barchasi');
    } else {
      setSelectedCategory(cat);
    }
  };

  // ==========================================
  // SENSOR / TOUCHPAD / TOUCH GESTURE HANDLERS
  // 1-barmoq bilan o'ngdan chapga surish -> Savatchani ochish
  // Chapdan o'ngga surish -> Savatchani yopish
  // ==========================================
  const touchStartRef = useRef<{ x: number; y: number; time: number; isIgnored: boolean } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    // Faqat bitta barmoq bilan (1 touch point)
    if (e.touches.length !== 1) {
      touchStartRef.current = null;
      return;
    }

    const target = e.target as HTMLElement | null;
    // Inputlar va kategoriyalar gorizontal skrollidan boshlangan teginishlarni chetlab o'tish
    const isInsideInput = !!target?.closest('input, textarea');
    const isInsideCategoryScroll = !!target?.closest('[data-category-scroll="true"]');

    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
      isIgnored: isInsideInput || isInsideCategoryScroll,
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || touchStartRef.current.isIgnored) {
      touchStartRef.current = null;
      return;
    }

    // Agar Numpad modali ochiq bo'lsa, savat surishini bajarmaslik
    if (selectedProduct) {
      touchStartRef.current = null;
      return;
    }

    const touch = e.changedTouches[0];
    if (!touch) return;

    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;
    touchStartRef.current = null;

    // Tezkor jest (< 700ms)
    if (deltaTime > 700) return;

    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Gorizontal surish vertikal skroldan sezilarli darajada katta bo'lishi shart (absX > absY * 1.4)
    if (absX >= 45 && absX > absY * 1.4) {
      if (deltaX < 0) {
        // O'ngdan chapga surish (Swipe left) -> Savatchani ochish
        if (!isCartOpen) {
          setIsCartOpen(true);
        }
      } else if (deltaX > 0) {
        // Chapdan o'ngga surish (Swipe right) -> Savatchani yopish
        if (isCartOpen) {
          setIsCartOpen(false);
        }
      }
    }
  };

  // Savatcha ichidan alohida ref bilan chapdan o'ngga surib yopish
  const cartTouchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const handleCartTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    cartTouchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };
  };

  const handleCartTouchEnd = (e: React.TouchEvent) => {
    if (!cartTouchStartRef.current) return;
    const touch = e.changedTouches[0];
    if (!touch) return;

    const deltaX = touch.clientX - cartTouchStartRef.current.x;
    const deltaY = touch.clientY - cartTouchStartRef.current.y;
    const deltaTime = Date.now() - cartTouchStartRef.current.time;
    cartTouchStartRef.current = null;

    if (deltaTime > 700) return;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Chapdan o'ngga surish (Swipe right) -> Savatchani yopish
    if (deltaX >= 45 && absX > absY * 1.3) {
      setIsCartOpen(false);
    }
  };

  // Touchpad / Trackpad 2-barmoqli gorizontal jestni aniqlash
  const accumulatedXRef = useRef(0);
  const wheelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (selectedProduct) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest('[data-category-scroll="true"]')) return;

      // Faqat gorizontal delta ustun bo'lganda
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) {
        accumulatedXRef.current = 0;
        return;
      }

      accumulatedXRef.current += e.deltaX;
      if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current);
      wheelTimerRef.current = setTimeout(() => {
        accumulatedXRef.current = 0;
      }, 250);

      // Trackpad swipe left (deltaX > 60): ochish
      if (accumulatedXRef.current > 60 && !isCartOpen) {
        setIsCartOpen(true);
        accumulatedXRef.current = 0;
      }
      // Trackpad swipe right (deltaX < -60): yopish
      else if (accumulatedXRef.current < -60 && isCartOpen) {
        setIsCartOpen(false);
        accumulatedXRef.current = 0;
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => {
      window.removeEventListener('wheel', handleWheel);
    };
  }, [selectedProduct, isCartOpen]);

  useEffect(() => {
    return () => {
      if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current);
    };
  }, []);

  return (
    <div 
      className="h-full flex flex-col xl:flex-row bg-slate-50 relative select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Toast Notification */}
      {toastNotification && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 text-white text-sm font-semibold px-4 py-2.5 rounded-2xl shadow-xl backdrop-blur-md flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastNotification}</span>
        </div>
      )}
      
      {/* LEFT PANEL: SEARCH & PRODUCTS LIST */}
      <div className="flex-1 flex flex-col h-full min-h-0 min-w-0">
        {/* Semantic H1 heading for SEO and Accessibility structure */}
        <h1 className="sr-only">ProSant — Santexnika Mahsulotlari Kassa va POS Tizimi</h1>
        
        {/* Search & Categories Area */}
        <div className="bg-white p-3.5 sm:p-4 border-b border-slate-200/80 z-10 flex flex-col gap-3 shrink-0 shadow-xs">
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
                className="w-full bg-slate-100 rounded-xl sm:rounded-2xl py-3 sm:py-3.5 pl-11 sm:pl-12 pr-14 text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-brand focus:bg-white transition-all font-medium border border-transparent focus:border-brand/30"
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
              className="xl:hidden relative p-3 sm:p-3.5 bg-white border border-slate-200 text-slate-800 rounded-xl sm:rounded-2xl active:scale-95 transition-all shadow-xs hover:bg-slate-50 cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
              onClick={() => setIsCartOpen(true)}
              aria-label="Savatchani ochish"
            >
              <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-slate-700" />
              {cart.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white text-xs font-black px-1.5 py-0.5 rounded-full border-2 border-white min-w-[22px] flex items-center justify-center shadow-xs">
                  {cart.length}
                </span>
              )}
            </button>
          </div>
          
          {/* Categories with scroll identifier */}
          <div 
            data-category-scroll="true"
            className="flex overflow-x-auto gap-2 pb-0.5 scrollbar-hide"
          >
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => handleCategoryClick(cat)}
                className={`whitespace-nowrap px-4 py-2 rounded-xl font-bold transition-all text-xs sm:text-sm cursor-pointer active:scale-95 min-h-[38px] ${
                  selectedCategory === cat
                    ? 'bg-brand text-white shadow-sm shadow-brand/30 ring-1 ring-brand'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product List */}
        <div className="flex-1 overflow-y-auto min-h-0 p-3 sm:p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 content-start scrollbar-hide pb-28 xl:pb-4">
          {visibleProducts.map(product => (
            <KassaProductCard
              key={product.id}
              product={product}
              isSelected={selectedProduct?.id === product.id}
              onSelect={openProductNumpad}
              onQuickAdd={handleQuickAdd}
            />
          ))}

          {/* Progressive Load More button */}
          {filteredProducts.length > visibleCount && (
            <div className="col-span-full py-4 flex justify-center">
              <button
                type="button"
                onClick={() => setVisibleCount(prev => prev + 24)}
                className="px-6 py-2.5 bg-white hover:bg-slate-50 border border-slate-200/90 text-brand font-bold text-xs sm:text-sm rounded-xl shadow-xs hover:shadow-sm active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Ko'proq ko'rsatish (+{filteredProducts.length - visibleCount} ta)</span>
              </button>
            </div>
          )}
          
          {/* Issue 16: Empty search result UI */}
          {filteredProducts.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400">
              <Search className="w-16 h-16 mb-4 text-slate-300" />
              <p className="font-medium text-xl mb-4">Hech narsa topilmadi</p>
              {query && (
                <button 
                  onClick={() => setQuery('')}
                  className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-full font-semibold transition-colors"
                >
                  Qidiruvni tozalash
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* NUMPAD OVERLAY (Shows when product is selected - Ergonomic & Large for Touch) */}
      {selectedProduct && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex flex-col justify-center items-center p-3 sm:p-4 transition-all overflow-y-auto"
          role="dialog"
          aria-modal="true"
          onClick={closeNumpad}
        >
          <div 
            ref={numpadRef}
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-5 sm:p-7 shadow-2xl animate-in zoom-in-95 max-w-xl sm:max-w-2xl w-full focus:outline-none border border-slate-200 flex flex-col gap-3.5 sm:gap-5 my-auto max-h-[92dvh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex justify-between items-start">
              <div className="pr-3">
                <span className="text-xs font-bold uppercase tracking-wider text-brand bg-brand/10 px-3 py-1 rounded-full inline-block mb-1.5">
                  {editingCartProductId !== null ? "Miqdorni o'zgartirish" : "Savatga qo'shish"}
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                  {selectedProduct.name}
                </h2>
                <p className="text-sm sm:text-base font-semibold text-slate-500 mt-1">
                  Narxi: <strong className="text-slate-800">{selectedProduct.price.toLocaleString()} UZS</strong> / {selectedProduct.unit}
                </p>
              </div>
              <button 
                onClick={closeNumpad}
                className="p-3 bg-slate-100 hover:bg-slate-200 rounded-2xl text-slate-500 transition-colors cursor-pointer shrink-0 active:scale-95"
                aria-label="Yopish"
              >
                <X className="w-6 h-6 sm:w-7 sm:h-7" />
              </button>
            </div>
            
            {/* Interactive Quantity Box: Native keyboard friendly + Stepper buttons */}
            <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-2xl flex flex-col gap-3 shadow-inner">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-slate-400 font-bold uppercase tracking-wider">
                  Miqdori:
                </span>
                <span className="text-xs sm:text-sm text-emerald-400 font-bold font-mono">
                  Jami: {(((parseFloat(numpadValue) || (numpadValue === '' ? 1 : 0))) * selectedProduct.price).toLocaleString()} UZS
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                {/* Stepper Minus */}
                <button
                  type="button"
                  onClick={() => {
                    const current = parseFloat(numpadValue) || 1;
                    const next = Math.max(1, current - 1);
                    setNumpadValue(next.toString());
                    setIsNumpadFresh(false);
                  }}
                  className="w-12 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 flex items-center justify-center transition-all cursor-pointer shrink-0 border border-slate-700"
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
                    value={numpadValue}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9.]/g, '');
                      const parts = val.split('.');
                      const cleanVal = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : val;
                      setNumpadValue(cleanVal);
                      setIsNumpadFresh(false);
                    }}
                    onFocus={(e) => e.target.select()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        e.stopPropagation();
                        handleNumpadInput('OK');
                      } else if (e.key === 'Escape') {
                        e.preventDefault();
                        e.stopPropagation();
                        closeNumpad();
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
                    const current = parseFloat(numpadValue) || 0;
                    const next = current + 1;
                    setNumpadValue(next.toString());
                    setIsNumpadFresh(false);
                  }}
                  className="w-12 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 flex items-center justify-center transition-all cursor-pointer shrink-0 border border-slate-700"
                  aria-label="Ko'paytirish"
                  title="1 ga oshirish"
                >
                  <Plus className="w-5 h-5 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* Quick Presets Row */}
            <div className="grid grid-cols-4 gap-2.5">
              {[1, 5, 10, 50].map(preset => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setNumpadValue(preset.toString());
                    setIsNumpadFresh(false);
                  }}
                  className="py-2.5 sm:py-3 rounded-2xl bg-slate-100 hover:bg-brand/10 hover:text-brand border border-slate-200 font-black text-xs sm:text-sm text-slate-700 active:scale-95 transition-all cursor-pointer select-none"
                >
                  +{preset} {selectedProduct.unit}
                </button>
              ))}
            </div>

            {/* Action Buttons for Mobile/Tablet (< lg) */}
            <div className="flex lg:hidden gap-2.5 pt-1">
              <button
                type="button"
                onClick={closeNumpad}
                className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all cursor-pointer text-sm sm:text-base active:scale-95"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={() => handleNumpadInput('OK')}
                className="flex-[2] py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black rounded-2xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 text-base sm:text-lg"
              >
                <Check className="hidden sm:inline-block w-5 h-5 stroke-[3]" />
                <span>Tasdiqlash</span>
              </button>
            </div>

            {/* Big Spacious Numpad Grid (ONLY VISIBLE ON DESKTOP POS lg+) */}
            <div className="hidden lg:grid grid-cols-4 gap-2.5 sm:gap-3.5">
              {/* Row 1 */}
              {[1, 2, 3].map(num => (
                <button 
                  key={num}
                  type="button"
                  onClick={() => handleNumpadInput(num.toString())}
                  aria-label={num.toString()}
                  className="h-18 sm:h-22 bg-slate-50 hover:bg-white active:bg-brand active:text-white border border-slate-200/90 text-3xl sm:text-4xl font-black text-slate-800 rounded-2xl shadow-xs transition-all cursor-pointer select-none flex items-center justify-center active:scale-95"
                >
                  {num}
                </button>
              ))}
              <button 
                type="button"
                onClick={() => handleNumpadInput('C')}
                aria-label="Tozalash"
                className="h-18 sm:h-22 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 border border-rose-200 text-rose-600 text-2xl sm:text-3xl font-black rounded-2xl transition-all cursor-pointer select-none flex items-center justify-center active:scale-95"
              >
                C
              </button>
              
              {/* Row 2 */}
              {[4, 5, 6].map(num => (
                <button 
                  key={num}
                  type="button"
                  onClick={() => handleNumpadInput(num.toString())}
                  aria-label={num.toString()}
                  className="h-18 sm:h-22 bg-slate-50 hover:bg-white active:bg-brand active:text-white border border-slate-200/90 text-3xl sm:text-4xl font-black text-slate-800 rounded-2xl shadow-xs transition-all cursor-pointer select-none flex items-center justify-center active:scale-95"
                >
                  {num}
                </button>
              ))}
              <button 
                type="button"
                onClick={() => handleNumpadInput('BACKSPACE')}
                aria-label="O'chirish"
                className="h-18 sm:h-22 bg-amber-50 hover:bg-amber-100 active:bg-amber-200 border border-amber-200 text-amber-700 rounded-2xl transition-all flex items-center justify-center cursor-pointer select-none active:scale-95"
              >
                <Delete className="w-8 h-8 sm:w-9 sm:h-9 stroke-[2.2]" />
              </button>

              {/* Row 3 & 4 */}
              {[7, 8, 9].map(num => (
                <button 
                  key={num}
                  type="button"
                  onClick={() => handleNumpadInput(num.toString())}
                  aria-label={num.toString()}
                  className="h-18 sm:h-22 bg-slate-50 hover:bg-white active:bg-brand active:text-white border border-slate-200/90 text-3xl sm:text-4xl font-black text-slate-800 rounded-2xl shadow-xs transition-all cursor-pointer select-none flex items-center justify-center active:scale-95"
                >
                  {num}
                </button>
              ))}
              {/* Tall OK / Confirm Button on the right spanning 2 rows */}
              <button 
                type="button"
                onClick={() => handleNumpadInput('OK')}
                aria-label="Tasdiqlash"
                className="row-span-2 h-full min-h-[150px] sm:min-h-[180px] bg-gradient-to-b from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 active:scale-95 text-white text-2xl sm:text-3xl font-black rounded-2xl shadow-xl shadow-emerald-600/30 transition-all cursor-pointer select-none flex flex-col items-center justify-center gap-2 border border-emerald-400/50"
              >
                <span>OK</span>
                <Check className="w-7 h-7 sm:w-8 sm:h-8 stroke-[3]" />
              </button>

              {/* Row 4 remaining buttons */}
              <button 
                type="button"
                onClick={() => handleNumpadInput('.')}
                aria-label="Nuqta"
                className="h-18 sm:h-22 bg-slate-100 hover:bg-slate-200 text-slate-700 text-3xl sm:text-4xl font-black rounded-2xl transition-colors cursor-pointer select-none flex items-center justify-center active:scale-95"
              >
                .
              </button>
              <button 
                type="button"
                onClick={() => handleNumpadInput('0')}
                aria-label="0"
                className="h-18 sm:h-22 bg-slate-50 hover:bg-white active:bg-brand active:text-white border border-slate-200/90 text-3xl sm:text-4xl font-black text-slate-800 rounded-2xl shadow-xs transition-all cursor-pointer select-none flex items-center justify-center active:scale-95"
              >
                0
              </button>
              <button 
                type="button"
                onClick={() => handleNumpadInput('00')}
                aria-label="00"
                className="h-18 sm:h-22 bg-slate-100 hover:bg-slate-200 text-slate-700 text-2xl sm:text-3xl font-black rounded-2xl transition-colors cursor-pointer select-none flex items-center justify-center active:scale-95"
              >
                00
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

      {/* RIGHT PANEL: CART (Embedded on desktop POS xl+ screens, Flyout drawer on mobile/tablet) */}
      <div 
        onTouchStart={handleCartTouchStart}
        onTouchEnd={handleCartTouchEnd}
        className={`fixed xl:relative inset-y-0 right-0 w-[92%] sm:w-[420px] xl:w-[380px] 2xl:w-[420px] max-w-full bg-white border-l border-slate-200/90 flex flex-col z-50 xl:z-20 transition-transform duration-300 ease-in-out shadow-2xl xl:shadow-none shrink-0 ${isCartOpen ? 'translate-x-0' : 'translate-x-full xl:translate-x-0'}`}
      >
        <div className="p-4 border-b border-slate-200/80 flex justify-between items-center bg-white text-slate-900 shrink-0">
          <h2 className="text-lg sm:text-xl font-black flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-brand" /> 
            <span>Savatcha</span>
            <span className="bg-slate-100 text-slate-700 text-xs font-black px-2.5 py-0.5 rounded-full ml-1 border border-slate-200">
              {cart.length}
            </span>
          </h2>
          <button 
            className="xl:hidden p-2 bg-slate-100 hover:bg-slate-200 rounded-xl active:scale-95 transition-colors cursor-pointer"
            onClick={() => setIsCartOpen(false)}
            aria-label="Savatchani yopish"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 bg-slate-50/70">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3 py-10">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center border border-slate-200 shadow-xs">
                <ShoppingCart className="w-8 h-8 text-slate-300" />
              </div>
              <p className="font-semibold text-sm text-slate-500">Hozircha xaridlar yo'q</p>
              <p className="text-xs text-slate-400 text-center max-w-[200px]">Mahsulot ustiga bosib savatga qo'shing</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.product.id} className="flex flex-col p-3 bg-white rounded-xl shadow-xs border border-slate-200/80">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 pr-2">
                    <h4 className="font-bold text-slate-800 text-xs sm:text-sm leading-tight mb-0.5 line-clamp-2">{item.product.name}</h4>
                    <p className="text-slate-500 font-medium text-[11px]">
                      {item.product.price.toLocaleString()} UZS / {item.product.unit}
                    </p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => removeCartItem(item.product.id)}
                    className="w-8 h-8 rounded-lg bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-500 hover:text-rose-600 border border-rose-100 shadow-xs active:scale-90 transition-all flex items-center justify-center shrink-0 cursor-pointer"
                    title="Mahsulotni savatdan o'chirish"
                    aria-label={`${item.product.name} mahsulotini savatdan o'chirish`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                  <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
                    <button 
                      onClick={() => updateCartItemQuantity(item.product.id, -1)}
                      className="p-1.5 hover:bg-white rounded-md transition-colors text-slate-700 active:scale-90 cursor-pointer"
                      aria-label="Kamaytirish"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      type="button"
                      onClick={() => openCartItemNumpad(item)}
                      className="min-w-[40px] px-2 py-0.5 mx-0.5 bg-white hover:bg-brand/10 hover:border-brand/40 hover:text-brand border border-slate-200/90 rounded-md font-black text-slate-800 text-xs shadow-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1 group/qty"
                      title="Miqdorni o'zgartirish uchun bosing"
                      aria-label={`${item.product.name} miqdorini o'zgartirish`}
                    >
                      <span>{item.quantity}</span>
                    </button>
                    <button 
                      onClick={() => updateCartItemQuantity(item.product.id, 1)}
                      className="p-1.5 hover:bg-white rounded-md transition-colors text-slate-700 active:scale-90 cursor-pointer"
                      aria-label="Ko'paytirish"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="font-black text-slate-900 text-sm sm:text-base">
                    {(item.product.price * item.quantity).toLocaleString()} <span className="text-[11px] font-bold text-slate-500">UZS</span>
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Checkout Footer */}
        <div className="p-4 bg-white border-t border-slate-200/80 shadow-[0_-8px_20px_-10px_rgba(0,0,0,0.06)] shrink-0">
          <div className="flex justify-between items-baseline mb-3">
            <span className="text-slate-500 font-bold uppercase tracking-wider text-xs">Jami to'lov:</span>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 leading-none">
              {totalCartSum.toLocaleString()} <span className="text-sm font-bold text-brand">UZS</span>
            </span>
          </div>
          <div className="flex gap-2">
            <button 
              disabled={cart.length === 0}
              onClick={openCheckoutModal}
              className={`flex-1 py-3.5 font-bold rounded-xl active:scale-95 transition-all text-sm flex items-center justify-center gap-1.5 ${
                cart.length > 0
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 cursor-pointer border border-slate-200'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-transparent'
              }`}
            >
              <FileText className="hidden sm:inline-block w-4 h-4 text-slate-500" />
              <span>Hisob</span>
            </button>
            <button 
              disabled={cart.length === 0}
              className={`flex-[2] py-3.5 font-black rounded-xl text-base transition-all flex items-center justify-center gap-2 ${
                cart.length > 0 
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/30 active:scale-95 cursor-pointer' 
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
              onClick={openCheckoutModal}
            >
              <Receipt className="hidden sm:inline-block w-5 h-5" />
              <span>Sotish & Chek</span>
            </button>
          </div>
        </div>

      </div>

      {/* CHECKOUT MODAL: FAST-FOOD SPLIT SCREEN (LEFT: FORM & INPUTS, RIGHT: TOUCH KEYPAD) */}
      {isCheckoutOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[80] flex items-center justify-center p-2 sm:p-3 md:p-5 transition-all overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-3xl w-full max-w-7xl h-full max-h-[96dvh] sm:max-h-[96vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 my-auto">
            
            {/* Top Bar Across the Screen */}
            <div className="px-5 py-3 sm:py-3.5 bg-slate-900 text-white flex justify-between items-center rounded-t-3xl shrink-0 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-brand/20 border border-brand/30 flex items-center justify-center text-brand-300">
                  <Receipt className="w-5 h-5 text-brand" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-brand text-[11px] font-bold uppercase tracking-wider">Fast Food & Sensor POS Kassa</p>
                    <span className="hidden lg:inline-flex px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Split-Screen POS
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black">Xaridni rasmiylashtirish</h3>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
                  <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-slate-200 font-mono font-bold text-[10px]">Enter ↵</kbd>
                  <span>— Keyingi maydon</span>
                  <span className="text-slate-600">|</span>
                  <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-slate-200 font-mono font-bold text-[10px]">Ctrl+Enter</kbd>
                  <span>— Tasdiqlash</span>
                </div>
                <button 
                  type="button"
                  onClick={() => setIsCheckoutOpen(false)}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer active:scale-95"
                  aria-label="Yopish"
                  title="Yopish (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Split Screen Body: 
                LEFT: Input Fields & Order Summary (46% width on lg)
                RIGHT: Large Touch Keypad (54% width on lg)
            */}
            <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
              
              {/* LEFT HALF: Form & Information */}
              <div className="w-full lg:w-[46%] xl:w-[44%] p-4 sm:p-5 lg:p-6 overflow-y-auto flex flex-col gap-3.5 border-b lg:border-b-0 lg:border-r border-slate-200 bg-slate-50/60">
                
                {/* 1. Order Summary Card */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-4 shadow-sm flex items-center justify-between shrink-0">
                  <div>
                    <div className="text-xs font-medium text-slate-400">
                      Savat: <span className="text-white font-bold">{cart.length} xil mahsulot</span>
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-slate-300 uppercase tracking-wider mt-0.5">
                      Jami to'lov:
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono tracking-tight">
                      {totalCartSum.toLocaleString()} <span className="text-xs sm:text-sm text-slate-300 font-sans font-bold">UZS</span>
                    </span>
                  </div>
                </div>

                {/* 2. Payment Method Tabs */}
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 tracking-wider mb-1.5">
                    To'lov turi:
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'naqd' as const, label: 'Naqd', icon: Banknote, color: 'text-emerald-600' },
                      { id: 'karta' as const, label: 'Karta', icon: CreditCard, color: 'text-blue-600' },
                      { id: 'transfer' as const, label: 'O\'tkazma', icon: Building2, color: 'text-purple-600' },
                      { id: 'nasiya' as const, label: 'Nasiya', icon: FileText, color: 'text-amber-600' },
                    ].map(tab => {
                      const Icon = tab.icon;
                      const isActive = paymentMethod === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => handlePaymentMethodSelect(tab.id)}
                          className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all font-bold text-xs gap-1.5 cursor-pointer active:scale-95 ${
                            isActive
                              ? 'border-brand bg-brand/10 text-slate-900 shadow-sm ring-2 ring-brand/20'
                              : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                          }`}
                        >
                          <Icon className={`w-5 h-5 ${tab.color}`} />
                          <span className="text-xs">{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 3. Cash Section (When Naqd) */}
                {paymentMethod === 'naqd' && (
                  <div 
                    onClick={() => handleSelectField('cash')}
                    className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                      activeCheckoutField === 'cash' 
                        ? 'bg-emerald-50/70 border-emerald-500 shadow-sm ring-2 ring-emerald-500/20' 
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="text-xs font-bold uppercase text-emerald-900 tracking-wider flex items-center gap-1.5">
                        <Banknote className="w-4 h-4 text-emerald-600" />
                        Mijoz bergan pul:
                      </label>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setReceivedCashStr(totalCartSum.toString());
                          cashInputRef.current?.focus();
                        }}
                        className="text-[11px] font-black text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-2.5 py-0.5 rounded-lg transition-colors cursor-pointer active:scale-95"
                        title="Aniq hisoblangan summani kiritish"
                      >
                        Aniq summa
                      </button>
                    </div>

                    <div className="flex items-center justify-between bg-white px-3 py-2.5 rounded-xl border border-emerald-300 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20">
                      <span className="text-xs text-slate-400 font-semibold shrink-0 mr-2 select-none">Berilgan:</span>
                      <input
                        ref={cashInputRef}
                        type="text"
                        inputMode="decimal"
                        value={receivedCashStr}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9.]/g, '');
                          const parts = val.split('.');
                          const cleanVal = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : val;
                          setReceivedCashStr(cleanVal);
                        }}
                        onFocus={() => {
                          setActiveCheckoutField('cash');
                          setKeyboardTab('numpad');
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (e.ctrlKey || e.metaKey) {
                              handleCompleteSale();
                            } else {
                              handleAdvanceFieldOrSubmit();
                            }
                          }
                        }}
                        placeholder="0"
                        className="w-full text-right text-2xl font-black text-slate-900 font-mono tracking-wide focus:outline-none bg-transparent"
                      />
                      <span className="text-xs font-sans font-bold text-slate-500 ml-2 shrink-0 select-none">UZS</span>
                    </div>

                    {/* Change Display */}
                    {parseFloat(receivedCashStr) >= totalCartSum ? (
                      <div className="mt-2.5 pt-2 border-t border-emerald-200 flex justify-between items-center text-emerald-900 font-bold">
                        <span className="text-xs uppercase tracking-wider">Qaytim:</span>
                        <span className="text-xl font-black text-emerald-700 font-mono">
                          {(parseFloat(receivedCashStr) - totalCartSum).toLocaleString()} <span className="text-xs font-sans">UZS</span>
                        </span>
                      </div>
                    ) : parseFloat(receivedCashStr) > 0 ? (
                      <div className="mt-2.5 pt-2 border-t border-amber-200 flex justify-between items-center text-amber-800 font-bold text-xs">
                        <span>Yetarli emas:</span>
                        <span className="font-mono text-amber-700 text-sm font-black">
                          {(totalCartSum - parseFloat(receivedCashStr)).toLocaleString()} UZS
                        </span>
                      </div>
                    ) : null}
                  </div>
                )}

                {/* 4. Customer Phone (Fixed +998 Prefix & 9-digit Mask) */}
                <div 
                  onClick={() => handleSelectField('customerPhone')}
                  className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                    activeCheckoutField === 'customerPhone' 
                      ? 'bg-blue-50/70 border-blue-500 shadow-sm ring-2 ring-blue-500/20' 
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold uppercase text-slate-600 tracking-wider flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-blue-500" />
                      Telefon raqami:
                    </label>
                    <span className="text-xs font-bold text-blue-600">
                      {activeCheckoutField === 'customerPhone' ? '🔢 O\'ngda numpad aktiv' : ''}
                    </span>
                  </div>
                  <div className="flex items-center bg-white rounded-xl border border-slate-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 overflow-hidden shadow-xs">
                    <span className="px-3.5 py-2.5 bg-slate-100 text-slate-700 font-black text-sm border-r border-slate-200 select-none font-mono shrink-0">
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
                      onFocus={() => {
                        setActiveCheckoutField('customerPhone');
                        setKeyboardTab('numpad');
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (e.ctrlKey || e.metaKey) {
                            handleCompleteSale();
                          } else {
                            handleAdvanceFieldOrSubmit();
                          }
                        }
                      }}
                      className="w-full px-3.5 py-2.5 text-slate-900 font-black text-lg font-mono focus:outline-none bg-transparent"
                    />
                  </div>
                </div>

                {/* 5. Customer Name */}
                <div 
                  onClick={() => handleSelectField('customerName')}
                  className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                    activeCheckoutField === 'customerName' 
                      ? 'bg-brand/5 border-brand shadow-sm ring-2 ring-brand/20' 
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold uppercase text-slate-600 tracking-wider flex items-center gap-1.5">
                      <User className="w-4 h-4 text-slate-500" />
                      Mijoz ismi:
                    </label>
                    <span className="text-xs font-bold text-brand">
                      {activeCheckoutField === 'customerName' ? '⌨️ O\'ngda harf klaviatura' : ''}
                    </span>
                  </div>
                  <input
                    ref={customerNameInputRef}
                    type="text"
                    placeholder="Mijoz ismi (ixtiyoriy)..."
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    onFocus={() => {
                      setActiveCheckoutField('customerName');
                      setKeyboardTab('keyboard');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (e.ctrlKey || e.metaKey) {
                          handleCompleteSale();
                        } else {
                          handleAdvanceFieldOrSubmit();
                        }
                      }
                    }}
                    className="w-full bg-white px-3.5 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-900 text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 shadow-xs"
                  />
                </div>

                {/* 6. Checkout Note */}
                <div 
                  onClick={() => handleSelectField('checkoutNote')}
                  className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                    activeCheckoutField === 'checkoutNote' 
                      ? 'bg-amber-50/60 border-amber-500 shadow-sm ring-2 ring-amber-500/20' 
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-bold uppercase text-slate-600 tracking-wider flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-slate-500" />
                      Izoh / Qayd:
                    </label>
                    <span className="text-xs font-bold text-amber-600">
                      {activeCheckoutField === 'checkoutNote' ? '⌨️ O\'ngda harf klaviatura' : ''}
                    </span>
                  </div>
                  <input
                    ref={checkoutNoteInputRef}
                    type="text"
                    placeholder="Izoh yoki eslatma (ixtiyoriy)..."
                    value={checkoutNote}
                    onChange={(e) => setCheckoutNote(e.target.value)}
                    onFocus={() => {
                      setActiveCheckoutField('checkoutNote');
                      setKeyboardTab('keyboard');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (e.ctrlKey || e.metaKey) {
                          handleCompleteSale();
                        } else {
                          handleAdvanceFieldOrSubmit();
                        }
                      }
                    }}
                    className="w-full bg-white px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium text-slate-900 text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 shadow-xs"
                  />
                </div>

                {/* 7. Print Receipt Checkbox */}
                <label className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-slate-200 cursor-pointer hover:bg-slate-100/80 transition-colors">
                  <input 
                    type="checkbox"
                    checked={autoPrintAfterSale}
                    onChange={e => setAutoPrintAfterSale(e.target.checked)}
                    className="w-5 h-5 text-brand rounded focus:ring-brand cursor-pointer"
                  />
                  <span className="text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-2 select-none">
                    <Printer className="w-4 h-4 text-slate-500" />
                    Sotuvdan so'ng chekni avtomatik chop etish
                  </span>
                </label>

                {/* 8. Action Buttons at the Bottom of Left Side */}
                <div className="pt-2 mt-auto border-t border-slate-200 flex gap-2.5 shrink-0 sticky bottom-0 bg-slate-50/95 backdrop-blur-sm pb-1">
                  <button 
                    type="button"
                    onClick={() => setIsCheckoutOpen(false)}
                    className="flex-1 py-3.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-2xl transition-all cursor-pointer text-sm active:scale-95"
                  >
                    Bekor qilish
                  </button>
                  <button 
                    type="button"
                    onClick={handleCompleteSale}
                    className="flex-[2] py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 active:scale-95 text-base cursor-pointer"
                    title="Sotishni tasdiqlash (Ctrl+Enter ↵)"
                  >
                    <CheckCircle2 className="hidden sm:inline-block w-5 h-5 stroke-[2.5]" />
                    <span>Sotishni tasdiqlash</span>
                  </button>
                </div>

              </div>

              {/* RIGHT HALF: Dedicated Fast Food Style Touch Keyboard & Numpad (ONLY VISIBLE ON DESKTOP POS lg+) */}
              <div className="hidden lg:flex w-full lg:w-[54%] xl:w-[56%] bg-slate-900 text-white p-4 sm:p-5 lg:p-6 flex-col justify-between gap-3 select-none">
                
                {/* Top Control Bar of Keyboard: HUD Monitor + Tabs */}
                <div className="flex flex-col gap-2 shrink-0">
                  {/* Live Value Monitor */}
                  <div className="bg-slate-950/90 rounded-2xl px-4 py-2.5 border border-slate-800 flex items-center justify-between gap-3 shadow-inner">
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="p-1.5 rounded-xl bg-slate-800 text-slate-300">
                        {activeCheckoutField === 'cash' && <Banknote className="w-5 h-5 text-emerald-400" />}
                        {activeCheckoutField === 'customerPhone' && <Phone className="w-5 h-5 text-blue-400" />}
                        {activeCheckoutField === 'customerName' && <User className="w-5 h-5 text-brand" />}
                        {activeCheckoutField === 'checkoutNote' && <FileText className="w-5 h-5 text-amber-400" />}
                      </span>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Aktiv maydon:
                        </span>
                        <span className="text-xs font-black text-white">
                          {activeCheckoutField === 'cash' ? 'Naqd pul summasi' :
                           activeCheckoutField === 'customerPhone' ? 'Telefon raqami' :
                           activeCheckoutField === 'customerName' ? 'Mijoz ismi' : 'Izoh / Qayd'}
                        </span>
                      </div>
                    </div>

                    {/* Real-time Formatted Text */}
                    <div className="flex-1 text-right font-mono font-black text-xl sm:text-2xl tracking-wider truncate px-2">
                      {activeCheckoutField === 'customerPhone' ? (
                        <span className="text-blue-400">
                          <span className="text-slate-500 text-sm mr-1">+998</span>
                          {customerPhoneDigits ? formatPhoneLocal(customerPhoneDigits) : <span className="text-slate-600 text-base">(__) ___-__-__</span>}
                        </span>
                      ) : activeCheckoutField === 'cash' ? (
                        <span className="text-emerald-400">
                          {receivedCashStr ? (parseFloat(receivedCashStr) || 0).toLocaleString() : '0'}{' '}
                          <span className="text-xs font-sans text-slate-400">UZS</span>
                          {parseFloat(receivedCashStr) > totalCartSum && (
                            <span className="text-xs font-sans text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded-lg ml-2 font-bold inline-block">
                              Qaytim: {(parseFloat(receivedCashStr) - totalCartSum).toLocaleString()} UZS
                            </span>
                          )}
                        </span>
                      ) : activeCheckoutField === 'customerName' ? (
                        <span className="text-white font-sans text-base sm:text-xl">
                          {customerName || <span className="text-slate-600 italic text-sm">Ismni yozing...</span>}
                        </span>
                      ) : (
                        <span className="text-amber-300 font-sans text-base sm:text-xl">
                          {checkoutNote || <span className="text-slate-600 italic text-sm">Izohni yozing...</span>}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Mode & Switchers Row */}
                  <div className="flex items-center justify-between gap-2">
                    {/* Previous / Next field buttons */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handlePrevField}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-brand text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                        title="Oldingi maydonga o'tish"
                      >
                        <span>▲</span>
                        <span className="hidden sm:inline">Oldingi</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleNextField}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-brand text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                        title="Keyingi maydonga o'tish"
                      >
                        <span className="hidden sm:inline">Keyingi</span>
                        <span>▼</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleCompleteSale}
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                        title="Darhol sotishni yakunlash (Ctrl+Enter)"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Darhol Sotish</span>
                      </button>
                    </div>

                    {/* 123 vs ABC Mode Toggle & Languages */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center bg-slate-800 p-0.5 rounded-xl border border-slate-700 gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setKeyboardTab('numpad');
                            setTouchSymbolsMode(false);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                            keyboardTab === 'numpad'
                              ? 'bg-brand text-white shadow-xs'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <Hash className="w-3.5 h-3.5" />
                          <span>123 Raqam</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setKeyboardTab('keyboard');
                            setTouchSymbolsMode(false);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                            keyboardTab === 'keyboard'
                              ? 'bg-brand text-white shadow-xs'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <Keyboard className="w-3.5 h-3.5" />
                          <span>ABC Harf</span>
                        </button>
                      </div>

                      {/* Language tabs if ABC */}
                      {keyboardTab === 'keyboard' && (
                        <div className="flex items-center bg-slate-800 p-0.5 rounded-xl border border-slate-700 gap-0.5">
                          {[
                            { code: 'uz' as const, label: "UZ" },
                            { code: 'en' as const, label: 'EN' },
                            { code: 'ru' as const, label: 'RU' },
                          ].map(l => (
                            <button
                              key={l.code}
                              type="button"
                              onClick={() => {
                                setKeyboardLang(l.code);
                                setTouchSymbolsMode(false);
                              }}
                              className={`px-2 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                                keyboardLang === l.code && !touchSymbolsMode
                                  ? 'bg-brand text-white shadow-xs'
                                  : 'text-slate-400 hover:text-white'
                              }`}
                              title={`${l.label} klaviaturasi`}
                            >
                              {l.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Keyboard Body Area */}
                <div className="flex-1 min-h-0 flex flex-col justify-center">
                  {keyboardTab === 'numpad' ? (
                    /* FAST FOOD 4-COLUMN GIANT NUMPAD */
                    <div className="w-full flex flex-col gap-2 sm:gap-2.5">
                      
                      {/* Fast Cash Presets Row (Only if Cash is active) */}
                      {activeCheckoutField === 'cash' && (
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { label: 'Aniq', val: totalCartSum },
                            { label: '+10k', val: (parseFloat(receivedCashStr) || 0) + 10000 },
                            { label: '+50k', val: (parseFloat(receivedCashStr) || 0) + 50000 },
                            { label: '+100k', val: (parseFloat(receivedCashStr) || 0) + 100000 },
                          ].map(preset => (
                            <button
                              key={preset.label}
                              type="button"
                              onClick={() => {
                                setReceivedCashStr(preset.val.toString());
                                cashInputRef.current?.focus();
                              }}
                              className="py-2.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 font-black text-xs sm:text-sm active:scale-95 transition-all cursor-pointer select-none"
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Giant 4-Column Keypad */}
                      <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
                        {/* Row 1 */}
                        {[1, 2, 3].map(num => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => handleCheckoutKeyInput(num.toString())}
                            className="h-16 sm:h-20 lg:h-22 rounded-2xl bg-slate-800 hover:bg-slate-700 active:bg-brand text-white font-black text-3xl sm:text-4xl border border-slate-700 shadow-sm active:scale-95 transition-all flex items-center justify-center cursor-pointer select-none"
                          >
                            {num}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => handleCheckoutKeyInput('C')}
                          className="h-16 sm:h-20 lg:h-22 rounded-2xl bg-rose-950/70 hover:bg-rose-900 border border-rose-800 text-rose-300 font-black text-2xl sm:text-3xl shadow-sm active:scale-95 transition-all flex items-center justify-center cursor-pointer select-none"
                          title="Tozalash"
                        >
                          C
                        </button>

                        {/* Row 2 */}
                        {[4, 5, 6].map(num => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => handleCheckoutKeyInput(num.toString())}
                            className="h-16 sm:h-20 lg:h-22 rounded-2xl bg-slate-800 hover:bg-slate-700 active:bg-brand text-white font-black text-3xl sm:text-4xl border border-slate-700 shadow-sm active:scale-95 transition-all flex items-center justify-center cursor-pointer select-none"
                          >
                            {num}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => handleCheckoutKeyInput('BACKSPACE')}
                          className="h-16 sm:h-20 lg:h-22 rounded-2xl bg-amber-950/70 hover:bg-amber-900 border border-amber-800 text-amber-300 font-bold shadow-sm active:scale-95 transition-all flex items-center justify-center cursor-pointer select-none"
                          title="O'chirish (Backspace)"
                        >
                          <Delete className="w-8 h-8 sm:w-9 sm:h-9 stroke-[2.2]" />
                        </button>

                        {/* Row 3 */}
                        {[7, 8, 9].map(num => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => handleCheckoutKeyInput(num.toString())}
                            className="h-16 sm:h-20 lg:h-22 rounded-2xl bg-slate-800 hover:bg-slate-700 active:bg-brand text-white font-black text-3xl sm:text-4xl border border-slate-700 shadow-sm active:scale-95 transition-all flex items-center justify-center cursor-pointer select-none"
                          >
                            {num}
                          </button>
                        ))}
                        {/* Tall 2-Row ENTER button */}
                        <button
                          type="button"
                          onClick={() => handleCheckoutKeyInput('ENTER')}
                          className="row-span-2 h-full min-h-[140px] sm:min-h-[170px] rounded-2xl bg-gradient-to-b from-emerald-500 via-emerald-600 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 active:bg-emerald-800 text-white font-black text-xl sm:text-2xl shadow-xl shadow-emerald-950/60 active:scale-95 transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer select-none border-2 border-emerald-400/80"
                          title={activeCheckoutField === 'checkoutNote' ? "Sotishni tasdiqlash (Enter)" : "Keyingi maydonga o'tish (Enter)"}
                        >
                          <CornerDownLeft className="w-8 h-8 sm:w-10 sm:h-10 stroke-[3]" />
                          <span>ENTER</span>
                          <span className="text-[10px] sm:text-xs font-bold text-emerald-100 uppercase tracking-wider text-center px-1">
                            {activeCheckoutField === 'cash' && '➔ Telefon'}
                            {activeCheckoutField === 'customerPhone' && '➔ Ism'}
                            {activeCheckoutField === 'customerName' && '➔ Izoh'}
                            {activeCheckoutField === 'checkoutNote' && '✓ Tasdiqlash'}
                          </span>
                        </button>

                        {/* Row 4 */}
                        <button
                          type="button"
                          onClick={() => handleCheckoutKeyInput(activeCheckoutField === 'cash' ? '.' : '00')}
                          className="h-16 sm:h-20 lg:h-22 rounded-2xl bg-slate-800 hover:bg-slate-700 active:bg-brand text-white font-black text-3xl sm:text-4xl border border-slate-700 shadow-sm active:scale-95 transition-all flex items-center justify-center cursor-pointer select-none"
                        >
                          {activeCheckoutField === 'cash' ? '.' : '00'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCheckoutKeyInput('0')}
                          className="h-16 sm:h-20 lg:h-22 rounded-2xl bg-slate-800 hover:bg-slate-700 active:bg-brand text-white font-black text-3xl sm:text-4xl border border-slate-700 shadow-sm active:scale-95 transition-all flex items-center justify-center cursor-pointer select-none"
                        >
                          0
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCheckoutKeyInput(activeCheckoutField === 'cash' ? '00' : '000')}
                          className="h-16 sm:h-20 lg:h-22 rounded-2xl bg-slate-800 hover:bg-slate-700 active:bg-brand text-white font-black text-2xl sm:text-3xl border border-slate-700 shadow-sm active:scale-95 transition-all flex items-center justify-center cursor-pointer select-none"
                        >
                          {activeCheckoutField === 'cash' ? '00' : '000'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* FULL MULTI-LANG KEYBOARD IN RIGHT HALF */
                    <div className="w-full flex gap-2 items-stretch">
                      <div className="flex-1 flex flex-col gap-1.5 sm:gap-2">
                        {(touchSymbolsMode ? TOUCH_KEYBOARD_SYMBOLS : KEYBOARD_LAYOUTS[keyboardLang]).map((row, rIdx) => (
                          <div key={rIdx} className="flex gap-1 sm:gap-1.5 w-full">
                            {!touchSymbolsMode && rIdx === 2 && (
                              <button
                                type="button"
                                onClick={() => setIsCapsOn(prev => !prev)}
                                className={`h-12 sm:h-14 px-3 sm:px-4 rounded-xl sm:rounded-2xl border text-xs sm:text-sm font-black active:scale-95 transition-all flex items-center justify-center cursor-pointer shrink-0 ${
                                  isCapsOn
                                    ? 'bg-brand border-brand text-white shadow-md'
                                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                                }`}
                                title="Katta/kichik harf (Shift)"
                              >
                                ⇧ Caps
                              </button>
                            )}

                            {row.map(char => {
                              const displayChar = (!touchSymbolsMode && !isCapsOn)
                                ? char.toLowerCase()
                                : char;
                              return (
                                <button
                                  key={char}
                                  type="button"
                                  onClick={() => handleCheckoutKeyInput(displayChar)}
                                  className="flex-1 h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-slate-800 hover:bg-slate-700 active:bg-brand text-white font-bold text-lg sm:text-2xl border border-slate-700/80 shadow-xs active:scale-90 transition-all flex items-center justify-center cursor-pointer select-none"
                                >
                                  {displayChar}
                                </button>
                              );
                            })}

                            {!touchSymbolsMode && rIdx === 2 && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleCheckoutKeyInput(',')}
                                  className="w-10 sm:w-12 h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-slate-800 hover:bg-slate-700 active:bg-brand text-white font-bold text-xl border border-slate-700/80 active:scale-90 transition-all flex items-center justify-center cursor-pointer select-none shrink-0"
                                >
                                  ,
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleCheckoutKeyInput('.')}
                                  className="w-10 sm:w-12 h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-slate-800 hover:bg-slate-700 active:bg-brand text-white font-bold text-xl border border-slate-700/80 active:scale-90 transition-all flex items-center justify-center cursor-pointer select-none shrink-0"
                                >
                                  .
                                </button>
                              </>
                            )}
                          </div>
                        ))}

                        {/* Bottom Row */}
                        <div className="flex gap-1.5 sm:gap-2 w-full pt-1">
                          <button
                            type="button"
                            onClick={() => setTouchSymbolsMode(prev => !prev)}
                            className="h-12 sm:h-14 px-3 sm:px-4 rounded-xl sm:rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-black text-xs sm:text-sm active:scale-95 transition-all cursor-pointer shrink-0"
                          >
                            {touchSymbolsMode ? 'ABC Harf' : '?123 Belgilar'}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCheckoutKeyInput('SPACE')}
                            className="flex-1 h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold text-xs sm:text-sm uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center cursor-pointer"
                          >
                            Bo'sh joy (Space)
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCheckoutKeyInput('C')}
                            className="h-12 sm:h-14 px-4 sm:px-6 rounded-xl sm:rounded-2xl bg-rose-950/70 hover:bg-rose-900 border border-rose-800 text-rose-300 font-black text-base active:scale-95 transition-all cursor-pointer shrink-0"
                            title="Tozalash"
                          >
                            C
                          </button>
                        </div>
                      </div>

                      {/* Right Side Action Column (Backspace on top, Tall Enter) */}
                      <div className="w-20 sm:w-28 lg:w-32 flex flex-col gap-1.5 sm:gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCheckoutKeyInput('BACKSPACE')}
                          className="h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-amber-950/80 hover:bg-amber-900 border border-amber-700/80 text-amber-300 font-bold active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer shadow-sm shrink-0"
                          title="O'chirish (Backspace)"
                        >
                          <Delete className="w-6 h-6 stroke-[2.2]" />
                          <span className="text-xs font-bold hidden sm:inline">O'chirish</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCheckoutKeyInput('ENTER')}
                          className="flex-1 min-h-[140px] sm:min-h-[160px] rounded-2xl bg-gradient-to-b from-emerald-500 via-emerald-600 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 active:scale-95 border-2 border-emerald-400/80 text-white font-black shadow-xl shadow-emerald-950/70 transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer select-none"
                          title={activeCheckoutField === 'checkoutNote' ? "Sotishni tasdiqlash (Enter)" : "Keyingi maydonga o'tish (Enter)"}
                        >
                          <CornerDownLeft className="w-8 h-8 sm:w-10 sm:h-10 stroke-[3]" />
                          <span className="text-base sm:text-xl font-black tracking-wider">ENTER</span>
                          <span className="text-[10px] sm:text-xs font-bold text-emerald-100 uppercase tracking-wider opacity-90 text-center px-1">
                            {activeCheckoutField === 'cash' && '➔ Telefon'}
                            {activeCheckoutField === 'customerPhone' && '➔ Ism'}
                            {activeCheckoutField === 'customerName' && '➔ Izoh'}
                            {activeCheckoutField === 'checkoutNote' && '✓ Tasdiqlash'}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </div>

            </div>
          </div>
        </div>
      )}

      {/* NAKLADNAYA / RECEIPT MODAL (EXACT PAPER INVOICE AS IN PHOTO) */}
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

    </div>
  );
}
