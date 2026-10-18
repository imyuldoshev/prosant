import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, PackagePlus, AlertCircle, ArrowUpRight, Package } from 'lucide-react';
import type { Product } from '../types';
import { FormattedNumberInput } from './FormattedNumberInput';
import { formatSum, parseFormattedNumber } from '../utils/format';

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
  const parsedAmount = parseFormattedNumber(amountStr);
  const newStock = Math.max(0, currentStock + (parsedAmount > 0 ? parsedAmount : 0));

  const handleSubmit = useCallback((e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const qty = parseFormattedNumber(amountStr);
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
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 my-auto"
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

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 flex flex-col gap-4">
          
          {/* Product Info Banner */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700 flex items-center gap-3 shrink-0">
            {product.image && product.image.trim() !== '' ? (
              <img 
                src={product.image} 
                alt={product.name}
                className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-xs shrink-0 bg-slate-100 dark:bg-slate-800" 
              />
            ) : (
              <div className="w-12 h-12 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-slate-400 dark:text-slate-500">
                <Package className="w-6 h-6 stroke-[1.5]" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-bold text-brand dark:text-blue-400 uppercase tracking-wider block truncate">
                {product.category || 'Umumiy'}
              </span>
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm truncate leading-snug">
                {product.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                Mavjud: <strong className="text-slate-800 dark:text-slate-200">{formatSum(currentStock)} {product.unit}</strong>
              </p>
            </div>
          </div>

          {/* Stock Calculation Preview */}
          <div className="grid grid-cols-2 gap-2.5 p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/70 text-center">
            <div className="border-r border-emerald-200/80 dark:border-emerald-800 pr-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block">
                Hozirgi qoldiq
              </span>
              <span className="text-base sm:text-lg font-black font-mono text-emerald-900 dark:text-emerald-200">
                {formatSum(currentStock)} <span className="text-xs font-sans font-bold text-emerald-700 dark:text-emerald-400">{product.unit}</span>
              </span>
            </div>
            <div className="pl-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block">
                Kirimdan so'ng
              </span>
              <span className="text-base sm:text-lg font-black font-mono text-emerald-700 dark:text-emerald-400">
                {formatSum(newStock)} <span className="text-xs font-sans font-bold text-emerald-600 dark:text-emerald-300">{product.unit}</span>
              </span>
            </div>
          </div>

          {/* Quantity Input Field */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="stock-in-amount" className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Kirim miqdori:
            </label>
            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 border-2 border-emerald-400 focus-within:border-emerald-600 focus-within:bg-white dark:focus-within:bg-slate-850 focus-within:ring-2 focus-within:ring-emerald-500/20 rounded-2xl px-4 py-2.5 transition-all shadow-inner">
              <FormattedNumberInput
                id="stock-in-amount"
                ref={inputRef}
                value={amountStr}
                onChangeValue={(val) => {
                  setAmountStr(val);
                  setError(null);
                }}
                placeholder="0"
                className="w-full text-2xl sm:text-3xl font-mono font-black text-slate-900 dark:text-white bg-transparent focus:outline-none tracking-wider"
              />
              <span className="text-sm font-bold text-slate-500 dark:text-slate-400 font-sans ml-2 shrink-0 select-none">
                {product.unit}
              </span>
            </div>
          </div>

          {/* Quick Presets for fast quantity entry */}
          <div className="grid grid-cols-4 gap-2">
            {[5, 10, 50, 100].map(preset => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setAmountStr(preset.toString());
                  setError(null);
                  if (inputRef.current) inputRef.current.focus();
                }}
                className="py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-800 dark:hover:text-emerald-300 hover:border-emerald-200 dark:hover:border-emerald-700 border border-slate-200/80 dark:border-slate-700 font-black text-xs text-slate-700 dark:text-slate-200 active:scale-95 transition-all cursor-pointer select-none"
              >
                +{preset}
              </button>
            ))}
          </div>

          {error && (
            <div className="flex items-center gap-1.5 text-rose-600 bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-xl text-xs font-semibold shrink-0 border border-rose-200 dark:border-rose-900">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl active:scale-95 transition-all text-sm cursor-pointer"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              className="flex-[2] py-3 px-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold rounded-2xl active:scale-95 transition-all shadow-md shadow-emerald-600/25 text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4 stroke-[3]" />
              <span>Kirimni tasdiqlash</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
