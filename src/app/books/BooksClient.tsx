'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  Flame,
  Sparkles,
  ShoppingBag,
  Trash2,
  Edit2,
  Play,
  Pause,
  RotateCcw,
  X,
  Shuffle,
  Layers,
  Lightbulb,
  Wand2,
} from 'lucide-react';
import { soundFx } from '@/lib/soundEffects';
import { addTransaction } from '@/app/actions/financeActions';
import { useRouter } from 'next/navigation';

export type BookCategory =
  | 'FINANCE'
  | 'BUSINESS'
  | 'SELF_DEV'
  | 'PSYCHOLOGY'
  | 'TECH'
  | 'FICTION'
  | 'ISLAMIC'
  | 'OTHER';

export type BookStatus = 'READING' | 'WANT_TO_READ' | 'FINISHED' | 'WISHLIST';

export interface BookItem {
  id: string;
  title: string;
  author: string;
  category: BookCategory;
  status: BookStatus;
  totalPages: number;
  currentPage: number;
  rating?: number;
  price?: number; // for wishlist
  coverGradient: string;
  notes?: string[];
  quotes?: string[];
  startedAt?: string;
  finishedAt?: string;
  favorite?: boolean;
}

const CATEGORY_MAP: Record<BookCategory, { label: string; color: string; bg: string }> = {
  FINANCE: { label: 'Финансы', color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  BUSINESS: { label: 'Бизнес', color: '#0066FF', bg: 'rgba(0,102,255,0.12)' },
  SELF_DEV: { label: 'Саморазвитие', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  PSYCHOLOGY: { label: 'Психология', color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
  TECH: { label: 'IT & Технологии', color: '#06B6D4', bg: 'rgba(6,182,212,0.12)' },
  FICTION: { label: 'Художественная', color: '#EC4899', bg: 'rgba(236,72,153,0.12)' },
  ISLAMIC: { label: 'Духовное', color: '#14B8A6', bg: 'rgba(20,184,166,0.12)' },
  OTHER: { label: 'Другое', color: '#6B7280', bg: 'rgba(107,114,128,0.12)' },
};

const GRADIENTS = [
  'from-blue-600 via-indigo-700 to-slate-900',
  'from-emerald-600 via-teal-700 to-slate-900',
  'from-amber-500 via-orange-600 to-slate-900',
  'from-purple-600 via-violet-700 to-slate-900',
  'from-rose-600 via-pink-700 to-slate-900',
  'from-cyan-600 via-blue-700 to-slate-900',
];

const DEFAULT_BOOKS: BookItem[] = [
  {
    id: 'b-1',
    title: 'Атомные привычки',
    author: 'Джеймс Клир',
    category: 'SELF_DEV',
    status: 'READING',
    totalPages: 320,
    currentPage: 145,
    coverGradient: 'from-amber-500 via-orange-600 to-slate-900',
    rating: 5,
    startedAt: '2026-08-01',
    notes: ['1% улучшений каждый день = в 37 раз лучше за год.', 'Система важнее целей.'],
    quotes: ['Вы не поднимаетесь до уровня своих целей, вы опускаетесь до уровня своих систем.'],
    favorite: true,
  },
  {
    id: 'b-2',
    title: 'Самый богатый человек в Вавилоне',
    author: 'Джордж Клейсон',
    category: 'FINANCE',
    status: 'FINISHED',
    totalPages: 160,
    currentPage: 160,
    coverGradient: 'from-emerald-600 via-teal-700 to-slate-900',
    rating: 5,
    startedAt: '2026-07-10',
    finishedAt: '2026-07-25',
    notes: ['Откладывай минимум 10% от любого дохода.', 'Заставь каждую монету работать на себя.'],
    favorite: true,
  },
  {
    id: 'b-3',
    title: 'Психология денег',
    author: 'Морган Хаузел',
    category: 'FINANCE',
    status: 'WANT_TO_READ',
    totalPages: 280,
    currentPage: 0,
    coverGradient: 'from-blue-600 via-indigo-700 to-slate-900',
    rating: 0,
    notes: [],
  },
  {
    id: 'b-4',
    title: 'От нуля к единице',
    author: 'Питер Тиль',
    category: 'BUSINESS',
    status: 'WISHLIST',
    totalPages: 220,
    currentPage: 0,
    price: 85000,
    coverGradient: 'from-purple-600 via-violet-700 to-slate-900',
  },
  {
    id: 'b-5',
    title: 'Эссенциализм',
    author: 'Грег МакКеон',
    category: 'SELF_DEV',
    status: 'WISHLIST',
    totalPages: 260,
    currentPage: 0,
    price: 95000,
    coverGradient: 'from-cyan-600 via-blue-700 to-slate-900',
  },
];

const MOTIVATION_TIPS = [
  '⚡️ Читая всего 15 страниц в день, вы прочитаете 18 книг за год!',
  '🧠 20 минут чтения перед сном улучшают память и снижают уровень стресса на 68%.',
  '💡 Знания из одной книги могут сэкономить годы ошибок в бизнесе и жизни.',
  '🎯 Не обязательно читать всё подряд. Читайте то, что применимо прямо сейчас.',
  '🔥 Дисциплина важнее мотивации — откройте книгу хотя бы на 5 минут!',
];

export function BooksClient({
  userAccounts = [],
}: {
  userAccounts?: { id: string; name: string; currentBalance: string }[];
}) {
  const router = useRouter();
  const [books, setBooks] = useState<BookItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<'READING' | 'LIBRARY' | 'WISHLIST' | 'TIMER'>('READING');
  const [aiRec, setAiRec] = useState<{ title: string; author: string; reason: string } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Modal / Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBook, setEditingBook] = useState<BookItem | null>(null);
  const [buyingBook, setBuyingBook] = useState<BookItem | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState(userAccounts[0]?.id || '');
  const [randomPick, setRandomPick] = useState<BookItem | null>(null);

  // New book state
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newCategory, setNewCategory] = useState<BookCategory>('SELF_DEV');
  const [newStatus, setNewStatus] = useState<BookStatus>('READING');
  const [newTotalPages, setNewTotalPages] = useState('250');
  const [newCurrentPage, setNewCurrentPage] = useState('0');
  const [newPrice, setNewPrice] = useState('');
  const [newGradient, setNewGradient] = useState(GRADIENTS[0]);

  // Note/Quote adding state
  const [activeNoteBookId, setActiveNoteBookId] = useState<string | null>(null);
  const [newNoteText, setNewNoteText] = useState('');

  // Reading Timer State
  const [timerSeconds, setTimerSeconds] = useState(15 * 60); // 15 min default
  const [initialTimerSeconds, setInitialTimerSeconds] = useState(15 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerBookId, setTimerBookId] = useState<string>('');
  const [timerPagesRead, setTimerPagesRead] = useState('5');
  const [timerFinished, setTimerFinished] = useState(false);

  // Reading streak tracking
  const [streakDays, setStreakDays] = useState(3);
  const [dailyGoalPages] = useState(15);
  const [pagesReadToday, setPagesReadToday] = useState(12);

  // Load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('zenri_books_data');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setBooks(parsed);
        } else {
          setBooks(DEFAULT_BOOKS);
          localStorage.setItem('zenri_books_data', JSON.stringify(DEFAULT_BOOKS));
        }
      } else {
        setBooks(DEFAULT_BOOKS);
        localStorage.setItem('zenri_books_data', JSON.stringify(DEFAULT_BOOKS));
      }

      const streakStored = localStorage.getItem('zenri_reading_streak');
      if (streakStored) setStreakDays(Number(streakStored) || 3);

      const pagesTodayStored = localStorage.getItem('zenri_reading_pages_today');
      if (pagesTodayStored) setPagesReadToday(Number(pagesTodayStored) || 12);
    } catch (e) {
      console.error(e);
      setBooks(DEFAULT_BOOKS);
    }
    setLoaded(true);
  }, []);

  const saveBooks = useCallback((items: BookItem[]) => {
    setBooks(items);
    localStorage.setItem('zenri_books_data', JSON.stringify(items));
  }, []);

  // Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            setTimerFinished(true);
            soundFx.playTaskSuccessSound();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timerSeconds]);

  // Calculations
  const currentlyReading = useMemo(
    () => books.filter((b) => b.status === 'READING'),
    [books]
  );
  const myLibrary = useMemo(
    () => books.filter((b) => b.status !== 'WISHLIST'),
    [books]
  );
  const wishlistBooks = useMemo(
    () => books.filter((b) => b.status === 'WISHLIST'),
    [books]
  );
  const finishedBooks = useMemo(
    () => books.filter((b) => b.status === 'FINISHED'),
    [books]
  );

  const totalPagesReadCount = useMemo(
    () => books.reduce((sum, b) => sum + (b.status === 'FINISHED' ? b.totalPages : b.currentPage || 0), 0),
    [books]
  );

  const wishlistTotalPrice = useMemo(
    () => wishlistBooks.reduce((sum, b) => sum + (b.price || 0), 0),
    [wishlistBooks]
  );

  // Quick page logger
  const handleAddPages = (bookId: string, delta: number) => {
    soundFx.playTaskSuccessSound();
    const updated = books.map((b) => {
      if (b.id === bookId) {
        const next = Math.max(0, Math.min(b.totalPages, (b.currentPage || 0) + delta));
        const isFinished = next >= b.totalPages;
        return {
          ...b,
          currentPage: next,
          status: (isFinished ? 'FINISHED' : 'READING') as BookStatus,
          finishedAt: isFinished ? new Date().toISOString() : b.finishedAt,
        };
      }
      return b;
    });
    saveBooks(updated);

    const newToday = pagesReadToday + Math.max(0, delta);
    setPagesReadToday(newToday);
    localStorage.setItem('zenri_reading_pages_today', String(newToday));
  };

  const handleUpdatePageExact = (bookId: string, pageNum: number) => {
    const updated = books.map((b) => {
      if (b.id === bookId) {
        const next = Math.max(0, Math.min(b.totalPages, pageNum));
        const isFinished = next >= b.totalPages;
        return {
          ...b,
          currentPage: next,
          status: (isFinished ? 'FINISHED' : 'READING') as BookStatus,
          finishedAt: isFinished ? new Date().toISOString() : b.finishedAt,
        };
      }
      return b;
    });
    saveBooks(updated);
  };

  // Add new book
  const handleCreateBook = () => {
    if (!newTitle.trim()) return;
    soundFx.playIncomeSound();

    const newItem: BookItem = {
      id: `b-${Date.now()}`,
      title: newTitle.trim(),
      author: newAuthor.trim() || 'Автор не указан',
      category: newCategory,
      status: newStatus,
      totalPages: Number(newTotalPages) || 250,
      currentPage: newStatus === 'FINISHED' ? Number(newTotalPages) : Number(newCurrentPage) || 0,
      price: newPrice ? Number(newPrice) : undefined,
      coverGradient: newGradient,
      startedAt: newStatus === 'READING' ? new Date().toISOString() : undefined,
      finishedAt: newStatus === 'FINISHED' ? new Date().toISOString() : undefined,
      notes: [],
      quotes: [],
    };

    saveBooks([newItem, ...books]);
    setNewTitle('');
    setNewAuthor('');
    setNewPrice('');
    setShowAddForm(false);
  };

  // Delete book
  const handleDeleteBook = (id: string) => {
    saveBooks(books.filter((b) => b.id !== id));
    if (editingBook?.id === id) setEditingBook(null);
  };

  // Move Wishlist Book to Reading / Library (Buy book action)
  const handleBuyBookConfirm = async () => {
    if (!buyingBook) return;
    soundFx.playExpenseSound();

    if (buyingBook.price && buyingBook.price > 0 && selectedAccountId) {
      try {
        await addTransaction({
          type: 'EXPENSE',
          amount: buyingBook.price,
          accountId: selectedAccountId,
          comment: `Покупка книги: «${buyingBook.title}» (${buyingBook.author})`,
        });
        router.refresh();
      } catch (e) {
        console.error(e);
      }
    }

    const updated = books.map((b) => {
      if (b.id === buyingBook.id) {
        return {
          ...b,
          status: 'READING' as BookStatus,
          startedAt: new Date().toISOString(),
          currentPage: 0,
        };
      }
      return b;
    });

    saveBooks(updated);
    setBuyingBook(null);
    setActiveTab('READING');
  };

  // Add note to book
  const handleAddNote = (bookId: string) => {
    if (!newNoteText.trim()) return;
    soundFx.playTaskSuccessSound();
    const updated = books.map((b) => {
      if (b.id === bookId) {
        return {
          ...b,
          notes: [...(b.notes || []), newNoteText.trim()],
        };
      }
      return b;
    });
    saveBooks(updated);
    setNewNoteText('');
  };

  // Random Pick (Book Roulette)
  const handleRandomPick = () => {
    soundFx.playIncomeSound();
    const candidates = books.filter((b) => b.status === 'READING' || b.status === 'WANT_TO_READ');
    if (candidates.length === 0) {
      setRandomPick(books[0] || null);
      return;
    }
    const idx = Math.floor(Math.random() * candidates.length);
    setRandomPick(candidates[idx]);
  };

  // AI Book Recommendation (smart random pick with motivating tip)
  const AI_REASONS = [
    'Эта книга изменит ваш взгляд на время и продуктивность. Идеальное чтение для роста.',
    'Автор раскрывает секреты, которые применяют лучшие лидеры мира. Мощная книга.',
    'Простые принципы, которые работают в реальной жизни. Начните прямо сегодня!',
    'Книга отвечает на вопросы, которые вы давно задавали себе. Очень своевременно.',
    'Эту книгу рекомендуют 9 из 10 успешных предпринимателей. Самое время прочитать!',
  ];

  const handleAiRecommend = () => {
    setAiLoading(true);
    const all = books.filter((b) => b.status !== 'WISHLIST');
    const candidates = all.length > 0 ? all : DEFAULT_BOOKS;
    setTimeout(() => {
      const pick = candidates[Math.floor(Math.random() * candidates.length)];
      const reason = AI_REASONS[Math.floor(Math.random() * AI_REASONS.length)];
      setAiRec({ title: pick.title, author: pick.author, reason });
      setAiLoading(false);
      soundFx.playIncomeSound();
    }, 1200);
  };

  // Complete Reading Timer Session
  const handleSaveTimerSession = () => {
    const pages = Number(timerPagesRead) || 5;
    if (timerBookId) {
      handleAddPages(timerBookId, pages);
    } else if (currentlyReading[0]) {
      handleAddPages(currentlyReading[0].id, pages);
    }
    setTimerFinished(false);
    setTimerSeconds(initialTimerSeconds);
    setActiveTab('READING');
  };

  // Filtered books
  const filteredLibrary = useMemo(() => {
    return myLibrary.filter((b) => {
      const matchCat = selectedCategory === 'ALL' || b.category === selectedCategory;
      const matchSearch =
        !searchQuery ||
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.author.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [myLibrary, selectedCategory, searchQuery]);

  if (!loaded) return null;

  const randomTip = MOTIVATION_TIPS[Math.floor(Math.random() * MOTIVATION_TIPS.length)];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-br from-[#0F1E36] via-[#132238] to-[#0A1527] border border-zen-800/80 rounded-3xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-1.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#0066FF] to-[#00C2FF] flex items-center justify-center text-white shadow-glow">
              <BookOpen size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">Книги & Читательский трекер</h1>
              <p className="text-xs text-zen-300">Моя библиотека, вишлист покупок, фокус-чтение и умные инсайты</p>
            </div>
          </div>
        </div>

        {/* Action buttons & streak pill */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap relative z-10">
          <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-extrabold">
            <Flame size={16} className="text-amber-400 animate-pulse" />
            <span>Стрик: {streakDays} дня подряд</span>
          </div>

          <button
            onClick={handleRandomPick}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-zen-800/80 hover:bg-zen-700 text-zen-200 border border-zen-700 text-xs font-bold transition-all active:scale-95"
            title="Выбрать случайную книгу"
          >
            <Shuffle size={15} />
            <span>Что почитать?</span>
          </button>

          <button
            onClick={() => {
              setShowAddForm(true);
              setEditingBook(null);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[#0066FF] hover:bg-[#0052CC] text-white text-xs font-bold shadow-glow transition-all active:scale-95"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Добавить книгу</span>
          </button>
        </div>
      </div>

      {/* Daily Motivation Card */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-zen-50 dark:bg-[#131C2E] border border-zen-200/80 dark:border-zen-800 flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center flex-shrink-0">
          <Lightbulb size={18} />
        </div>
        <p className="text-xs font-medium text-zen-700 dark:text-zen-300 leading-relaxed">
          {randomTip}
        </p>
      </div>

      {/* AI Recommendation Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-900/50 via-indigo-900/50 to-blue-900/40 border border-violet-500/30 flex flex-col sm:flex-row items-center gap-3">
        <div className="flex items-center gap-3 flex-1">
          <button
            onClick={handleAiRecommend}
            disabled={aiLoading}
            className={`relative w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all active:scale-95 ${
              aiLoading
                ? 'bg-violet-600/50 cursor-wait'
                : 'bg-gradient-to-tr from-violet-600 to-blue-500 hover:from-violet-500 hover:to-blue-400 shadow-lg shadow-violet-500/40 hover:scale-105'
            }`}
          >
            {aiLoading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Wand2 size={22} className="text-white" />
            )}
            {!aiLoading && (
              <span className="absolute inset-0 rounded-2xl bg-violet-400/20 animate-ping opacity-60 pointer-events-none" />
            )}
          </button>
          {aiRec ? (
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-violet-300 font-bold uppercase tracking-wider">🤖 AI рекомендует</p>
              <p className="text-sm font-extrabold text-white truncate">{aiRec.title}</p>
              <p className="text-[11px] text-slate-400 truncate">{aiRec.author} — {aiRec.reason}</p>
            </div>
          ) : (
            <div className="flex-1">
              <p className="text-xs font-extrabold text-white">🤖 AI посоветует книгу</p>
              <p className="text-[11px] text-slate-400">Нажмите на шар — получите умную рекомендацию</p>
            </div>
          )}
        </div>
        {aiRec && (
          <button
            onClick={() => setAiRec(null)}
            className="p-1.5 text-slate-400 hover:text-white flex-shrink-0"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {[
          { key: 'READING', label: `Читаю (${currentlyReading.length})`, icon: BookOpen },
          { key: 'LIBRARY', label: `Библиотека (${myLibrary.length})`, icon: Layers },
          { key: 'WISHLIST', label: `Вишлист (${wishlistBooks.length})`, icon: ShoppingBag },
          { key: 'TIMER', label: '⏱️ Таймер', icon: Clock },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as never)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex-shrink-0 ${
                isActive
                  ? 'bg-[#0066FF] text-white shadow-glow'
                  : 'bg-white dark:bg-[#131C2E] text-zen-600 dark:text-zen-400 border border-zen-200 dark:border-zen-800 hover:border-[#0066FF]/50'
              }`}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: ЧИТАЮ СЕЙЧАС (Active Reading Spotlight) */}
      {activeTab === 'READING' && (
        <div className="space-y-6">
          {currentlyReading.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-3xl bg-white dark:bg-[#131C2E] border border-dashed border-zen-200 dark:border-zen-800">
              <BookOpen size={40} className="mx-auto text-zen-400 mb-3 opacity-40" />
              <h3 className="text-base font-bold text-zen-900 dark:text-zen-100">Вы сейчас ничего не читаете</h3>
              <p className="text-xs text-zen-400 mt-1 max-w-md mx-auto">
                Выберите книгу из библиотеки или добавьте новую, чтобы начать отслеживать прогресс страниц и инсайты.
              </p>
              <button
                onClick={() => {
                  setNewStatus('READING');
                  setShowAddForm(true);
                }}
                className="mt-4 px-4 py-2.5 rounded-2xl bg-[#0066FF] text-white text-xs font-bold shadow-glow"
              >
                + Начать читать книгу
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {currentlyReading.map((book) => {
                const progressPct = Math.round((book.currentPage / book.totalPages) * 100) || 0;
                const pagesLeft = book.totalPages - book.currentPage;
                const daysLeft = Math.ceil(pagesLeft / 15); // ~15 pages a day pace

                return (
                  <div
                    key={book.id}
                    className="bg-white dark:bg-[#131C2E] border border-zen-200 dark:border-zen-800 rounded-3xl p-5 sm:p-6 shadow-apple flex flex-col justify-between space-y-5 relative overflow-hidden"
                  >
                    {/* Top Row: Book Cover & Details */}
                    <div className="flex gap-4 sm:gap-5 items-start">
                      {/* Stylized Book 3D Cover */}
                      <div
                        className={`w-20 h-28 sm:w-24 sm:h-32 rounded-2xl bg-gradient-to-br ${book.coverGradient} shadow-xl flex-shrink-0 flex flex-col justify-between p-2.5 text-white border-l-4 border-white/20`}
                      >
                        <div className="text-[9px] uppercase tracking-wider font-extrabold opacity-80 truncate">
                          {CATEGORY_MAP[book.category]?.label || 'Книга'}
                        </div>
                        <div>
                          <p className="text-[11px] font-black leading-tight line-clamp-2">{book.title}</p>
                          <p className="text-[9px] opacity-75 mt-0.5 truncate">{book.author}</p>
                        </div>
                      </div>

                      {/* Info & Category */}
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold"
                            style={{
                              color: CATEGORY_MAP[book.category]?.color,
                              backgroundColor: CATEGORY_MAP[book.category]?.bg,
                            }}
                          >
                            {CATEGORY_MAP[book.category]?.label}
                          </span>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setTimerBookId(book.id);
                                setActiveTab('TIMER');
                              }}
                              className="p-1.5 rounded-xl text-zen-400 hover:text-[#0066FF] hover:bg-zen-100 dark:hover:bg-zen-800 transition-colors"
                              title="Включить таймер чтения"
                            >
                              <Clock size={15} />
                            </button>
                            <button
                              onClick={() => setEditingBook(book)}
                              className="p-1.5 rounded-xl text-zen-400 hover:text-zen-700 dark:hover:text-zen-200 hover:bg-zen-100 dark:hover:bg-zen-800 transition-colors"
                              title="Редактировать"
                            >
                              <Edit2 size={14} />
                            </button>
                          </div>
                        </div>

                        <h2 className="text-base font-extrabold text-zen-900 dark:text-zen-100 leading-snug">
                          {book.title}
                        </h2>
                        <p className="text-xs text-zen-400 font-medium">{book.author}</p>

                        <div className="flex items-center gap-3 pt-1 text-[11px] text-zen-500 dark:text-zen-400">
                          <span>Осталось ~{pagesLeft} стр</span>
                          <span>•</span>
                          <span className="text-[#0066FF] font-semibold">~{daysLeft} дней при 15 стр/день</span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar & Page Stats */}
                    <div className="space-y-2 pt-2 border-t border-zen-100 dark:border-zen-800/80">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-zen-900 dark:text-zen-100">
                          {book.currentPage} <span className="text-zen-400 font-normal">/ {book.totalPages} стр</span>
                        </span>
                        <span className="font-extrabold text-[#0066FF]">{progressPct}%</span>
                      </div>

                      <div className="w-full bg-zen-100 dark:bg-zen-800 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#0066FF] to-[#00C2FF] transition-all duration-500"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Quick Page Log Buttons */}
                    <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
                      <span className="text-[11px] text-zen-400 font-semibold">Записать прочитанное:</span>
                      <div className="flex items-center gap-1.5">
                        {[+5, +10, +20].map((delta) => (
                          <button
                            key={delta}
                            onClick={() => handleAddPages(book.id, delta)}
                            className="px-2.5 py-1 rounded-xl bg-zen-100 dark:bg-zen-800 hover:bg-[#0066FF] hover:text-white text-zen-700 dark:text-zen-300 text-xs font-bold transition-all active:scale-95"
                          >
                            +{delta} стр
                          </button>
                        ))}
                        <button
                          onClick={() => {
                            const val = prompt('Введите номер текущей страницы:', String(book.currentPage));
                            if (val && !isNaN(Number(val))) {
                              handleUpdatePageExact(book.id, Number(val));
                            }
                          }}
                          className="px-2.5 py-1 rounded-xl bg-[#0066FF]/10 text-[#0066FF] hover:bg-[#0066FF] hover:text-white text-xs font-bold transition-all"
                        >
                          Задать стр.
                        </button>
                      </div>
                    </div>

                    {/* Notes & Key Insights Preview */}
                    {book.notes && book.notes.length > 0 && (
                      <div className="p-3 rounded-2xl bg-zen-50 dark:bg-zen-900/60 border border-zen-200/60 dark:border-zen-800 text-xs space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-bold text-zen-700 dark:text-zen-300">
                          <span className="flex items-center gap-1">
                            <Sparkles size={12} className="text-amber-500" />
                            Главный инсайт:
                          </span>
                        </div>
                        <p className="text-zen-600 dark:text-zen-300 italic">
                          «{book.notes[book.notes.length - 1]}»
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: МОЯ БИБЛИОТЕКА (Full Library List + Filters) */}
      {activeTab === 'LIBRARY' && (
        <div className="space-y-5">
          {/* Search & Category Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zen-400" />
              <input
                type="text"
                placeholder="Поиск по названию или автору..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-[#131C2E] border border-zen-200 dark:border-zen-800 text-xs font-semibold text-zen-900 dark:text-zen-100 focus:outline-none focus:border-[#0066FF]"
              />
            </div>

            {/* Category Pill Select */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              <button
                onClick={() => setSelectedCategory('ALL')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex-shrink-0 ${
                  selectedCategory === 'ALL'
                    ? 'bg-[#0066FF] text-white'
                    : 'bg-white dark:bg-[#131C2E] text-zen-600 dark:text-zen-400 border border-zen-200 dark:border-zen-800'
                }`}
              >
                Все жанры
              </button>
              {(Object.keys(CATEGORY_MAP) as BookCategory[]).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex-shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-[#0066FF] text-white'
                      : 'bg-white dark:bg-[#131C2E] text-zen-600 dark:text-zen-400 border border-zen-200 dark:border-zen-800'
                  }`}
                >
                  {CATEGORY_MAP[cat].label}
                </button>
              ))}
            </div>
          </div>

          {/* Books Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLibrary.map((book) => {
              const isFinished = book.status === 'FINISHED';
              const isReading = book.status === 'READING';
              const progress = Math.round((book.currentPage / book.totalPages) * 100) || 0;

              return (
                <div
                  key={book.id}
                  className="bg-white dark:bg-[#131C2E] border border-zen-200 dark:border-zen-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between space-y-3 hover:border-[#0066FF]/40 transition-all group"
                >
                  <div className="flex gap-3 items-start">
                    <div
                      className={`w-14 h-20 rounded-xl bg-gradient-to-br ${book.coverGradient} shadow-md flex-shrink-0 flex items-center justify-center text-white text-[10px] font-black p-1 text-center`}
                    >
                      <span className="line-clamp-2">{book.title}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span
                          className="px-2 py-0.5 rounded-md text-[9px] font-extrabold"
                          style={{
                            color: CATEGORY_MAP[book.category]?.color,
                            backgroundColor: CATEGORY_MAP[book.category]?.bg,
                          }}
                        >
                          {CATEGORY_MAP[book.category]?.label}
                        </span>

                        <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setEditingBook(book)}
                            className="p-1 rounded-lg text-zen-400 hover:text-[#0066FF]"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteBook(book.id)}
                            className="p-1 rounded-lg text-zen-400 hover:text-rose-500"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      <h3 className="text-xs font-bold text-zen-900 dark:text-zen-100 mt-1 truncate">{book.title}</h3>
                      <p className="text-[11px] text-zen-400 truncate">{book.author}</p>

                      <div className="mt-2 flex items-center justify-between text-[10px]">
                        <span className="font-semibold text-zen-500">
                          {book.currentPage} / {book.totalPages} стр
                        </span>
                        {isFinished ? (
                          <span className="text-emerald-500 font-bold flex items-center gap-0.5">
                            <CheckCircle2 size={11} /> Прочитано
                          </span>
                        ) : isReading ? (
                          <span className="text-[#0066FF] font-bold">{progress}%</span>
                        ) : (
                          <span className="text-zen-400">В планах</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions row */}
                  <div className="flex items-center justify-between pt-2 border-t border-zen-100 dark:border-zen-800 text-xs">
                    {isReading ? (
                      <button
                        onClick={() => handleAddPages(book.id, 10)}
                        className="w-full py-1.5 rounded-xl bg-[#0066FF]/10 text-[#0066FF] hover:bg-[#0066FF] hover:text-white font-bold text-[11px] transition-all text-center"
                      >
                        +10 страниц
                      </button>
                    ) : isFinished ? (
                      <button
                        onClick={() => {
                          setActiveNoteBookId(activeNoteBookId === book.id ? null : book.id);
                        }}
                        className="w-full py-1.5 rounded-xl bg-zen-100 dark:bg-zen-800 text-zen-700 dark:text-zen-300 hover:text-[#0066FF] font-bold text-[11px] transition-all flex items-center justify-center gap-1"
                      >
                        <Lightbulb size={12} /> Заметки ({book.notes?.length || 0})
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          const updated = books.map((b) =>
                            b.id === book.id ? { ...b, status: 'READING' as BookStatus, startedAt: new Date().toISOString() } : b
                          );
                          saveBooks(updated);
                          setActiveTab('READING');
                        }}
                        className="w-full py-1.5 rounded-xl bg-zen-100 dark:bg-zen-800 hover:bg-[#0066FF] hover:text-white text-zen-700 dark:text-zen-300 font-bold text-[11px] transition-all text-center"
                      >
                        Начать читать →
                      </button>
                    )}
                  </div>

                  {/* Notes inline dropdown */}
                  {activeNoteBookId === book.id && (
                    <div className="pt-2 space-y-2 border-t border-zen-100 dark:border-zen-800 text-xs">
                      {book.notes && book.notes.length > 0 && (
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {book.notes.map((note, idx) => (
                            <div key={idx} className="p-2 rounded-xl bg-zen-50 dark:bg-zen-900/80 text-[11px] text-zen-700 dark:text-zen-300">
                              • {note}
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-1">
                        <input
                          type="text"
                          placeholder="Добавить инсайт..."
                          value={newNoteText}
                          onChange={(e) => setNewNoteText(e.target.value)}
                          className="flex-1 px-2.5 py-1.5 rounded-xl text-xs bg-zen-50 dark:bg-zen-800 border border-zen-200 dark:border-zen-700"
                        />
                        <button
                          onClick={() => handleAddNote(book.id)}
                          className="px-3 py-1.5 rounded-xl bg-[#0066FF] text-white font-bold text-xs"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: ХОЧУ КУПИТЬ (Book Wishlist) */}
      {activeTab === 'WISHLIST' && (
        <div className="space-y-5">
          {/* Total Wishlist Summary Card */}
          <div className="p-5 rounded-3xl bg-white dark:bg-[#131C2E] border border-zen-200 dark:border-zen-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-glow flex-shrink-0">
                <ShoppingBag size={20} />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-zen-900 dark:text-zen-100">Список книг к покупке</h3>
                <p className="text-xs text-zen-400">
                  Всего: {wishlistBooks.length} книг на сумму{' '}
                  <span className="font-extrabold text-zen-900 dark:text-zen-100">
                    {wishlistTotalPrice.toLocaleString('ru-RU')} сум
                  </span>
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setNewStatus('WISHLIST');
                setShowAddForm(true);
              }}
              className="px-4 py-2.5 rounded-2xl bg-[#0066FF] text-white text-xs font-bold shadow-glow transition-all active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Plus size={15} strokeWidth={2.5} />
              <span>Добавить книгу в вишлист</span>
            </button>
          </div>

          {/* Wishlist Items Grid */}
          {wishlistBooks.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-3xl bg-white dark:bg-[#131C2E] border border-dashed border-zen-200 dark:border-zen-800">
              <ShoppingBag size={36} className="mx-auto text-zen-400 mb-2 opacity-40" />
              <p className="text-sm font-bold text-zen-900 dark:text-zen-100">Вишлист пуст</p>
              <p className="text-xs text-zen-400 mt-1 max-w-sm mx-auto">
                Добавьте книги, которые планируете купить, чтобы не забыть и учесть их в бюджете.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {wishlistBooks.map((book) => (
                <div
                  key={book.id}
                  className="p-4 rounded-2xl bg-white dark:bg-[#131C2E] border border-zen-200 dark:border-zen-800 shadow-sm flex flex-col justify-between space-y-3"
                >
                  <div className="flex gap-3 items-start">
                    <div
                      className={`w-12 h-16 rounded-xl bg-gradient-to-br ${book.coverGradient} shadow-md flex-shrink-0 flex items-center justify-center text-white text-[9px] font-black p-1 text-center`}
                    >
                      <span className="line-clamp-2">{book.title}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <span
                        className="px-2 py-0.5 rounded-md text-[9px] font-extrabold"
                        style={{
                          color: CATEGORY_MAP[book.category]?.color,
                          backgroundColor: CATEGORY_MAP[book.category]?.bg,
                        }}
                      >
                        {CATEGORY_MAP[book.category]?.label}
                      </span>
                      <h4 className="text-xs font-bold text-zen-900 dark:text-zen-100 mt-1 truncate">{book.title}</h4>
                      <p className="text-[11px] text-zen-400 truncate">{book.author}</p>
                      {book.price ? (
                        <p className="text-xs font-extrabold text-[#0066FF] mt-1">
                          {book.price.toLocaleString('ru-RU')} сум
                        </p>
                      ) : null}
                    </div>
                  </div>

                  {/* Actions: Buy button & delete */}
                  <div className="flex gap-2 pt-2 border-t border-zen-100 dark:border-zen-800">
                    <button
                      onClick={() => handleDeleteBook(book.id)}
                      className="p-2 rounded-xl bg-zen-100 dark:bg-zen-800 hover:bg-rose-500/10 hover:text-rose-500 text-zen-400 text-xs transition-colors"
                      title="Удалить из списка"
                    >
                      <Trash2 size={14} />
                    </button>
                    <button
                      onClick={() => setBuyingBook(book)}
                      className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-glow-green transition-all active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 size={14} />
                      <span>Купил (В библиотеку)</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ФОКУС-ТАЙМЕР ЧТЕНИЯ (Pomodoro Focus Reading) */}
      {activeTab === 'TIMER' && (
        <div className="max-w-xl mx-auto bg-white dark:bg-[#131C2E] border border-zen-200 dark:border-zen-800 rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-apple">
          <div>
            <span className="px-3 py-1 rounded-full bg-[#0066FF]/15 text-[#0066FF] text-xs font-extrabold uppercase tracking-wider">
              Фокус-чтение без телефона
            </span>
            <h3 className="text-xl font-extrabold text-zen-900 dark:text-zen-100 mt-2">
              Режим «15 минут в день»
            </h3>
            <p className="text-xs text-zen-400 mt-1">
              Уберите отвлекающие факторы, включите таймер и погрузитесь в чтение.
            </p>
          </div>

          {/* Book selector for timer */}
          {currentlyReading.length > 0 && (
            <div className="text-left max-w-sm mx-auto">
              <label className="block text-xs font-bold text-zen-700 dark:text-zen-300 mb-1">
                Какую книгу читаем сейчас:
              </label>
              <select
                value={timerBookId || currentlyReading[0]?.id}
                onChange={(e) => setTimerBookId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-zen-50 dark:bg-zen-900 border border-zen-200 dark:border-zen-700 text-xs font-bold text-zen-900 dark:text-zen-100 focus:outline-none focus:border-[#0066FF]"
              >
                {currentlyReading.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title} ({b.currentPage}/{b.totalPages} стр)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Digital Timer Display */}
          <div className="py-6">
            <div className="text-6xl font-mono font-black text-zen-900 dark:text-zen-100 tracking-tight">
              {Math.floor(timerSeconds / 60)
                .toString()
                .padStart(2, '0')}
              :{(timerSeconds % 60).toString().padStart(2, '0')}
            </div>
            <p className="text-xs text-zen-400 mt-2">
              {isTimerRunning ? '🔥 Вы в потоке, приятного чтения!' : 'Нажмите Старт для начала сессии'}
            </p>
          </div>

          {/* Timer controls */}
          <div className="flex items-center justify-center gap-3">
            {!isTimerRunning ? (
              <button
                onClick={() => {
                  soundFx.playTaskSuccessSound();
                  setIsTimerRunning(true);
                }}
                className="px-6 py-3.5 rounded-2xl bg-[#0066FF] hover:bg-[#0052CC] text-white font-extrabold text-sm shadow-glow flex items-center gap-2 transition-all active:scale-95"
              >
                <Play size={18} fill="currentColor" />
                <span>Старт чтения</span>
              </button>
            ) : (
              <button
                onClick={() => setIsTimerRunning(false)}
                className="px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-sm shadow-glow flex items-center gap-2 transition-all active:scale-95"
              >
                <Pause size={18} fill="currentColor" />
                <span>Пауза</span>
              </button>
            )}

            <button
              onClick={() => {
                setIsTimerRunning(false);
                setTimerSeconds(initialTimerSeconds);
              }}
              className="p-3.5 rounded-2xl bg-zen-100 dark:bg-zen-800 text-zen-500 hover:text-zen-900 dark:hover:text-zen-100 transition-colors"
              title="Сброс таймера"
            >
              <RotateCcw size={18} />
            </button>
          </div>

          {/* Preset Buttons */}
          <div className="flex justify-center gap-2 pt-2">
            {[10, 15, 25, 45].map((mins) => (
              <button
                key={mins}
                onClick={() => {
                  setIsTimerRunning(false);
                  setInitialTimerSeconds(mins * 60);
                  setTimerSeconds(mins * 60);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  initialTimerSeconds === mins * 60
                    ? 'bg-[#0066FF]/15 text-[#0066FF] border border-[#0066FF]'
                    : 'bg-zen-50 dark:bg-zen-900 text-zen-400 border border-zen-200 dark:border-zen-800'
                }`}
              >
                {mins} мин
              </button>
            ))}
          </div>

          {/* Session Finished Dialog */}
          {timerFinished && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-left space-y-3">
              <div className="flex items-center gap-2 text-emerald-500 font-bold text-sm">
                <CheckCircle2 size={18} />
                <span>Сессия завершена! Отличная работа! 🎉</span>
              </div>
              <p className="text-xs text-zen-600 dark:text-zen-300">
                Сколько страниц вам удалось прочитать за эту сессию?
              </p>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={timerPagesRead}
                  onChange={(e) => setTimerPagesRead(e.target.value)}
                  className="w-24 px-3 py-2 rounded-xl bg-white dark:bg-zen-900 border border-zen-300 dark:border-zen-700 text-sm font-bold text-center"
                />
                <button
                  onClick={handleSaveTimerSession}
                  className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                >
                  Записать в прогресс
                </button>
              </div>
            </div>
          )}
        </div>
      )}



      {/* --- INLINE ADD BOOK FORM --- */}
      {showAddForm && (
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#131C2E] border border-[#0066FF]/40 shadow-xl space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-zen-100 dark:border-zen-800 pb-3">
            <h3 className="text-sm font-extrabold text-zen-900 dark:text-zen-100">
              {newStatus === 'WISHLIST' ? 'Добавить книгу в вишлист (Хочу купить)' : 'Добавить новую книгу'}
            </h3>
            <button
              onClick={() => setShowAddForm(false)}
              className="p-1 rounded-lg text-zen-400 hover:text-zen-700 dark:hover:text-zen-200"
            >
              <X size={16} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zen-700 dark:text-zen-300 mb-1">Название книги *</label>
              <input
                type="text"
                placeholder="Например: Атомные привычки"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zen-50 dark:bg-zen-900 border border-zen-200 dark:border-zen-700 text-xs font-bold text-zen-900 dark:text-zen-100 focus:outline-none focus:border-[#0066FF]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zen-700 dark:text-zen-300 mb-1">Автор</label>
              <input
                type="text"
                placeholder="Например: Джеймс Клир"
                value={newAuthor}
                onChange={(e) => setNewAuthor(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zen-50 dark:bg-zen-900 border border-zen-200 dark:border-zen-700 text-xs font-bold text-zen-900 dark:text-zen-100 focus:outline-none focus:border-[#0066FF]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-zen-700 dark:text-zen-300 mb-1">Жанр / Категория</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as BookCategory)}
                className="w-full px-3 py-2.5 rounded-xl bg-zen-50 dark:bg-zen-900 border border-zen-200 dark:border-zen-700 text-xs font-bold text-zen-900 dark:text-zen-100 focus:outline-none focus:border-[#0066FF]"
              >
                {(Object.keys(CATEGORY_MAP) as BookCategory[]).map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_MAP[cat].label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zen-700 dark:text-zen-300 mb-1">Статус</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as BookStatus)}
                className="w-full px-3 py-2.5 rounded-xl bg-zen-50 dark:bg-zen-900 border border-zen-200 dark:border-zen-700 text-xs font-bold text-zen-900 dark:text-zen-100 focus:outline-none focus:border-[#0066FF]"
              >
                <option value="READING">📖 Читаю сейчас</option>
                <option value="WANT_TO_READ">📚 В планах библиотеки</option>
                <option value="FINISHED">✅ Уже прочитано</option>
                <option value="WISHLIST">🛍️ Хочу купить (Вишлист)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zen-700 dark:text-zen-300 mb-1">
                {newStatus === 'WISHLIST' ? 'Цена книги (сум)' : 'Всего страниц'}
              </label>
              <input
                type="number"
                placeholder={newStatus === 'WISHLIST' ? '85000' : '320'}
                value={newStatus === 'WISHLIST' ? newPrice : newTotalPages}
                onChange={(e) => (newStatus === 'WISHLIST' ? setNewPrice(e.target.value) : setNewTotalPages(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zen-50 dark:bg-zen-900 border border-zen-200 dark:border-zen-700 text-xs font-bold text-zen-900 dark:text-zen-100 focus:outline-none focus:border-[#0066FF]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-zen-500 hover:bg-zen-100 dark:hover:bg-zen-800"
            >
              Отмена
            </button>
            <button
              onClick={handleCreateBook}
              disabled={!newTitle.trim()}
              className="px-5 py-2 rounded-xl bg-[#0066FF] hover:bg-[#0052CC] text-white text-xs font-bold shadow-glow disabled:opacity-50"
            >
              Сохранить книгу
            </button>
          </div>
        </div>
      )}

      {/* --- BUY CONFIRMATION PANEL (Buy book from wishlist) --- */}
      {buyingBook && (
        <div className="p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-500" />
              <h4 className="text-sm font-extrabold text-zen-900 dark:text-zen-100">
                Перенос книги «{buyingBook.title}» в библиотеку
              </h4>
            </div>
            <button onClick={() => setBuyingBook(null)} className="text-zen-400 hover:text-zen-600">
              <X size={16} />
            </button>
          </div>

          <p className="text-xs text-zen-600 dark:text-zen-300">
            Книга перейдет в статус «Читаю сейчас». Если указан счет, сумма ({buyingBook.price?.toLocaleString('ru-RU')} сум) будет автоматически списана в транзакциях.
          </p>

          {userAccounts.length > 0 && buyingBook.price && buyingBook.price > 0 && (
            <div className="max-w-sm">
              <label className="block text-xs font-bold text-zen-700 dark:text-zen-300 mb-1">Списать со счета:</label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-zen-900 border border-zen-200 dark:border-zen-700 text-xs font-bold text-zen-900 dark:text-zen-100"
              >
                {userAccounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} — {Number(a.currentBalance).toLocaleString('ru-RU')} сум
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => setBuyingBook(null)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-zen-500 bg-white dark:bg-zen-800"
            >
              Отмена
            </button>
            <button
              onClick={handleBuyBookConfirm}
              className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-glow-green"
            >
              Подтвердить покупку
            </button>
          </div>
        </div>
      )}

      {/* --- RANDOM PICK ROULETTE RESULT --- */}
      {randomPick && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-purple-600/20 border border-[#0066FF]/40 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-[#0066FF] flex items-center gap-1.5">
              <Sparkles size={15} /> Выбор ZenRI на сегодня:
            </span>
            <button onClick={() => setRandomPick(null)} className="text-zen-400 hover:text-white">
              <X size={15} />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-14 rounded-lg bg-gradient-to-br ${randomPick.coverGradient} shadow-md flex-shrink-0`} />
            <div>
              <h4 className="text-sm font-extrabold text-zen-900 dark:text-zen-100">{randomPick.title}</h4>
              <p className="text-xs text-zen-400">{randomPick.author}</p>
            </div>
          </div>
          <p className="text-xs text-zen-600 dark:text-zen-300">
            «Откройте прямо сейчас и прочитайте всего 10 страниц — вы удивитесь, как легко войти во вкус!»
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setTimerBookId(randomPick.id);
                setRandomPick(null);
                setActiveTab('TIMER');
              }}
              className="px-4 py-2 rounded-xl bg-[#0066FF] text-white text-xs font-bold shadow-glow"
            >
              ⏱️ Запустить 15 мин таймер
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
