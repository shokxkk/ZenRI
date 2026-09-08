'use client';

import React, { useState, useTransition } from 'react';
import {
  Target, Plus, Sparkles, TrendingUp, Clock, CheckCircle2,
  Trash2, X, ChevronDown, ChevronUp, Loader2, AlertCircle
} from 'lucide-react';
import { createGoal, deleteGoal, addSavingsToGoal, getAIGoalPrediction } from '@/app/actions/goalActions';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/ToastProvider';

function formatMoney(n: number) {
  return n.toLocaleString('ru-RU');
}

function formatDate(d: Date | string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

interface Goal {
  id: string;
  name: string;
  description: string | null;
  targetAmount: number;
  savedAmount: number;
  deadline: Date | null;
  type: string;
  isCompleted: boolean;
  aiPredictionMonths: number | null;
  aiLastAnalyzedAt: Date | null;
}

interface Props {
  goals: Goal[];
}

export function GoalsClient({ goals }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();
  const [showCreate, setShowCreate] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [aiPredictions, setAiPredictions] = useState<Record<string, string>>({});
  const [loadingAI, setLoadingAI] = useState<string | null>(null);
  const [depositGoalId, setDepositGoalId] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState('');

  // Create form
  const [form, setForm] = useState({
    name: '',
    description: '',
    targetAmount: '',
    savedAmount: '',
    deadline: '',
    type: 'SHORT_TERM' as 'SHORT_TERM' | 'LONG_TERM',
  });

  const shortTermGoals = goals.filter((g) => g.type === 'SHORT_TERM' && !g.isCompleted);
  const longTermGoals = goals.filter((g) => g.type === 'LONG_TERM' && !g.isCompleted);
  const completedGoals = goals.filter((g) => g.isCompleted);

  function handleCreate() {
    if (!form.name.trim() || !form.targetAmount) return;
    startTransition(async () => {
      await createGoal({
        name: form.name,
        description: form.description,
        targetAmount: Number(form.targetAmount.replace(/\s/g, '')),
        savedAmount: Number(form.savedAmount.replace(/\s/g, '') || 0),
        deadline: form.deadline || undefined,
        type: form.type,
      });
      setShowCreate(false);
      setForm({ name: '', description: '', targetAmount: '', savedAmount: '', deadline: '', type: 'SHORT_TERM' });
      toast.success('Цель создана!');
      router.refresh();
    });
  }

  function handleDelete(id: string, name: string) {
    if (!confirm(`Удалить цель "${name}"?`)) return;
    startTransition(async () => {
      await deleteGoal(id);
      toast.success('Цель удалена');
      router.refresh();
    });
  }

  async function handleAIPrediction(goalId: string) {
    setLoadingAI(goalId);
    try {
      const result = await getAIGoalPrediction(goalId);
      setAiPredictions((prev) => ({ ...prev, [goalId]: result.prediction }));
      router.refresh();
    } catch {
      toast.error('Ошибка AI-прогноза');
    } finally {
      setLoadingAI(null);
    }
  }

  function handleDeposit(goalId: string) {
    const amount = Number(depositAmount.replace(/\s/g, ''));
    if (!amount || amount <= 0) return;
    startTransition(async () => {
      const result = await addSavingsToGoal(goalId, amount);
      setDepositGoalId(null);
      setDepositAmount('');
      if (result.isCompleted) {
        toast.success('🎉 Поздравляем! Цель достигнута!');
      } else {
        toast.success(`Добавлено ${formatMoney(amount)} сум к цели`);
      }
      router.refresh();
    });
  }

  function GoalCard({ goal }: { goal: Goal }) {
    const progress = Math.min(100, (goal.savedAmount / goal.targetAmount) * 100);
    const remaining = goal.targetAmount - goal.savedAmount;
    const isExpanded = expandedId === goal.id;

    return (
      <div className={`bg-zinc-900 border rounded-2xl p-5 transition-all ${goal.isCompleted ? 'border-green-800/50' : 'border-zinc-800 hover:border-zinc-700'}`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${goal.isCompleted ? 'bg-green-500/20' : goal.type === 'LONG_TERM' ? 'bg-purple-500/20' : 'bg-blue-500/20'}`}>
              {goal.isCompleted ? (
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              ) : goal.type === 'LONG_TERM' ? (
                <TrendingUp className="w-5 h-5 text-purple-400" />
              ) : (
                <Target className="w-5 h-5 text-blue-400" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">{goal.name}</h3>
              {goal.description && <p className="text-xs text-zinc-500">{goal.description}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded-full ${goal.type === 'LONG_TERM' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'}`}>
              {goal.type === 'LONG_TERM' ? 'Долгосрочная' : 'Краткосрочная'}
            </span>
            {!goal.isCompleted && (
              <button onClick={() => handleDelete(goal.id, goal.name)} className="p-1 text-zinc-600 hover:text-red-400 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Progress */}
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-zinc-400">{formatMoney(goal.savedAmount)} сум</span>
            <span className="text-zinc-400">{formatMoney(goal.targetAmount)} сум</span>
          </div>
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${goal.isCompleted ? 'bg-green-500' : progress > 66 ? 'bg-blue-500' : progress > 33 ? 'bg-amber-500' : 'bg-red-500'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span className={`font-medium ${goal.isCompleted ? 'text-green-400' : 'text-zinc-300'}`}>{Math.round(progress)}%</span>
            {!goal.isCompleted && <span className="text-zinc-500">осталось {formatMoney(remaining)} сум</span>}
          </div>
        </div>

        {goal.deadline && (
          <div className="flex items-center gap-1 text-xs text-zinc-500 mb-3">
            <Clock className="w-3 h-3" />
            <span>Срок: {formatDate(goal.deadline)}</span>
          </div>
        )}

        {!goal.isCompleted && (
          <div className="flex gap-2">
            <button
              onClick={() => setDepositGoalId(depositGoalId === goal.id ? null : goal.id)}
              className="flex-1 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/30 text-blue-300 py-2 rounded-xl text-xs font-medium transition-all"
            >
              + Пополнить
            </button>
            <button
              onClick={() => {
                setExpandedId(isExpanded ? null : goal.id);
                if (!isExpanded && !aiPredictions[goal.id]) {
                  handleAIPrediction(goal.id);
                }
              }}
              className="flex items-center gap-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-300 px-3 py-2 rounded-xl text-xs font-medium transition-all"
            >
              {loadingAI === goal.id ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              AI прогноз
              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        )}

        {/* Deposit form */}
        {depositGoalId === goal.id && !goal.isCompleted && (
          <div className="mt-3 flex gap-2">
            <input
              type="number"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="Сумма пополнения"
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-blue-500"
              autoFocus
            />
            <button
              onClick={() => handleDeposit(goal.id)}
              disabled={isPending}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              OK
            </button>
          </div>
        )}

        {/* AI Prediction */}
        {isExpanded && (
          <div className="mt-3 bg-amber-500/5 border border-amber-500/20 rounded-xl p-3">
            {loadingAI === goal.id ? (
              <div className="flex items-center gap-2 text-amber-300 text-xs">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>AI анализирует ваши данные...</span>
              </div>
            ) : aiPredictions[goal.id] ? (
              <p className="text-amber-200 text-xs leading-relaxed">{aiPredictions[goal.id]}</p>
            ) : (
              <div className="flex items-center gap-2 text-zinc-400 text-xs">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Нет данных для прогноза</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Target className="w-6 h-6 text-amber-400" />
              Финансовые цели
            </h1>
            <p className="text-zinc-400 text-sm mt-1">AI рассчитывает срок достижения каждой цели</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-black px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Новая цель
          </button>
        </div>

        {goals.length === 0 ? (
          <div className="text-center py-16 bg-zinc-900/50 rounded-2xl border border-zinc-800">
            <Target className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-zinc-400 font-medium mb-2">Нет целей</h3>
            <p className="text-zinc-500 text-sm mb-4">Добавьте вашу первую финансовую цель и AI рассчитает срок её достижения</p>
            <button
              onClick={() => setShowCreate(true)}
              className="bg-amber-500 hover:bg-amber-400 text-black px-6 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              Создать цель
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {shortTermGoals.length > 0 && (
              <div>
                <h2 className="text-sm font-medium text-zinc-400 mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-400" />
                  КРАТКОСРОЧНЫЕ
                </h2>
                <div className="grid gap-4">
                  {shortTermGoals.map((g) => <GoalCard key={g.id} goal={g} />)}
                </div>
              </div>
            )}

            {longTermGoals.length > 0 && (
              <div>
                <h2 className="text-sm font-medium text-zinc-400 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                  ДОЛГОСРОЧНЫЕ
                </h2>
                <div className="grid gap-4">
                  {longTermGoals.map((g) => <GoalCard key={g.id} goal={g} />)}
                </div>
              </div>
            )}

            {completedGoals.length > 0 && (
              <div>
                <h2 className="text-sm font-medium text-zinc-400 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  ДОСТИГНУТЫ
                </h2>
                <div className="grid gap-4">
                  {completedGoals.map((g) => <GoalCard key={g.id} goal={g} />)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Goal Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Новая финансовая цель</h2>
              <button onClick={() => setShowCreate(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Goal Type Toggle */}
            <div className="flex gap-1 mb-4 bg-zinc-800 rounded-xl p-1">
              <button
                onClick={() => setForm((f) => ({ ...f, type: 'SHORT_TERM' }))}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${form.type === 'SHORT_TERM' ? 'bg-blue-600 text-white' : 'text-zinc-400'}`}
              >
                🎯 Краткосрочная
              </button>
              <button
                onClick={() => setForm((f) => ({ ...f, type: 'LONG_TERM' }))}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${form.type === 'LONG_TERM' ? 'bg-purple-600 text-white' : 'text-zinc-400'}`}
              >
                📈 Долгосрочная
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Название цели *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Например: Новый автомобиль"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-blue-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Описание</label>
                <input
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Необязательно"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Целевая сумма (сум) *</label>
                <input
                  type="number"
                  value={form.targetAmount}
                  onChange={(e) => setForm((f) => ({ ...f, targetAmount: e.target.value }))}
                  placeholder="50000000"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Уже накоплено (сум)</label>
                <input
                  type="number"
                  value={form.savedAmount}
                  onChange={(e) => setForm((f) => ({ ...f, savedAmount: e.target.value }))}
                  placeholder="0"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Желаемый срок</label>
                <input
                  type="date"
                  value={form.deadline}
                  onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl text-sm font-medium transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleCreate}
                disabled={!form.name.trim() || !form.targetAmount || isPending}
                className="flex-1 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black py-3 rounded-xl text-sm font-medium transition-colors"
              >
                {isPending ? 'Создание...' : 'Создать цель'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
