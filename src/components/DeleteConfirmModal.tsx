import { AlertTriangle, Trash2 } from 'lucide-react';
import type { Product } from '../types';

interface DeleteConfirmModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmModal({ product, isOpen, onClose, onConfirm }: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 my-auto max-h-[92dvh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-modal-title"
      >
        <div className="p-6 text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
            <AlertTriangle className="w-9 h-9" />
          </div>

          <h2 id="delete-modal-title" className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Mahsulotni o'chirish
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-2">
            Haqiqatan ham quyidagi mahsulotni ro'yxatdan o'chirmoqchimisiz?
          </p>

          <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 rounded-2xl w-full flex items-center gap-3 text-left">
            <img 
              src={product.image || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&q=80'} 
              alt={product.name}
              className="w-12 h-12 rounded-xl object-cover shrink-0" 
            />
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm truncate">{product.name}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Qoldiq: <span className="font-semibold text-slate-700 dark:text-slate-200">{product.stock} {product.unit}</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 w-full mt-6">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[48px] py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-2xl active:scale-95 transition-all"
            >
              Bekor qilish
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="min-h-[48px] py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl active:scale-95 transition-all shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2"
            >
              <Trash2 className="hidden sm:inline-block w-5 h-5" />
              <span>O'chirish</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
