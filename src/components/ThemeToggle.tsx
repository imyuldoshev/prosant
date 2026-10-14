import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className = '', showLabel = false }: ThemeToggleProps) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative inline-flex items-center justify-center gap-2 rounded-xl transition-all cursor-pointer select-none active:scale-95 ${
        showLabel
          ? 'px-3.5 py-2.5 font-bold text-xs sm:text-sm bg-white/5 hover:bg-white/10 text-white border border-white/10'
          : 'h-10 w-10 min-w-[40px] min-h-[40px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-amber-400 border border-slate-200/80 dark:border-slate-700 shadow-2xs'
      } ${className}`}
      title={isDark ? "Yorug' rejimga o'tish (Light mode)" : "Qorong'i rejimga o'tish (Dark mode)"}
      aria-label={isDark ? "Yorug' rejimga o'tish" : "Qorong'i rejimga o'tish"}
    >
      {isDark ? (
        <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 stroke-[2.2] animate-in zoom-in-75 duration-200" />
      ) : (
        <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700 dark:text-slate-300 stroke-[2.2] animate-in zoom-in-75 duration-200" />
      )}
      {showLabel && (
        <span>{isDark ? "Yorug' rejim" : "Qorong'i rejim"}</span>
      )}
    </button>
  );
}
