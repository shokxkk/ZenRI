'use client';

import React, { useState, useTransition } from 'react';
import { PlusCircle, PieChart, AlertTriangle } from 'lucide-react';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { createBudget, setBudgetCategoryLimit } from '@/app/actions/budgetActions';
import { useRouter } from 'next/navigation';

function formatMoney(v: string | number) {
  return Number(v).toLocaleString('ru-RU');
}

type BudgetCategory = {
  id: string; categoryId: string; limitAmount: string; spent: string;
  category: { name: string; color: string | null; type: string };
};

type Budget = {
  id: string; month: string; totalLimit: string; reserveAmount: string;
  targetSavings: string; totalSpent: string;
  categories: BudgetCategory[];
};

interface BudgetsClientProps {
  budget: Budget | null;
  categories: { id: string; name: string; type: string }[];
}

export function BudgetsClient({ budget, categories }: BudgetsClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showCreateBudget, setShowCreateBudget] = useState(false);
  const [showSetLimit, setShowSetLimit] = useState(false);
  const [totalLimit, setTotalLimit] = useState('8000000');
  const [reserve, setReserve] = useState('1000000');
  const [savings, setSavings] = useState('2000000');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [limitAmount, setLimitAmount] = useState('');

  const now = new Date();
  const monthLabel = now.toLocaleString('ru-RU', { month: 'long', year: 'numeric' });

  const expenseCategories = categories.filter((c) => c.type === 'EXPENSE');

  const handleCreateBudget = () => {
    startTransition(async () => {
      await createBudget({ totalLimit: Number(totalLimit), reserveAmount: Number(reserve), targetSavings: Number(savings) });
      setShowCreateBudget(false);
      router.refresh();
    });
  };

  const handleSetLimit = () => {
    if (!selectedCategory || !limitAmount) return;
    startTransition(async () => {
      await setBudgetCategoryLimit(selectedCategory, Number(limitAmount));
      setSelectedCategory(''); setLimitAmount('');
      setShowSetLimit(false);
      router.refresh();
    });
  };

  if (!budget) {
    return (
      <div className="space-y-5">
        <h1 className="text-2xl font-bold text-zen-900 dark:text-zen-100">Бюджеты</h1>
        <div className="bg-white dark:bg-zen-900 border border-zen-200 dark:border-zen-800 rounded-3xl p-10 text-center shadow-apple">
          <PieChart size={40} className="text-zen-300 mx-auto mb-4" />
          <p className="text-zen-500 text-sm mb-4">Бюджет на {monthLabel} ещё не создан</p>
          <button onClick={() => setShowCreateBudget(true)} className="py-3 px-6 rounded-xl bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-all">
            Создать бюджет
          </button>
        </div>
        <Modal open={showCreateBudget} onClose={() => setShowCreateBudget(false)} title="Создать бюджет месяца">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zen-700 dark:text-zen-300 mb-1">Общий лимит расходов (UZS)</label>
              <input type="number" value={totalLimit} onChange={(e) => setTotalLimit(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-zen-50 dark:bg-zen-800 border border-zen-200 dark:border-zen-700 text-sm focus:outline-none focus:border-accent text-zen-900 dark:text-zen-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zen-700 dark:text-zen-300 mb-1">Резервный фонд (UZS)</label>
              <input type="number" value={reserve} onChange={(e) => setReserve(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-zen-50 dark:bg-zen-800 border border-zen-200 dark:border-zen-700 text-sm focus:outline-none focus:border-accent text-zen-900 dark:text-zen-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zen-700 dark:text-zen-300 mb-1">Цель накоплений (UZS)</label>
              <input type="number" value={savings} onChange={(e) => setSavings(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-zen-50 dark:bg-zen-800 border border-zen-200 dark:border-zen-700 text-sm focus:outline-none focus:border-accent text-zen-900 dark:text-zen-100"
              />
            </div>
            <button onClick={handleCreateBudget} disabled={isPending}
              className="w-full py-3.5 rounded-xl font-medium text-sm text-white bg-accent hover:bg-accent-hover transition-all disabled:opacity-50">
              {isPending ? 'Создание...' : 'Создать'}
            </button>
          </div>
        </Modal>
      </div>
    );
  }

  const totalSpentPct = (Number(budget.totalSpent) / Number(budget.totalLimit)) * 100;
  const isOverall = totalSpentPct >= 100;

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-zen-900 dark:text-zen-100">Бюджет</h1>
          <p className="text-xs text-zen-500 capitalize mt-0.5">{monthLabel}</p>
        </div>
        <button onClick={() => setShowSetLimit(true)} className="flex items-center gap-1.5 text-xs text-accent hover:underline">
          <PlusCircle size={14} /> Лимит категории
        </button>
      </div>

      {/* Overview Card */}
      <div className={`rounded-3xl p-6 shadow-lg text-white ${isOverall ? 'bg-gradient-to-br from-expense to-red-700' : 'bg-gradient-to-br from-accent to-accent-hover'}`}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-sm opacity-80">Потрачено</p>
            <p className="text-3xl font-bold mt-0.5">{formatMoney(budget.totalSpent)} <span className="text-lg opacity-70">UZS</span></p>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-80">Лимит</p>
            <p className="text-xl font-semibold">{formatMoney(budget.totalLimit)}</p>
          </div>
        </div>
        <div className="w-full bg-white/20 rounded-full h-2.5">
          <div className="h-2.5 bg-white rounded-full transition-all" style={{ width: `${Math.min(100, totalSpentPct)}%` }} />
        </div>
        <p className="text-xs opacity-70 mt-2">{Math.round(totalSpentPct)}% от лимита использовано</p>
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-white/15 rounded-2xl p-3">
            <p className="text-xs opacity-70">Резерв</p>
            <p className="font-semibold">{formatMoney(budget.reserveAmount)}</p>
          </div>
          <div className="bg-white/15 rounded-2xl p-3">
            <p className="text-xs opacity-70">Цель накоп.</p>
            <p className="font-semibold">{formatMoney(budget.targetSavings)}</p>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div>
        <h2 className="text-sm font-semibold text-zen-900 dark:text-zen-100 mb-3">По категориям</h2>
        <div className="space-y-3">
          {budget.categories.length === 0 && (
            <p className="text-xs text-zen-400 text-center py-6">Лимиты по категориям не установлены</p>
          )}
          {budget.categories.map((bc) => {
            const spent = Number(bc.spent);
            const limit = Number(bc.limitAmount);
            const pct = (spent / limit) * 100;
            const isOver = pct >= 100;
            return (
              <div key={bc.id} className="bg-white dark:bg-zen-900 border border-zen-200 dark:border-zen-800 rounded-2xl p-4 shadow-apple">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    {isOver && <AlertTriangle size={14} className="text-expense" />}
                    <span className="text-sm font-medium text-zen-900 dark:text-zen-100">{bc.category.name}</span>
                    {isOver && <Badge variant="danger">Превышен</Badge>}
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-semibold ${isOver ? 'text-expense' : 'text-zen-700 dark:text-zen-300'}`}>{formatMoney(spent)}</span>
                    <span className="text-xs text-zen-400"> / {formatMoney(limit)}</span>
                  </div>
                </div>
                <ProgressBar value={spent} max={limit} showLabel />
              </div>
            );
          })}
        </div>
      </div>

      {/* Set Category Limit Modal */}
      <Modal open={showSetLimit} onClose={() => setShowSetLimit(false)} title="Лимит по категории">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zen-700 dark:text-zen-300 mb-1">Категория расходов</label>
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zen-50 dark:bg-zen-800 border border-zen-200 dark:border-zen-700 text-sm focus:outline-none focus:border-accent text-zen-900 dark:text-zen-100">
              <option value="">Выберите...</option>
              {expenseCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-zen-700 dark:text-zen-300 mb-1">Лимит (UZS)</label>
            <input type="number" min="0" placeholder="0"
              value={limitAmount} onChange={(e) => setLimitAmount(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-zen-50 dark:bg-zen-800 border border-zen-200 dark:border-zen-700 text-sm focus:outline-none focus:border-accent text-zen-900 dark:text-zen-100"
            />
          </div>
          <button onClick={handleSetLimit} disabled={isPending || !selectedCategory || !limitAmount}
            className="w-full py-3.5 rounded-xl font-medium text-sm text-white bg-accent hover:bg-accent-hover transition-all disabled:opacity-50">
            {isPending ? 'Сохранение...' : 'Установить лимит'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
