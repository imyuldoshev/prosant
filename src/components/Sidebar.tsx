import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Package, History, X, LogIn, LogOut } from 'lucide-react';
import { MenuButton } from './MenuButton';
import { useAuth } from '../context/AuthContext';
import logoMobile from '../assets/logo/logo-mobile.webp';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, isAuthenticated, signOut } = useAuth();
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
            <img src={logoMobile} alt="ProSant" width={40} height={40} decoding="async" className="w-10 h-10 rounded-xl object-contain shadow-md" />
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

        {/* Bottom Auth Section */}
        <div className="p-4 border-t border-white/10 bg-slate-950/40">
          {isAuthenticated ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2.5 px-3 py-2 bg-white/5 border border-white/10 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-black uppercase shrink-0 shadow-xs">
                  {(user?.profile?.full_name || user?.email || 'U')[0]}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-white truncate">
                    {user?.profile?.full_name || user?.email?.split('@')[0]}
                  </span>
                  <span className="text-[10px] text-slate-400 capitalize font-medium">
                    {user?.profile?.role === 'admin' ? 'Administrator' : 'Kassir'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  signOut();
                  onClose();
                }}
                className="w-full h-11 flex items-center justify-center gap-2 px-4 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs sm:text-sm font-bold transition-all active:scale-95 cursor-pointer shadow-xs select-none"
              >
                <LogOut className="w-4 h-4 stroke-[2.2]" />
                <span>Tizimdan chiqish</span>
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              onClick={onClose}
              className="w-full h-11 flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm active:scale-98 cursor-pointer select-none"
            >
              <LogIn className="w-4 h-4 stroke-[2.2]" />
              <span>Tizimga kirish</span>
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
