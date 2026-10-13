import { Menu, LayoutDashboard, Package, History } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import logoWeb from '../assets/logo/logo-web.jpg';
import logoMobile from '../assets/logo/logo-mobile.jpg';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const location = useLocation();

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
    <header className="bg-white text-slate-800 border-b border-slate-200/80 px-3 sm:px-6 flex items-center justify-between z-30 h-16 shrink-0 shadow-xs">
      {/* LEFT AREA: Web Logo (Desktop) / Mobile Icon + Desktop Navigation */}
      <div className="flex items-center gap-3 sm:gap-6 min-w-0">
        {/* Hamburger Menu button: ONLY visible on mobile (<md) */}
        <button 
          onClick={onMenuClick} 
          className="md:hidden p-2 bg-slate-100 hover:bg-slate-200 active:scale-95 rounded-xl transition-all text-slate-700 cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center shrink-0"
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
            className="w-8 h-8 rounded-lg object-contain shadow-xs border border-slate-100 group-hover:scale-105 transition-transform shrink-0" 
          />
          <span className="text-lg font-black text-slate-900 tracking-tight">
            Pro<span className="text-brand">Sant</span>
          </span>
        </Link>

        {/* Desktop Divider */}
        <div className="hidden md:block h-6 w-px bg-slate-200 shrink-0" />

        {/* 3 Main Pages in Header Row */}
        <nav className="hidden md:flex items-center gap-1.5 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80 shrink-0">
          {navItems.map(item => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg font-bold text-sm transition-all cursor-pointer ${
                item.active
                  ? 'bg-brand text-white shadow-sm shadow-brand/30'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              }`}
            >
              <span className={item.active ? 'text-white' : 'text-slate-500'}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>

      {/* RIGHT AREA: Mobile Title & Status Indicator */}
      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        {/* Title for mobile */}
        <div className="md:hidden font-bold text-slate-800 text-sm truncate max-w-[140px]">
          {currentTitle}
        </div>

        {/* Pro Online Status Dot */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-xl text-xs font-bold shrink-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="hidden sm:inline">Online</span>
        </div>
      </div>
    </header>
  );
}
