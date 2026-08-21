'use client';

import React, { useState, useTransition } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from 'recharts';
import {
  TrendingUp, TrendingDown, BarChart2, Sparkles, Loader2, RefreshCw,
  PiggyBank, Zap,
} from 'lucide-react';
import { LifeTimeAuditWidget } from '@/components/ui/LifeTimeAuditWidget';
import { askChatGPT, Message } from '@/app/actions/aiActions';

function fmt(v: number) {
  return v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(Math.round(v));
}

type CatData = { name: string; color: string; amount: number; percent: number };

interface FullAnalyticsData {
  monthlyData: { month: string; income: number; expense: number }[];
  topExpenseCategories: CatData[];
  topIncomeCategories: CatData[];
  totalExpenseMonth: number;
  totalIncomeMonth: number;
  lastMonth: { income: number; expense: number; month: string };
  totalIncome6m: number;
  totalExpense6m: number;
  savingsRate: number;
}

const TABS = ['Обзор', 'Расходы', 'Доходы', 'ИИ Инсайты'] as const;
type Tab = (typeof TABS)[number];

export function AnalyticsClient({ data }: { data: FullAnalyticsData }) {
  const {
    monthlyData, topExpenseCategories, topIncomeCategories,
    totalExpenseMonth, totalIncomeMonth,
    lastMonth, totalIncome6m, totalExpense6m, savingsRate,
  } = data;

  const [activeTab, setActiveTab] = useState<Tab>('Обзор');
  const [aiInsight, setAiInsight] = useState<string>('');
  const [isPending, startTransition] = useTransition();

  const handleGenerateInsight = () => {
    startTransition(async () => {
      const topExpStr = topExpenseCategories.slice(0, 5)
        .map((c) => `${c.name}: ${c.amount.toLocaleString('ru-RU')} сум (${c.percent}%)`)
        .join(', ');
      const topIncStr = topIncomeCategories.slice(0, 3)
        .map((c) => `${c.name}: ${c.amount.toLocaleString('ru-RU')} сум`)
        .join(', ');

      const messages: Message[] = [{
        role: 'user',
        content: `Ты — финансовый аналитик ZenRI. Проанализируй расходы пользователя за текущий месяц и дай конкретные советы.

Доходы этого месяца: ${totalIncomeMonth.toLocaleString('ru-RU')} сум
Расходы этого месяца: ${totalExpenseMonth.toLocaleString('ru-RU')} сум
Топ категории расходов: ${topExpStr || 'нет данных'}
Источники дохода: ${topIncStr || 'нет данных'}
Норма сбережений за 6 мес: ${savingsRate}%

Напиши краткий анализ (5-7 предложений):
1. Что занимает наибольшую долю расходов и как это оценить
2. На чём можно сэкономить конкретно
3. Один конкретный совет по оптимизации
Пиши без markdown символов, живо и по делу.`,
      }];

      const customKey = typeof window !== 'undefined' ? localStorage.getItem('zenri_custom_openai_key') || undefined : undefined;
      const reply = await askChatGPT(messages, customKey);
      setAiInsight(reply.replace(/#{1,6}\s?/g, '').replace(/\*\*/g, '').replace(/\*/g, ''));
    });
  };

  const expensePieData = topExpenseCategories.map((c) => ({ name: c.name, value: c.amount, fill: c.color }));
  const incomePieData = topIncomeCategories.map((c) => ({ name: c.name, value: c.amount, fill: c.color }));
  const savings6m = totalIncome6m - totalExpense6m;

  const COLORS_FALLBACK = ['#0066FF', '#10B981', '#F97316', '#8B5CF6', '#EC4899', '#F59E0B', '#06B6D4', '#EF4444'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zen-900 dark:text-zen-100 flex items-center gap-2">
          <BarChart2 className="text-[#0066FF]" size={24} />
          Аналитика & Инсайты
        </h1>
        <p className="text-xs text-zen-400 mt-0.5">Детальная финансовая аналитика с AI-анализом</p>
      </div>

      {/* Summary KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-income-light dark:bg-income-dark/20 border border-income/20 rounded-2xl p-4">
          <TrendingUp size={16} className="text-income mb-1" />
          <p className="text-[10px] text-income font-semibold uppercase">Доходы / мес</p>
          <p className="text-xl font-black text-income">{fmt(totalIncomeMonth)}</p>
          <p className="text-[10px] text-income/60">текущий месяц</p>
        </div>
        <div className="bg-expense-light dark:bg-expense-dark/20 border border-expense/20 rounded-2xl p-4">
          <TrendingDown size={16} className="text-expense mb-1" />
          <p className="text-[10px] text-expense font-semibold uppercase">Расходы / мес</p>
          <p className="text-xl font-black text-expense">{fmt(totalExpenseMonth)}</p>
          <p className="text-[10px] text-expense/60">текущий месяц</p>
        </div>
        <div className={`${savingsRate >= 0 ? 'bg-[#0066FF]/10 border-[#0066FF]/20' : 'bg-expense-light border-expense/20'} border rounded-2xl p-4`}>
          <PiggyBank size={16} className={savingsRate >= 0 ? 'text-[#0066FF] mb-1' : 'text-expense mb-1'} />
          <p className={`text-[10px] font-semibold uppercase ${savingsRate >= 0 ? 'text-[#0066FF]' : 'text-expense'}`}>Норма сбережений</p>
          <p className={`text-xl font-black ${savingsRate >= 0 ? 'text-[#0066FF]' : 'text-expense'}`}>{savingsRate}%</p>
          <p className="text-[10px] text-zen-400">за 6 месяцев</p>
        </div>
        <div className={`${savings6m >= 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-expense-light border-expense/20'} border rounded-2xl p-4`}>
          <BarChart2 size={16} className={savings6m >= 0 ? 'text-emerald-500 mb-1' : 'text-expense mb-1'} />
          <p className={`text-[10px] font-semibold uppercase ${savings6m >= 0 ? 'text-emerald-500' : 'text-expense'}`}>
            {savings6m >= 0 ? 'Накоплено' : 'Дефицит'}
          </p>
          <p className={`text-xl font-black ${savings6m >= 0 ? 'text-emerald-500' : 'text-expense'}`}>{fmt(Math.abs(savings6m))}</p>
          <p className="text-[10px] text-zen-400">сум за 6 мес</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-1 bg-zen-100 dark:bg-zen-900 p-1 rounded-2xl border border-zen-200 dark:border-zen-800">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
              activeTab === tab
                ? tab === 'ИИ Инсайты'
                  ? 'bg-gradient-to-r from-violet-600 to-[#0066FF] text-white shadow-sm'
                  : 'bg-[#0066FF] text-white shadow-sm'
                : 'text-zen-500 hover:text-zen-200'
            }`}
          >
            {tab === 'ИИ Инсайты' && <Sparkles size={12} className="inline mr-1" />}
            {tab}
          </button>
        ))}
      </div>

      {/* ─── TAB: ОБЗОР ─── */}
      {activeTab === 'Обзор' && (
        <div className="space-y-5">
          {/* Bar chart: income vs expense */}
          <div className="bg-white dark:bg-[#131C2E] border border-zen-200 dark:border-zen-800/80 rounded-2xl p-5 shadow-apple">
            <h2 className="text-sm font-bold text-zen-900 dark:text-zen-100 mb-4">Доходы и расходы по месяцам</h2>
            {monthlyData.every((m) => m.income === 0 && m.expense === 0) ? (
              <div className="text-center py-10 text-zen-400 text-sm">Нет данных для отображения</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthlyData} barCategoryGap="30%" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={fmt} />
                  <Tooltip
                    formatter={(value: number) => [`${value.toLocaleString('ru-RU')} сум`]}
                    contentStyle={{ borderRadius: 16, background: '#1E293B', borderColor: '#334155', color: '#F8FAFC', fontSize: 12 }}
                  />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="income" name="Доходы" fill="#10B981" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="expense" name="Расходы" fill="#EF4444" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Savings Rate bar */}
          <div className="bg-white dark:bg-[#131C2E] border border-zen-200 dark:border-zen-800/80 rounded-2xl p-5 shadow-apple">
            <h2 className="text-sm font-bold text-zen-900 dark:text-zen-100 mb-1">Последний месяц — {lastMonth.month}</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs text-zen-400">Доходы</p>
                <p className="text-xl font-black text-income">{lastMonth.income.toLocaleString('ru-RU')} сум</p>
              </div>
              <div>
                <p className="text-xs text-zen-400">Расходы</p>
                <p className="text-xl font-black text-expense">{lastMonth.expense.toLocaleString('ru-RU')} сум</p>
              </div>
            </div>
            <div className="w-full bg-zen-100 dark:bg-zen-800 rounded-full h-3 overflow-hidden">
              <div
                className="h-3 rounded-full bg-gradient-to-r from-income to-emerald-400 transition-all duration-700"
                style={{ width: `${lastMonth.income + lastMonth.expense > 0 ? (lastMonth.income / (lastMonth.income + lastMonth.expense)) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Life Time Audit */}
          <LifeTimeAuditWidget monthlyIncome={lastMonth.income || 10_000_000} />
        </div>
      )}

      {/* ─── TAB: РАСХОДЫ ─── */}
      {activeTab === 'Расходы' && (
        <div className="space-y-5">
          {topExpenseCategories.length === 0 ? (
            <div className="text-center py-16 text-zen-400">
              <TrendingDown size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Нет расходов в этом месяце</p>
              <p className="text-xs mt-1">Добавьте первую транзакцию через кнопку ➕</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-5">
              {/* Donut */}
              <div className="bg-white dark:bg-[#131C2E] border border-zen-200 dark:border-zen-800/80 rounded-2xl p-5 shadow-apple flex flex-col items-center">
                <h2 className="text-sm font-bold text-zen-900 dark:text-zen-100 mb-3 self-start">Структура расходов</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={expensePieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={44}>
                      {expensePieData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill || COLORS_FALLBACK[i % COLORS_FALLBACK.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: number, name: string) => [`${v.toLocaleString('ru-RU')} сум`, name]}
                      contentStyle={{ borderRadius: 12, background: '#1E293B', borderColor: '#334155', color: '#F8FAFC', fontSize: 11 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <p className="text-xs text-zen-400 mt-1">Итого: {totalExpenseMonth.toLocaleString('ru-RU')} сум</p>
              </div>

              {/* Ranked list */}
              <div className="bg-white dark:bg-[#131C2E] border border-zen-200 dark:border-zen-800/80 rounded-2xl p-5 shadow-apple">
                <h2 className="text-sm font-bold text-zen-900 dark:text-zen-100 mb-4">Топ категорий</h2>
                <div className="space-y-3">
                  {topExpenseCategories.map((cat, i) => (
                    <div key={i}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-zen-700 dark:text-zen-200 flex items-center gap-2">
                          <span className="text-[10px] font-black text-zen-400 w-4">{i + 1}.</span>
                          {cat.name}
                        </span>
                        <div className="text-right">
                          <span className="text-xs font-black text-zen-900 dark:text-zen-100">{cat.amount.toLocaleString('ru-RU')}</span>
                          <span className="text-[10px] text-zen-400 ml-1">({cat.percent}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-zen-100 dark:bg-zen-800 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all duration-700"
                          style={{ width: `${cat.percent}%`, backgroundColor: cat.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB: ДОХОДЫ ─── */}
      {activeTab === 'Доходы' && (
        <div className="space-y-5">
          {topIncomeCategories.length === 0 ? (
            <div className="text-center py-16 text-zen-400">
              <TrendingUp size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Нет доходов в этом месяце</p>
              <p className="text-xs mt-1">Добавьте доход через кнопку ➕</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-5">
              {/* Donut */}
              <div className="bg-white dark:bg-[#131C2E] border border-zen-200 dark:border-zen-800/80 rounded-2xl p-5 shadow-apple flex flex-col items-center">
                <h2 className="text-sm font-bold text-zen-900 dark:text-zen-100 mb-3 self-start">Источники дохода</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={incomePieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={44}>
                      {incomePieData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill || COLORS_FALLBACK[i % COLORS_FALLBACK.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: number, name: string) => [`${v.toLocaleString('ru-RU')} сум`, name]}
                      contentStyle={{ borderRadius: 12, background: '#1E293B', borderColor: '#334155', color: '#F8FAFC', fontSize: 11 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <p className="text-xs text-zen-400 mt-1">Итого: {totalIncomeMonth.toLocaleString('ru-RU')} сум</p>
              </div>

              {/* Ranked list */}
              <div className="bg-white dark:bg-[#131C2E] border border-zen-200 dark:border-zen-800/80 rounded-2xl p-5 shadow-apple">
                <h2 className="text-sm font-bold text-zen-900 dark:text-zen-100 mb-4">Источники дохода</h2>
                <div className="space-y-3">
                  {topIncomeCategories.map((cat, i) => (
                    <div key={i}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-zen-700 dark:text-zen-200 flex items-center gap-2">
                          <span className="text-[10px] font-black text-zen-400 w-4">{i + 1}.</span>
                          {cat.name}
                        </span>
                        <div className="text-right">
                          <span className="text-xs font-black text-zen-900 dark:text-zen-100">{cat.amount.toLocaleString('ru-RU')}</span>
                          <span className="text-[10px] text-zen-400 ml-1">({cat.percent}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-zen-100 dark:bg-zen-800 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all duration-700"
                          style={{ width: `${cat.percent}%`, backgroundColor: cat.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB: ИИ ИНСАЙТЫ ─── */}
      {activeTab === 'ИИ Инсайты' && (
        <div className="space-y-5">
          {/* Quick stats for AI */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white dark:bg-[#131C2E] border border-zen-200 dark:border-zen-800/80 rounded-2xl p-4">
              <p className="text-[10px] text-zen-400 uppercase font-bold mb-1">Самая большая статья</p>
              <p className="text-sm font-black text-zen-900 dark:text-zen-100">
                {topExpenseCategories[0]?.name || '—'}
              </p>
              <p className="text-xs text-expense font-bold">
                {topExpenseCategories[0]?.amount.toLocaleString('ru-RU') ?? 0} сум
              </p>
            </div>
            <div className="bg-white dark:bg-[#131C2E] border border-zen-200 dark:border-zen-800/80 rounded-2xl p-4">
              <p className="text-[10px] text-zen-400 uppercase font-bold mb-1">Главный источник дохода</p>
              <p className="text-sm font-black text-zen-900 dark:text-zen-100">
                {topIncomeCategories[0]?.name || '—'}
              </p>
              <p className="text-xs text-income font-bold">
                {topIncomeCategories[0]?.amount.toLocaleString('ru-RU') ?? 0} сум
              </p>
            </div>
          </div>

          {/* AI Insight Card */}
          <div className="bg-gradient-to-br from-[#0066FF]/10 via-violet-600/10 to-transparent border border-[#0066FF]/30 rounded-2xl p-6 shadow-apple">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#0066FF] to-violet-600 flex items-center justify-center shadow-glow">
                <Sparkles size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-sm font-black text-zen-900 dark:text-zen-100">ИИ Финансовый Анализ</h3>
                <p className="text-[10px] text-zen-400">Персональный разбор ваших трат от ChatGPT</p>
              </div>
            </div>

            {aiInsight ? (
              <div className="text-sm text-zen-700 dark:text-zen-200 leading-relaxed whitespace-pre-wrap bg-white/30 dark:bg-black/20 rounded-xl p-4 border border-white/20">
                {aiInsight}
              </div>
            ) : (
              <div className="text-center py-6">
                <Zap size={32} className="mx-auto mb-3 text-[#0066FF] opacity-60" />
                <p className="text-sm text-zen-500 dark:text-zen-400 mb-4">
                  Нажмите кнопку ниже, чтобы ИИ проанализировал на что уходит больше всего денег в этом месяце и что можно оптимизировать.
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={handleGenerateInsight}
              disabled={isPending}
              className="w-full mt-4 py-3.5 rounded-xl bg-gradient-to-r from-[#0066FF] to-violet-600 hover:from-[#0052CC] hover:to-violet-700 text-white text-sm font-black shadow-glow transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isPending ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Анализирую ваши финансы...
                </>
              ) : aiInsight ? (
                <>
                  <RefreshCw size={16} />
                  Обновить анализ
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Получить ИИ Анализ расходов
                </>
              )}
            </button>
          </div>

          {/* Detailed category breakdown for AI tab */}
          {topExpenseCategories.length > 0 && (
            <div className="bg-white dark:bg-[#131C2E] border border-zen-200 dark:border-zen-800/80 rounded-2xl p-5 shadow-apple">
              <h3 className="text-sm font-bold text-zen-900 dark:text-zen-100 mb-4">
                Разбивка расходов по категориям
              </h3>
              <div className="space-y-2.5">
                {topExpenseCategories.map((cat, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                    <span className="flex-1 text-xs text-zen-700 dark:text-zen-300">{cat.name}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-zen-100 dark:bg-zen-800 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full" style={{ width: `${cat.percent}%`, backgroundColor: cat.color }} />
                      </div>
                      <span className="text-xs font-black text-zen-900 dark:text-zen-100 w-8 text-right">{cat.percent}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
