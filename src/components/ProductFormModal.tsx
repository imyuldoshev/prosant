import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  X, 
  Edit3, 
  Plus, 
  AlertCircle, 
  ArrowUpRight, 
  FolderPlus,
  Check,
  Loader2
} from 'lucide-react';
import type { Product } from '../types';
import { CustomSelect } from './CustomSelect';
import { ProductImageSection } from './ProductImageSection';
import { FormattedNumberInput } from './FormattedNumberInput';
import { formatSum, formatInputNumber, parseFormattedNumber } from '../utils/format';
import { imageService } from '../services/imageService';

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
  const [image, setImage] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // New Category inline creation state
  const [isAddingNewCat, setIsAddingNewCat] = useState(false);
  const [newCatInput, setNewCatInput] = useState('');

  // Duplicate match and error
  const [duplicateMatch, setDuplicateMatch] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);

  const nameInputRef = useRef<HTMLInputElement>(null);

  // Ensure category is available
  const availableCategories = useMemo(() => {
    return categories.filter(c => c !== 'Barchasi');
  }, [categories]);

  // Sync state on open/edit
  useEffect(() => {
    if (isOpen) {
      if (productToEdit) {
        setName(productToEdit.name);
        setCategory(productToEdit.category || availableCategories[0] || 'Umumiy');
        setCostPrice(productToEdit.costPrice !== undefined ? formatInputNumber(productToEdit.costPrice.toString()) : '');
        setPrice(formatInputNumber(productToEdit.price.toString()));
        setUnit(productToEdit.unit || 'dona');
        setStock(productToEdit.stock !== undefined ? formatInputNumber(productToEdit.stock.toString()) : '0');
        setMinStock(productToEdit.minStock !== undefined ? formatInputNumber(productToEdit.minStock.toString()) : '');
        setImage(productToEdit.image || '');
      } else {
        setName('');
        setCategory(availableCategories[0] || 'Umumiy');
        setCostPrice('');
        setPrice('10 000');
        setUnit('dona');
        setStock('10');
        setMinStock('');
        setImage('');
      }
      setIsAddingNewCat(false);
      setNewCatInput('');
      setDuplicateMatch(null);
      setError(null);

      // Focus name input immediately
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, productToEdit, availableCategories]);

  // Debounced duplicate check (150ms) to eliminate keystroke jank
  useEffect(() => {
    if (!name.trim()) {
      setDuplicateMatch(null);
      return;
    }
    const timer = setTimeout(() => {
      const match = checkDuplicate(name.trim(), productToEdit?.id);
      setDuplicateMatch(match || null);
    }, 150);

    return () => clearTimeout(timer);
  }, [name, checkDuplicate, productToEdit?.id]);

  const handleAddNewCategory = useCallback(() => {
    const trimmed = newCatInput.trim();
    if (!trimmed) return;
    onAddCategory(trimmed);
    setCategory(trimmed);
    setIsAddingNewCat(false);
    setNewCatInput('');
  }, [newCatInput, onAddCategory]);

  // Real-time Profit and Margin calculation if cost price and selling price are provided
  const profitCalc = useMemo(() => {
    const cp = parseFormattedNumber(costPrice);
    const sp = parseFormattedNumber(price);
    if (!isNaN(cp) && !isNaN(sp) && cp > 0 && sp > 0) {
      const profit = sp - cp;
      const percent = ((profit / cp) * 100).toFixed(1);
      return { profit, percent };
    }
    return null;
  }, [costPrice, price]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUploading) return;

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

    const parsedPrice = parseFormattedNumber(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setError('Belgilangan narxni to\'g\'ri kiriting!');
      return;
    }

    // Cost price is optional
    let parsedCostPrice: number | undefined = undefined;
    if (costPrice.trim() !== '') {
      const cp = parseFormattedNumber(costPrice);
      if (!isNaN(cp) && cp >= 0) {
        parsedCostPrice = cp;
      }
    }

    // Default stock: preserve existing product's stock or start with 0
    const finalStock = productToEdit ? Number(productToEdit.stock) || 0 : parseFormattedNumber(stock);

    // minStock is optional
    let parsedMinStock: number | undefined = undefined;
    if (minStock.trim() !== '') {
      const m = parseFormattedNumber(minStock);
      if (!isNaN(m) && m >= 0) {
        parsedMinStock = m;
      }
    }

    let finalImageUrl = image.trim();

    // Agar rasm yangi olingan yoki yuklangan base64 bo'lsa (data:image/...)
    // uni Cloudflare R2 ga siqib yuklaymiz
    if (finalImageUrl.startsWith('data:')) {
      setIsUploading(true);
      setError(null);
      try {
        const uploadResult = await imageService.uploadImage(finalImageUrl, trimmedName);
        if (uploadResult && uploadResult.url) {
          finalImageUrl = uploadResult.url;
        }
      } catch (uploadErr) {
        console.warn('[ProductFormModal] Rasm yuklashda xatolik yuz berdi:', uploadErr);
      } finally {
        setIsUploading(false);
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
      image: finalImageUrl,
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
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-xl overflow-hidden flex flex-col my-auto max-h-[96vh] animate-in zoom-in-95 duration-200"
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
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-sky-100 block leading-none">
                {isEditing ? 'Tahrirlash rejimi' : 'Yangi tovar'}
              </span>
              <h2 id="product-form-modal-title" className="text-base sm:text-xl font-black leading-tight mt-0.5">
                {isEditing ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot qo\'shish'}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
          <div className="p-4 sm:p-6 overflow-y-auto flex flex-col gap-4 flex-1">
          
          {/* 1. Name & Duplicate Check Alert */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="prod-name-input" className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 flex justify-between items-center">
              <span>Mahsulot nomi: <span className="text-rose-500">*</span></span>
              {name.trim() && !duplicateMatch && (
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Nomi to'g'ri
                </span>
              )}
            </label>
            <input
              id="prod-name-input"
              ref={nameInputRef}
              type="text"
              required
              value={name}
              onChange={e => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Masalan: Truba 20 lik PPR, Smesitel vanna..."
              className={`w-full min-h-[46px] sm:min-h-[50px] px-4 rounded-2xl border-2 text-sm sm:text-base font-bold transition-all focus:outline-none ${
                duplicateMatch 
                  ? 'border-amber-400 bg-amber-50/50 dark:bg-amber-950/30 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-400/20' 
                  : 'border-slate-200 dark:border-slate-700 focus:border-brand dark:focus:border-blue-500 focus:ring-2 focus:ring-brand/20 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500'
              }`}
            />

            {/* Inline Duplicate Alert Banner */}
            {duplicateMatch && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-2xl flex flex-col gap-1 text-xs animate-in fade-in duration-150">
                <div className="flex items-center gap-1.5 font-extrabold text-amber-900 dark:text-amber-200">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Bunday nomli mahsulot bazada mavjud!</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 pl-5">
                  Mavjud: <strong className="text-slate-900 dark:text-white">{duplicateMatch.name}</strong> ({formatSum(duplicateMatch.stock)} {duplicateMatch.unit}, {formatSum(duplicateMatch.price)} UZS).
                </p>
                {onDuplicateAttempt && (
                  <button
                    type="button"
                    onClick={() => {
                      onDuplicateAttempt(duplicateMatch);
                      onClose();
                    }}
                    className="self-start mt-1 ml-5 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>Mavjud tovar sahifasiga o'tish</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 2. Category & Unit Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 items-start">
            {/* Category */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                  Kategoriya: <span className="text-rose-500">*</span>
                </label>
                {!isAddingNewCat && (
                  <button
                    type="button"
                    onClick={() => setIsAddingNewCat(true)}
                    className="text-xs font-bold text-brand dark:text-blue-400 hover:text-brand-dark flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                    <span>Yangi kategoriya</span>
                  </button>
                )}
              </div>

              {isAddingNewCat ? (
                <div className="flex items-center gap-1.5 min-h-[46px]">
                  <input
                    type="text"
                    autoFocus
                    value={newCatInput}
                    onChange={e => setNewCatInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddNewCategory();
                      } else if (e.key === 'Escape') {
                        setIsAddingNewCat(false);
                      }
                    }}
                    placeholder="Kategoriya nomi..."
                    className="flex-1 min-h-[46px] px-3 rounded-2xl border-2 border-brand bg-white dark:bg-slate-800 text-xs sm:text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand/20 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddNewCategory}
                    className="min-h-[46px] px-3 bg-brand hover:bg-brand-dark text-white rounded-2xl font-bold text-xs flex items-center justify-center cursor-pointer active:scale-95 transition-all"
                    title="Qo'shish"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingNewCat(false)}
                    className="min-h-[46px] px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-bold text-xs flex items-center justify-center cursor-pointer active:scale-95 transition-all"
                    title="Bekor qilish"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <CustomSelect
                  options={availableCategories.map(cat => ({ value: cat, label: cat }))}
                  value={category || availableCategories[0] || 'Umumiy'}
                  onChange={setCategory}
                  placeholder="Kategoriya tanlang"
                  ariaLabel="Mahsulot kategoriyasi"
                />
              )}
            </div>

            {/* Unit */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
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
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750'
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Pricing Section (Cost price + Selling price) */}
          <div className="p-3.5 bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700 rounded-2xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Narxlar va Foyda
              </span>
              {profitCalc && (
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                  Foyda: +{formatSum(profitCalc.profit)} UZS ({profitCalc.percent}%)
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Asl narx (kelish narxi / tannarx) */}
              <div className="flex flex-col gap-1">
                <label 
                  htmlFor="prod-cost-price-input" 
                  className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center justify-between"
                >
                  <span className="flex items-center gap-1">
                    <span>Asl narxi (kelish)</span>
                    <span className="text-[10px] font-normal text-slate-400 dark:text-slate-500">(ixtiyoriy)</span>
                  </span>
                </label>
                <div className="flex items-center bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-700 focus-within:border-brand transition-all p-1.5">
                  <FormattedNumberInput
                    id="prod-cost-price-input"
                    value={costPrice}
                    onChangeValue={setCostPrice}
                    placeholder="Masalan: 8 000"
                    className="w-full text-base sm:text-lg font-black text-slate-900 dark:text-white bg-transparent focus:outline-none px-2 select-text font-mono"
                  />
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 pr-2 shrink-0">UZS</span>
                </div>
              </div>

              {/* Belgilangan sotish narxi */}
              <div className="flex flex-col gap-1">
                <label 
                  htmlFor="prod-price-input" 
                  className="text-xs font-bold text-slate-700 dark:text-slate-300"
                >
                  <span>Sotish narxi: <span className="text-rose-500">*</span></span>
                </label>
                <div className="flex items-center bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-700 focus-within:border-brand transition-all p-1.5">
                  <FormattedNumberInput
                    id="prod-price-input"
                    value={price}
                    onChangeValue={setPrice}
                    placeholder="Masalan: 12 000"
                    className="w-full text-base sm:text-lg font-black text-slate-900 dark:text-white bg-transparent focus:outline-none px-2 select-text font-mono"
                  />
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 pr-2 shrink-0">UZS</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Stock Section */}
          <div className="p-3.5 bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700 rounded-2xl flex flex-col gap-3">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Qoldiq va Ombor
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Stock */}
              <div className="flex flex-col gap-1">
                <label 
                  htmlFor="prod-stock-input" 
                  className="text-xs font-bold text-slate-700 dark:text-slate-300"
                >
                  <span>{isEditing ? 'Hozirgi qoldiq' : 'Dastlabki kirim'}:</span>
                </label>
                <div className="flex items-center bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-700 focus-within:border-brand transition-all p-1.5">
                  <FormattedNumberInput
                    id="prod-stock-input"
                    value={stock}
                    onChangeValue={setStock}
                    placeholder="0"
                    className="w-full text-base sm:text-lg font-black text-slate-900 dark:text-white bg-transparent focus:outline-none px-2 select-text font-mono"
                  />
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 pr-2 shrink-0">{unit}</span>
                </div>
              </div>

              {/* Min Stock */}
              <div className="flex flex-col gap-1">
                <label 
                  htmlFor="prod-min-stock-input" 
                  className="text-xs font-bold text-slate-600 dark:text-slate-300"
                >
                  <span className="flex items-center gap-1">
                    <span>Eng kam qoldiq</span>
                    <span className="text-[10px] font-normal text-slate-400 dark:text-slate-500">(ogohlantirish)</span>
                  </span>
                </label>
                <div className="flex items-center bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-700 focus-within:border-brand transition-all p-1.5">
                  <FormattedNumberInput
                    id="prod-min-stock-input"
                    value={minStock}
                    onChangeValue={setMinStock}
                    placeholder="Masalan: 5"
                    className="w-full text-base sm:text-lg font-black text-slate-900 dark:text-white bg-transparent focus:outline-none px-2 select-text font-mono"
                  />
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 pr-2 shrink-0">{unit}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 5. Image Section: 2 Methods (1-Upload, 2-Camera) */}
          <ProductImageSection
            image={image}
            onChange={setImage}
          />

          {error && (
            <div className="flex items-center gap-2 text-rose-600 bg-rose-50 dark:bg-rose-950/40 p-3 rounded-xl text-sm font-semibold shrink-0 border border-rose-200 dark:border-rose-900">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          </div>

          {/* Action Buttons */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/90 border-t border-slate-100 dark:border-slate-800 flex gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="flex-1 min-h-[48px] py-3 px-4 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-2xl active:scale-95 transition-all text-sm sm:text-base cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={Boolean(duplicateMatch) || isUploading}
              className={`flex-[2] min-h-[48px] py-3 px-6 font-extrabold rounded-2xl active:scale-95 transition-all text-sm sm:text-base flex items-center justify-center gap-2 cursor-pointer ${
                duplicateMatch || isUploading
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                  : 'bg-brand hover:bg-brand-dark text-white shadow-lg shadow-brand/25'
              }`}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Rasm yuklanmoqda...</span>
                </>
              ) : (
                <>
                  {isEditing ? <Edit3 className="hidden sm:inline-block w-5 h-5" /> : <Plus className="hidden sm:inline-block w-5 h-5 stroke-[3]" />}
                  <span>{isEditing ? 'O\'zgarishlarni saqlash' : 'Mahsulotni qo\'shish'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
