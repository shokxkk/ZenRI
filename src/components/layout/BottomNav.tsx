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
  BookOpen,
  PieChart,
  HandCoins,
  Sparkles,
  BarChart3,
  Calculator,
  Settings,
  X,
} from 'lucide-react';
import { useLanguage } from '@/components/ui/LanguageProvider';

interface BottomNavProps {
  onOpenQuickAdd: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ onOpenQuickAdd }) => {
  const pathname = usePathname();
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const { t } = useLanguage();

  const allItems = [
    { href: '/dashboard', labelKey: 'nav_today' as const, icon: LayoutDashboard },
    { href: '/finances', labelKey: 'nav_finances' as const, icon: Wallet },
    { href: '/calculator', labelKey: 'nav_calculator' as const, icon: Calculator },
    { href: '/tasks', labelKey: 'nav_tasks' as const, icon: CheckSquare },
    { href: '/habits', labelKey: 'nav_habits' as const, icon: Repeat },
    { href: '/books', labelKey: 'nav_books' as const, icon: BookOpen },
    { href: '/budgets', labelKey: 'nav_budgets' as const, icon: PieChart },
    { href: '/debts', labelKey: 'nav_debts' as const, icon: HandCoins },
    { href: '/ai', labelKey: 'nav_ai' as const, icon: Sparkles },
    { href: '/analytics', labelKey: 'nav_analytics' as const, icon: BarChart3 },
    { href: '/settings', labelKey: 'nav_settings' as const, icon: Settings },
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
            className="bg-white dark:bg-[#131C2E] rounded-t-3xl p-5 border-t border-zen-200 dark:border-zen-800 shadow-2xl animate-in slide-in-from-bottom duration-200"
            style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* iOS Pill handle */}
            <div className="w-12 h-1.5 bg-zen-300 dark:bg-zen-700 rounded-full mx-auto mb-5" />

            <div className="flex items-center justify-between mb-4 pb-3 border-b border-zen-100 dark:border-zen-800/60">
              <span className="font-bold text-zen-900 dark:text-zen-100 text-sm">{t('nav_all_sections')}</span>
              <button
                onClick={() => setShowMoreMenu(false)}
                className="w-8 h-8 rounded-full text-zen-400 hover:text-zen-600 dark:hover:text-zen-200 bg-zen-100 dark:bg-zen-800 flex items-center justify-center"
              >
                <X size={16} />
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
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl transition-all min-h-[72px] ${
                      isActive
                        ? 'bg-[#0066FF] text-white font-bold shadow-glow scale-[1.03]'
                        : 'bg-zen-50 dark:bg-zen-900/60 text-zen-700 dark:text-zen-300 hover:bg-zen-100 dark:hover:bg-zen-800 active:scale-95'
                    }`}
                  >
                    <Icon size={22} className={isActive ? 'text-white' : 'text-zen-400'} />
                    <span className="text-[11px] mt-1.5 text-center font-semibold leading-tight">{t(item.labelKey)}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 5-item Mobile Bottom Navigation Bar with iPhone safe-area support */}
      <nav
        className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-[#0A0F1D]/90 apple-glass border-t border-zen-200 dark:border-zen-800/80 z-40 md:hidden flex items-center justify-around px-2"
        style={{
          height: 'calc(4rem + env(safe-area-inset-bottom))',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {/* 1. Сегодня */}
        <Link
          href="/dashboard"
          className={`flex flex-col items-center justify-center min-w-[52px] py-2 rounded-xl transition-colors active:scale-90 ${
            pathname === '/dashboard'
              ? 'text-[#0066FF] font-bold'
              : 'text-zen-400 hover:text-zen-900 dark:hover:text-zen-100'
          }`}
        >
          <LayoutDashboard size={22} />
          <span className="text-[10px] font-semibold mt-0.5">{t('nav_today')}</span>
        </Link>

        {/* 2. Финансы */}
        <Link
          href="/finances"
          className={`flex flex-col items-center justify-center min-w-[52px] py-2 rounded-xl transition-colors active:scale-90 ${
            pathname.startsWith('/finances')
              ? 'text-[#0066FF] font-bold'
              : 'text-zen-400 hover:text-zen-900 dark:hover:text-zen-100'
          }`}
        >
          <Wallet size={22} />
          <span className="text-[10px] font-semibold mt-0.5">{t('nav_finances')}</span>
        </Link>

        {/* 3. + Central Prominent Glowing Button */}
        <button
          onClick={onOpenQuickAdd}
          className="flex items-center justify-center w-14 h-14 rounded-full bg-[#0066FF] hover:bg-[#0052CC] text-white shadow-glow active:scale-90 transition-transform -mt-6 border-4 border-white dark:border-[#0A0F1D] flex-shrink-0"
          title={t('header_quick_add')}
        >
          <Plus size={26} strokeWidth={2.5} />
        </button>

        {/* 4. Задачи */}
        <Link
          href="/tasks"
          className={`flex flex-col items-center justify-center min-w-[52px] py-2 rounded-xl transition-colors active:scale-90 ${
            pathname.startsWith('/tasks')
              ? 'text-[#0066FF] font-bold'
              : 'text-zen-400 hover:text-zen-900 dark:hover:text-zen-100'
          }`}
        >
          <CheckSquare size={22} />
          <span className="text-[10px] font-semibold mt-0.5">{t('nav_tasks')}</span>
        </Link>

        {/* 5. Ещё */}
        <button
          onClick={() => setShowMoreMenu(true)}
          className={`flex flex-col items-center justify-center min-w-[52px] py-2 rounded-xl transition-colors active:scale-90 ${
            showMoreMenu
              ? 'text-[#0066FF] font-bold'
              : 'text-zen-400 hover:text-zen-900 dark:hover:text-zen-100'
          }`}
        >
          <MoreHorizontal size={22} />
          <span className="text-[10px] font-semibold mt-0.5">{t('nav_more')}</span>
        </button>
      </nav>
    </>
  );
};
