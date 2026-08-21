'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { QuickAddModal } from '@/components/ui/QuickAddModal';
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

      {/* Fully Functional Quick Add Modal */}
      <QuickAddModal open={quickAddOpen} onClose={handleCloseQuickAdd} />
    </div>
  );
};
