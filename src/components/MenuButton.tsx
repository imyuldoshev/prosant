import { Link, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';

interface MenuButtonProps {
  icon: ReactNode;
  label: string;
  to: string;
  onClick?: () => void;
}

export function MenuButton({ icon, label, to, onClick }: MenuButtonProps) {
  const location = useLocation();
  const active = location.pathname === to;
  
  return (
    <Link 
      to={to}
      onClick={onClick}
      className={`flex items-center gap-5 p-5 rounded-2xl transition-all text-left w-full ${
        active 
          ? 'bg-brand text-white shadow-xl shadow-brand/20 scale-105' 
          : 'bg-white/5 hover:bg-white/10 text-slate-300'
      }`}
    >
      <div className={`${active ? 'text-white' : 'text-slate-400'}`}>{icon}</div>
      <span className="text-2xl font-semibold tracking-wide">{label}</span>
    </Link>
  );
}
