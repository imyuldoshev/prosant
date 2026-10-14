import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { UpdateIndicator } from './UpdateIndicator';

export function Layout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden font-sans transition-colors duration-200">
      <Sidebar isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
      
      <Header onMenuClick={() => setIsMenuOpen(true)} />
      
      <main className="flex-1 min-h-0 relative overflow-hidden flex flex-col">
        <Outlet />
      </main>

      {/* Non-intrusive notification indicator for pending updates */}
      <UpdateIndicator />

      <BottomNav />
    </div>
  );
}
