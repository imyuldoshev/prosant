import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption<T = string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  badge?: string;
}

interface CustomSelectProps<T = string> {
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
  buttonClassName?: string;
  dropdownClassName?: string;
  id?: string;
  ariaLabel?: string;
  disabled?: boolean;
}

export function CustomSelect<T = string>({
  value,
  onChange,
  options,
  placeholder = 'Tanlang...',
  icon,
  className = '',
  buttonClassName = '',
  dropdownClassName = '',
  id,
  ariaLabel,
  disabled = false,
}: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Handle keyboard events (Escape to close)
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  }, []);

  const handleSelect = (optionValue: T) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div 
      ref={containerRef} 
      className={`relative ${className}`}
      onKeyDown={handleKeyDown}
    >
      {/* Trigger Button */}
      <button
        type="button"
        id={id}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel || placeholder}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(prev => !prev)}
        className={`w-full min-h-[44px] px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100/90 dark:hover:bg-slate-750 active:scale-[0.99] border border-slate-200/90 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 rounded-2xl flex items-center justify-between gap-2.5 text-left transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand ${
          isOpen ? 'ring-2 ring-brand/40 border-brand bg-white dark:bg-slate-800 shadow-sm' : ''
        } ${disabled ? 'opacity-60 cursor-not-allowed' : ''} ${buttonClassName}`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {icon && <span className="text-slate-400 dark:text-slate-500 shrink-0">{icon}</span>}
          {selectedOption?.icon && (
            <span className="shrink-0">{selectedOption.icon}</span>
          )}
          <span className={`text-xs sm:text-sm font-bold truncate ${
            selectedOption ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500 font-medium'
          }`}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.badge && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-300 shrink-0">
              {selectedOption.badge}
            </span>
          )}
        </div>

        <ChevronDown 
          className={`w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-brand dark:text-blue-400' : ''
          }`} 
        />
      </button>

      {/* Modern Floating Dropdown Menu */}
      {isOpen && (
        <div 
          role="listbox"
          tabIndex={-1}
          className={`absolute left-0 right-0 sm:right-auto sm:min-w-full max-w-[calc(100vw-24px)] z-50 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xl shadow-slate-900/10 dark:shadow-black/50 p-1.5 animate-in fade-in zoom-in-95 duration-150 max-h-64 overflow-y-auto ${dropdownClassName}`}
        >
          {options.map((opt, idx) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={idx}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => handleSelect(opt.value)}
                className={`w-full px-3 py-2.5 rounded-xl text-left flex items-center justify-between gap-2.5 transition-all text-xs sm:text-sm cursor-pointer select-none ${
                  isSelected
                    ? 'bg-brand/10 dark:bg-blue-900/30 text-brand dark:text-blue-400 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/90 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white font-semibold'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                  <span className="truncate">{opt.label}</span>
                  {opt.badge && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-300 shrink-0">
                      {opt.badge}
                    </span>
                  )}
                </div>
                {isSelected && (
                  <Check className="w-4 h-4 text-brand dark:text-blue-400 stroke-[3] shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
