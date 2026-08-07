'use client';

import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Cell, PieChart, Pie,
} from 'recharts';
import { TrendingUp, TrendingDown, BarChart2 } from 'lucide-react';
import { LifeTimeAuditWidget } from '@/components/ui/LifeTimeAuditWidget';

function formatMoney(v: number) { return v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v); }

type MonthData = { month: string; income: number; expense: number };
type CategoryData = { name: string; color: string; amount: number };

export function AnalyticsClient({ data }: { data: { monthlyData: MonthData[]; topCategories: CategoryData[] } }) {
  const { monthlyData, topCategories } = data;

  const lastMonth = monthlyData[monthlyData.length - 1] || { income: 0, expense: 0 };
  const totalIncome = monthlyData.reduce((s, m) => s + m.income, 0);
  const totalExpense = monthlyData.reduce((s, m) => s + m.expense, 0);
  const savings = totalIncome - totalExpense;

  const pieData = topCategories.map((c) => ({ name: c.name, value: c.amount, fill: c.color }));
  const maxExpense = Math.max(...topCategories.map((c) => c.amount), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zen-900 dark:text-zen-100">Аналитика & Life Time</h1>
        <p className="text-xs text-zen-400 mt-0.5">Финансовая аналитика и аудит стоимости вашей жизни</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-income-light dark:bg-income-dark/20 border border-income/20 rounded-card p-4 card-hover">
          <TrendingUp size={16} className="text-income mb-1" />
          <p className="text-xs text-income font-semibold">Доходы</p>
          <p className="text-xl font-bold text-income">{formatMoney(totalIncome)}</p>
          <p className="text-[10px] text-income/70">сум за 6 мес.</p>
        </div>
        <div className="bg-expense-light dark:bg-expense-dark/20 border border-expense/20 rounded-card p-4 card-hover">
          <TrendingDown size={16} className="text-expense mb-1" />
          <p className="text-xs text-expense font-semibold">Расходы</p>
          <p className="text-xl font-bold text-expense">{formatMoney(totalExpense)}</p>
          <p className="text-[10px] text-expense/70">сум за 6 мес.</p>
        </div>
        <div className={`${savings >= 0 ? 'bg-[#0066FF]/15 border-[#0066FF]/30' : 'bg-expense-light dark:bg-expense-dark/20 border-expense/20'} border rounded-card p-4 card-hover`}>
          <BarChart2 size={16} className={savings >= 0 ? 'text-[#0066FF] mb-1' : 'text-expense mb-1'} />
          <p className={`text-xs font-semibold ${savings >= 0 ? 'text-[#0066FF]' : 'text-expense'}`}>Баланс</p>
          <p className={`text-xl font-bold ${savings >= 0 ? 'text-[#0066FF]' : 'text-expense'}`}>{formatMoney(Math.abs(savings))}</p>
          <p className={`text-[10px] opacity-70 ${savings >= 0 ? 'text-[#0066FF]' : 'text-expense'}`}>{savings >= 0 ? 'накоплено' : 'дефицит'}</p>
        </div>
      </div>

      {/* Novel 'Four Thousand Weeks' Life Time & Cost of Time Widget */}
      <LifeTimeAuditWidget monthlyIncome={lastMonth.income || 10000000} />

      {/* Bar Chart */}
      <div className="bg-white dark:bg-[#131C2E] border border-zen-200 dark:border-zen-800/80 rounded-card p-5 shadow-apple card-hover">
        <h2 className="text-sm font-bold text-zen-900 dark:text-zen-100 mb-4">Доходы и расходы по месяцам</h2>
        {monthlyData.every((m) => m.income === 0 && m.expense === 0) ? (
          <div className="text-center py-8 text-zen-400 text-sm">Нет данных для отображения</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }} barCategoryGap="30%">
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={formatMoney} />
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

      {/* Top Categories */}
      <div className="bg-white dark:bg-[#131C2E] border border-zen-200 dark:border-zen-800/80 rounded-card p-5 shadow-apple card-hover">
        <h2 className="text-sm font-bold text-zen-900 dark:text-zen-100 mb-4">Топ категорий расходов (текущий месяц)</h2>
        {topCategories.length === 0 ? (
          <div className="text-center py-8 text-zen-400 text-sm">Нет расходов в этом месяце</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6 items-center">
            <div className="space-y-3">
              {topCategories.map((cat, i) => (
                <div key={i}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-zen-700 dark:text-zen-300">{cat.name}</span>
                    <span className="text-xs font-bold text-zen-900 dark:text-zen-100">{cat.amount.toLocaleString('ru-RU')} сум</span>
                  </div>
                  <div className="w-full bg-zen-100 dark:bg-zen-800 rounded-full h-2">
                    <div className="h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(cat.amount / maxExpense) * 100}%`, backgroundColor: cat.color }} />
                  </div>
                </div>
              ))}
            </div>
            {pieData.length > 0 && (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={40}>
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => v.toLocaleString('ru-RU')} contentStyle={{ borderRadius: 12, background: '#1E293B', borderColor: '#334155', color: '#F8FAFC', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        )}
      </div>

      {/* Last Month Detail */}
      <div className="bg-white dark:bg-[#131C2E] border border-zen-200 dark:border-zen-800/80 rounded-card p-5 shadow-apple card-hover">
        <h2 className="text-sm font-bold text-zen-900 dark:text-zen-100 mb-3">Последний месяц</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-zen-400">Доходы</p>
            <p className="text-2xl font-bold text-income">{lastMonth.income.toLocaleString('ru-RU')} сум</p>
          </div>
          <div>
            <p className="text-xs text-zen-400">Расходы</p>
            <p className="text-2xl font-bold text-expense">{lastMonth.expense.toLocaleString('ru-RU')} сум</p>
          </div>
        </div>
        <div className="mt-3 w-full bg-zen-100 dark:bg-zen-800 rounded-full h-2.5">
          <div className="h-2.5 rounded-full bg-income transition-all"
            style={{ width: `${lastMonth.income + lastMonth.expense > 0 ? (lastMonth.income / (lastMonth.income + lastMonth.expense)) * 100 : 0}%` }} />
        </div>
      </div>
    </div>
  );
}
