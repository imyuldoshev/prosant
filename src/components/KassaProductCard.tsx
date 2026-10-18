import { memo } from 'react';
import { Plus, Package } from 'lucide-react';
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
  onSelect,
  onQuickAdd,
}: KassaProductCardProps) {
  const stockNum = Number(product.stock) || 0;
  const isOutOfStock = stockNum <= 0;
  const isCriticalStock = stockNum > 0 && stockNum <= 5;
  const isLowStock = stockNum > 5 && stockNum <= 15;

  return (
    <div
      onClick={() => {
        if (!isOutOfStock) {
          onSelect(product);
        }
      }}
      className={`group relative flex flex-col rounded-2xl border text-left transition-all duration-150 select-none bg-white dark:bg-slate-900 ${
        isOutOfStock
          ? 'opacity-80 border-slate-200 dark:border-slate-800 cursor-not-allowed'
          : isSelected 
          ? 'border-brand shadow-md ring-2 ring-brand/30 scale-[0.98] cursor-pointer' 
          : 'border-slate-200/90 dark:border-slate-800 hover:border-brand/40 dark:hover:border-brand/50 hover:shadow-md cursor-pointer'
      }`}
    >
      {/* Product Image Area */}
      <div className="relative h-28 sm:h-32 md:h-36 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden rounded-t-2xl shrink-0 flex items-center justify-center">
        {product.image && product.image.trim() !== '' ? (
          <img 
            src={product.image} 
            alt={product.name}
            width={260}
            height={144}
            loading="lazy"
            decoding="async"
            className={`absolute inset-0 w-full h-full object-cover transition-transform duration-300 ${
              isOutOfStock ? 'grayscale-[30%]' : 'group-hover:scale-105'
            }`} 
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-slate-300 dark:text-slate-600 bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 select-none">
            <Package className="w-9 h-9 stroke-[1.5]" />
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">Rasm yo'q</span>
          </div>
        )}
        
        {/* Quick Add Button */}
        <button
          type="button"
          disabled={isOutOfStock}
          onClick={(e) => {
            e.stopPropagation();
            if (!isOutOfStock) {
              onQuickAdd(product);
            }
          }}
          aria-label={isOutOfStock ? `${product.name} qolmagan` : `${product.name} ni bitta qo'shish`}
          title={isOutOfStock ? `Mahsulot qolmagan (0 ${product.unit})` : "1 ta qo'shish"}
          className={`absolute top-2 right-2 w-9 h-9 sm:w-10 sm:h-10 rounded-xl backdrop-blur-md shadow-xs flex items-center justify-center font-black transition-all min-w-[36px] min-h-[36px] ${
            isOutOfStock
              ? 'bg-slate-100/95 dark:bg-slate-800/95 text-slate-300 dark:text-slate-600 cursor-not-allowed'
              : 'bg-white/95 dark:bg-slate-800/95 text-brand dark:text-blue-400 hover:scale-105 hover:bg-brand hover:text-white dark:hover:bg-brand active:scale-90 cursor-pointer shadow-sm'
          }`}
        >
          <Plus className="w-5 h-5 sm:w-5.5 sm:h-5.5" />

          {/* Qizil chiziq: chap pastki burchakdan o'ng yuqori burchakka */}
          {isOutOfStock && (
            <svg 
              className="absolute inset-0 w-full h-full pointer-events-none" 
              viewBox="0 0 40 40" 
              fill="none"
            >
              <line 
                x1="6" 
                y1="34" 
                x2="34" 
                y2="6" 
                stroke="#ef4444" 
                strokeWidth="3.5" 
                strokeLinecap="round" 
              />
            </svg>
          )}
        </button>

        {/* Stock Badge with Status Indicator */}
        <div className={`absolute bottom-2 left-2 text-[11px] font-bold px-2 py-0.5 rounded-lg backdrop-blur-md flex items-center gap-1.5 shadow-xs ${
          isOutOfStock
            ? 'bg-rose-950/90 text-rose-300 border border-rose-500/40'
            : isCriticalStock
            ? 'bg-rose-950/80 text-rose-200 border border-rose-500/30' 
            : isLowStock
            ? 'bg-amber-950/80 text-amber-200 border border-amber-500/30'
            : 'bg-slate-900/80 text-white border border-white/10'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${
            isOutOfStock
              ? 'bg-rose-500'
              : isCriticalStock
              ? 'bg-rose-400 animate-pulse' 
              : isLowStock 
              ? 'bg-amber-400' 
              : 'bg-emerald-400'
          }`} />
          <span>{stockNum} {product.unit} {isOutOfStock ? '(Tugagan)' : ''}</span>
        </div>
      </div>

      {/* Product Info Area */}
      <div className="p-3 sm:p-3.5 flex flex-col justify-between grow gap-2 rounded-b-2xl">
        <div>
          <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400 block mb-0.5 truncate">
            {product.category}
          </span>
          <h3 
            className={`font-bold text-xs sm:text-sm leading-tight line-clamp-2 transition-colors ${
              isOutOfStock 
                ? 'text-slate-500 dark:text-slate-400' 
                : 'text-slate-800 dark:text-slate-100 group-hover:text-brand dark:group-hover:text-blue-400'
            }`}
            title={product.name}
          >
            {product.name}
          </h3>
        </div>

        <div className="pt-1.5 mt-auto border-t border-slate-100 dark:border-slate-800 flex items-baseline justify-between gap-1">
          <div className={`font-black text-sm sm:text-base tracking-tight ${
            isOutOfStock ? 'text-slate-400 dark:text-slate-500' : 'text-brand dark:text-blue-400'
          }`}>
            {formatSum(product.price)} <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">UZS</span>
          </div>
          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
            /{product.unit}
          </span>
        </div>
      </div>
    </div>
  );
});
