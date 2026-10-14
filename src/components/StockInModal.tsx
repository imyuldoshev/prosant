import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, PackagePlus, AlertCircle, ArrowUpRight, Delete } from 'lucide-react';
import type { Product } from '../types';

interface StockInModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (quantity: number) => void;
}

export function StockInModal({ product, isOpen, onClose, onConfirm }: StockInModalProps) {
  const [amountStr, setAmountStr] = useState('10');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus and auto-select on open for fast computer typing
  useEffect(() => {
    if (isOpen && product) {
      setAmountStr('10');
      setError(null);
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          inputRef.current.select();
        }
      }, 50);
    }
  }, [isOpen, product?.id]);

  const currentStock = product ? (Number(product.stock) || 0) : 0;
  const parsedAmount = parseFloat(amountStr) || 0;
  const newStock = Math.max(0, currentStock + (parsedAmount > 0 ? parsedAmount : 0));

  const handleNumpadInput = (val: string) => {
    setError(null);
    if (val === 'C') {
      setAmountStr('');
      if (inputRef.current) inputRef.current.focus();
    } else if (val === 'BACKSPACE') {
      setAmountStr(prev => prev.slice(0, -1));
      if (inputRef.current) inputRef.current.focus();
    } else if (val === '.') {
      if (!amountStr) {
        setAmountStr('0.');
      } else if (!amountStr.includes('.')) {
        setAmountStr(prev => prev + '.');
      }
      if (inputRef.current) inputRef.current.focus();
    } else {
      // Numbers 0-9
      if (amountStr === '0') {
        setAmountStr(val);
      } else {
        setAmountStr(prev => prev + val);
      }
      if (inputRef.current) inputRef.current.focus();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(',', '.');
    // Allow digits and at most one dot
    if (raw === '' || /^\d*\.?\d*$/.test(raw)) {
      setAmountStr(raw);
      setError(null);
    }
  };

  const handleSubmit = useCallback((e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const qty = parseFloat(amountStr);
    if (isNaN(qty) || qty <= 0) {
      setError('Kirim miqdori 0 dan katta bo\'lishi kerak!');
      if (inputRef.current) inputRef.current.focus();
      return;
    }
    onConfirm(qty);
    onClose();
  }, [amountStr, onConfirm, onClose]);

  // Physical keyboard Enter & Escape handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleSubmit, onClose]);

  if (!isOpen || !product) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-xl sm:max-w-2xl lg:max-w-3xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 my-auto max-h-[92dvh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="stock-in-modal-title"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-3.5 sm:px-6 sm:py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner shrink-0">
              <PackagePlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-emerald-100 block leading-none">
                Ombor operatsiyasi
              </span>
              <h2 id="stock-in-modal-title" className="text-base sm:text-xl font-black leading-tight mt-0.5">
                Kirim qilish
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

        {/* Modal Body - 2 Columns on desktop POS (lg:grid-cols-2), single column on mobile & tablet */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 flex flex-col gap-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-stretch">
            
            {/* LEFT COLUMN: Product info + Stock preview + Display */}
            <div className="flex flex-col justify-between gap-3">
              
              {/* Product Info Banner */}
              <div className="p-3 sm:p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center gap-3.5 shrink-0">
                <img 
                  src={product.image || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&q=80'} 
                  alt={product.name}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover border border-slate-200 shadow-xs shrink-0 bg-slate-100" 
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-brand bg-brand/10 px-2.5 py-0.5 rounded-full">
                      {product.category}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      ID: #{product.id.slice(-5)}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-xs sm:text-sm leading-snug line-clamp-2 mt-1" title={product.name}>
                    {product.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Narxi: <span className="font-bold text-slate-700">{product.price.toLocaleString()} UZS</span> / {product.unit}
                  </p>
                </div>
              </div>

              {/* Stock Calculation Preview Bar (Oldingi qoldiq va Yangi qoldiq) */}
              <div className="grid grid-cols-2 gap-3 p-3 sm:p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl text-center shrink-0">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wide truncate">Oldingi qoldiq</div>
                  <div className="text-lg sm:text-2xl font-black text-slate-800 mt-0.5 truncate">
                    {currentStock} <span className="text-xs sm:text-sm font-semibold text-slate-500">{product.unit}</span>
                  </div>
                </div>
                <div className="min-w-0 border-l border-emerald-200/80 pl-3">
                  <div className="text-xs font-bold text-brand uppercase tracking-wide truncate">Yangi qoldiq</div>
                  <div className="text-lg sm:text-2xl font-black text-brand mt-0.5 truncate">
                    {newStock} <span className="text-xs sm:text-sm font-semibold text-brand/70">{product.unit}</span>
                  </div>
                </div>
              </div>

              {/* Interactive Input for Kirim Amount (Keyboard + Mouse + Touch friendly) */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="stockin-amount-input" className="text-xs font-bold uppercase tracking-wider text-slate-500 cursor-pointer">
                    Kirim miqdori:
                  </label>
                  <span className="text-xs font-bold text-brand bg-brand/10 px-2.5 py-0.5 rounded-md">
                    {product.unit}
                  </span>
                </div>

                <div className="bg-white border-2 border-emerald-500/50 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/20 rounded-2xl p-2.5 sm:p-3 flex items-center justify-between shadow-inner transition-all">
                  <input
                    ref={inputRef}
                    id="stockin-amount-input"
                    type="text"
                    inputMode="decimal"
                    value={amountStr}
                    onChange={handleInputChange}
                    placeholder="0"
                    className="w-full text-2xl sm:text-4xl font-mono font-black text-slate-900 bg-transparent focus:outline-none tracking-wider px-1"
                    title="Klaviatura orqali sonni kiritishingiz yoki o'zgartirishingiz mumkin"
                  />
                  <span className="text-base sm:text-lg font-bold text-slate-400 font-sans ml-2 shrink-0 select-none">
                    {product.unit}
                  </span>
                </div>
              </div>

              {/* Quick Presets for fast quantity entry */}
              <div className="grid grid-cols-4 gap-2 pt-1">
                {[5, 10, 50, 100].map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setAmountStr(preset.toString());
                      setError(null);
                      if (inputRef.current) inputRef.current.focus();
                    }}
                    className="py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 font-black text-xs sm:text-sm text-emerald-800 active:scale-95 transition-all cursor-pointer select-none"
                  >
                    +{preset} {product.unit}
                  </button>
                ))}
              </div>

              {error && (
                <div className="flex items-center gap-1.5 text-rose-600 bg-rose-50 p-2.5 rounded-xl text-xs sm:text-sm font-semibold shrink-0">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Touch & Computer Calculator Grid (ONLY VISIBLE ON DESKTOP POS lg+) */}
            <div className="hidden lg:flex flex-col justify-between select-none">
              <div className="grid grid-cols-4 gap-2 sm:gap-2.5">
                {/* Row 1 */}
                {[1, 2, 3].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleNumpadInput(num.toString())}
                    className="h-16 sm:h-18 lg:h-20 bg-slate-100 hover:bg-slate-200 active:bg-brand active:text-white active:scale-95 text-slate-800 text-2xl sm:text-3xl font-black rounded-2xl transition-all shadow-xs flex items-center justify-center cursor-pointer border border-slate-200/80"
                    aria-label={num.toString()}
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handleNumpadInput('C')}
                  className="h-16 sm:h-18 lg:h-20 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 active:scale-95 text-rose-600 text-xl sm:text-2xl font-black rounded-2xl transition-all shadow-xs flex items-center justify-center cursor-pointer border border-rose-200"
                  aria-label="Hammasini tozalash"
                  title="Hammasini tozalash"
                >
                  C
                </button>

                {/* Row 2 */}
                {[4, 5, 6].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleNumpadInput(num.toString())}
                    className="h-16 sm:h-18 lg:h-20 bg-slate-100 hover:bg-slate-200 active:bg-brand active:text-white active:scale-95 text-slate-800 text-2xl sm:text-3xl font-black rounded-2xl transition-all shadow-xs flex items-center justify-center cursor-pointer border border-slate-200/80"
                    aria-label={num.toString()}
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handleNumpadInput('BACKSPACE')}
                  className="h-16 sm:h-18 lg:h-20 bg-amber-50 hover:bg-amber-100 active:bg-amber-200 active:scale-95 text-amber-700 rounded-2xl transition-all shadow-xs flex items-center justify-center cursor-pointer border border-amber-200"
                  aria-label="Bitta o'chirish"
                  title="Bitta o'chirish"
                >
                  <Delete className="w-7 h-7 stroke-[2.2]" />
                </button>

                {/* Row 3 */}
                {[7, 8, 9].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleNumpadInput(num.toString())}
                    className="h-16 sm:h-18 lg:h-20 bg-slate-100 hover:bg-slate-200 active:bg-brand active:text-white active:scale-95 text-slate-800 text-2xl sm:text-3xl font-black rounded-2xl transition-all shadow-xs flex items-center justify-center cursor-pointer border border-slate-200/80"
                    aria-label={num.toString()}
                  >
                    {num}
                  </button>
                ))}
                {/* Tall Side Kirim / Enter Button spanning 2 rows */}
                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  className="row-span-2 h-full bg-gradient-to-b from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 active:scale-95 text-white font-black text-lg sm:text-xl rounded-2xl shadow-lg shadow-emerald-600/30 transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer select-none border border-emerald-400/40"
                  aria-label="Kirimni tasdiqlash"
                  title="Kirimni tasdiqlash"
                >
                  <ArrowUpRight className="w-7 h-7 stroke-[3]" />
                  <span>Kirim</span>
                </button>

                {/* Row 4 */}
                <button
                  type="button"
                  onClick={() => handleNumpadInput('.')}
                  className="h-16 sm:h-18 lg:h-20 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 active:scale-95 text-slate-800 text-3xl sm:text-4xl font-black rounded-2xl transition-all shadow-xs flex items-center justify-center cursor-pointer border border-slate-200/80"
                  aria-label="Nuqta"
                >
                  .
                </button>
                <button
                  type="button"
                  onClick={() => handleNumpadInput('0')}
                  className="h-16 sm:h-18 lg:h-20 bg-slate-100 hover:bg-slate-200 active:bg-brand active:text-white active:scale-95 text-slate-800 text-2xl sm:text-3xl font-black rounded-2xl transition-all shadow-xs flex items-center justify-center cursor-pointer border border-slate-200/80"
                  aria-label="0"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={() => handleNumpadInput('00')}
                  className="h-16 sm:h-18 lg:h-20 bg-slate-100 hover:bg-slate-200 active:bg-brand active:text-white active:scale-95 text-slate-800 text-xl sm:text-2xl font-black rounded-2xl transition-all shadow-xs flex items-center justify-center cursor-pointer border border-slate-200/80"
                  aria-label="00"
                >
                  00
                </button>
              </div>
            </div>

          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-2 border-t border-slate-100 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 min-h-[48px] sm:min-h-[52px] py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl active:scale-95 transition-all text-sm sm:text-base cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              className="flex-[2] min-h-[48px] sm:min-h-[52px] py-3 px-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold rounded-2xl active:scale-95 transition-all shadow-lg shadow-emerald-600/25 text-sm sm:text-base flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowUpRight className="hidden sm:inline-block w-5 h-5 stroke-[3]" />
              <span>Kirimni tasdiqlash</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
