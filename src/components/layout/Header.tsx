'use client';

import React, { useState, useEffect } from 'react';
import { ZenLogo } from '@/components/ui/ZenLogo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { VoiceAssistant } from '@/components/ui/VoiceAssistant';
import { useSession } from 'next-auth/react';
import { User as UserIcon, Plus, Calculator, Volume2, VolumeX } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/components/ui/LanguageProvider';
import { soundFx } from '@/lib/soundEffects';

interface HeaderProps {
  onOpenQuickAdd: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenQuickAdd }) => {
  const { data: session } = useSession();
  const { t } = useLanguage();
  const [isMuted, setIsMuted] = useState(false);

  // Sync mute state from localStorage on mount
  useEffect(() => {
    setIsMuted(soundFx.getMuted());
  }, []);

  const handleToggleMute = () => {
    const newMuted = soundFx.toggleMute();
    setIsMuted(newMuted);
    // Если включили звук — проиграть маленький подтверждающий клик
    if (!newMuted) soundFx.playClick();
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return t('header_good_morning');
    if (h >= 12 && h < 17) return t('header_good_afternoon');
    if (h >= 17 && h < 22) return t('header_good_evening');
    return t('header_good_night');
  };

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
          {getGreeting()}, {session?.user?.name?.split(' ')[0] || ''}! 👋
        </span>
      </div>

      {/* CENTER — Voice Assistant (prominent, always visible) */}
      <div className="flex-1 flex items-center justify-center">
        <VoiceAssistant size="lg" />
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 flex-shrink-0">

        {/* Sound Mute Toggle */}
        <button
          onClick={handleToggleMute}
          className={`p-2 rounded-xl transition-all ${
            isMuted
              ? 'text-rose-400 bg-rose-500/10 hover:bg-rose-500/20'
              : 'text-zen-400 hover:text-zen-900 dark:hover:text-zen-100 bg-zen-100 dark:bg-zen-800/80 hover:bg-zen-200 dark:hover:bg-zen-700'
          }`}
          title={isMuted ? 'Включить звук' : 'Выключить звук'}
        >
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>

        {/* Currency & Calculator Quick Access */}
        <Link
          href="/calculator"
          className="p-2 rounded-xl text-zen-500 hover:text-[#0066FF] hover:bg-zen-100 dark:hover:bg-zen-800/80 transition-all flex items-center gap-1.5"
          title={t('nav_calculator')}
        >
          <Calculator size={18} />
          <span className="text-[10px] font-black uppercase text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-md hidden lg:inline">
            ЦБ РУз
          </span>
        </Link>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Round Blue Plus Button */}
        <button
          onClick={onOpenQuickAdd}
          className="w-9 h-9 rounded-full bg-[#0066FF] hover:bg-[#0052CC] text-white flex items-center justify-center shadow-glow transition-transform active:scale-95 flex-shrink-0"
          title={t('header_quick_add')}
        >
          <Plus size={20} strokeWidth={2.5} />
        </button>

        {/* User Avatar — links to settings */}
        <a href="/settings" title={t('nav_settings')}>
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
