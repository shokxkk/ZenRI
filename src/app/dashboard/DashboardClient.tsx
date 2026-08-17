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
import { LifeGraphWidget } from '@/components/ui/LifeGraphWidget';
import { WishlistWidget } from '@/components/ui/WishlistWidget';
import { DailyFinancialQuote } from '@/components/ui/DailyFinancialQuote';
import { BooksWidget } from '@/components/ui/BooksWidget';
import { soundFx } from '@/lib/soundEffects';

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
};

const HABIT_ICONS_MAP: Record<string, React.ElementType> = {
  Чтение: BookOpen,
  Спорт: Dumbbell,
  'Вода 2л': Droplets,
  Медитация: Sun,
  Английский: Headphones,
  'Ранний подъём': Moon,
};

type WidgetKey = 'quote' | 'aiPredict' | 'wishlist' | 'books' | 'lifeGraph' | 'finances' | 'tasks' | 'budgets' | 'habits';

const ALL_WIDGETS: { key: WidgetKey; label: string }[] = [
  { key: 'quote', label: 'Цитата дня (Финансовая мудрость)' },
  { key: 'aiPredict', label: 'ИИ Прогноз накоплений и бюджета' },
  { key: 'wishlist', label: 'Хотелки (Wishlist + ИИ Скоринг)' },
  { key: 'books', label: 'Книги & Чтение (Трекер страниц)' },
  { key: 'lifeGraph', label: 'Граф Жизни (Life Graph)' },
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
    lifeGraph: false,
    finances: false,
    tasks: false,
    budgets: false,
    habits: false,
  });
  const [showWidgetSettings, setShowWidgetSettings] = useState(false);

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
  const [comment, setComment] = useState('');

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

  const handleQuickTxSubmit = () => {
    if (!amount || !activeModal) return;
    if (activeModal === 'INCOME') {
      soundFx.playIncomeSound();
    } else {
      soundFx.playExpenseSound();
    }
    startTransition(async () => {
      await addTransaction({
        type: activeModal as never,
        amount: Number(amount),
        accountId: accountId || data.accounts[0]?.id || '',
        comment: comment || undefined,
      });
      setAmount('');
      setComment('');
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

        {/* Widget Manager Button */}
        <button
          onClick={() => setShowWidgetSettings(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zen-100 dark:bg-[#131C2E] border border-zen-200 dark:border-zen-800 text-xs font-bold text-zen-700 dark:text-zen-300 hover:text-[#0066FF] transition-all"
        >
          <Settings2 size={15} />
          <span>Настроить виджеты</span>
          {hiddenCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-[#0066FF] text-white text-[10px] flex items-center justify-center font-bold">
              {hiddenCount}
            </span>
          )}
        </button>
      </div>

      {/* Quote of the Day (Financial Wisdom Widget - Requirement match) */}
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
        {/* Left Column: Hero Total Balance Card (7 cols) */}
        <div className="lg:col-span-7 bg-gradient-to-br from-[#0F1E36] via-[#122442] to-[#0A1527] rounded-card p-6 text-white border border-slate-200/50 dark:border-zen-800/80 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[280px]">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zen-400 uppercase tracking-widest flex items-center gap-2">
                Общий баланс
                <button
                  onClick={() => setShowBalance(!showBalance)}
                  className="text-zen-400 hover:text-white transition-colors"
                >
                  {showBalance ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
              </span>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-income/15 border border-income/30 text-income text-[11px] font-medium">
                <TrendingUp size={12} />
                <span>+2.5% с прошлого месяца</span>
              </div>
            </div>

            <div className="mt-3">
              <p className="text-4xl font-extrabold tracking-tight">
                {showBalance ? formatMoney(data.totalBalance) : '••••••••'}{' '}
                <span className="text-xl font-normal text-zen-400">сум</span>
              </p>
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-24 h-20 opacity-40 pointer-events-none">
            <svg viewBox="0 0 500 100" className="w-full h-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="balanceCurve" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00C2FF" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#0055FF" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M 0,80 Q 80,40 160,65 T 320,30 T 500,10 L 500,100 L 0,100 Z"
                fill="url(#balanceCurve)"
              />
              <path
                d="M 0,80 Q 80,40 160,65 T 320,30 T 500,10"
                fill="none"
                stroke="#00C2FF"
                strokeWidth="3"
              />
              <circle cx="500" cy="10" r="5" fill="#00C2FF" className="animate-ping" />
              <circle cx="500" cy="10" r="4" fill="#FFFFFF" />
            </svg>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-6 z-10">
            <button
              onClick={() => setActiveModal('EXPENSE')}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#0066FF] hover:bg-[#0052CC] text-white font-medium text-xs shadow-glow transition-all active:scale-95"
            >
              <ArrowDownRight size={16} />
              <span>Расход</span>
            </button>
            <button
              onClick={() => setActiveModal('INCOME')}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#10B981] hover:bg-[#059669] text-white font-medium text-xs shadow-glow-green transition-all active:scale-95"
            >
              <ArrowUpRight size={16} />
              <span>Доход</span>
            </button>
            <button
              onClick={() => setActiveModal('TRANSFER')}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-zen-800/90 hover:bg-zen-700 text-zen-100 font-medium text-xs border border-zen-700 transition-all active:scale-95"
            >
              <ArrowLeftRight size={16} />
              <span>Перевод</span>
            </button>
          </div>
        </div>

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

      {/* Books & Reading Tracker Widget (Hideable) */}
      {!hiddenWidgets.books && (
        <div className="relative group">
          <button
            onClick={() => toggleWidgetHide('books')}
            className="absolute top-4 right-4 p-1.5 rounded-lg bg-zen-900/80 text-zen-400 hover:text-white z-20 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Скрыть виджет"
          >
            <X size={15} />
          </button>
          <BooksWidget />
        </div>
      )}

      {/* Life Graph Feature (Hideable) */}
      {!hiddenWidgets.lifeGraph && (
        <div className="relative group">
          <button
            onClick={() => toggleWidgetHide('lifeGraph')}
            className="absolute top-4 right-4 p-1.5 rounded-lg bg-zen-900/80 text-zen-400 hover:text-white z-20 opacity-0 group-hover:opacity-100 transition-opacity"
            title="Скрыть виджет"
          >
            <X size={15} />
          </button>
          <LifeGraphWidget
            totalBalance={data.totalBalance}
            allTransactions={data.allTransactions || []}
            tasksTotalCount={data.todayTasksTotalCount || (data.todayTasks.length + (data.todayTasksCompletedCount || 0))}
            tasksCompletedCount={data.todayTasksCompletedCount || 0}
            habitsTotalCount={data.habits.length}
            habitsCompletedCount={habitsDoneCount}
          />
        </div>
      )}

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
            onClick={handleQuickTxSubmit}
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
    </div>
  );
}
