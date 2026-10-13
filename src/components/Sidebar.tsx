import { useEffect, useRef } from 'react';
import { LayoutDashboard, Package, History, X } from 'lucide-react';
import { MenuButton } from './MenuButton';
import logoMobile from '../assets/logo/logo-mobile.jpg';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement as HTMLElement | null;

    const sidebar = sidebarRef.current;
    if (sidebar) {
      const focusableElements = sidebar.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Tab' && sidebar) {
        const focusableElements = Array.from(
          sidebar.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
        );
        if (focusableElements.length === 0) return;

        const first = focusableElements[0];
        const last = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen, onClose]);

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 animate-in fade-in duration-200"
          onClick={onClose}
          role="presentation"
        />
      )}
      
      {/* Sidebar Content */}
      <div 
        ref={sidebarRef}
        role="dialog"
        aria-modal="true"
        aria-label="Asosiy menyu"
        aria-hidden={!isOpen}
        className={`fixed inset-y-0 left-0 bg-slate-900 text-white w-80 z-50 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 flex justify-between items-center border-b border-white/10 h-[72px]">
          <div className="flex items-center gap-3">
            <img src={logoMobile} alt="ProSant" className="w-10 h-10 rounded-xl object-contain shadow-md" />
            <h2 className="text-2xl font-bold tracking-wider">ProSant</h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors active:scale-95"
            aria-label="Menyuni yopish"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="flex-1 p-6 flex flex-col gap-4">
          <MenuButton 
            icon={<LayoutDashboard className="w-7 h-7" />} 
            label="Kassa (POS)" 
            to="/" 
            onClick={onClose} 
          />
          <MenuButton 
            icon={<Package className="w-7 h-7" />} 
            label="Tovarlar" 
            to="/tovarlar" 
            onClick={onClose} 
          />
          <MenuButton 
            icon={<History className="w-7 h-7" />} 
            label="Tarix (Hisobot)" 
            to="/tarix" 
            onClick={onClose} 
          />
        </div>
      </div>
    </>
  );
}
