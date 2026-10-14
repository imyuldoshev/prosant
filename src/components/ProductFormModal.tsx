import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  X, 
  Edit3, 
  Plus, 
  AlertCircle, 
  ArrowUpRight, 
  Upload, 
  Camera, 
  Trash2, 
  Delete, 
  FolderPlus,
  Check,
  Calculator
} from 'lucide-react';
import type { Product } from '../types';
import { CustomSelect } from './CustomSelect';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
  categories: string[];
  onAddCategory: (category: string) => void;
  onSave: (productData: Omit<Product, 'id'>) => void;
  onDuplicateAttempt?: (existingProduct: Product) => void;
  checkDuplicate: (name: string, excludeId?: string) => Product | undefined;
}

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&q=80';

export function ProductFormModal({
  isOpen,
  onClose,
  productToEdit,
  categories,
  onAddCategory,
  onSave,
  onDuplicateAttempt,
  checkDuplicate,
}: ProductFormModalProps) {
  // Form fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [price, setPrice] = useState('10000');
  const [unit, setUnit] = useState('dona');
  const [stock, setStock] = useState('10');
  const [minStock, setMinStock] = useState('');
  const [image, setImage] = useState(DEFAULT_IMAGE);

  // New Category inline creation state
  const [isAddingNewCat, setIsAddingNewCat] = useState(false);
  const [newCatInput, setNewCatInput] = useState('');

  // Active numeric field for Calculator numpad: 'costPrice' | 'price' | 'minStock' | 'stock' | null
  const [activeNumField, setActiveNumField] = useState<'costPrice' | 'price' | 'minStock' | 'stock' | null>(null);

  // Camera capture modal state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Hidden file input refs
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  // Duplicate match and error
  const [duplicateMatch, setDuplicateMatch] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);

  const availableCategories = useMemo(() => categories.filter(c => c !== 'Barchasi'), [categories]);

  // Track modal open/edit transition to only initialize on fresh open or edit target switch
  const prevIsOpenRef = useRef(false);
  const prevEditIdRef = useRef<string | undefined>(undefined);

  // Handle camera stream cleanup
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  // Guarantee cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Initialize form ONLY when opened or when product to edit switches
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      prevIsOpenRef.current = false;
      return;
    }

    const wasJustOpened = !prevIsOpenRef.current;
    const editTargetChanged = productToEdit?.id !== prevEditIdRef.current;
    prevIsOpenRef.current = true;
    prevEditIdRef.current = productToEdit?.id;

    if (wasJustOpened || editTargetChanged) {
      if (productToEdit) {
        setName(productToEdit.name || '');
        setCategory(productToEdit.category || '');
        setCostPrice(productToEdit.costPrice !== undefined && productToEdit.costPrice !== null ? String(productToEdit.costPrice) : '');
        setPrice(String(productToEdit.price ?? ''));
        setUnit(productToEdit.unit || 'dona');
        setStock(String(productToEdit.stock ?? '0'));
        setMinStock(productToEdit.minStock !== undefined && productToEdit.minStock !== null ? String(productToEdit.minStock) : '');
        setImage(productToEdit.image || DEFAULT_IMAGE);
      } else {
        setName('');
        const initialCat = categories.find(c => c !== 'Barchasi') || 'Trubalar';
        setCategory(initialCat);
        setCostPrice('');
        setPrice('');
        setUnit('dona');
        setStock('0');
        setMinStock('');
        setImage(DEFAULT_IMAGE);
      }
      setDuplicateMatch(null);
      setError(null);
      setIsAddingNewCat(false);
      setNewCatInput('');
      setActiveNumField(null);
    }
  }, [isOpen, productToEdit, stopCamera, categories]);

  // Auto-scroll input into view when on-screen calculator opens so it is never hidden
  useEffect(() => {
    if (activeNumField) {
      setTimeout(() => {
        const id = activeNumField === 'costPrice'
          ? 'prod-cost-price-input'
          : activeNumField === 'price' 
            ? 'prod-price-input' 
            : activeNumField === 'stock' 
              ? 'prod-stock-input' 
              : 'prod-min-stock-input';
        const el = document.getElementById(id);
        el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 40);
    }
  }, [activeNumField]);

  // Physical keyboard Escape and Enter handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeNumField) {
          setActiveNumField(null);
        } else {
          onClose();
        }
      } else if (e.key === 'Enter') {
        if (activeNumField) {
          e.preventDefault();
          setActiveNumField(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeNumField, onClose]);

  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.warn('Direct mediaDevices error, falling back to camera file input', err);
      setIsCameraActive(false);
      // Fallback directly to native camera input on mobile/tablets
      if (cameraInputRef.current) {
        cameraInputRef.current.click();
      }
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      const maxWidth = 800;
      const maxHeight = 600;
      let w = video.videoWidth || 640;
      let h = video.videoHeight || 480;
      if (w > maxWidth) {
        h = Math.round((h * maxWidth) / w);
        w = maxWidth;
      }
      if (h > maxHeight) {
        w = Math.round((w * maxHeight) / h);
        h = maxHeight;
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        setImage(dataUrl);
      }
    }
    stopCamera();
  };

  // Handle file uploads (from laptop disk or mobile gallery)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setImage(result);
      }
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be re-selected if desired
    e.target.value = '';
  };

  // Real-time duplicate check with safe fallback
  const handleNameChange = (val: string) => {
    setName(val);
    setError(null);
    try {
      if (checkDuplicate) {
        const match = checkDuplicate(val, productToEdit?.id);
        setDuplicateMatch(match || null);
      }
    } catch (e) {
      console.warn('Duplicate check error:', e);
      setDuplicateMatch(null);
    }
  };

  // Inline Category Add
  const handleAddNewCategoryConfirm = () => {
    const trimmed = newCatInput.trim();
    if (!trimmed) return;
    onAddCategory(trimmed);
    setCategory(trimmed);
    setIsAddingNewCat(false);
    setNewCatInput('');
  };

  // Calculator Numpad Actions for active number field
  const handleNumpadInput = (val: string) => {
    if (!activeNumField) return;

    if (val === 'OK') {
      setActiveNumField(null);
      return;
    }

    const currentVal = (
      activeNumField === 'costPrice' ? costPrice : 
      activeNumField === 'price' ? price : 
      activeNumField === 'stock' ? stock : 
      minStock
    ) || '';

    let updatedVal = currentVal;
    if (val === 'C') {
      updatedVal = '';
    } else if (val === 'BACKSPACE') {
      updatedVal = currentVal.length > 0 ? currentVal.slice(0, -1) : '';
    } else if (val === '.') {
      if (!currentVal) {
        updatedVal = '0.';
      } else if (!currentVal.includes('.')) {
        updatedVal = currentVal + '.';
      }
    } else if (val === '00') {
      if (currentVal && currentVal !== '0') {
        updatedVal = currentVal + '00';
      }
    } else {
      if (currentVal === '0') {
        updatedVal = val;
      } else {
        updatedVal = currentVal + val;
      }
    }

    if (activeNumField === 'costPrice') setCostPrice(updatedVal);
    else if (activeNumField === 'price') setPrice(updatedVal);
    else if (activeNumField === 'stock') setStock(updatedVal);
    else if (activeNumField === 'minStock') setMinStock(updatedVal);
  };

  // Real-time Profit and Margin calculation if cost price and selling price are provided
  const profitCalc = useMemo(() => {
    const cp = parseFloat(costPrice);
    const sp = parseFloat(price);
    if (!isNaN(cp) && !isNaN(sp) && cp > 0 && sp > 0) {
      const profit = sp - cp;
      const percent = ((profit / cp) * 100).toFixed(1);
      return { profit, percent };
    }
    return null;
  }, [costPrice, price]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Mahsulot nomini kiriting!');
      return;
    }

    const match = checkDuplicate(trimmedName, productToEdit?.id);
    if (match) {
      setDuplicateMatch(match);
      if (onDuplicateAttempt) {
        onDuplicateAttempt(match);
      }
      return;
    }

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setError('Belgilangan narxni to\'g\'ri kiriting!');
      return;
    }

    // Cost price is optional
    let parsedCostPrice: number | undefined = undefined;
    if (costPrice.trim() !== '') {
      const cp = parseFloat(costPrice);
      if (!isNaN(cp) && cp >= 0) {
        parsedCostPrice = cp;
      }
    }

    // Default stock: preserve existing product's stock or start with 0
    const finalStock = productToEdit ? Number(productToEdit.stock) || 0 : (parseFloat(stock) || 0);

    // minStock is optional
    let parsedMinStock: number | undefined = undefined;
    if (minStock.trim() !== '') {
      const m = parseFloat(minStock);
      if (!isNaN(m) && m >= 0) {
        parsedMinStock = m;
      }
    }

    onSave({
      name: trimmedName,
      category: category || availableCategories[0] || 'Umumiy',
      costPrice: parsedCostPrice,
      price: parsedPrice,
      unit,
      stock: finalStock,
      minStock: parsedMinStock,
      image: image.trim() || DEFAULT_IMAGE,
    });
    onClose();
  };

  const isEditing = Boolean(productToEdit);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-2xl overflow-hidden flex flex-col my-auto max-h-[96vh] animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-form-modal-title"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-brand to-sky-700 px-5 py-3.5 sm:py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
              {isEditing ? <Edit3 className="w-5 h-5 text-white" /> : <Plus className="w-6 h-6 text-white stroke-[2.5]" />}
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-sky-100 block leading-tight">
                {isEditing ? 'Tahrirlash' : 'Yangi Mahsulot'}
              </span>
              <h2 id="product-form-modal-title" className="text-lg sm:text-xl font-black leading-tight">
                {isEditing ? 'Mahsulotni tahrirlash' : 'Mahsulot qo\'shish'}
              </h2>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition-all flex items-center justify-center text-white cursor-pointer"
            aria-label="Yopish"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Duplicate Warning Banner */}
        {duplicateMatch && (
          <div className="bg-amber-500 text-white p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner shrink-0 animate-in slide-in-from-top-4 duration-200">
            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-white/20 rounded-xl shrink-0 mt-0.5">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="font-extrabold text-sm leading-tight">
                  Ushbu mahsulot oldin qo'shilgan!
                </p>
                <p className="text-xs text-amber-100 mt-0.5">
                  "{duplicateMatch.name}" allaqachon mavjud. Qoldiq: {duplicateMatch.stock} {duplicateMatch.unit}
                </p>
              </div>
            </div>
            {onDuplicateAttempt && (
              <button
                type="button"
                onClick={() => {
                  onDuplicateAttempt(duplicateMatch);
                  onClose();
                }}
                className="min-h-[40px] px-4 py-2 bg-white text-amber-900 hover:bg-amber-50 active:scale-95 font-black text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 self-start sm:self-auto shrink-0 cursor-pointer"
              >
                <ArrowUpRight className="w-4 h-4 stroke-[3]" />
                <span>Kirim qilish</span>
              </button>
            )}
          </div>
        )}

        {/* Form Body (Scrollable) */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 flex flex-col gap-4 overflow-y-auto overflow-x-hidden">
          
          {/* 1. Name Field */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="product-name-input" className="text-xs sm:text-sm font-bold text-slate-700 flex justify-between">
              <span>Mahsulot nomi *</span>
              {duplicateMatch && (
                <span className="text-xs text-amber-600 font-bold">Mavjud mahsulot!</span>
              )}
            </label>
            <input
              id="product-name-input"
              type="text"
              required
              value={name}
              onChange={e => handleNameChange(e.target.value)}
              placeholder="Masalan: Truba Oq 25mm"
              className={`w-full min-h-[46px] px-4 py-2.5 rounded-2xl text-base font-medium transition-all ${
                duplicateMatch 
                  ? 'bg-amber-50/70 border-2 border-amber-500 text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400' 
                  : 'bg-slate-100 border-2 border-transparent focus:border-brand focus:bg-white focus:outline-none'
              }`}
              autoFocus
            />
          </div>

          {/* 2. Category Selection & Dynamic New Category Creation */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="product-cat-select" className="text-xs sm:text-sm font-bold text-slate-700">
                Kategoriya *
              </label>
              {!isAddingNewCat && (
                <button
                  type="button"
                  onClick={() => setIsAddingNewCat(true)}
                  className="text-xs font-bold text-brand hover:text-sky-700 flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>+ Yangi kategoriya</span>
                </button>
              )}
            </div>

            {isAddingNewCat ? (
              <div className="flex items-center gap-2 bg-blue-50/70 p-2 rounded-2xl border border-brand/30 animate-in fade-in duration-150">
                <input
                  type="text"
                  placeholder="Yangi kategoriya nomini yozing..."
                  value={newCatInput}
                  onChange={e => setNewCatInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddNewCategoryConfirm();
                    }
                  }}
                  className="flex-1 min-h-[40px] px-3.5 py-1.5 bg-white rounded-xl text-sm font-semibold border border-slate-200 focus:outline-none focus:border-brand"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleAddNewCategoryConfirm}
                  disabled={!newCatInput.trim()}
                  className="min-h-[40px] px-3.5 py-1.5 bg-brand hover:bg-sky-600 disabled:bg-slate-200 text-white rounded-xl font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Qo'shish</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingNewCat(false);
                    setNewCatInput('');
                  }}
                  className="min-h-[40px] px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-xs transition-all cursor-pointer"
                >
                  Bekor
                </button>
              </div>
            ) : (
              <CustomSelect
                id="product-cat-select"
                value={category}
                onChange={setCategory}
                options={availableCategories.map(cat => ({ value: cat, label: cat }))}
                placeholder="Kategoriya tanlang..."
                buttonClassName="bg-slate-100 border-2 border-transparent focus:border-brand focus:bg-white min-h-[46px]"
              />
            )}
          </div>

          {/* 3. Unit Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs sm:text-sm font-bold text-slate-700">
              O'lchov birligi *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['dona', 'metr', 'komplekt'].map(u => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUnit(u)}
                  className={`min-h-[44px] rounded-2xl font-bold text-xs sm:text-sm transition-all border cursor-pointer active:scale-95 ${
                    unit === u 
                      ? 'bg-brand text-white border-brand shadow-sm' 
                      : 'bg-slate-100 text-slate-700 border-slate-200/80 hover:bg-slate-200'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Asosiy ko'rsatkichlar: Asl narx, Belgilangan narx, Dastlabki kirim, Eng kam qoldiq */}
          <div className="flex flex-col gap-3">
            {/* Narxlar bloki: Asl narx (tannarx) va Belgilangan narx (sotish narxi) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Asl narx (Tannarx / Kelish narxi) */}
              <div className="flex flex-col gap-1">
                <label 
                  htmlFor="prod-cost-price-input" 
                  className="text-xs font-bold text-slate-700 flex items-center justify-between"
                >
                  <span className="flex items-center gap-1.5">
                    <span>Asl narxi (UZS)</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md">
                      Kelish narxi
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveNumField(prev => prev === 'costPrice' ? null : 'costPrice')}
                    className={`hidden lg:flex p-1 rounded-lg text-xs items-center gap-1 font-semibold transition-colors cursor-pointer ${
                      activeNumField === 'costPrice' ? 'bg-brand text-white' : 'text-slate-400 hover:text-brand'
                    }`}
                    title="On-screen kalkulyatorni ochish/yopish"
                  >
                    <Calculator className="w-3.5 h-3.5" />
                  </button>
                </label>
                <div 
                  className={`flex items-center bg-slate-100 rounded-2xl border-2 transition-all p-1.5 ${
                    activeNumField === 'costPrice' ? 'border-brand bg-white ring-2 ring-brand/20' : 'border-transparent'
                  }`}
                >
                  <input
                    id="prod-cost-price-input"
                    type="text"
                    inputMode="decimal"
                    value={costPrice}
                    onFocus={e => {
                      const target = e.currentTarget;
                      requestAnimationFrame(() => target.select());
                    }}
                    onClick={e => (e.currentTarget as HTMLInputElement).select()}
                    onChange={e => {
                      const v = e.target.value.replace(',', '.');
                      if (v === '' || /^\d*\.?\d*$/.test(v)) setCostPrice(v);
                    }}
                    placeholder="0"
                    className="w-full text-base sm:text-lg font-black text-slate-900 bg-transparent focus:outline-none px-2 select-text"
                  />
                  <span className="text-xs font-bold text-slate-400 pr-2 shrink-0">UZS</span>
                </div>
              </div>

              {/* Belgilangan narx (Sotish narxi) */}
              <div className="flex flex-col gap-1">
                <label 
                  htmlFor="prod-price-input" 
                  className="text-xs font-bold text-slate-700 flex items-center justify-between"
                >
                  <span className="flex items-center gap-1.5">
                    <span>Belgilangan narxi (UZS) *</span>
                    <span className="text-[10px] font-bold text-sky-700 bg-sky-50 border border-sky-200 px-1.5 py-0.5 rounded-md">
                      Sotish narxi
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveNumField(prev => prev === 'price' ? null : 'price')}
                    className={`hidden lg:flex p-1 rounded-lg text-xs items-center gap-1 font-semibold transition-colors cursor-pointer ${
                      activeNumField === 'price' ? 'bg-brand text-white' : 'text-slate-400 hover:text-brand'
                    }`}
                    title="On-screen kalkulyatorni ochish/yopish"
                  >
                    <Calculator className="w-3.5 h-3.5" />
                  </button>
                </label>
                <div 
                  className={`flex items-center bg-slate-100 rounded-2xl border-2 transition-all p-1.5 ${
                    activeNumField === 'price' ? 'border-brand bg-white ring-2 ring-brand/20' : 'border-transparent'
                  }`}
                >
                  <input
                    id="prod-price-input"
                    type="text"
                    inputMode="decimal"
                    required
                    value={price}
                    onFocus={e => {
                      const target = e.currentTarget;
                      requestAnimationFrame(() => target.select());
                    }}
                    onClick={e => (e.currentTarget as HTMLInputElement).select()}
                    onChange={e => {
                      const v = e.target.value.replace(',', '.');
                      if (v === '' || /^\d*\.?\d*$/.test(v)) setPrice(v);
                    }}
                    placeholder="0"
                    className="w-full text-base sm:text-lg font-black text-slate-900 bg-transparent focus:outline-none px-2 select-text"
                  />
                  <span className="text-xs font-bold text-slate-400 pr-2 shrink-0">UZS</span>
                </div>
              </div>
            </div>

            {/* Real-time Profit / Margin Preview Banner if both prices are entered */}
            {profitCalc && (
              <div className={`p-2.5 sm:p-3 rounded-2xl border flex items-center justify-between text-xs font-bold transition-all animate-in fade-in ${
                profitCalc.profit >= 0 
                  ? 'bg-emerald-50/80 border-emerald-200/90 text-emerald-900' 
                  : 'bg-rose-50/80 border-rose-200/90 text-rose-900'
              }`}>
                <span className="flex items-center gap-2">
                  <span className="text-slate-600 font-semibold">Kutilayotgan foyda:</span>
                  <span className={`font-black ${profitCalc.profit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {profitCalc.profit >= 0 ? '+' : ''}{profitCalc.profit.toLocaleString()} UZS / {unit}
                  </span>
                </span>
                <span className={`px-2.5 py-1 rounded-xl text-[11px] font-black border ${
                  profitCalc.profit >= 0 
                    ? 'bg-white text-emerald-800 border-emerald-300 shadow-2xs' 
                    : 'bg-white text-rose-800 border-rose-300 shadow-2xs'
                }`}>
                  {profitCalc.percent}% marja
                </span>
              </div>
            )}

            {/* Qoldiqlar bloki: Dastlabki kirim va Eng kam qoldiq */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Dastlabki kirim (Boshlang'ich qoldiq) */}
              <div className="flex flex-col gap-1">
                <label 
                  htmlFor="prod-stock-input" 
                  className="text-xs font-bold text-slate-700 flex items-center justify-between"
                >
                  <span className="flex items-center gap-1.5">
                    <span>{isEditing ? 'Joriy qoldiq' : 'Dastlabki kirim'}</span>
                    <span className="text-[10px] font-bold text-slate-600 bg-slate-200/80 px-1.5 py-0.5 rounded-md">
                      {isEditing ? 'Ombordagi' : 'Boshlang\'ich miqdor'}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveNumField(prev => prev === 'stock' ? null : 'stock')}
                    className={`hidden lg:flex p-1 rounded-lg text-xs items-center gap-1 font-semibold transition-colors cursor-pointer ${
                      activeNumField === 'stock' ? 'bg-brand text-white' : 'text-slate-400 hover:text-brand'
                    }`}
                    title="On-screen kalkulyatorni ochish/yopish"
                  >
                    <Calculator className="w-3.5 h-3.5" />
                  </button>
                </label>
                <div 
                  className={`flex items-center bg-slate-100 rounded-2xl border-2 transition-all p-1.5 ${
                    activeNumField === 'stock' ? 'border-brand bg-white ring-2 ring-brand/20' : 'border-transparent'
                  }`}
                >
                  <input
                    id="prod-stock-input"
                    type="text"
                    inputMode="decimal"
                    value={stock}
                    onFocus={e => {
                      const target = e.currentTarget;
                      requestAnimationFrame(() => target.select());
                    }}
                    onClick={e => (e.currentTarget as HTMLInputElement).select()}
                    onChange={e => {
                      const v = e.target.value.replace(',', '.');
                      if (v === '' || /^\d*\.?\d*$/.test(v)) setStock(v);
                    }}
                    placeholder="0"
                    className="w-full text-base sm:text-lg font-black text-slate-900 bg-transparent focus:outline-none px-2 select-text"
                  />
                  <span className="text-xs font-bold text-slate-400 pr-2 shrink-0">{unit}</span>
                </div>
              </div>

              {/* Eng kam qoldiq */}
              <div className="flex flex-col gap-1">
                <label 
                  htmlFor="prod-min-stock-input" 
                  className="text-xs font-bold text-slate-700 flex items-center justify-between"
                >
                  <span className="flex items-center gap-1.5">
                    <span>Eng kam qoldiq</span>
                    <span className="text-[10px] font-normal text-slate-400">(ogohlantirish limiti)</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveNumField(prev => prev === 'minStock' ? null : 'minStock')}
                    className={`hidden lg:flex p-1 rounded-lg text-xs items-center gap-1 font-semibold transition-colors cursor-pointer ${
                      activeNumField === 'minStock' ? 'bg-brand text-white' : 'text-slate-400 hover:text-brand'
                    }`}
                    title="On-screen kalkulyatorni ochish/yopish"
                  >
                    <Calculator className="w-3.5 h-3.5" />
                  </button>
                </label>
                <div 
                  className={`flex items-center bg-slate-100 rounded-2xl border-2 transition-all p-1.5 ${
                    activeNumField === 'minStock' ? 'border-brand bg-white ring-2 ring-brand/20' : 'border-transparent'
                  }`}
                >
                  <input
                    id="prod-min-stock-input"
                    type="text"
                    inputMode="decimal"
                    value={minStock}
                    onFocus={e => {
                      const target = e.currentTarget;
                      requestAnimationFrame(() => target.select());
                    }}
                    onClick={e => (e.currentTarget as HTMLInputElement).select()}
                    onChange={e => {
                      const v = e.target.value.replace(',', '.');
                      if (v === '' || /^\d*\.?\d*$/.test(v)) setMinStock(v);
                    }}
                    placeholder="Masalan: 5"
                    className="w-full text-base sm:text-lg font-black text-slate-900 bg-transparent focus:outline-none px-2 select-text"
                  />
                  <span className="text-xs font-bold text-slate-400 pr-2 shrink-0">{unit}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ON-SCREEN CALCULATOR / NUMPAD (ONLY VISIBLE ON DESKTOP POS lg+) */}
          {activeNumField && (
            <div className="hidden lg:flex bg-slate-50 border-2 border-brand/30 rounded-3xl p-3 sm:p-4 flex-col gap-2 animate-in zoom-in-95 duration-150 shadow-inner">
              <div className="flex items-center justify-between text-xs font-bold text-slate-600 pb-1 border-b border-slate-200">
                <span className="flex items-center gap-1 text-brand">
                  <Calculator className="w-4 h-4" />
                  <span>
                    Kalkulyator:{' '}
                    {activeNumField === 'costPrice'
                      ? 'Asl narx (kelish narxi)'
                      : activeNumField === 'price' 
                        ? 'Belgilangan narx (sotish)' 
                        : activeNumField === 'stock' 
                          ? 'Dastlabki kirim' 
                          : 'Eng kam qoldiq'}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setActiveNumField(null)}
                  className="text-slate-400 hover:text-slate-700 font-bold px-2 py-0.5 rounded-lg hover:bg-slate-200 text-xs cursor-pointer"
                >
                  Yopish ✕
                </button>
              </div>

              {/* Quick Presets for fast entry */}
              <div className="grid grid-cols-4 gap-2 max-w-md mx-auto w-full pt-1">
                {(activeNumField === 'costPrice' || activeNumField === 'price' ? [1000, 5000, 10000, 50000] : [1, 5, 10, 50]).map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      if (activeNumField === 'costPrice') setCostPrice(preset.toString());
                      else if (activeNumField === 'price') setPrice(preset.toString());
                      else if (activeNumField === 'stock') setStock(preset.toString());
                      else if (activeNumField === 'minStock') setMinStock(preset.toString());
                    }}
                    className="py-2 rounded-xl bg-brand/10 hover:bg-brand/20 border border-brand/30 font-black text-xs text-brand active:scale-95 transition-all cursor-pointer select-none"
                  >
                    +{preset} {activeNumField === 'costPrice' || activeNumField === 'price' ? 'UZS' : unit}
                  </button>
                ))}
              </div>

              {/* Spacious 4-Column Calculator Grid with Tall OK Button on Right */}
              <div className="grid grid-cols-4 gap-2 select-none max-w-md mx-auto w-full pt-1">
                {/* Row 1 */}
                {[1, 2, 3].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleNumpadInput(num.toString())}
                    className="h-14 sm:h-16 bg-white hover:bg-slate-100 active:bg-brand active:text-white active:scale-95 text-slate-800 text-2xl font-black rounded-2xl transition-all shadow-xs flex items-center justify-center cursor-pointer border border-slate-200/80"
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handleNumpadInput('C')}
                  className="h-14 sm:h-16 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 active:scale-95 text-rose-600 text-xl font-black rounded-2xl transition-all shadow-xs flex items-center justify-center cursor-pointer border border-rose-200"
                  title="Tozalash"
                >
                  C
                </button>

                {/* Row 2 */}
                {[4, 5, 6].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleNumpadInput(num.toString())}
                    className="h-14 sm:h-16 bg-white hover:bg-slate-100 active:bg-brand active:text-white active:scale-95 text-slate-800 text-2xl font-black rounded-2xl transition-all shadow-xs flex items-center justify-center cursor-pointer border border-slate-200/80"
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handleNumpadInput('BACKSPACE')}
                  className="h-14 sm:h-16 bg-amber-50 hover:bg-amber-100 active:bg-amber-200 active:scale-95 text-amber-700 rounded-2xl transition-all shadow-xs flex items-center justify-center cursor-pointer border border-amber-200"
                  title="Bitta o'chirish"
                >
                  <Delete className="w-6 h-6 stroke-[2.2]" />
                </button>

                {/* Row 3 */}
                {[7, 8, 9].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleNumpadInput(num.toString())}
                    className="h-14 sm:h-16 bg-white hover:bg-slate-100 active:bg-brand active:text-white active:scale-95 text-slate-800 text-2xl font-black rounded-2xl transition-all shadow-xs flex items-center justify-center cursor-pointer border border-slate-200/80"
                  >
                    {num}
                  </button>
                ))}
                {/* Tall OK Button on Right spanning 2 rows */}
                <button
                  type="button"
                  onClick={() => handleNumpadInput('OK')}
                  className="row-span-2 h-full bg-brand hover:bg-sky-600 active:scale-95 text-white font-black text-lg rounded-2xl shadow-md shadow-brand/30 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer select-none border border-sky-400/40"
                  title="Tasdiqlash va yopish"
                >
                  <Check className="w-6 h-6 stroke-[3]" />
                  <span>OK</span>
                </button>

                {/* Row 4 */}
                <button
                  type="button"
                  onClick={() => handleNumpadInput('.')}
                  className="h-14 sm:h-16 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 active:scale-95 text-slate-800 text-3xl font-black rounded-2xl transition-all shadow-xs flex items-center justify-center cursor-pointer border border-slate-200/80"
                >
                  .
                </button>
                <button
                  type="button"
                  onClick={() => handleNumpadInput('0')}
                  className="h-14 sm:h-16 bg-white hover:bg-slate-100 active:bg-brand active:text-white active:scale-95 text-slate-800 text-2xl font-black rounded-2xl transition-all shadow-xs flex items-center justify-center cursor-pointer border border-slate-200/80"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={() => handleNumpadInput('00')}
                  className="h-14 sm:h-16 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 active:scale-95 text-slate-800 text-xl font-black rounded-2xl transition-all shadow-xs flex items-center justify-center cursor-pointer border border-slate-200/80"
                >
                  00
                </button>
              </div>
            </div>
          )}

          {/* 5. Image Section: 2 Methods (1-Upload, 2-Camera) */}
          <div className="flex flex-col gap-2">
            <label className="text-xs sm:text-sm font-bold text-slate-700">
              Mahsulot rasmi:
            </label>

            {/* Hidden native inputs for maximum mobile & laptop compatibility */}
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleFileUpload} 
            />
            <input 
              ref={cameraInputRef}
              type="file" 
              accept="image/*" 
              capture="environment" 
              className="hidden" 
              onChange={handleFileUpload} 
            />

            {/* Live Camera View if Active */}
            {isCameraActive ? (
              <div className="bg-slate-900 rounded-2xl p-3 flex flex-col items-center gap-3 animate-in fade-in duration-200">
                <div className="relative w-full max-w-sm aspect-video bg-black rounded-xl overflow-hidden shadow-lg border border-slate-700">
                  <video 
                    ref={videoRef} 
                    playsInline 
                    autoPlay 
                    className="w-full h-full object-cover" 
                  />
                </div>
                <div className="flex gap-2.5 w-full max-w-sm">
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl active:scale-95 transition-all text-sm flex items-center justify-center gap-2 cursor-pointer shadow-md"
                  >
                    <Camera className="w-4 h-4 stroke-[2.5]" />
                    <span>Suratga olish</span>
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl active:scale-95 transition-all text-sm cursor-pointer"
                  >
                    Bekor
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center gap-3">
                {/* Image Preview */}
                <div className="relative group shrink-0">
                  <img 
                    src={image || DEFAULT_IMAGE} 
                    alt="Tovar rasmi" 
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-slate-200 shadow-xs bg-white"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = DEFAULT_IMAGE;
                    }}
                  />
                  {image && image !== DEFAULT_IMAGE && (
                    <button
                      type="button"
                      onClick={() => setImage(DEFAULT_IMAGE)}
                      className="absolute -top-1.5 -right-1.5 p-1 bg-rose-600 text-white rounded-full shadow-md hover:bg-rose-700 transition-colors cursor-pointer"
                      title="Rasmni olib tashlash"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Upload & Camera Buttons */}
                <div className="flex-1 flex flex-col gap-2 w-full">
                  <div className="grid grid-cols-2 gap-2">
                    {/* Method 1: Upload (Mobile gallery or PC files) */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="min-h-[46px] px-3 py-2 bg-white hover:bg-slate-100 active:scale-95 text-slate-800 font-bold rounded-xl border border-slate-200 shadow-xs transition-all flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer"
                      title="Qurilmadan fayl yuklash"
                    >
                      <Upload className="w-4 h-4 text-brand shrink-0" />
                      <span>Fayldan yuklash</span>
                    </button>

                    {/* Method 2: Camera (Live camera or native mobile camera) */}
                    <button
                      type="button"
                      onClick={startCamera}
                      className="min-h-[46px] px-3 py-2 bg-white hover:bg-slate-100 active:scale-95 text-slate-800 font-bold rounded-xl border border-slate-200 shadow-xs transition-all flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer"
                      title="Kamera orqali suratga olish"
                    >
                      <Camera className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Kameradan olish</span>
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-400 font-medium leading-tight">
                    Telefonda bo'lsa galereya yoki kameradan, kompyuterda bo'lsa fayllardan yoki veb-kameradan rasm yuklashingiz mumkin.
                  </p>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 text-rose-600 bg-rose-50 p-3 rounded-xl text-sm font-semibold shrink-0">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-1 shrink-0 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 min-h-[48px] py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl active:scale-95 transition-all text-sm sm:text-base cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={Boolean(duplicateMatch)}
              className={`flex-[2] min-h-[48px] py-3 px-6 font-extrabold rounded-2xl active:scale-95 transition-all text-sm sm:text-base flex items-center justify-center gap-2 cursor-pointer ${
                duplicateMatch
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-brand hover:bg-brand-dark text-white shadow-lg shadow-brand/25'
              }`}
            >
              {isEditing ? <Edit3 className="hidden sm:inline-block w-5 h-5" /> : <Plus className="hidden sm:inline-block w-5 h-5 stroke-[3]" />}
              <span>{isEditing ? 'O\'zgarishlarni saqlash' : 'Mahsulotni qo\'shish'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
