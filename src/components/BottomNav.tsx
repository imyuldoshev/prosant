import { LayoutDashboard, Package, History } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export function BottomNav() {
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

  return (
    <nav className="md:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/90 dark:border-slate-800 shrink-0 flex items-center z-30 shadow-lg px-2 pt-1 pb-[max(0.6rem,env(safe-area-inset-bottom,0px))] min-h-[calc(3.85rem+env(safe-area-inset-bottom,0px))]">
      {navItems.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className={`flex-1 flex flex-col items-center justify-center gap-1 py-1 transition-all active:scale-95 min-h-[44px] ${
            item.active
              ? 'text-brand font-black'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-semibold'
          }`}
        >
          <div className={`p-1 rounded-xl transition-all ${item.active ? 'bg-brand/10 text-brand' : ''}`}>
            {item.icon}
          </div>
          <span className="text-xs leading-none">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
