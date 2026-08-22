'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import {
  Wallet,
  CheckSquare2,
  Square,
  ArrowDownRight,
  ArrowUpRight,
  ArrowLeftRight,
  Eye,
  EyeOff,
  Plus,
  Flame,
  Check,
  TrendingUp,
  BookOpen,
  Dumbbell,
  Droplets,
  Sun,
  Headphones,
  Moon,
  Settings2,
  X,
} from 'lucide-react';
import { updateTaskStatus } from '@/app/actions/taskActions';
import { toggleHabitCompletion } from '@/app/actions/habitActions';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { clsx } from 'clsx';
import { Modal } from '@/components/ui/Modal';
import { addTransaction } from '@/app/actions/financeActions';
import { AIPredictWidget } from '@/components/ui/AIPredictWidget';
import { WishlistWidget } from '@/components/ui/WishlistWidget';
import { DailyFinancialQuote } from '@/components/ui/DailyFinancialQuote';
import { BooksWidget } from '@/components/ui/BooksWidget';
import { MascotScale } from '@/components/ui/MascotScale';
import { soundFx } from '@/lib/soundEffects';
import { triggerFlyingCoins, triggerHaptic } from '@/lib/coinAnimation';
import { getStreakInfo, recordStreakActivity, StreakInfo } from '@/lib/streakTracker';
import { StreakModal } from '@/components/ui/StreakModal';
import { BarsikHubModal } from '@/components/ui/BarsikHubModal';
import { SavingsLeagueModal } from '@/components/ui/SavingsLeagueModal';
import { DailyTabooModal } from '@/components/ui/DailyTabooModal';
import { BarsikShopModal } from '@/components/ui/BarsikShopModal';
import { MoneyPulseSpheresWidget } from '@/components/ui/MoneyPulseSpheresWidget';
import { FinancialSurvivalDialWidget } from '@/components/ui/FinancialSurvivalDialWidget';
import { CARD_THEMES, CardThemeId, getSavedCardTheme, saveCardTheme } from '@/lib/cardThemeStore';
import { getUserShopData, UserShopData } from '@/lib/barsikShopStore';
import { getTodayTaboo, TabooChallenge } from '@/lib/dailyTaboo';
import { Trophy, ShieldAlert, Palette, ShoppingBag, Coins } from 'lucide-react';

function formatMoney(v: number) {
  return v.toLocaleString('ru-RU');
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

type DashboardData = {
  userName: string;
  totalBalance: number;
  accounts: { id: string; name: string; type: string; currentBalance: string; currency: string }[];
  recentTransactions: { id: string; type: string; amount: string; date: string; comment: string | null; categoryName: string | null; accountName: string }[];
  allTransactions?: { id: string; type: string; amount: number; date: string }[];
  todayTasks: { id: string; title: string; priority: string; status: string; dueTime: string | null }[];
  todayTasksTotalCount?: number;
  todayTasksCompletedCount?: number;
  habits: { id: string; name: string; currentStreak: number; doneToday: boolean }[];
  thisMonthIncome: number;
  thisMonthExpense: number;
  topCategoryName?: string;
  topCategoryAmount?: number;
  categories?: { id: string; name: string; type: string; color: string | null }[];
};

const HABIT_ICONS_MAP: Record<string, React.ElementType> = {
  Чтение: BookOpen,
  Спорт: Dumbbell,
  'Вода 2л': Droplets,
  Медитация: Sun,
  Английский: Headphones,
  'Ранний подъём': Moon,
};

type WidgetKey = 'quote' | 'aiPredict' | 'wishlist' | 'books' | 'finances' | 'tasks' | 'budgets' | 'habits' | 'spheres' | 'speedometer';

const ALL_WIDGETS: { key: WidgetKey; label: string }[] = [
  { key: 'quote', label: 'Цитата дня (Финансовая мудрость)' },
  { key: 'aiPredict', label: 'ИИ Прогноз накоплений и бюджета' },
  { key: 'wishlist', label: 'Хотелки (Wishlist + ИИ Скоринг)' },
  { key: 'spheres', label: 'Пульсирующие Сферы Расходов' },
  { key: 'speedometer', label: 'Спидометр Подушки Безопасности' },
  { key: 'books', label: 'Книги & Чтение (Трекер страниц)' },
  { key: 'finances', label: 'Финансы сегодня' },
  { key: 'tasks', label: 'Задачи на сегодня' },
  { key: 'budgets', label: 'Бюджет месяца' },
  { key: 'habits', label: 'Привычки' },
];

export function DashboardClient({ data }: { data: DashboardData }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isPending, startTransition] = useTransition();

  const currentUserName = session?.user?.name || data.userName;
  const [showBalance, setShowBalance] = useState(true);
  const [activeModal, setActiveModal] = useState<'EXPENSE' | 'INCOME' | 'TRANSFER' | null>(null);

  // Widget Manager State
  const [hiddenWidgets, setHiddenWidgets] = useState<Record<WidgetKey, boolean>>({
    quote: false,
    aiPredict: false,
    wishlist: false,
    books: false,
    finances: false,
    tasks: false,
    budgets: false,
    habits: false,
    spheres: false,
    speedometer: false,
  });
  const [showWidgetSettings, setShowWidgetSettings] = useState(false);

  // Modals & Hub State
  const [streakInfo, setStreakInfo] = useState<StreakInfo>({
    currentStreak: 1,
    bestStreak: 1,
    lastActiveDate: '',
    levelName: 'Новичок 🔥',
    accessory: 'Базовый худи 7.',
  });
  const [isStreakModalOpen, setIsStreakModalOpen] = useState(false);
  const [isHubOpen, setIsHubOpen] = useState(false);
  const [hubTab, setHubTab] = useState<'CARD' | 'MEME' | 'VOICE'>('CARD');
  const [isLeagueOpen, setIsLeagueOpen] = useState(false);
  const [isTabooOpen, setIsTabooOpen] = useState(false);
  const [todayTaboo, setTodayTaboo] = useState<TabooChallenge>(getTodayTaboo());
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [shopData, setShopData] = useState<UserShopData>(getUserShopData());

  // 3D Holographic Card Theme State
  const [cardTheme, setCardTheme] = useState<CardThemeId>('CYBERPUNK');

  useEffect(() => {
    setStreakInfo(getStreakInfo());
    setCardTheme(getSavedCardTheme());
  }, []);

  const handleNextTheme = () => {
    soundFx.playClick();
    const themesList: CardThemeId[] = ['CYBERPUNK', 'DUBAI_GOLD', 'APPLE_GLASS', 'BLACK_OPS'];
    const currentIdx = themesList.indexOf(cardTheme);
    const nextIdx = (currentIdx + 1) % themesList.length;
    const nextTheme = themesList[nextIdx];
    setCardTheme(nextTheme);
    saveCardTheme(nextTheme);
  };

  useEffect(() => {
    const stored = localStorage.getItem('zenri_hidden_widgets');
    if (stored) {
      try {
        setHiddenWidgets(JSON.parse(stored));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const toggleWidgetHide = (key: WidgetKey) => {
    const updated = { ...hiddenWidgets, [key]: !hiddenWidgets[key] };
    setHiddenWidgets(updated);
    localStorage.setItem('zenri_hidden_widgets', JSON.stringify(updated));
  };

  // Modal State
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState(data.accounts[0]?.id || '');
  const [categoryId, setCategoryId] = useState('');
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (activeModal === 'EXPENSE') {
      const expCat = data.categories?.find((c) => c.type === 'EXPENSE');
      setCategoryId(expCat ? expCat.id : '');
    } else if (activeModal === 'INCOME') {
      const incCat = data.categories?.find((c) => c.type === 'INCOME');
      setCategoryId(incCat ? incCat.id : '');
    } else {
      setCategoryId('');
    }
  }, [activeModal, data.categories]);

  const todayDateStr = new Date().toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const handleToggleTask = (taskId: string, done: boolean) => {
    if (!done) soundFx.playTaskSuccessSound();
    startTransition(async () => {
      await updateTaskStatus(taskId, (done ? 'TODO' : 'COMPLETED') as never);
      router.refresh();
    });
  };

  const handleToggleHabit = (habitId: string, done: boolean) => {
    if (!done) soundFx.playHabitSuccessSound();
    startTransition(async () => {
      await toggleHabitCompletion(habitId, !done);
      router.refresh();
    });
  };

  const handleQuickTxSubmit = (e?: React.MouseEvent) => {
    if (!amount || !activeModal) return;
    const isInc = activeModal === 'INCOME';
    if (isInc) {
      soundFx.playIncomeSound();
    } else {
      soundFx.playExpenseSound();
    }

    if (e) {
      triggerFlyingCoins(e.clientX, e.clientY, isInc);
    } else {
      triggerFlyingCoins(undefined, undefined, isInc);
    }

    startTransition(async () => {
      await addTransaction({
        type: activeModal as never,
        amount: Number(amount),
        accountId: accountId || data.accounts[0]?.id || '',
        categoryId: activeModal !== 'TRANSFER' ? categoryId || undefined : undefined,
        comment: comment || undefined,
      });
      setStreakInfo(recordStreakActivity());
      setAmount('');
      setComment('');
      setCategoryId('');
      setActiveModal(null);
      router.refresh();
    });
  };

  const habitsDoneCount = data.habits.filter((h) => h.doneToday).length;
  const hiddenCount = Object.values(hiddenWidgets).filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Top Header Greeting + Widget Manager Button */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-zen-900 dark:text-zen-100">
            Доброе утро, {currentUserName}! 👋
          </h1>
          <p className="text-xs text-zen-400 capitalize mt-0.5">{todayDateStr}</p>
        </div>

        {/* Top Header Buttons: Clean & Spacious (Shop + League + Taboo + Streak + Settings) */}
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          {/* 🛍️ Barsik Shop Button */}
          <button
            onClick={() => setIsShopOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-amber-500/20 border border-purple-400/40 text-xs font-black text-purple-200 hover:brightness-110 transition-all shadow-sm active:scale-95"
            title="Магазин и Гардероб Барсика"
          >
            <ShoppingBag size={14} className="text-purple-400" />
            <span className="hidden sm:inline">Магазин</span>
            <span className="text-[10px] text-amber-300 font-mono pl-0.5">{shopData.zenCoins}🪙</span>
          </button>

          {/* 🏆 Savings League Button */}
          <button
            onClick={() => setIsLeagueOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-purple-500/20 border border-amber-500/30 text-xs font-black text-amber-300 hover:brightness-110 transition-all shadow-sm active:scale-95"
            title="Анонимная Лига Сбережений ZenRI"
          >
            <Trophy size={14} className="text-amber-400" />
            <span className="hidden sm:inline">Лига</span>
          </button>

          {/* 🚫 Daily Taboo Button */}
          <button
            onClick={() => setIsTabooOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs font-black text-rose-300 hover:bg-rose-500/25 transition-all shadow-sm active:scale-95"
            title="ИИ-Табу Дня"
          >
            <ShieldAlert size={14} className="text-rose-400" />
            <span className="hidden sm:inline">Табу</span>
          </button>

          {/* 🔥 Daily Financial Streak Badge */}
          <button
            onClick={() => setIsStreakModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs font-black text-amber-400 hover:bg-amber-500/20 transition-all shadow-sm active:scale-95"
            title="Огненный страйк активности"
          >
            <Flame size={14} className="fill-amber-400 animate-pulse text-amber-400" />
            <span>{streakInfo.currentStreak}d</span>
          </button>

          {/* Sleek Compact Widget Settings Icon Button ⚙️ */}
          <button
            onClick={() => setShowWidgetSettings(true)}
            className="p-1.5 rounded-xl bg-zen-100 dark:bg-[#131C2E] border border-zen-200 dark:border-zen-800 text-zen-700 dark:text-zen-300 hover:text-[#00C2FF] transition-all relative active:scale-95"
            title="Настроить виджеты"
          >
            <Settings2 size={15} />
            {hiddenCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#0066FF] text-white text-[9px] flex items-center justify-center font-black">
                {hiddenCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Quote of the Day */}
      {!hiddenWidgets.quote && (
        <div className="relative group">
          <button
            onClick={() => toggleWidgetHide('quote')}
            className="absolute top-3 right-3 p-1 rounded-lg bg-zen-900/80 text-zen-400 hover:text-white z-20 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Скрыть виджет"
          >
            <X size={14} />
          </button>
          <DailyFinancialQuote />
        </div>
      )}

      {/* Main Grid: Hero Card + Finances Widget */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Hero Total Balance Card (7 cols) with 3D Holographic Theme Selector */}
        {(() => {
          const currentThemeObj = CARD_THEMES[cardTheme] || CARD_THEMES.CYBERPUNK;
          const cardBg = currentThemeObj.bgClass;
          const badgeClass = currentThemeObj.badgeClass;
          const strokeColor = currentThemeObj.accentColor;
          const badgeText = data.totalBalance <= 0 ? '⚠️ Зона риска: Минус' : data.totalBalance >= 10000000 ? '👑 Высокий капитал' : '+2.5% с прошлого месяца';

          return (
            <div className={`lg:col-span-7 rounded-card p-6 text-white border shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[280px] transition-all duration-500 ${cardBg} ${currentThemeObj.borderColor}`}>
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold text-zen-400 uppercase tracking-widest flex items-center gap-2">
                      Общий баланс
                      <button
                        onClick={() => setShowBalance(!showBalance)}
                        className="text-zen-400 hover:text-white transition-colors"
                      >
                        {showBalance ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                    </span>

                    {/* 3D Theme Switcher Button 🎨 */}
                    <button
                      onClick={handleNextTheme}
                      className="px-2 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-[10px] font-black text-amber-300 border border-white/15 flex items-center gap-1 transition-all active:scale-95"
                      title="Сменить 3D-Тему Оформления Карты"
                    >
                      <Palette size={12} />
                      <span>{currentThemeObj.icon} {currentThemeObj.name.split(' ')[0]}</span>
                    </button>
                  </div>
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] border ${badgeClass}`}>
                    <TrendingUp size={12} />
                    <span>{badgeText}</span>
                  </div>
                </div>

                <div className="mt-3">
                  <p className="text-4xl font-extrabold tracking-tight">
                    {showBalance ? formatMoney(data.totalBalance) : '••••••••'}{' '}
                    <span className="text-xl font-normal text-zen-400">сум</span>
                  </p>
                </div>

                {/* Dynamic Financial Balance Scale held by Mascot (Барсик) */}
            <MascotScale
              totalBalance={data.totalBalance}
              onOpenHub={(tab) => {
                setHubTab(tab || 'CARD');
                setIsHubOpen(true);
              }}
            />
              </div>

              <div className="absolute inset-x-0 bottom-24 h-20 opacity-40 pointer-events-none">
                <svg viewBox="0 0 500 100" className="w-full h-full" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="balanceCurve" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={strokeColor} stopOpacity="0.4" />
                      <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M 0,80 Q 80,40 160,65 T 320,30 T 500,10 L 500,100 L 0,100 Z"
                    fill="url(#balanceCurve)"
                  />
                  <path
                    d="M 0,80 Q 80,40 160,65 T 320,30 T 500,10"
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth="3"
                  />
                  <circle cx="500" cy="10" r="5" fill={strokeColor} className="animate-ping" />
                  <circle cx="500" cy="10" r="4" fill="#FFFFFF" />
                </svg>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-6 z-10">
                <button
                  onClick={(e) => {
                    triggerFlyingCoins(e.clientX, e.clientY, false);
                    setActiveModal('EXPENSE');
                  }}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#0066FF] hover:bg-[#0052CC] text-white font-medium text-xs shadow-glow transition-all active:scale-95"
                >
                  <ArrowDownRight size={16} />
                  <span>Расход</span>
                </button>
                <button
                  onClick={(e) => {
                    triggerFlyingCoins(e.clientX, e.clientY, true);
                    setActiveModal('INCOME');
                  }}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#10B981] hover:bg-[#059669] text-white font-medium text-xs shadow-glow-green transition-all active:scale-95"
                >
                  <ArrowUpRight size={16} />
                  <span>Доход</span>
                </button>
                <button
                  onClick={(e) => {
                    triggerFlyingCoins(e.clientX, e.clientY, false);
                    setActiveModal('TRANSFER');
                  }}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-zen-800/90 hover:bg-zen-700 text-zen-100 font-medium text-xs border border-zen-700 transition-all active:scale-95"
                >
                  <ArrowLeftRight size={16} />
                  <span>Перевод</span>
                </button>
              </div>
            </div>
          );
        })()}

        {/* Right Column: "Финансы сегодня" Widget (Hideable) */}
        {!hiddenWidgets.finances && (
          <div className="lg:col-span-5 bg-white dark:bg-[#131C2E] border border-zen-200 dark:border-zen-800/80 rounded-card p-5 shadow-apple flex flex-col justify-between relative group">
            <button
              onClick={() => toggleWidgetHide('finances')}
              className="absolute top-4 right-4 p-1 rounded-lg text-zen-400 hover:text-zen-700 dark:hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
              title="Скрыть виджет"
            >
              <X size={15} />
            </button>
            <div>
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-sm font-bold text-zen-900 dark:text-zen-100 flex items-center gap-2">
                  <Wallet size={16} className="text-accent" />
                  Финансы сегодня
                </h2>
                <span className="text-[11px] text-zen-400 mr-6">Сегодня</span>
              </div>

              <div className="space-y-3">
                {data.recentTransactions.length === 0 ? (
                  <p className="text-xs text-zen-400 py-6 text-center">Операций пока нет</p>
                ) : (
                  data.recentTransactions.slice(0, 4).map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-zen-50 dark:hover:bg-zen-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={clsx(
                            'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0',
                            tx.type === 'INCOME'
                              ? 'bg-income-light text-income'
                              : 'bg-expense-light text-expense'
                          )}
                        >
                          {tx.type === 'INCOME' ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-zen-900 dark:text-zen-100">
                            {tx.categoryName || tx.comment || 'Транзакция'}
                          </p>
                          <p className="text-[10px] text-zen-400">
                            {formatTime(tx.date)} • {tx.accountName}
                          </p>
                        </div>
                      </div>
                      <span
                        className={clsx(
                          'text-xs font-bold',
                          tx.type === 'INCOME' ? 'text-income' : 'text-expense'
                        )}
                      >
                        {tx.type === 'INCOME' ? '+' : '−'}
                        {formatMoney(Number(tx.amount))} сум
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <Link
              href="/finances"
              className="text-center text-xs font-semibold text-accent hover:underline mt-4 block"
            >
              Показать все операции →
            </Link>
          </div>
        )}
      </div>

      {/* AI Predict Feature (Hideable) */}
      {!hiddenWidgets.aiPredict && (
        <div className="relative group">
          <button
            onClick={() => toggleWidgetHide('aiPredict')}
            className="absolute top-4 right-4 p-1.5 rounded-lg bg-zen-900/80 text-zen-400 hover:text-white z-20 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Скрыть виджет"
          >
            <X size={15} />
          </button>
          <AIPredictWidget
            totalBalance={data.totalBalance}
            monthlyIncome={data.thisMonthIncome}
            monthlyExpense={data.thisMonthExpense}
            topCategoryName={data.topCategoryName || 'Расходы'}
            topCategoryAmount={data.topCategoryAmount || 0}
          />
        </div>
      )}

      {/* Wishlist Хотелки Widget (Hideable & AI Scoring Integrated) */}
      {!hiddenWidgets.wishlist && (
        <div className="relative group">
          <button
            onClick={() => toggleWidgetHide('wishlist')}
            className="absolute top-4 right-4 p-1.5 rounded-lg bg-zen-900/80 text-zen-400 hover:text-white z-20 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Скрыть виджет"
          >
            <X size={15} />
          </button>
          <WishlistWidget monthlyNetSavings={Math.max(1000000, (data.thisMonthIncome || 12000000) - (data.thisMonthExpense || 545000))} />
        </div>
      )}

      {/* 🎯 Tesla-Style Financial Survival Autonomy Gauge (Hideable) */}
      {!hiddenWidgets.speedometer && (
        <div className="relative group">
          <button
            onClick={() => toggleWidgetHide('speedometer')}
            className="absolute top-4 right-4 p-1.5 rounded-lg bg-zen-900/80 text-zen-400 hover:text-white z-20 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Скрыть виджет"
          >
            <X size={15} />
          </button>
          <FinancialSurvivalDialWidget
            totalBalance={data.totalBalance}
            monthlyExpense={data.thisMonthExpense}
          />
        </div>
      )}

      {/* 🔮 Interactive Money Pulse Spheres Category Bubbles (Hideable & Computed from Real Data) */}
      {(() => {
        const categoryMap: Record<string, { name: string; amount: number; color: string }> = {};
        const palette = ['#F59E0B', '#3B82F6', '#10B981', '#A855F7', '#EC4899', '#00C2FF', '#EF4444'];
        let colorIdx = 0;

        for (const tx of data.recentTransactions || []) {
          if (tx.type === 'EXPENSE') {
            const name = tx.categoryName || 'Прочие расходы';
            const amt = parseFloat(tx.amount) || 0;
            if (!categoryMap[name]) {
              categoryMap[name] = { name, amount: 0, color: palette[colorIdx % palette.length] };
              colorIdx++;
            }
            categoryMap[name].amount += amt;
          }
        }

        const realCategories = Object.values(categoryMap).sort((a, b) => b.amount - a.amount);

        return (
          !hiddenWidgets.spheres && (
            <div className="relative group">
              <button
                onClick={() => toggleWidgetHide('spheres')}
                className="absolute top-4 right-4 p-1.5 rounded-lg bg-zen-900/80 text-zen-400 hover:text-white z-20 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Скрыть виджет"
              >
                <X size={15} />
              </button>
              <MoneyPulseSpheresWidget categories={realCategories} />
            </div>
          )
        );
      })()}


      {/* Middle Row: 3 Widgets (Hideable) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Widget 1: Задачи на сегодня */}
        {!hiddenWidgets.tasks && (
          <div className="bg-white dark:bg-[#131C2E] border border-zen-200 dark:border-zen-800/80 rounded-card p-5 shadow-apple flex flex-col justify-between relative group">
            <button
              onClick={() => toggleWidgetHide('tasks')}
              className="absolute top-4 right-4 p-1 rounded-lg text-zen-400 hover:text-zen-700 dark:hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
              title="Скрыть виджет"
            >
              <X size={15} />
            </button>
            <div>
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-sm font-bold text-zen-900 dark:text-zen-100 flex items-center gap-2">
                  <CheckSquare2 size={16} className="text-accent" />
                  Задачи на сегодня
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-accent/15 text-accent text-[11px] font-bold mr-6">
                  {data.todayTasks.length}
                </span>
              </div>

              <div className="space-y-2">
                {data.todayTasks.length === 0 ? (
                  <div className="text-center py-6 text-zen-400 text-xs">Все задачи выполнены! 🎉</div>
                ) : (
                  data.todayTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-2.5 rounded-2xl bg-zen-50 dark:bg-zen-900/60 border border-zen-200/50 dark:border-zen-800/60"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <button
                          onClick={() => handleToggleTask(task.id, task.status === 'COMPLETED')}
                          disabled={isPending}
                          className="text-zen-400 hover:text-accent transition-colors"
                        >
                          {task.status === 'COMPLETED' ? (
                            <CheckSquare2 size={18} className="text-income" />
                          ) : (
                            <Square size={18} />
                          )}
                        </button>
                        <span
                          className={clsx(
                            'text-xs font-medium truncate',
                            task.status === 'COMPLETED'
                              ? 'line-through text-zen-400'
                              : 'text-zen-900 dark:text-zen-100'
                          )}
                        >
                          {task.title}
                        </span>
                      </div>
                      {task.dueTime && (
                        <span className="text-[10px] text-zen-400 bg-zen-200/60 dark:bg-zen-800 px-2 py-0.5 rounded-lg flex-shrink-0">
                          {task.dueTime}
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <Link
              href="/tasks"
              className="text-center text-xs font-semibold text-accent hover:underline mt-4 block"
            >
              + Новая задача
            </Link>
          </div>
        )}

        {/* Widget 2: Бюджет месяца */}
        {!hiddenWidgets.budgets && (
          <div className="bg-white dark:bg-[#131C2E] border border-zen-200 dark:border-zen-800/80 rounded-card p-5 shadow-apple flex flex-col justify-between relative group">
            <button
              onClick={() => toggleWidgetHide('budgets')}
              className="absolute top-4 right-4 p-1 rounded-lg text-zen-400 hover:text-zen-700 dark:hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
              title="Скрыть виджет"
            >
              <X size={15} />
            </button>
            <div>
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-sm font-bold text-zen-900 dark:text-zen-100">Бюджет месяца</h2>
                <span className="text-[11px] text-zen-400 mr-6">Лимит</span>
              </div>

              {data.thisMonthExpense === 0 ? (
                <div className="text-center py-6 text-zen-400 text-xs">
                  Бюджеты пока не настроены.
                </div>
              ) : (
                <div className="space-y-3">
                  {[
                    { name: 'Продукты', spent: Math.min(data.thisMonthExpense, 200000), limit: 200000, pct: 60, color: 'bg-cyan-500' },
                  ].map((item, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between items-center text-[11px] mb-1">
                        <span className="font-medium text-zen-700 dark:text-zen-300">{item.name}</span>
                        <span className="text-zen-400">
                          {formatMoney(item.spent)} / {formatMoney(item.limit)}
                        </span>
                        <span className="font-bold text-zen-900 dark:text-zen-100">{item.pct}%</span>
                      </div>
                      <div className="w-full bg-zen-100 dark:bg-zen-800 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${item.color} transition-all`}
                          style={{ width: `${item.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Link
              href="/budgets"
              className="text-center text-xs font-semibold text-accent hover:underline mt-4 block"
            >
              → Настроить бюджеты
            </Link>
          </div>
        )}

        {/* Widget 3: Привычки */}
        {!hiddenWidgets.habits && (
          <div className="bg-white dark:bg-[#131C2E] border border-zen-200 dark:border-zen-800/80 rounded-card p-5 shadow-apple flex flex-col justify-between relative group">
            <button
              onClick={() => toggleWidgetHide('habits')}
              className="absolute top-4 right-4 p-1 rounded-lg text-zen-400 hover:text-zen-700 dark:hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
              title="Скрыть виджет"
            >
              <X size={15} />
            </button>
            <div>
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-sm font-bold text-zen-900 dark:text-zen-100">Привычки</h2>
                <span className="text-[11px] font-semibold text-income mr-6">
                  {habitsDoneCount} из {data.habits.length}
                </span>
              </div>

              {data.habits.length === 0 ? (
                <div className="text-center py-6 text-zen-400 text-xs">
                  Привычки пока не добавлены.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {data.habits.map((h) => {
                    const IconComponent = HABIT_ICONS_MAP[h.name] || BookOpen;
                    return (
                      <button
                        key={h.id}
                        onClick={() => handleToggleHabit(h.id, h.doneToday)}
                        disabled={isPending}
                        className={clsx(
                          'p-3 rounded-2xl border text-left flex flex-col items-center justify-center gap-1.5 transition-all',
                          h.doneToday
                            ? 'bg-income-light dark:bg-income-dark/30 border-income/40 text-income'
                            : 'bg-zen-50 dark:bg-zen-900/60 border-zen-200/50 dark:border-zen-800/60 text-zen-700 dark:text-zen-300'
                        )}
                      >
                        <div
                          className={clsx(
                            'w-8 h-8 rounded-xl flex items-center justify-center',
                            h.doneToday ? 'bg-income text-white' : 'bg-zen-200/60 dark:bg-zen-800'
                          )}
                        >
                          {h.doneToday ? <Check size={16} /> : <IconComponent size={16} />}
                        </div>
                        <span className="text-[11px] font-semibold text-center truncate w-full">
                          {h.name}
                        </span>
                        <span className="text-[10px] text-warning flex items-center gap-0.5">
                          <Flame size={10} /> {h.currentStreak} дней
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <Link
              href="/habits"
              className="text-center text-xs font-semibold text-accent hover:underline mt-4 block"
            >
              + Добавить привычку
            </Link>
          </div>
        )}
      </div>

      {/* Widget Settings Manager Modal */}
      <Modal
        open={showWidgetSettings}
        onClose={() => setShowWidgetSettings(false)}
        title="Настройка виджетов на экране"
      >
        <div className="space-y-4">
          <p className="text-xs text-zen-400">
            Включайте или скрывайте виджеты рабочего стола в 1 клик.
          </p>
          <div className="space-y-2">
            {ALL_WIDGETS.map((w) => {
              const isHidden = hiddenWidgets[w.key];
              return (
                <div
                  key={w.key}
                  onClick={() => toggleWidgetHide(w.key)}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-zen-50 dark:bg-zen-900/80 border border-zen-200/80 dark:border-zen-800 cursor-pointer hover:border-[#0066FF] transition-all"
                >
                  <span className="text-xs font-bold text-zen-900 dark:text-zen-100">
                    {w.label}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-[11px] font-bold ${
                      !isHidden
                        ? 'bg-income/20 text-income'
                        : 'bg-zen-200 dark:bg-zen-800 text-zen-400'
                    }`}
                  >
                    {!isHidden ? 'Показывается' : 'Скрыт'}
                  </span>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => setShowWidgetSettings(false)}
            className="w-full py-3.5 rounded-2xl font-bold text-sm text-white bg-[#0066FF] hover:bg-[#0052CC] shadow-glow transition-all"
          >
            Готово
          </button>
        </div>
      </Modal>

      {/* Quick Action Modal */}
      <Modal
        open={!!activeModal}
        onClose={() => setActiveModal(null)}
        title={
          activeModal === 'EXPENSE'
            ? 'Быстрый расход'
            : activeModal === 'INCOME'
            ? 'Быстрый доход'
            : 'Перевод между счетами'
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zen-700 dark:text-zen-300 mb-1">
              Сумма (сум)
            </label>
            <input
              type="number"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zen-50 dark:bg-zen-800 border border-zen-200 dark:border-zen-700 text-sm focus:outline-none focus:border-accent text-zen-900 dark:text-zen-100"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zen-700 dark:text-zen-300 mb-1">
              Счёт
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zen-50 dark:bg-zen-800 border border-zen-200 dark:border-zen-700 text-sm focus:outline-none focus:border-accent text-zen-900 dark:text-zen-100"
            >
              {data.accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} — {formatMoney(Number(a.currentBalance))} сум
                </option>
              ))}
            </select>
          </div>

          {/* Category Selector for Quick Expense / Quick Income */}
          {activeModal !== 'TRANSFER' && data.categories && data.categories.filter((c) => c.type === activeModal).length > 0 && (
            <div>
              <label className="block text-xs font-medium text-zen-700 dark:text-zen-300 mb-1.5">
                Категория {activeModal === 'EXPENSE' ? 'расхода' : 'дохода'}
              </label>
              <div className="flex gap-2 overflow-x-auto pb-2 max-w-full -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
                {data.categories
                  .filter((c) => c.type === activeModal)
                  .map((cat) => {
                    const isSelected = categoryId === cat.id;
                    const color = cat.color || (activeModal === 'EXPENSE' ? '#EF4444' : '#10B981');
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategoryId(cat.id)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border flex-shrink-0 ${
                          isSelected
                            ? 'text-white shadow-sm'
                            : 'bg-zen-50 dark:bg-zen-800 text-zen-700 dark:text-zen-300 border-zen-200 dark:border-zen-700 hover:border-[#0066FF]/50'
                        }`}
                        style={isSelected ? { backgroundColor: color, borderColor: color } : undefined}
                      >
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: isSelected ? 'rgba(255,255,255,0.7)' : color }}
                        />
                        {cat.name}
                      </button>
                    );
                  })}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-zen-700 dark:text-zen-300 mb-1">
              Комментарий
            </label>
            <input
              type="text"
              placeholder="Заметка..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zen-50 dark:bg-zen-800 border border-zen-200 dark:border-zen-700 text-sm focus:outline-none focus:border-accent text-zen-900 dark:text-zen-100"
            />
          </div>
          <button
            onClick={(e) => handleQuickTxSubmit(e)}
            disabled={isPending || !amount}
            className={`w-full py-3.5 rounded-xl font-semibold text-sm text-white transition-all ${
              activeModal === 'INCOME'
                ? 'bg-income hover:opacity-90'
                : activeModal === 'EXPENSE'
                ? 'bg-[#0066FF] hover:opacity-90'
                : 'bg-[#0066FF] hover:opacity-90'
            } disabled:opacity-50`}
          >
            {isPending ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </Modal>

      {/* Daily Financial Streak Rewards Modal */}
      <StreakModal
        isOpen={isStreakModalOpen}
        onClose={() => setIsStreakModalOpen(false)}
        streakInfo={streakInfo}
      />

      {/* 🐆 Barsik Unified Center Modal (VIP Card + Meme Lab + Voice AI) */}
      <BarsikHubModal
        isOpen={isHubOpen}
        onClose={() => setIsHubOpen(false)}
        userName={currentUserName}
        totalBalance={data.totalBalance}
        monthlyIncome={data.thisMonthIncome}
        monthlyExpense={data.thisMonthExpense}
        currentStreak={streakInfo.currentStreak}
        initialTab={hubTab}
      />

      {/* 🏆 ZenRI Savings League Gaming Leaderboard Modal */}
      <SavingsLeagueModal
        isOpen={isLeagueOpen}
        onClose={() => setIsLeagueOpen(false)}
        userName={currentUserName}
        monthlyIncome={data.thisMonthIncome}
        monthlyExpense={data.thisMonthExpense}
      />

      {/* 🚫 AI Daily Expense Taboo Challenge Modal */}
      <DailyTabooModal
        isOpen={isTabooOpen}
        onClose={() => setIsTabooOpen(false)}
        taboo={todayTaboo}
        onRewardClaimed={() => setTodayTaboo(getTodayTaboo())}
      />

      {/* 🛍️ Barsik Mascot Shop & Customizer Modal */}
      <BarsikShopModal
        isOpen={isShopOpen}
        onClose={() => setIsShopOpen(false)}
        onDataChanged={setShopData}
      />
    </div>
  );
}
