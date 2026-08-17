'use client';

import React, { useState } from 'react';
import { Sparkles, TrendingUp, Zap, ChevronRight, ShieldCheck, AlertCircle, ArrowUpRight, PiggyBank } from 'lucide-react';
import Link from 'next/link';

function formatMoney(val: number) {
  return Math.round(val).toLocaleString('ru-RU');
}

interface AIPredictWidgetProps {
  totalBalance?: number;
  monthlyIncome?: number;
  monthlyExpense?: number;
  topCategoryName?: string;
  topCategoryAmount?: number;
}

export const AIPredictWidget: React.FC<AIPredictWidgetProps> = ({
  totalBalance = 0,
  monthlyIncome = 0,
  monthlyExpense = 0,
  topCategoryName = 'Основные траты',
  topCategoryAmount = 0,
}) => {
  const [reducePct, setReducePct] = useState(15);
  const [selectedMonths, setSelectedMonths] = useState(6);

  const hasFinancialData = totalBalance > 0 || monthlyIncome > 0 || monthlyExpense > 0;

  // Monthly Net Savings
  const netMonthlyCashflow = monthlyIncome - monthlyExpense;
  const isPositiveSaving = netMonthlyCashflow > 0;

  // Projected savings over selected months
  const projectedExtraSavings = isPositiveSaving ? netMonthlyCashflow * selectedMonths : 0;
  const projectedTotalBalance = Math.max(0, totalBalance + netMonthlyCashflow * selectedMonths);

  // Savings rate
  const savingsRate = monthlyIncome > 0 ? Math.round((netMonthlyCashflow / monthlyIncome) * 100) : 0;

  // Optimization potential in top category
  const monthlyCategorySaving = (topCategoryAmount * reducePct) / 100;
  const periodExtraOptimization = monthlyCategorySaving * selectedMonths;

  return (
    <div className="bg-white dark:bg-gradient-to-br dark:from-[#0D182E] dark:via-[#111F3C] dark:to-[#0A1224] rounded-card p-5 sm:p-6 text-slate-800 dark:text-white border border-slate-200/90 dark:border-[#0066FF]/30 shadow-apple relative overflow-hidden space-y-4 sm:space-y-5 card-hover">
      {/* Decorative Glowing Backdrop */}
      <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-[#0066FF]/10 dark:bg-[#0066FF]/20 blur-[90px] pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-[#EC4899]/10 dark:bg-[#EC4899]/15 blur-[90px] pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 z-10 relative">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#0066FF] to-[#00C2FF] flex items-center justify-center shadow-glow flex-shrink-0">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold tracking-wide text-slate-900 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-white dark:via-zen-100 dark:to-[#00C2FF]">
                ИИ Прогноз накоплений и бюджета
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-[#0066FF]/15 text-[#0066FF] dark:text-[#00C2FF] text-[10px] font-extrabold">
                ИИ Анализ
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-zen-400 mt-0.5">
              Умный расчёт финансового потенциала на основе ваших счетов и операций
            </p>
          </div>
        </div>

        {/* Horizon selector pills */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-zen-900/80 p-1 rounded-xl border border-slate-200 dark:border-zen-800 self-start sm:self-auto">
          {[3, 6, 12].map((m) => (
            <button
              key={m}
              onClick={() => setSelectedMonths(m)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                selectedMonths === m
                  ? 'bg-[#0066FF] text-white shadow-sm'
                  : 'text-slate-600 dark:text-zen-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {m} мес.
            </button>
          ))}
        </div>
      </div>

      {!hasFinancialData ? (
        <div className="p-6 rounded-2xl bg-slate-50 dark:bg-zen-900/50 border border-slate-200 dark:border-zen-800 text-center relative z-10 space-y-2">
          <Sparkles size={28} className="mx-auto text-[#0066FF] dark:text-[#00C2FF] opacity-70" />
          <p className="text-sm font-bold text-slate-900 dark:text-white">
            ИИ ожидает ввода первых финансовых операций
          </p>
          <p className="text-xs text-slate-500 dark:text-zen-400 max-w-md mx-auto">
            Добавьте ваши счета, доходы или расходы, чтобы искусственный интеллект построил индивидуальный прогноз накоплений.
          </p>
        </div>
      ) : (
        <>
          {/* Main Grid: 2 Scenario Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
            {/* Scenario 1: Forecast Trend */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zen-900/70 border border-slate-200/80 dark:border-zen-800/80 backdrop-blur-md flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <TrendingUp size={15} />
                    <span>Прогноз на {selectedMonths} {selectedMonths === 3 ? 'месяца' : 'месяцев'}</span>
                  </div>
                  {isPositiveSaving && savingsRate > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold flex items-center gap-1">
                      <ShieldCheck size={12} /> {savingsRate}% норма сбережений
                    </span>
                  )}
                </div>

                <div className="mt-3">
                  <span className="text-[10px] text-slate-500 dark:text-zen-400 block uppercase font-semibold">
                    {isPositiveSaving ? `Будет отложено за ${selectedMonths} мес:` : 'Ожидаемый капитал на счетах:'}
                  </span>
                  <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                    {formatMoney(isPositiveSaving ? projectedExtraSavings : projectedTotalBalance)}{' '}
                    <span className="text-xs font-normal text-slate-500 dark:text-zen-400">сум</span>
                  </p>
                </div>
              </div>

              <div className="pt-2.5 border-t border-slate-200/60 dark:border-zen-800/80 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-600 dark:text-zen-300 font-medium">
                  {isPositiveSaving
                    ? `Итоговый баланс: ~${formatMoney(projectedTotalBalance)} сум`
                    : monthlyIncome === 0
                    ? `Баланс на счетах: ${formatMoney(totalBalance)} сум`
                    : 'Внимание: расходы превышают доходы'}
                </span>
                <PiggyBank size={15} className="text-[#0066FF]" />
              </div>
            </div>

            {/* Scenario 2: AI Budget Analysis & Optimization */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#8B5CF6]/10 via-[#0066FF]/10 to-transparent dark:from-[#8B5CF6]/20 dark:via-[#0066FF]/20 border border-[#8B5CF6]/30 backdrop-blur-md flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#8B5CF6]">
                    <Zap size={15} />
                    <span>ИИ Оценка потенциала</span>
                  </div>

                  <span className="px-2 py-0.5 rounded-full bg-[#8B5CF6]/15 text-[#8B5CF6] text-[10px] font-extrabold">
                    {isPositiveSaving ? 'Темп активен' : 'Требует внимания'}
                  </span>
                </div>

                <div className="mt-2 space-y-1">
                  <p className="text-xs text-slate-600 dark:text-zen-300 font-medium">
                    Чистый остаток в месяц:{' '}
                    <strong className={isPositiveSaving ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}>
                      {isPositiveSaving ? `+${formatMoney(netMonthlyCashflow)}` : `${formatMoney(netMonthlyCashflow)}`} сум
                    </strong>
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-zen-400">
                    Доходы: +{formatMoney(monthlyIncome)} сум • Расходы: −{formatMoney(monthlyExpense)} сум
                  </p>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-100/90 dark:bg-zen-950/70 border border-slate-200 dark:border-zen-800 text-[11px] text-slate-700 dark:text-zen-300 space-y-1">
                <p className="flex items-center gap-1 font-semibold text-[#8B5CF6]">
                  <Sparkles size={12} /> ИИ Совет:
                </p>
                <p className="text-[10px] text-slate-600 dark:text-zen-400 leading-relaxed">
                  {isPositiveSaving
                    ? `Вы откладываете ~${savingsRate}% доходов. При сохранении текущего темпа вы легко достигнете поставленных финансовых целей.`
                    : monthlyIncome === 0
                    ? `Внесите ваши источники доходов в ZenRI, чтобы ИИ рассчитал скорость достижения ваших целей.`
                    : `Расходы превышают доходы на ${formatMoney(Math.abs(netMonthlyCashflow))} сум. Сократите необязательные траты в категории «${topCategoryName}».`}
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Action bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-xs text-slate-500 dark:text-zen-400 relative z-10 border-t border-slate-100 dark:border-zen-800/60">
            <span className="text-[11px]">
              Расчёт сформирован на основе ваших реальных счетов и операций текущего месяца.
            </span>
            <Link
              href="/ai"
              className="flex items-center gap-1 text-[#0066FF] font-bold hover:underline text-xs flex-shrink-0"
            >
              Задать вопрос ИИ-помощнику <ChevronRight size={14} />
            </Link>
          </div>
        </>
      )}
    </div>
  );
};
