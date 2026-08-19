'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { useLanguage } from '@/components/ui/LanguageProvider';
import { soundFx } from '@/lib/soundEffects';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const { t } = useLanguage();

  // App open sound on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      soundFx.playAppOpen();
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const handleOpenQuickAdd = () => {
    soundFx.playModalOpen();
    setQuickAddOpen(true);
  };

  const handleCloseQuickAdd = () => {
    soundFx.playModalClose();
    setQuickAddOpen(false);
  };

  return (
    <div className="relative flex min-h-screen bg-zen-50 dark:bg-[#0A0F1D] text-zen-900 dark:text-zen-100 overflow-hidden">
      {/* Ambient Animated Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-60 dark:opacity-40">
        <div className="absolute -top-32 -left-32 w-[400px] h-[400px] md:w-[500px] md:h-[500px] rounded-full bg-gradient-to-br from-[#0066FF] to-[#00C2FF] blur-[120px] md:blur-[140px] animate-ambient-1" />
        <div className="absolute top-1/4 -right-32 w-[450px] h-[450px] md:w-[600px] md:h-[600px] rounded-full bg-gradient-to-br from-[#8B5CF6] via-[#0055FF] to-[#00C2FF] blur-[130px] md:blur-[160px] animate-ambient-2" />
        <div className="absolute -bottom-40 left-1/3 w-[400px] h-[400px] md:w-[550px] md:h-[550px] rounded-full bg-gradient-to-tr from-[#10B981] via-[#0066FF] to-[#00C2FF] blur-[120px] md:blur-[150px] animate-ambient-3" />
      </div>

      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div
        className="relative z-10 flex-1 flex flex-col min-w-0"
        style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}
      >
        <style jsx>{`
          @media (min-width: 768px) {
            .main-content-pad {
              padding-bottom: 1.5rem !important;
            }
          }
        `}</style>
        <div className="main-content-pad flex-1 flex flex-col">
          <Header onOpenQuickAdd={handleOpenQuickAdd} />
          <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">{children}</main>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav onOpenQuickAdd={handleOpenQuickAdd} />

      {/* Quick Add Modal */}
      {quickAddOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-end sm:items-center justify-center p-4"
          style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
          onClick={handleCloseQuickAdd}
        >
          <div
            className="bg-white dark:bg-[#131C2E] rounded-3xl p-6 w-full max-w-lg border border-zen-200 dark:border-zen-800 shadow-2xl animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-zen-900 dark:text-zen-100">{t('quick_add_title')}</h3>
              <button
                onClick={() => {
                soundFx.playClick();
                handleCloseQuickAdd();
              }}
                className="w-8 h-8 flex items-center justify-center rounded-full text-zen-400 hover:text-zen-600 dark:hover:text-zen-200 bg-zen-100 dark:bg-zen-800 transition-colors"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-zen-400 mb-4">
              {t('quick_add_subtitle')}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button className="p-4 bg-[#0066FF] text-white font-semibold rounded-2xl text-sm hover:bg-[#0052CC] shadow-glow transition-all active:scale-95 min-h-[52px]">
                {t('quick_add_expense')}
              </button>
              <button className="p-4 bg-[#10B981] text-white font-semibold rounded-2xl text-sm hover:bg-[#059669] shadow-glow-green transition-all active:scale-95 min-h-[52px]">
                {t('quick_add_income')}
              </button>
              <button className="p-4 bg-zen-100 dark:bg-zen-800 text-zen-800 dark:text-zen-100 font-semibold rounded-2xl text-sm hover:bg-zen-200 dark:hover:bg-zen-700 transition-all active:scale-95 min-h-[52px]">
                {t('quick_add_transfer')}
              </button>
              <button className="p-4 bg-accent/15 text-accent border border-accent/30 font-semibold rounded-2xl text-sm hover:bg-accent/25 transition-all active:scale-95 min-h-[52px]">
                {t('quick_add_task')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
