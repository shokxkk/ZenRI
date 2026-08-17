'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, Flame, ArrowRight, CheckCircle2, Clock, Plus } from 'lucide-react';
import { soundFx } from '@/lib/soundEffects';

interface BookItem {
  id: string;
  title: string;
  author: string;
  totalPages: number;
  currentPage: number;
  status: 'READING' | 'WANT_TO_READ' | 'FINISHED' | 'WISHLIST';
  coverGradient: string;
}

export const BooksWidget: React.FC = () => {
  const [activeBook, setActiveBook] = useState<BookItem | null>(null);
  const [streak, setStreak] = useState(3);
  const [todayPages, setTodayPages] = useState(12);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('zenri_books_data');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const current = parsed.find((b: BookItem) => b.status === 'READING');
          if (current) setActiveBook(current);
        }
      }
      const streakStored = localStorage.getItem('zenri_reading_streak');
      if (streakStored) setStreak(Number(streakStored) || 3);
      const pagesStored = localStorage.getItem('zenri_reading_pages_today');
      if (pagesStored) setTodayPages(Number(pagesStored) || 12);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleQuickAddPages = (delta: number) => {
    if (!activeBook) return;
    soundFx.playTaskSuccessSound();

    const nextPages = Math.min(activeBook.totalPages, activeBook.currentPage + delta);
    const updatedBook = { ...activeBook, currentPage: nextPages };
    setActiveBook(updatedBook);

    try {
      const stored = localStorage.getItem('zenri_books_data');
      if (stored) {
        const parsed = JSON.parse(stored);
        const updatedList = parsed.map((b: BookItem) =>
          b.id === activeBook.id ? { ...b, currentPage: nextPages } : b
        );
        localStorage.setItem('zenri_books_data', JSON.stringify(updatedList));
      }
      const newToday = todayPages + delta;
      setTodayPages(newToday);
      localStorage.setItem('zenri_reading_pages_today', String(newToday));
    } catch (e) {
      console.error(e);
    }
  };

  const pct = activeBook ? Math.round((activeBook.currentPage / activeBook.totalPages) * 100) : 0;

  return (
    <div className="bg-white dark:bg-[#131C2E] border border-zen-200 dark:border-zen-800/80 rounded-card p-5 shadow-apple flex flex-col justify-between space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0066FF] to-[#00C2FF] flex items-center justify-center text-white shadow-glow">
            <BookOpen size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zen-900 dark:text-zen-100">Книги & Чтение</h3>
            <p className="text-[10px] text-zen-400">Трекер страниц и библиотека</p>
          </div>
        </div>

        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-500 text-[11px] font-extrabold">
          <Flame size={12} className="animate-pulse" />
          <span>{streak} дн.</span>
        </div>
      </div>

      {/* Content: Active book or Empty state */}
      {activeBook ? (
        <div className="p-3.5 rounded-2xl bg-zen-50 dark:bg-zen-900/60 border border-zen-200/60 dark:border-zen-800 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <h4 className="text-xs font-extrabold text-zen-900 dark:text-zen-100 truncate">
                {activeBook.title}
              </h4>
              <p className="text-[10px] text-zen-400 truncate">{activeBook.author}</p>
            </div>
            <span className="text-xs font-black text-[#0066FF] flex-shrink-0">{pct}%</span>
          </div>

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="w-full bg-zen-200 dark:bg-zen-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#0066FF] to-[#00C2FF] transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-zen-400">
              <span>{activeBook.currentPage} стр</span>
              <span>{activeBook.totalPages} стр</span>
            </div>
          </div>

          {/* Quick page actions */}
          <div className="flex items-center justify-between pt-1 gap-2">
            <span className="text-[10px] text-zen-400 font-medium">Записать:</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleQuickAddPages(5)}
                className="px-2 py-0.5 rounded-lg bg-white dark:bg-zen-800 border border-zen-200 dark:border-zen-700 text-[10px] font-bold text-zen-700 dark:text-zen-200 hover:border-[#0066FF] transition-colors"
              >
                +5 стр
              </button>
              <button
                onClick={() => handleQuickAddPages(10)}
                className="px-2 py-0.5 rounded-lg bg-[#0066FF]/10 text-[#0066FF] text-[10px] font-bold hover:bg-[#0066FF] hover:text-white transition-colors"
              >
                +10 стр
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-4 bg-zen-50 dark:bg-zen-900/40 rounded-2xl border border-dashed border-zen-200 dark:border-zen-800">
          <p className="text-xs font-semibold text-zen-600 dark:text-zen-400">Нет активной книги</p>
          <Link
            href="/books"
            className="text-[11px] font-bold text-[#0066FF] hover:underline mt-1 inline-block"
          >
            + Выбрать из библиотеки
          </Link>
        </div>
      )}

      {/* Footer Link */}
      <Link
        href="/books"
        className="text-center text-xs font-bold text-[#0066FF] hover:underline flex items-center justify-center gap-1"
      >
        <span>Открыть всю библиотеку</span>
        <ArrowRight size={13} />
      </Link>
    </div>
  );
};
