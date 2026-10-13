import { Sparkles, X, RefreshCw } from 'lucide-react';
import { useUpdate } from '../context/UpdateContext';

/**
 * UpdateIndicator displays a small, non-intrusive notification when a new version
 * is detected in the background. It explains that the update will be applied automatically
 * once the user finishes their current work, and provides an optional manual "Update now" button.
 */
export function UpdateIndicator() {
  const {
    hasPendingUpdate,
    indicatorDismissed,
    showIndicator,
    isBusy,
    applyNow,
    dismissIndicator,
  } = useUpdate();

  if (!showIndicator || !hasPendingUpdate || indicatorDismissed) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 max-w-sm bg-slate-900/95 backdrop-blur-md text-white border border-slate-700/80 rounded-2xl shadow-2xl p-3.5 sm:p-4 animate-in fade-in slide-in-from-bottom-4 duration-300 pointer-events-auto"
    >
      <div className="flex items-start gap-3">
        {/* Glowing badge icon */}
        <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0 mt-0.5 relative">
          <Sparkles className="w-5 h-5 text-blue-400" />
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500" />
          </span>
        </div>

        {/* Informational Text */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-sm tracking-tight text-white">
              Yangi versiya tayyor
            </span>
            <span className="px-1.5 py-0.2 bg-blue-500/20 text-blue-300 text-[10px] font-bold rounded-md">
              v-update
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-0.5 leading-snug">
            {isBusy ? (
              <span>Ishingiz tugagach avtomatik yangilanadi. Hozirgi ma'lumotlaringiz saqlanadi.</span>
            ) : (
              <span>Boshqa sahifaga o'tganingizda yangi versiya avtomatik qo'llanadi.</span>
            )}
          </p>

          {/* Action Row */}
          <div className="flex items-center gap-2 mt-2.5">
            <button
              type="button"
              onClick={applyNow}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Ilovani hozir yangilash"
            >
              <RefreshCw className="hidden sm:inline-block w-3.5 h-3.5" />
              <span>Hozir yangilash</span>
            </button>
            <button
              type="button"
              onClick={dismissIndicator}
              className="px-2.5 py-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Yopish
            </button>
          </div>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={dismissIndicator}
          className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors shrink-0"
          aria-label="Bildirishnomani yopish"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
