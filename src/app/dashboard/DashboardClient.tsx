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
} from 'lucide-react';
import { updateTaskStatus } from '@/app/actions/taskActions';
import { toggleHabitCompletion } from '@/app/actions/habitActions';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { clsx } from 'clsx';
import { Modal } from '@/components/ui/Modal';
import { addTransaction } from '@/app/actions/financeActions';
import { useToast } from '@/components/ui/ToastProvider';
import { soundFx } from '@/lib/soundEffects';
import { triggerFlyingCoins } from '@/lib/coinAnimation';
import { getStreakInfo, recordStreakActivity, StreakInfo } from '@/lib/streakTracker';
import { StreakModal } from '@/components/ui/StreakModal';

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

export function DashboardClient({ data }: { data: DashboardData }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  const currentUserName = session?.user?.name || data.userName;
  const [showBalance, setShowBalance] = useState(true);
  const [activeModal, setActiveModal] = useState<'EXPENSE' | 'INCOME' | 'TRANSFER' | null>(null);

  const [streakInfo, setStreakInfo] = useState<StreakInfo>({
    currentStreak: 1,
    bestStreak: 1,
    lastActiveDate: '',
    levelName: 'Новичок 🔥',
    accessory: 'Базовый худи 7.',
  });
  const [isStreakModalOpen, setIsStreakModalOpen] = useState(false);

  useEffect(() => {
    setStreakInfo(getStreakInfo());
  }, []);

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
      const fmtAmt = Number(amount).toLocaleString('ru-RU');
      if (activeModal === 'INCOME') toast.success(`✅ Доход +${fmtAmt} сум сохранён`);
      else if (activeModal === 'EXPENSE') toast.success(`✅ Расход −${fmtAmt} сум записан`);
      else toast.success(`✅ Перевод ${fmtAmt} сум выполнен`);
      setAmount('');
      setComment('');
      setCategoryId('');
      setActiveModal(null);
      router.refresh();
    });
  };

  const habitsDoneCount = data.habits.filter((h) => h.doneToday).length;

  const badgeText =
    data.totalBalance <= 0
      ? '⚠️ Зона риска'
      : data.totalBalance >= 10000000
      ? '👑 Высокий капитал'
      : '+2.5% с прошлого месяца';

  return (
    <div className="space-y-5">
      {/* Header Greeting */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-zen-900 dark:text-zen-100">
            Доброе утро, {currentUserName}! 👋
          </h1>
          <p className="text-xs text-zen-400 capitalize mt-0.5">{todayDateStr}</p>
        </div>

        {/* Streak Button */}
        <button
          onClick={() => setIsStreakModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-xs font-black text-amber-400 hover:brightness-110 transition-all shadow-sm active:scale-95"
          title="Ежедневный Огненный Страйк"
        >
          <Flame size={16} className="text-amber-400 fill-amber-400 animate-pulse" />
          <span>{streakInfo.currentStreak}d</span>
        </button>
      </div>

      {/* Main Grid: Balance Card + Today Finances */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* Balance Card */}
        <div className="lg:col-span-7 rounded-card p-6 text-white border shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[260px] bg-gradient-to-br from-[#0A0F1D] via-[#0d1a3a] to-[#0A0F1D] border-[#0066FF]/30">
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
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] border border-[#0066FF]/30 bg-[#0066FF]/10 text-[#00C2FF]">
                <TrendingUp size={12} />
                <span>{badgeText}</span>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-4xl font-extrabold tracking-tight">
                {showBalance ? formatMoney(data.totalBalance) : '••••••••'}{' '}
                <span className="text-xl font-normal text-zen-400">сум</span>
              </p>
            </div>

            {/* Income / Expense summary */}
            <div className="flex gap-4 mt-4">
              <div>
                <p className="text-[10px] text-zen-500 uppercase tracking-wider">Доходы (мес.)</p>
                <p className="text-sm font-bold text-emerald-400">+{formatMoney(data.thisMonthIncome)} сум</p>
              </div>
              <div>
                <p className="text-[10px] text-zen-500 uppercase tracking-wider">Расходы (мес.)</p>
                <p className="text-sm font-bold text-rose-400">−{formatMoney(data.thisMonthExpense)} сум</p>
              </div>
            </div>
          </div>

          {/* Decorative chart line */}
          <div className="absolute inset-x-0 bottom-20 h-16 opacity-30 pointer-events-none">
            <svg viewBox="0 0 500 100" className="w-full h-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="balanceCurve" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0066FF" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#0066FF" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M 0,80 Q 80,40 160,65 T 320,30 T 500,10 L 500,100 L 0,100 Z"
                fill="url(#balanceCurve)"
              />
              <path
                d="M 0,80 Q 80,40 160,65 T 320,30 T 500,10"
                fill="none"
                stroke="#0066FF"
                strokeWidth="2"
              />
            </svg>
          </div>

          {/* Quick Actions */}
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

        {/* Today Finances Widget */}
        <div className="lg:col-span-5 bg-white dark:bg-[#131C2E] border border-zen-200 dark:border-zen-800/80 rounded-card p-5 shadow-apple flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-sm font-bold text-zen-900 dark:text-zen-100 flex items-center gap-2">
                <Wallet size={16} className="text-accent" />
                Финансы сегодня
              </h2>
              <span className="text-[11px] text-zen-400">Сегодня</span>
            </div>

            <div className="space-y-3">
              {data.recentTransactions.length === 0 ? (
                <p className="text-xs text-zen-400 py-6 text-center">Операций пока нет</p>
              ) : (
                data.recentTransactions.slice(0, 5).map((tx) => (
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
      </div>

      {/* Bottom Row: Tasks + Habits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Tasks Widget */}
        <div className="bg-white dark:bg-[#131C2E] border border-zen-200 dark:border-zen-800/80 rounded-card p-5 shadow-apple flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-sm font-bold text-zen-900 dark:text-zen-100 flex items-center gap-2">
                <CheckSquare2 size={16} className="text-accent" />
                Задачи на сегодня
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-accent/15 text-accent text-[11px] font-bold">
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

        {/* Habits Widget */}
        <div className="bg-white dark:bg-[#131C2E] border border-zen-200 dark:border-zen-800/80 rounded-card p-5 shadow-apple flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-sm font-bold text-zen-900 dark:text-zen-100">Привычки</h2>
              <span className="text-[11px] font-semibold text-income">
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
      </div>

      {/* 💼 Бизнес-Обзор месяца */}
      <div className="rounded-card p-5 bg-gradient-to-br from-amber-950/30 via-[#131C2E] to-[#131C2E] border border-amber-500/20 shadow-apple">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <span className="text-base">💼</span>
            </div>
            <div>
              <h2 className="text-sm font-bold text-zen-900 dark:text-zen-100">Бизнес-обзор месяца</h2>
              <p className="text-[10px] text-zen-400">Для владельцев бизнеса</p>
            </div>
          </div>
          <Link href="/analytics" className="text-[11px] font-bold text-amber-400 hover:text-amber-300 transition-colors">
            Полный отчёт →
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {/* Выручка */}
          <div className="bg-white/5 dark:bg-zen-900/40 rounded-2xl p-3 border border-white/5">
            <p className="text-[10px] text-zen-500 uppercase tracking-wider mb-1">Выручка</p>
            <p className="text-lg font-extrabold text-emerald-400">{formatMoney(data.thisMonthIncome)}</p>
            <p className="text-[9px] text-zen-500 mt-0.5">сум</p>
          </div>

          {/* Расходы */}
          <div className="bg-white/5 dark:bg-zen-900/40 rounded-2xl p-3 border border-white/5">
            <p className="text-[10px] text-zen-500 uppercase tracking-wider mb-1">Расходы</p>
            <p className="text-lg font-extrabold text-rose-400">{formatMoney(data.thisMonthExpense)}</p>
            <p className="text-[9px] text-zen-500 mt-0.5">сум</p>
          </div>

          {/* Прибыль */}
          <div className={`rounded-2xl p-3 border ${
            data.thisMonthIncome - data.thisMonthExpense >= 0
              ? 'bg-emerald-500/10 border-emerald-500/25'
              : 'bg-rose-500/10 border-rose-500/25'
          }`}>
            <p className="text-[10px] text-zen-500 uppercase tracking-wider mb-1">Прибыль</p>
            <p className={`text-lg font-extrabold ${
              data.thisMonthIncome - data.thisMonthExpense >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {data.thisMonthIncome - data.thisMonthExpense >= 0 ? '+' : ''}
              {formatMoney(data.thisMonthIncome - data.thisMonthExpense)}
            </p>
            <p className="text-[9px] text-zen-500 mt-0.5">сум</p>
          </div>
        </div>

        <div className="flex gap-2 mt-3">
          <Link
            href="/finances"
            className="flex-1 py-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/25 text-amber-400 text-xs font-bold text-center hover:bg-amber-500/25 transition-colors"
          >
            📊 Операции
          </Link>
          <Link
            href="/budgets"
            className="flex-1 py-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/25 text-amber-400 text-xs font-bold text-center hover:bg-amber-500/25 transition-colors"
          >
            🎯 Бюджеты
          </Link>
          <Link
            href="/debts"
            className="flex-1 py-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/25 text-amber-400 text-xs font-bold text-center hover:bg-amber-500/25 transition-colors"
          >
            🤝 Долги
          </Link>
        </div>
      </div>

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
    </div>
  );
}
