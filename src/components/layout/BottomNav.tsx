'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Wallet,
  CheckSquare,
  Plus,
  MoreHorizontal,
  Repeat,
  PieChart,
  HandCoins,
  Sparkles,
  BarChart3,
  Settings,
  X,
} from 'lucide-react';

interface BottomNavProps {
  onOpenQuickAdd: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ onOpenQuickAdd }) => {
  const pathname = usePathname();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const allItems = [
    { href: '/dashboard', label: 'Сегодня', icon: LayoutDashboard },
    { href: '/finances', label: 'Финансы', icon: Wallet },
    { href: '/tasks', label: 'Задачи', icon: CheckSquare },
    { href: '/habits', label: 'Привычки', icon: Repeat },
    { href: '/budgets', label: 'Бюджеты', icon: PieChart },
    { href: '/debts', label: 'Долги', icon: HandCoins },
    { href: '/ai', label: 'AI Ассистент', icon: Sparkles },
    { href: '/analytics', label: 'Аналитика', icon: BarChart3 },
    { href: '/settings', label: 'Настройки', icon: Settings },
  ];

  return (
    <>
      {/* Mobile More Drawer Overlay (iOS Bottom Sheet) */}
      {showMoreMenu && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 md:hidden flex flex-col justify-end"
          onClick={() => setShowMoreMenu(false)}
        >
          <div
            className="bg-white dark:bg-[#131C2E] rounded-t-3xl p-6 border-t border-zen-200 dark:border-zen-800 shadow-2xl animate-in slide-in-from-bottom duration-200 pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* iOS Pill handle */}
            <div className="w-12 h-1.5 bg-zen-300 dark:bg-zen-700 rounded-full mx-auto mb-4" />

            <div className="flex items-center justify-between mb-4 pb-2 border-b border-zen-100 dark:border-zen-800/60">
              <span className="font-bold text-zen-900 dark:text-zen-100 text-sm">Все разделы ZenRI</span>
              <button
                onClick={() => setShowMoreMenu(false)}
                className="p-2 rounded-full text-zen-400 hover:text-zen-600 dark:hover:text-zen-200 bg-zen-100 dark:bg-zen-800"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {allItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setShowMoreMenu(false)}
                    className={`flex flex-col items-center justify-center p-3.5 rounded-2xl transition-all ${
                      isActive
                        ? 'bg-[#0066FF] text-white font-bold shadow-glow scale-[1.03]'
                        : 'bg-zen-50 dark:bg-zen-900/60 text-zen-700 dark:text-zen-300 hover:bg-zen-100 dark:hover:bg-zen-800'
                    }`}
                  >
                    <Icon size={20} className={isActive ? 'text-white' : 'text-zen-400'} />
                    <span className="text-[11px] mt-1.5 text-center font-bold">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 5-item Mobile Bottom Navigation Bar with Safe Area inset for iPhone */}
      <nav className="fixed bottom-0 left-0 right-0 h-[calc(4rem+env(safe-area-inset-bottom))] pb-[env(safe-area-inset-bottom)] bg-white/90 dark:bg-[#0A0F1D]/90 apple-glass border-t border-zen-200 dark:border-zen-800/80 z-40 md:hidden flex items-center justify-around px-2">
        {/* 1. Сегодня */}
        <Link
          href="/dashboard"
          className={`flex flex-col items-center justify-center w-14 py-1 rounded-xl transition-colors ${
            pathname === '/dashboard'
              ? 'text-[#0066FF] font-bold'
              : 'text-zen-400 hover:text-zen-900 dark:hover:text-zen-100'
          }`}
        >
          <LayoutDashboard size={20} />
          <span className="text-[10px] font-semibold mt-0.5">Сегодня</span>
        </Link>

        {/* 2. Финансы */}
        <Link
          href="/finances"
          className={`flex flex-col items-center justify-center w-14 py-1 rounded-xl transition-colors ${
            pathname.startsWith('/finances')
              ? 'text-[#0066FF] font-bold'
              : 'text-zen-400 hover:text-zen-900 dark:hover:text-zen-100'
          }`}
        >
          <Wallet size={20} />
          <span className="text-[10px] font-semibold mt-0.5">Финансы</span>
        </Link>

        {/* 3. + Central Prominent Glowing Button */}
        <button
          onClick={onOpenQuickAdd}
          className="flex items-center justify-center w-12 h-12 rounded-full bg-[#0066FF] hover:bg-[#0052CC] text-white shadow-glow active:scale-90 transition-transform -mt-5 border-4 border-white dark:border-[#0A0F1D] flex-shrink-0"
          title="Быстрое действие"
        >
          <Plus size={24} strokeWidth={2.5} />
        </button>

        {/* 4. Задачи */}
        <Link
          href="/tasks"
          className={`flex flex-col items-center justify-center w-14 py-1 rounded-xl transition-colors ${
            pathname.startsWith('/tasks')
              ? 'text-[#0066FF] font-bold'
              : 'text-zen-400 hover:text-zen-900 dark:hover:text-zen-100'
          }`}
        >
          <CheckSquare size={20} />
          <span className="text-[10px] font-semibold mt-0.5">Задачи</span>
        </Link>

        {/* 5. Ещё */}
        <button
          onClick={() => setShowMoreMenu(true)}
          className={`flex flex-col items-center justify-center w-14 py-1 rounded-xl transition-colors ${
            showMoreMenu
              ? 'text-[#0066FF] font-bold'
              : 'text-zen-400 hover:text-zen-900 dark:hover:text-zen-100'
          }`}
        >
          <MoreHorizontal size={20} />
          <span className="text-[10px] font-semibold mt-0.5">Ещё</span>
        </button>
      </nav>
    </>
  );
};
