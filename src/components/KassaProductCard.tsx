import { memo } from 'react';
import { Plus } from 'lucide-react';
import type { Product } from '../types';
import { formatSum } from '../utils/format';

interface KassaProductCardProps {
  product: Product;
  isSelected: boolean;
  onSelect: (product: Product) => void;
  onQuickAdd: (product: Product) => void;
}

export const KassaProductCard = memo(function KassaProductCard({
  product,
  isSelected,
  onQuickAdd,
}: KassaProductCardProps) {
  const stockNum = Number(product.stock) || 0;
  const isOutOfStock = stockNum <= 0;
  const isCriticalStock = stockNum > 0 && stockNum <= 5;
  const hasImage = Boolean(product.image && product.image.trim() !== '');

  // Qoldiq rangi va holati (0 bo'lsa qizil, <= 5 bo'lsa sariq, aks holda yashil)
  const stockColorClass = isOutOfStock
    ? 'text-rose-600 dark:text-rose-400'
    : isCriticalStock
    ? 'text-amber-600 dark:text-amber-400'
    : 'text-emerald-600 dark:text-emerald-400';

  const dotColorClass = isOutOfStock
    ? 'bg-rose-500'
    : isCriticalStock
    ? 'bg-amber-400 animate-pulse'
    : 'bg-emerald-500';

  return (
    <div
      role="button"
      tabIndex={isOutOfStock ? -1 : 0}
      onClick={() => {
        if (!isOutOfStock) {
          onQuickAdd(product);
        }
      }}
      onKeyDown={(e) => {
        if (!isOutOfStock && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onQuickAdd(product);
        }
      }}
      className={`group relative flex flex-col justify-between rounded-2xl border text-left transition-all duration-150 select-none bg-white dark:bg-slate-900 border-slate-200/90 dark:border-white/[0.08] ${
        isOutOfStock
          ? 'opacity-70 cursor-not-allowed'
          : isSelected
          ? 'border-brand ring-2 ring-brand/30 shadow-md cursor-pointer'
          : 'hover:border-brand/50 dark:hover:border-blue-500/50 hover:shadow-md cursor-pointer active:scale-[0.98]'
      }`}
    >
      {/* 1. AGAR RASM BOR BO'LSA — RASM BLOKI */}
      {hasImage ? (
        <div className="relative h-28 sm:h-32 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden rounded-t-2xl shrink-0 flex items-center justify-center">
          <img
            src={product.image}
            alt={product.name}
            width={260}
            height={130}
            loading="lazy"
            decoding="async"
            className={`absolute inset-0 w-full h-full object-cover transition-transform duration-300 ${
              isOutOfStock ? 'grayscale-[40%]' : 'group-hover:scale-105'
            }`}
          />

          {/* Quick Add Button 40x40px */}
          <button
            type="button"
            disabled={isOutOfStock}
            onClick={(e) => {
              e.stopPropagation();
              if (!isOutOfStock) {
                onQuickAdd(product);
              }
            }}
            aria-label={isOutOfStock ? `${product.name} qolmagan` : `${product.name} ni savatchaga qo'shish`}
            title={isOutOfStock ? `Mahsulot qolmagan (0 ${product.unit})` : "Savatchaga qo'shish"}
            className={`absolute top-2 right-2 w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl flex items-center justify-center font-black transition-all shadow-md active:scale-90 ${
              isOutOfStock
                ? 'bg-slate-100/90 dark:bg-slate-800/90 text-slate-400 cursor-not-allowed'
                : 'bg-brand hover:bg-brand/90 text-white dark:bg-blue-600 dark:hover:bg-blue-500 cursor-pointer'
            }`}
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
            {isOutOfStock && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 40 40" fill="none">
                <line x1="6" y1="34" x2="34" y2="6" stroke="#ef4444" strokeWidth="3.5" strokeLinecap="round" />
              </svg>
            )}
          </button>
        </div>
      ) : null}

      {/* 2. MAHSULOT MA'LUMOTLARI */}
      <div className={`p-3 sm:p-3.5 flex flex-col justify-between grow gap-2.5 ${!hasImage ? 'rounded-2xl' : 'rounded-b-2xl'}`}>
        <div>
          {/* Top row if no image: Category + Quick Add Button (40x40px) */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-400 dark:text-slate-500 truncate block">
              {product.category && product.category.trim() !== '' ? product.category : 'Kategoriyasiz'}
            </span>

            {/* If no image, + button sits neatly in the top right */}
            {!hasImage && (
              <button
                type="button"
                disabled={isOutOfStock}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isOutOfStock) {
                    onQuickAdd(product);
                  }
                }}
                aria-label={isOutOfStock ? `${product.name} qolmagan` : `${product.name} ni savatchaga qo'shish`}
                title={isOutOfStock ? `Mahsulot qolmagan (0 ${product.unit})` : "Savatchaga qo'shish"}
                className={`w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl flex items-center justify-center font-black transition-all shrink-0 active:scale-90 ${
                  isOutOfStock
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                    : 'bg-brand hover:bg-brand/90 text-white dark:bg-blue-600 dark:hover:bg-blue-500 cursor-pointer shadow-sm'
                }`}
              >
                <Plus className="w-5 h-5 stroke-[2.5]" />
                {isOutOfStock && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 40 40" fill="none">
                    <line x1="6" y1="34" x2="34" y2="6" stroke="#ef4444" strokeWidth="3.5" strokeLinecap="round" />
                  </svg>
                )}
              </button>
            )}
          </div>

          {/* Product Name */}
          <h3
            className={`font-bold text-xs sm:text-sm leading-snug line-clamp-2 transition-colors ${
              isOutOfStock
                ? 'text-slate-400 dark:text-slate-500'
                : 'text-slate-800 dark:text-slate-100 group-hover:text-brand dark:group-hover:text-blue-400'
            }`}
            title={product.name}
          >
            {product.name}
          </h3>
        </div>

        {/* Bottom row: Price & Stock indicator */}
        <div className="pt-2 mt-auto border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1.5">
          {/* Price */}
          <div className={`font-black text-sm sm:text-base tracking-tight ${
            isOutOfStock ? 'text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'
          }`}>
            {formatSum(product.price)} <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">UZS</span>
          </div>

          {/* Qoldiq belgisi (13-14px shrift, rangli nuqta) */}
          <div className={`inline-flex items-center gap-1.5 text-[13px] sm:text-sm font-bold ${stockColorClass}`}>
            <span className={`w-2 h-2 rounded-full shrink-0 ${dotColorClass}`} />
            <span>
              {stockNum} {product.unit} {isOutOfStock ? '(Tugagan)' : ''}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});
