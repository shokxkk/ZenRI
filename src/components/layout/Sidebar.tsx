'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Wallet,
  CheckSquare,
  Repeat,
  BookOpen,
  PieChart,
  HandCoins,
  Sparkles,
  BarChart3,
  Calculator,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User as UserIcon,
  Users,
} from 'lucide-react';
import { ZenLogo } from '@/components/ui/ZenLogo';
import { signOut, useSession } from 'next-auth/react';
import { useLanguage } from '@/components/ui/LanguageProvider';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { data: session } = useSession();
  const { t } = useLanguage();

  const navItems = [
    { href: '/dashboard', labelKey: 'nav_today' as const, icon: LayoutDashboard },
    { href: '/finances', labelKey: 'nav_finances' as const, icon: Wallet },
    { href: '/calculator', labelKey: 'nav_calculator' as const, icon: Calculator },
    { href: '/tasks', labelKey: 'nav_tasks' as const, icon: CheckSquare },
    { href: '/habits', labelKey: 'nav_habits' as const, icon: Repeat },
    { href: '/books', labelKey: 'nav_books' as const, icon: BookOpen },
    { href: '/debts', labelKey: 'nav_debts' as const, icon: HandCoins },
    { href: '/budgets', labelKey: 'nav_budgets' as const, icon: PieChart },
    { href: '/analytics', labelKey: 'nav_analytics' as const, icon: BarChart3 },
    { href: '/ai', labelKey: 'nav_ai' as const, icon: Sparkles },
    { href: '/settings', labelKey: 'nav_settings' as const, icon: Settings },
    { href: '/club', labelKey: 'nav_club' as const, icon: Users },
  ];

  return (
    <aside
      className={`hidden md:flex flex-col h-screen sticky top-0 bg-white/90 dark:bg-[#0A0F1D]/90 apple-glass border-r border-zen-200 dark:border-zen-800/80 transition-all duration-300 z-30 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Sidebar Header */}
      <div className="p-5 flex items-center justify-between border-b border-zen-100 dark:border-zen-800/60">
        {!collapsed && <ZenLogo size="md" />}
        {collapsed && <ZenLogo size="sm" />}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-xl text-zen-400 hover:text-zen-800 dark:hover:text-zen-200 hover:bg-zen-100 dark:hover:bg-[#131C2E] transition-colors"
          title={collapsed ? 'Развернуть' : 'Свернуть'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3.5 px-3.5 py-3 rounded-2xl font-bold text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-[#0066FF] !text-white shadow-glow scale-[1.02]'
                  : 'text-zen-600 dark:text-zen-400 hover:bg-zen-100 dark:hover:bg-[#131C2E] hover:text-[#0066FF] dark:hover:text-[#00C2FF] hover:translate-x-1'
              }`}
            >
              <Icon
                size={20}
                className={`transition-transform duration-200 group-hover:scale-110 ${
                  isActive ? '!text-white' : 'text-zen-400 group-hover:text-[#0066FF] dark:group-hover:text-[#00C2FF]'
                }`}
              />
              {!collapsed && <span className={isActive ? '!text-white' : ''}>{t(item.labelKey)}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User Profile Card */}
      <div className="p-3 border-t border-zen-100 dark:border-zen-800/60">
        <div
          className={`flex items-center justify-between p-2.5 rounded-2xl bg-zen-50 dark:bg-[#131C2E] border border-zen-200/60 dark:border-zen-800 transition-transform duration-200 hover:scale-[1.02] ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#0055FF] to-[#00C2FF] p-0.5 flex-shrink-0">
              {session?.user?.image ? (
                <img
                  src={session.user.image}
                  alt={session.user.name || 'avatar'}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-zen-900 flex items-center justify-center text-white font-bold text-xs">
                  {session?.user?.name ? (
                    session.user.name.charAt(0).toUpperCase()
                  ) : (
                    <UserIcon size={16} />
                  )}
                </div>
              )}
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-xs font-bold text-zen-900 dark:text-zen-100 truncate">
                  {session?.user?.name || 'Пользователь'}
                </p>
                <p className="text-[10px] text-zen-400">{t('settings_profile_label')}</p>
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="p-1.5 rounded-xl text-zen-400 hover:text-expense hover:bg-expense-light dark:hover:bg-expense-dark transition-colors"
              title={t('settings_logout')}
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
