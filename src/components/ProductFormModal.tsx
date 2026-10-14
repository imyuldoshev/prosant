import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  X, 
  Edit3, 
  Plus, 
  AlertCircle, 
  ArrowUpRight, 
  FolderPlus,
  Check,
  Calculator
} from 'lucide-react';
import type { Product } from '../types';
import { CustomSelect } from './CustomSelect';
import { ProductNumpad, type NumField } from './ProductNumpad';
import { ProductImageSection } from './ProductImageSection';

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
  const [activeNumField, setActiveNumField] = useState<NumField>(null);

  // Duplicate match and error
  const [duplicateMatch, setDuplicateMatch] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);

  const availableCategories = useMemo(() => categories.filter(c => c !== 'Barchasi'), [categories]);

  // Track modal open/edit transition to only initialize on fresh open or edit target switch
  const prevIsOpenRef = useRef(false);
  const prevEditIdRef = useRef<string | undefined>(undefined);

  // Initialize form ONLY when opened or when product to edit switches
  useEffect(() => {
    if (!isOpen) {
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
  }, [isOpen, productToEdit, categories]);

  // Debounced duplicate check (150ms debounce prevents jank on typing)
  useEffect(() => {
    if (!isOpen || !name.trim()) {
      setDuplicateMatch(null);
      return;
    }

    const timer = setTimeout(() => {
      try {
        const match = checkDuplicate(name.trim(), productToEdit?.id);
        setDuplicateMatch(match || null);
      } catch (err) {
        console.warn('Duplicate check warning:', err);
        setDuplicateMatch(null);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [name, checkDuplicate, productToEdit?.id, isOpen]);

  // Auto-scroll input into view when on-screen calculator opens so it is never hidden
  useEffect(() => {
    if (activeNumField) {
      const timer = setTimeout(() => {
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
      return () => clearTimeout(timer);
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

  // Inline Category Add
  const handleAddNewCategoryConfirm = useCallback(() => {
    const trimmed = newCatInput.trim();
    if (!trimmed) return;
    onAddCategory(trimmed);
    setCategory(trimmed);
    setIsAddingNewCat(false);
    setNewCatInput('');
  }, [newCatInput, onAddCategory]);

  // Calculator Numpad Actions for active number field
  const handleNumpadInput = useCallback((val: string) => {
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
  }, [activeNumField, costPrice, price, stock, minStock]);

  const handleNumpadPreset = useCallback((preset: number) => {
    if (!activeNumField) return;
    const strVal = preset.toString();
    if (activeNumField === 'costPrice') setCostPrice(strVal);
    else if (activeNumField === 'price') setPrice(strVal);
    else if (activeNumField === 'stock') setStock(strVal);
    else if (activeNumField === 'minStock') setMinStock(strVal);
  }, [activeNumField]);

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
              <h2 id="product-form-modal-title" className="text-base sm:text-lg font-black tracking-tight">
                {isEditing ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot qo\'shish'}
              </h2>
              <p className="text-white/80 text-xs font-medium">
                {isEditing ? 'Ma\'lumotlarni o\'zgartiring va saqlang' : 'Santexnika mahsulotini ro\'yxatga kiritish'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition-all cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
            aria-label="Yopish"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto flex flex-col gap-4">
          {/* 1. Name Input */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="prod-name-input" className="text-xs sm:text-sm font-bold text-slate-700 flex items-center justify-between">
              <span>Mahsulot nomi: <span className="text-rose-500">*</span></span>
              {duplicateMatch && (
                <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  Bu nomdagi tovar allaqachon mavjud!
                </span>
              )}
            </label>
            <div className="relative">
              <input
                id="prod-name-input"
                type="text"
                value={name}
                onChange={e => {
                  setName(e.target.value);
                  setError(null);
                }}
                placeholder="Masalan: Truba (Oq) 20mm yoki Smesitel Oshxona"
                className={`w-full min-h-[48px] px-3.5 py-2.5 bg-slate-50 border rounded-2xl text-slate-900 font-semibold text-sm sm:text-base focus:bg-white focus:outline-none transition-all ${
                  duplicateMatch 
                    ? 'border-rose-400 focus:ring-2 focus:ring-rose-200' 
                    : 'border-slate-200 focus:border-brand focus:ring-2 focus:ring-brand/20'
                }`}
                autoFocus
              />
            </div>
            {duplicateMatch && (
              <div className="p-2.5 bg-rose-50/90 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center justify-between gap-2 animate-in fade-in duration-150">
                <div className="min-w-0">
                  <span className="font-bold block truncate">{duplicateMatch.name}</span>
                  <span className="text-[11px] text-rose-600">
                    Mavjud qoldiq: {duplicateMatch.stock} {duplicateMatch.unit} | Narxi: {duplicateMatch.price.toLocaleString()} UZS
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (onDuplicateAttempt) {
                      onDuplicateAttempt(duplicateMatch);
                      onClose();
                    }
                  }}
                  className="px-3 py-1.5 min-h-[36px] bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-lg text-xs shrink-0 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                >
                  <span>Kirim qilish</span>
                  <ArrowUpRight className="w-3.5 h-3.5 stroke-[3]" />
                </button>
              </div>
            )}
          </div>

          {/* 2. Category & Unit Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Category Dropdown with inline creation */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs sm:text-sm font-bold text-slate-700">
                  Kategoriya: <span className="text-rose-500">*</span>
                </label>
                {!isAddingNewCat && (
                  <button
                    type="button"
                    onClick={() => setIsAddingNewCat(true)}
                    className="text-[11px] font-bold text-brand hover:text-brand-dark flex items-center gap-1 cursor-pointer"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    <span>Yangi qo'shish</span>
                  </button>
                )}
              </div>

              {isAddingNewCat ? (
                <div className="flex items-center gap-1.5 animate-in fade-in duration-150">
                  <input
                    type="text"
                    value={newCatInput}
                    onChange={e => setNewCatInput(e.target.value)}
                    placeholder="Yangi kategoriya..."
                    className="flex-1 min-h-[44px] px-3 py-2 bg-slate-50 border border-brand rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:bg-white"
                    autoFocus
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddNewCategoryConfirm();
                      } else if (e.key === 'Escape') {
                        setIsAddingNewCat(false);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddNewCategoryConfirm}
                    className="min-h-[44px] px-3 bg-brand text-white font-bold rounded-xl text-xs active:scale-95 transition-all cursor-pointer flex items-center justify-center"
                    title="Tasdiqlash"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingNewCat(false)}
                    className="min-h-[44px] px-2.5 bg-slate-200 text-slate-700 font-bold rounded-xl text-xs active:scale-95 transition-all cursor-pointer flex items-center justify-center"
                    title="Bekor"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <CustomSelect
                  value={category || availableCategories[0] || 'Umumiy'}
                  onChange={setCategory}
                  options={availableCategories.map(cat => ({ value: cat, label: cat }))}
                  ariaLabel="Mahsulot kategoriyasi"
                />
              )}
            </div>

            {/* Unit */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs sm:text-sm font-bold text-slate-700">
                O'lchov birligi: <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-4 gap-1.5 min-h-[44px]">
                {['dona', 'metr', 'komplekt', 'kg'].map(u => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setUnit(u)}
                    className={`min-h-[44px] rounded-xl text-xs sm:text-sm font-extrabold transition-all border cursor-pointer active:scale-95 ${
                      unit === u
                        ? 'bg-brand text-white border-brand shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Pricing Section (Cost price + Selling price) */}
          <div className="p-3.5 bg-slate-50/80 border border-slate-200/90 rounded-2xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                Narxlar va Foyda
              </span>
              {profitCalc && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                  Foyda: +{profitCalc.profit.toLocaleString()} UZS ({profitCalc.percent}%)
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Asl narx (kelish narxi / tannarx) */}
              <div className="flex flex-col gap-1">
                <label 
                  htmlFor="prod-cost-price-input" 
                  className="text-xs font-bold text-slate-600 flex items-center justify-between"
                >
                  <span className="flex items-center gap-1">
                    <span>Asl narxi (kelish)</span>
                    <span className="text-[10px] font-normal text-slate-400">(ixtiyoriy)</span>
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
                  className={`flex items-center bg-white rounded-2xl border-2 transition-all p-1.5 ${
                    activeNumField === 'costPrice' ? 'border-brand ring-2 ring-brand/20' : 'border-slate-200 focus-within:border-brand'
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
                    placeholder="Masalan: 8000"
                    className="w-full text-base sm:text-lg font-black text-slate-900 bg-transparent focus:outline-none px-2 select-text"
                  />
                  <span className="text-xs font-bold text-slate-400 pr-2 shrink-0">UZS</span>
                </div>
              </div>

              {/* Belgilangan sotish narxi */}
              <div className="flex flex-col gap-1">
                <label 
                  htmlFor="prod-price-input" 
                  className="text-xs font-bold text-slate-700 flex items-center justify-between"
                >
                  <span>Sotish narxi: <span className="text-rose-500">*</span></span>
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
                  className={`flex items-center bg-white rounded-2xl border-2 transition-all p-1.5 ${
                    activeNumField === 'price' ? 'border-brand ring-2 ring-brand/20' : 'border-slate-200 focus-within:border-brand'
                  }`}
                >
                  <input
                    id="prod-price-input"
                    type="text"
                    inputMode="decimal"
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
                    placeholder="Masalan: 12000"
                    className="w-full text-base sm:text-lg font-black text-slate-900 bg-transparent focus:outline-none px-2 select-text"
                  />
                  <span className="text-xs font-bold text-slate-400 pr-2 shrink-0">UZS</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Stock Section */}
          <div className="p-3.5 bg-slate-50/80 border border-slate-200/90 rounded-2xl flex flex-col gap-3">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">
              Qoldiq va Ombor
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Stock */}
              <div className="flex flex-col gap-1">
                <label 
                  htmlFor="prod-stock-input" 
                  className="text-xs font-bold text-slate-700 flex items-center justify-between"
                >
                  <span>{isEditing ? 'Hozirgi qoldiq' : 'Dastlabki kirim'}:</span>
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
                  className={`flex items-center bg-white rounded-2xl border-2 transition-all p-1.5 ${
                    activeNumField === 'stock' ? 'border-brand ring-2 ring-brand/20' : 'border-slate-200 focus-within:border-brand'
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

              {/* Min Stock */}
              <div className="flex flex-col gap-1">
                <label 
                  htmlFor="prod-min-stock-input" 
                  className="text-xs font-bold text-slate-600 flex items-center justify-between"
                >
                  <span className="flex items-center gap-1">
                    <span>Eng kam qoldiq</span>
                    <span className="text-[10px] font-normal text-slate-400">(ogohlantirish)</span>
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
                  className={`flex items-center bg-white rounded-2xl border-2 transition-all p-1.5 ${
                    activeNumField === 'minStock' ? 'border-brand ring-2 ring-brand/20' : 'border-slate-200 focus-within:border-brand'
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
          <ProductNumpad
            activeNumField={activeNumField}
            unit={unit}
            onClose={() => setActiveNumField(null)}
            onInput={handleNumpadInput}
            onPreset={handleNumpadPreset}
          />

          {/* 5. Image Section: 2 Methods (1-Upload, 2-Camera) */}
          <ProductImageSection
            image={image}
            defaultImage={DEFAULT_IMAGE}
            onChange={setImage}
          />

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
