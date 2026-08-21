'use client';

import React, { useState, useEffect } from 'react';
import { ZenLogo } from '@/components/ui/ZenLogo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { VoiceAssistant } from '@/components/ui/VoiceAssistant';
import { useSession } from 'next-auth/react';
import { User as UserIcon, Plus, Volume2, VolumeX } from 'lucide-react';
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
    <header className="h-[calc(4rem+env(safe-area-inset-top))] sm:h-[calc(4.5rem+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] px-2.5 sm:px-4 md:px-6 bg-white/90 dark:bg-[#0A0F1D]/90 apple-glass border-b border-zen-200 dark:border-zen-800/80 flex items-center justify-between sticky top-0 z-20 transition-colors gap-1.5 sm:gap-3">

      {/* Left — Logo / Greeting */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
        {/* Mobile logo */}
        <div className="md:hidden flex-shrink-0">
          <ZenLogo size="sm" hideTextOnMobile={true} />
        </div>
        {/* Desktop greeting */}
        <span className="hidden md:block text-sm font-bold text-zen-900 dark:text-zen-100 whitespace-nowrap">
          {getGreeting()}, {session?.user?.name?.split(' ')[0] || ''}! 👋
        </span>
      </div>

      {/* CENTER — Voice Assistant (prominent, responsive) */}
      <div className="flex-1 flex items-center justify-center min-w-0 px-0.5 sm:px-1">
        <VoiceAssistant size="lg" />
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">

        {/* Sound Mute Toggle — always visible and responsive */}
        <button
          onClick={handleToggleMute}
          className={`p-1.5 sm:p-2 rounded-xl transition-all active:scale-90 flex items-center justify-center flex-shrink-0 ${
            isMuted
              ? 'text-rose-500 bg-rose-500/15 border border-rose-500/30'
              : 'text-[#0066FF] hover:text-[#0052CC] bg-[#0066FF]/10 hover:bg-[#0066FF]/20 border border-[#0066FF]/25 dark:bg-[#0066FF]/15 dark:border-[#0066FF]/30'
          }`}
          title={isMuted ? 'Включить звук' : 'Выключить звук'}
          aria-label={isMuted ? 'Включить звук' : 'Выключить звук'}
        >
          {isMuted ? <VolumeX size={17} className="text-rose-500" /> : <Volume2 size={17} className="text-[#0066FF]" />}
        </button>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Round Blue Plus Button */}
        <button
          onClick={onOpenQuickAdd}
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#0066FF] hover:bg-[#0052CC] text-white flex items-center justify-center shadow-glow transition-transform active:scale-95 flex-shrink-0"
          title={t('header_quick_add')}
        >
          <Plus size={18} strokeWidth={2.5} />
        </button>

        {/* User Avatar — links to settings */}
        <a href="/settings" title={t('nav_settings')} className="flex-shrink-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-[#0055FF] to-[#00C2FF] p-0.5 flex-shrink-0 cursor-pointer shadow-sm hover:scale-110 transition-transform">
            {session?.user?.image ? (
              <img
                src={session.user.image}
                alt={session.user.name || 'avatar'}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-zen-900 flex items-center justify-center text-white font-bold text-[10px] sm:text-xs">
                {session?.user?.name ? (
                  session.user.name.charAt(0).toUpperCase()
                ) : (
                  <UserIcon size={14} />
                )}
              </div>
            )}
          </div>
        </a>
      </div>

    </header>
  );
};
