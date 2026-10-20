import { useState } from 'react';
import { Menu, LayoutDashboard, Package, History, LogIn, LogOut, Send } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import { TelegramSettingsModal } from './TelegramSettingsModal';
import { telegramService } from '../services/telegramService';
import logoWeb from '../assets/logo/logo-web.webp';
import logoMobile from '../assets/logo/logo-mobile.webp';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated, signOut } = useAuth();

  const navItems = [
    {
      to: '/',
      label: 'Kassa',
      icon: <LayoutDashboard className="w-5 h-5" />,
      active: location.pathname === '/',
    },
    {
      to: '/tovarlar',
      label: 'Tovarlar',
      icon: <Package className="w-5 h-5" />,
      active: location.pathname === '/tovarlar',
    },
    {
      to: '/tarix',
      label: 'Tarix',
      icon: <History className="w-5 h-5" />,
      active: location.pathname === '/tarix',
    },
  ];

  const currentTitle = navItems.find(item => item.active)?.label || 'ProSant';

  return (
    <header className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-b border-slate-200/80 dark:border-slate-800 px-3 sm:px-6 flex items-center justify-between z-30 h-16 shrink-0 shadow-xs transition-colors duration-200">
      {/* LEFT AREA: Web Logo (Desktop) / Mobile Icon + Desktop Navigation */}
      <div className="flex items-center gap-3 sm:gap-6 min-w-0">
        {/* Hamburger Menu button: ONLY visible on mobile (<md) */}
        <button 
          onClick={onMenuClick} 
          className="md:hidden p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 rounded-xl transition-all text-slate-700 dark:text-slate-200 cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center shrink-0"
          aria-label="Menyuni ochish"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* 1. Desktop Logo: Yuqori chap tarafda 'for_web' rasmi */}
        <Link 
          to="/" 
          className="hidden md:flex items-center shrink-0 hover:opacity-90 active:scale-98 transition-all py-1"
          title="ProSant - Santexnika Mahsulotlari"
        >
          <img 
            src={logoWeb} 
            alt="ProSant - Santexnika Mahsulotlari" 
            width={200}
            height={40}
            decoding="async"
            fetchPriority="high"
            className="h-10 lg:h-11 w-auto max-w-[200px] lg:max-w-[240px] object-contain rounded-md" 
          />
        </Link>

        {/* 2. Mobile Logo: Yuqori chap tarafda 'for_mb' rasmi va nomi */}
        <Link 
          to="/" 
          className="flex md:hidden items-center gap-2 py-1 shrink-0 group"
          title="ProSant"
        >
          <img 
            src={logoMobile} 
            alt="ProSant" 
            width={32}
            height={32}
            decoding="async"
            fetchPriority="high"
            className="w-8 h-8 rounded-lg object-contain shadow-xs border border-slate-100 group-hover:scale-105 transition-transform shrink-0" 
          />
          <span className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
            Pro<span className="text-brand">Sant</span>
          </span>
        </Link>

        {/* Desktop Divider */}
        <div className="hidden md:block h-6 w-px bg-slate-200 dark:bg-slate-700 shrink-0" />

        {/* 3 Main Pages in Header Row */}
        <nav className="hidden md:flex items-center gap-1.5 bg-slate-100/90 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700 shrink-0">
          {navItems.map(item => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg font-bold text-sm transition-all cursor-pointer ${
                item.active
                  ? 'bg-brand text-white shadow-sm shadow-brand/30'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-700/60'
              }`}
            >
              <span className={item.active ? 'text-white' : 'text-slate-500 dark:text-slate-400'}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>

      {/* RIGHT AREA: Theme Toggle & Telegram & Auth */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Telegram Bot Button */}
        <button
          type="button"
          onClick={() => setIsTelegramModalOpen(true)}
          className="relative w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-all cursor-pointer border border-slate-200/60 dark:border-slate-700 shadow-xs"
          title="Telegram Bot sozlamalari (Sotuv cheklari)"
          aria-label="Telegram Bot sozlamalari"
        >
          <Send className="w-4 h-4 text-sky-500 -rotate-12 translate-x-0.5" />
          {telegramService.isConfigured() && (
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
          )}
        </button>

        {/* Theme Toggle Button */}
        <ThemeToggle />

        {/* Title for small tablet screens */}
        <div className="hidden sm:block md:hidden font-bold text-slate-800 dark:text-slate-200 text-xs sm:text-sm truncate max-w-[100px]">
          {currentTitle}
        </div>

        {/* Auth Action */}
        {isAuthenticated ? (
          <button
            onClick={() => signOut()}
            title="Tizimdan chiqish"
            className="h-10 px-3 sm:px-3.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 active:bg-rose-200/80 text-rose-600 dark:text-rose-400 border border-rose-200/90 dark:border-rose-900/60 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all active:scale-95 shadow-xs shrink-0 cursor-pointer select-none"
            aria-label="Tizimdan chiqish"
          >
            <LogOut className="w-4 h-4 shrink-0 stroke-[2.2]" />
            <span className="whitespace-nowrap">Chiqish</span>
          </button>
        ) : (
          <Link
            to="/login"
            className="h-10 px-3.5 sm:px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm shadow-blue-500/20 active:scale-95 transition-all shrink-0 cursor-pointer select-none"
          >
            <LogIn className="w-4 h-4 stroke-[2.2]" />
            <span className="whitespace-nowrap">Kirish</span>
          </Link>
        )}
      </div>

      <TelegramSettingsModal
        isOpen={isTelegramModalOpen}
        onClose={() => setIsTelegramModalOpen(false)}
      />
    </header>
  );
}
