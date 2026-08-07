'use client';

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { BottomNav } from './BottomNav';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const handleOpenQuickAdd = () => {
    setQuickAddOpen(true);
  };

  return (
    <div className="relative flex min-h-screen bg-zen-50 dark:bg-[#0A0F1D] text-zen-900 dark:text-zen-100 overflow-hidden">
      {/* Ambient Animated Background (Requirement 4) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-60 dark:opacity-40">
        {/* Top Left Electric Blue Glowing Orb */}
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-[#0066FF] to-[#00C2FF] blur-[140px] animate-ambient-1" />
        {/* Top Right Cyan & Purple Glowing Orb */}
        <div className="absolute top-1/4 -right-32 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#8B5CF6] via-[#0055FF] to-[#00C2FF] blur-[160px] animate-ambient-2" />
        {/* Bottom Left Emerald & Blue Glowing Orb */}
        <div className="absolute -bottom-40 left-1/3 w-[550px] h-[550px] rounded-full bg-gradient-to-tr from-[#10B981] via-[#0066FF] to-[#00C2FF] blur-[150px] animate-ambient-3" />
      </div>

      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 flex flex-col min-w-0 pb-20 md:pb-6">
        <Header onOpenQuickAdd={handleOpenQuickAdd} />
        <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full">{children}</main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav onOpenQuickAdd={handleOpenQuickAdd} />

      {/* Quick Add Modal */}
      {quickAddOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={() => setQuickAddOpen(false)}
        >
          <div
            className="bg-white dark:bg-[#131C2E] rounded-card p-6 max-w-lg w-full border border-zen-200 dark:border-zen-800 shadow-2xl animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-zen-900 dark:text-zen-100">Быстрое добавление</h3>
              <button
                onClick={() => setQuickAddOpen(false)}
                className="text-zen-400 hover:text-zen-600 dark:hover:text-zen-200"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-zen-400 mb-4">
              Выберите тип операции для быстрой записи.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button className="p-3.5 bg-[#0066FF] text-white font-semibold rounded-2xl text-xs hover:bg-[#0052CC] shadow-glow transition-all">
                + Расход
              </button>
              <button className="p-3.5 bg-[#10B981] text-white font-semibold rounded-2xl text-xs hover:bg-[#059669] shadow-glow-green transition-all">
                + Доход
              </button>
              <button className="p-3.5 bg-zen-100 dark:bg-zen-800 text-zen-800 dark:text-zen-100 font-semibold rounded-2xl text-xs hover:bg-zen-200 dark:hover:bg-zen-700 transition-all">
                ↔ Перевод
              </button>
              <button className="p-3.5 bg-accent/15 text-accent border border-accent/30 font-semibold rounded-2xl text-xs hover:bg-accent/25 transition-all">
                ✓ Задача
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
