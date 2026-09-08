'use client';

import React, { useState, useTransition } from 'react';
import {
  Briefcase, Plus, TrendingUp, TrendingDown, DollarSign,
  BarChart3, Edit2, Trash2, ChevronRight, Building2, X
} from 'lucide-react';
import { createBusiness, deleteBusiness } from '@/app/actions/businessActions';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/ToastProvider';

const PERIOD_LABELS: Record<string, string> = {
  day: 'Сегодня',
  week: 'Неделя',
  month: 'Месяц',
  quarter: 'Квартал',
  '6months': '6 месяцев',
  year: 'Год',
};

const BUSINESS_COLORS = [
  '#0066FF', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#F97316', '#84CC16', '#6366F1',
];

const BUSINESS_ICONS = [
  'briefcase', 'building-2', 'store', 'factory', 'truck',
  'restaurant', 'laptop', 'shopping-bag', 'trending-up', 'dollar-sign',
];

function formatMoney(n: number) {
  return n.toLocaleString('ru-RU');
}

interface Business {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  totalIncome: number;
  totalExpense: number;
  profit: number;
}

interface Props {
  businesses: Business[];
  summary: { totalIncome: number; totalExpense: number; totalProfit: number };
  personal: { totalIncome: number; totalExpense: number; balance: number; topCategories: { name: string; color: string; amount: number; percent: number }[] };
  businesses_list: { id: string; name: string; color: string; icon: string }[];
  period: string;
}

export function BusinessClient({ businesses, summary, personal, period }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [isPending, startTransition] = useTransition();
  const [activePeriod, setActivePeriod] = useState(period);
  const [showNewBusiness, setShowNewBusiness] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newColor, setNewColor] = useState(BUSINESS_COLORS[0]);
  const [activeTab, setActiveTab] = useState<'business' | 'personal'>('business');

  function changePeriod(p: string) {
    setActivePeriod(p);
    router.push(`/business?period=${p}`);
  }

  function handleCreate() {
    if (!newName.trim()) return;
    startTransition(async () => {
      await createBusiness({ name: newName, description: newDesc, color: newColor });
      setShowNewBusiness(false);
      setNewName('');
      setNewDesc('');
      toast.success('Бизнес создан!');
      router.refresh();
    });
  }

  function handleDelete(id: string, name: string) {
    if (!confirm(`Удалить бизнес "${name}"? Транзакции не удалятся, просто отвяжутся от бизнеса.`)) return;
    startTransition(async () => {
      await deleteBusiness(id);
      toast.success(`Бизнес "${name}" удалён`);
      router.refresh();
    });
  }

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Building2 className="w-6 h-6 text-blue-400" />
              Финансы бизнеса
            </h1>
            <p className="text-zinc-400 text-sm mt-1">Учёт доходов и расходов по каждому бизнесу</p>
          </div>
          <button
            onClick={() => setShowNewBusiness(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Добавить бизнес
          </button>
        </div>

        {/* Period Selector */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {Object.entries(PERIOD_LABELS).map(([p, label]) => (
            <button
              key={p}
              onClick={() => changePeriod(p)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activePeriod === p
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Tabs: Business / Personal */}
        <div className="flex gap-1 mb-6 bg-zinc-900 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('business')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'business' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            💼 Мои бизнесы
          </button>
          <button
            onClick={() => setActiveTab('personal')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'personal' ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            👤 Личные финансы
          </button>
        </div>

        {activeTab === 'business' && (
          <>
            {/* All Businesses Summary */}
            {businesses.length > 0 && (
              <div className="bg-gradient-to-br from-blue-900/40 to-zinc-900 border border-blue-800/30 rounded-2xl p-6 mb-6">
                <h2 className="text-sm font-medium text-blue-300 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  ОБЩАЯ СВОДКА — ВСЕ БИЗНЕСЫ за {PERIOD_LABELS[activePeriod]?.toLowerCase()}
                </h2>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-black/20 rounded-xl p-4">
                    <p className="text-xs text-zinc-400 mb-1">Общий доход</p>
                    <p className="text-xl font-bold text-green-400">+{formatMoney(summary.totalIncome)}</p>
                    <p className="text-xs text-zinc-500">сум</p>
                  </div>
                  <div className="bg-black/20 rounded-xl p-4">
                    <p className="text-xs text-zinc-400 mb-1">Общие расходы</p>
                    <p className="text-xl font-bold text-red-400">−{formatMoney(summary.totalExpense)}</p>
                    <p className="text-xs text-zinc-500">сум</p>
                  </div>
                  <div className="bg-black/20 rounded-xl p-4">
                    <p className="text-xs text-zinc-400 mb-1">Общая прибыль</p>
                    <p className={`text-xl font-bold ${summary.totalProfit >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                      {summary.totalProfit >= 0 ? '+' : ''}{formatMoney(summary.totalProfit)}
                    </p>
                    <p className="text-xs text-zinc-500">сум</p>
                  </div>
                </div>
              </div>
            )}

            {/* Business Cards */}
            {businesses.length === 0 ? (
              <div className="text-center py-16 bg-zinc-900/50 rounded-2xl border border-zinc-800">
                <Building2 className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                <h3 className="text-zinc-400 font-medium mb-2">Нет бизнесов</h3>
                <p className="text-zinc-500 text-sm mb-4">Добавьте ваш первый бизнес и начните вести учёт</p>
                <button
                  onClick={() => setShowNewBusiness(true)}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl text-sm font-medium transition-colors"
                >
                  Добавить бизнес
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {businesses.map((b) => {
                  const profitColor = b.profit >= 0 ? 'text-green-400' : 'text-red-400';
                  const profitBg = b.profit >= 0 ? 'bg-green-500/10' : 'bg-red-500/10';
                  return (
                    <div
                      key={b.id}
                      className="bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-2xl p-5 transition-all"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                            style={{ backgroundColor: b.color + '20', border: `1px solid ${b.color}40` }}
                          >
                            💼
                          </div>
                          <div>
                            <h3 className="font-semibold text-white">{b.name}</h3>
                            {b.description && <p className="text-xs text-zinc-500">{b.description}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDelete(b.id, b.name)}
                            className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-zinc-800/50 rounded-xl p-3">
                          <div className="flex items-center gap-1 mb-1">
                            <TrendingUp className="w-3 h-3 text-green-400" />
                            <span className="text-xs text-zinc-400">Доход</span>
                          </div>
                          <p className="font-semibold text-green-400 text-sm">{formatMoney(b.totalIncome)}</p>
                        </div>
                        <div className="bg-zinc-800/50 rounded-xl p-3">
                          <div className="flex items-center gap-1 mb-1">
                            <TrendingDown className="w-3 h-3 text-red-400" />
                            <span className="text-xs text-zinc-400">Расход</span>
                          </div>
                          <p className="font-semibold text-red-400 text-sm">{formatMoney(b.totalExpense)}</p>
                        </div>
                        <div className={`${profitBg} rounded-xl p-3`}>
                          <div className="flex items-center gap-1 mb-1">
                            <DollarSign className="w-3 h-3 text-zinc-400" />
                            <span className="text-xs text-zinc-400">{b.profit >= 0 ? 'Прибыль' : 'Убыток'}</span>
                          </div>
                          <p className={`font-bold text-sm ${profitColor}`}>
                            {b.profit >= 0 ? '+' : ''}{formatMoney(b.profit)}
                          </p>
                        </div>
                      </div>

                      {/* Profit margin bar */}
                      {b.totalIncome > 0 && (
                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-zinc-500 mb-1">
                            <span>Рентабельность</span>
                            <span>{Math.round((b.profit / b.totalIncome) * 100)}%</span>
                          </div>
                          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${b.profit >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                              style={{ width: `${Math.min(100, Math.abs((b.profit / b.totalIncome) * 100))}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {activeTab === 'personal' && (
          <>
            {/* Personal Finances */}
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-900/50 border border-zinc-800 rounded-2xl p-6 mb-6">
              <h2 className="text-sm font-medium text-zinc-300 mb-4">
                👤 ЛИЧНЫЕ ФИНАНСЫ за {PERIOD_LABELS[activePeriod]?.toLowerCase()}
              </h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-zinc-800/50 rounded-xl p-4">
                  <p className="text-xs text-zinc-400 mb-1">Личный доход</p>
                  <p className="text-xl font-bold text-green-400">+{formatMoney(personal.totalIncome)}</p>
                  <p className="text-xs text-zinc-500">сум</p>
                </div>
                <div className="bg-zinc-800/50 rounded-xl p-4">
                  <p className="text-xs text-zinc-400 mb-1">Личные расходы</p>
                  <p className="text-xl font-bold text-red-400">−{formatMoney(personal.totalExpense)}</p>
                  <p className="text-xs text-zinc-500">сум</p>
                </div>
                <div className={`rounded-xl p-4 ${personal.balance >= 0 ? 'bg-blue-900/20' : 'bg-red-900/20'}`}>
                  <p className="text-xs text-zinc-400 mb-1">{personal.balance >= 0 ? 'Остаток' : 'Убыток'}</p>
                  <p className={`text-xl font-bold ${personal.balance >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                    {personal.balance >= 0 ? '+' : ''}{formatMoney(personal.balance)}
                  </p>
                  <p className="text-xs text-zinc-500">сум</p>
                </div>
              </div>
            </div>

            {/* Top Expense Categories */}
            {personal.topCategories.length > 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <h3 className="text-sm font-medium text-zinc-300 mb-4">Личные расходы по категориям</h3>
                <div className="space-y-3">
                  {personal.topCategories.map((cat) => (
                    <div key={cat.name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-zinc-300">{cat.name}</span>
                        <span className="text-zinc-400">{formatMoney(cat.amount)} сум · {cat.percent}%</span>
                      </div>
                      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${cat.percent}%`, backgroundColor: cat.color || '#0066FF' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* New Business Modal */}
      {showNewBusiness && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Новый бизнес</h2>
              <button onClick={() => setShowNewBusiness(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Название бизнеса *</label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Например: Ресторан на Навои"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-blue-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Описание (необязательно)</label>
                <input
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Краткое описание"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 mb-2 block">Цвет</label>
                <div className="flex gap-2 flex-wrap">
                  {BUSINESS_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setNewColor(c)}
                      className={`w-8 h-8 rounded-full transition-all ${newColor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900 scale-110' : ''}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNewBusiness(false)}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl text-sm font-medium transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={handleCreate}
                disabled={!newName.trim() || isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-3 rounded-xl text-sm font-medium transition-colors"
              >
                {isPending ? 'Создание...' : 'Создать'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
