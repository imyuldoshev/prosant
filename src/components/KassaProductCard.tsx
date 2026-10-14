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

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=260&q=65&auto=format&fit=crop';

export const KassaProductCard = memo(function KassaProductCard({
  product,
  isSelected,
  onSelect,
  onQuickAdd,
}: KassaProductCardProps) {
  const stockNum = Number(product.stock) || 0;
  const isCriticalStock = stockNum <= 5;
  const isLowStock = stockNum > 5 && stockNum <= 15;

  return (
    <div
      onClick={() => onSelect(product)}
      className={`group relative flex flex-col rounded-2xl border text-left cursor-pointer transition-all duration-150 select-none bg-white ${
        isSelected 
          ? 'border-brand shadow-md ring-2 ring-brand/30 scale-[0.98]' 
          : 'border-slate-200/90 hover:border-brand/40 hover:shadow-md'
      }`}
    >
      {/* Product Image Area */}
      <div className="relative h-28 sm:h-32 md:h-36 w-full bg-slate-100 overflow-hidden rounded-t-2xl shrink-0">
        <img 
          src={product.image || FALLBACK_IMAGE} 
          alt={product.name}
          width={260}
          height={144}
          loading="lazy"
          decoding="async"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = FALLBACK_IMAGE;
          }}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
        />
        
        {/* Quick Add Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onQuickAdd(product);
          }}
          aria-label={`${product.name} ni bitta qo'shish`}
          title="1 ta qo'shish"
          className="absolute top-2 right-2 w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/95 backdrop-blur-md shadow-sm flex items-center justify-center text-brand font-black transition-all hover:scale-105 hover:bg-brand hover:text-white active:scale-90 cursor-pointer min-w-[36px] min-h-[36px]"
        >
          <Plus className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
        </button>

        {/* Stock Badge with Status Indicator */}
        <div className={`absolute bottom-2 left-2 text-[11px] font-bold px-2 py-0.5 rounded-lg backdrop-blur-md flex items-center gap-1.5 shadow-xs ${
          isCriticalStock
            ? 'bg-rose-950/80 text-rose-200 border border-rose-500/30' 
            : isLowStock
            ? 'bg-amber-950/80 text-amber-200 border border-amber-500/30'
            : 'bg-slate-900/80 text-white border border-white/10'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${
            isCriticalStock
              ? 'bg-rose-400 animate-pulse' 
              : isLowStock 
              ? 'bg-amber-400' 
              : 'bg-emerald-400'
          }`} />
          <span>{stockNum} {product.unit}</span>
        </div>
      </div>

      {/* Product Info Area */}
      <div className="p-3 sm:p-3.5 flex flex-col justify-between grow gap-2 rounded-b-2xl">
        <div>
          <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400 block mb-0.5 truncate">
            {product.category}
          </span>
          <h3 
            className="font-bold text-slate-800 text-xs sm:text-sm leading-tight line-clamp-2 group-hover:text-brand transition-colors"
            title={product.name}
          >
            {product.name}
          </h3>
        </div>

        <div className="pt-1.5 mt-auto border-t border-slate-100 flex items-baseline justify-between gap-1">
          <div className="text-brand font-black text-sm sm:text-base tracking-tight">
            {formatSum(product.price)} <span className="text-[11px] font-bold text-slate-500">UZS</span>
          </div>
          <span className="text-[11px] font-semibold text-slate-400">
            /{product.unit}
          </span>
        </div>
      </div>
    </div>
  );
});
