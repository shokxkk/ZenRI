'use client';

import React from 'react';
import { ZenLogo } from '@/components/ui/ZenLogo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { VoiceAssistant } from '@/components/ui/VoiceAssistant';
import { useSession } from 'next-auth/react';
import { User as UserIcon, Plus } from 'lucide-react';

interface HeaderProps {
  onOpenQuickAdd: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenQuickAdd }) => {
  const { data: session } = useSession();

  return (
    <header className="h-[calc(4.5rem+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] px-4 md:px-6 bg-white/90 dark:bg-[#0A0F1D]/90 apple-glass border-b border-zen-200 dark:border-zen-800/80 flex items-center justify-between sticky top-0 z-20 transition-colors gap-3">

      {/* Left — Logo / Greeting */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Mobile logo */}
        <div className="md:hidden">
          <ZenLogo size="sm" />
        </div>
        {/* Desktop greeting */}
        <span className="hidden md:block text-sm font-bold text-zen-900 dark:text-zen-100 whitespace-nowrap">
          Доброе утро, {session?.user?.name?.split(' ')[0] || 'Пользователь'}! 👋
        </span>
      </div>

      {/* CENTER — Voice Assistant (prominent, always visible) */}
      <div className="flex-1 flex items-center justify-center">
        <VoiceAssistant size="lg" />
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 flex-shrink-0">

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Round Blue Plus Button */}
        <button
          onClick={onOpenQuickAdd}
          className="w-9 h-9 rounded-full bg-[#0066FF] hover:bg-[#0052CC] text-white flex items-center justify-center shadow-glow transition-transform active:scale-95 flex-shrink-0"
          title="Быстрое действие"
        >
          <Plus size={20} strokeWidth={2.5} />
        </button>

        {/* User Avatar — links to settings */}
        <a href="/settings" title="Настройки профиля">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#0055FF] to-[#00C2FF] p-0.5 flex-shrink-0 cursor-pointer shadow-sm hover:scale-110 transition-transform">
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
        </a>
      </div>

    </header>
  );
};
