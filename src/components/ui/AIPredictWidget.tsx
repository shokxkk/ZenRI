'use client';

import React, { useState } from 'react';
import { Sparkles, TrendingUp, Zap, ChevronRight, Gift, ShieldCheck, Target } from 'lucide-react';
import Link from 'next/link';

function formatMoney(val: number) {
  return val.toLocaleString('ru-RU');
}

interface AIPredictWidgetProps {
  monthlyIncome?: number;
  monthlyExpense?: number;
  topCategoryName?: string;
  topCategoryAmount?: number;
}

export const AIPredictWidget: React.FC<AIPredictWidgetProps> = ({
  monthlyIncome = 0,
  monthlyExpense = 0,
  topCategoryName = 'Расходы',
  topCategoryAmount = 0,
}) => {
  const [reducePct, setReducePct] = useState(15);
  const [selectedMonths, setSelectedMonths] = useState(6);

  const hasData = monthlyIncome > 0 || monthlyExpense > 0;

  // Math Calculations
  const monthlySavings = Math.max(0, monthlyIncome - monthlyExpense);
  const base6MonthsSavings = monthlySavings * selectedMonths;

  // Optimized Savings Math
  const monthlyCategorySaving = (topCategoryAmount * reducePct) / 100;
  const periodExtraSavings = monthlyCategorySaving * selectedMonths;
  const totalOptimizedSavings = base6MonthsSavings + periodExtraSavings;

  return (
    <div className="bg-white dark:bg-gradient-to-br dark:from-[#0D182E] dark:via-[#111F3C] dark:to-[#0A1224] rounded-card p-6 text-slate-800 dark:text-white border border-slate-200/90 dark:border-[#0066FF]/30 shadow-apple relative overflow-hidden space-y-5 card-hover">
      {/* Decorative Glowing Backdrop */}
      <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-[#0066FF]/10 dark:bg-[#0066FF]/20 blur-[90px] pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-[#EC4899]/10 dark:bg-[#EC4899]/15 blur-[90px] pointer-events-none" />

      {/* Header Badge */}
      <div className="flex items-center justify-between z-10 relative">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0066FF] to-[#00C2FF] flex items-center justify-center shadow-glow">
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold tracking-wide uppercase text-slate-900 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-white dark:via-zen-100 dark:to-[#00C2FF]">
              AI Predict Pro + Хотелки Скоринг
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-zen-400">Умный прогноз накопительного потенциала и целей</p>
          </div>
        </div>

        {/* Month selector pills */}
        {hasData && (
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-zen-900/80 p-1 rounded-xl border border-slate-200 dark:border-zen-800">
            {[3, 6, 12].map((m) => (
              <button
                key={m}
                onClick={() => setSelectedMonths(m)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  selectedMonths === m
                    ? 'bg-[#0066FF] text-white shadow-sm'
                    : 'text-slate-600 dark:text-zen-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {m} мес.
              </button>
            ))}
          </div>
        )}
      </div>

      {!hasData ? (
        <div className="p-6 rounded-2xl bg-slate-50 dark:bg-zen-900/50 border border-slate-200 dark:border-zen-800 text-center relative z-10 space-y-2">
          <Sparkles size={28} className="mx-auto text-[#0066FF] dark:text-[#00C2FF] opacity-70" />
          <p className="text-sm font-bold text-slate-900 dark:text-white">AI Predict Pro ожидает ввод первых операций</p>
          <p className="text-xs text-slate-500 dark:text-zen-400 max-w-md mx-auto">
            Добавьте доходы или расходы (голосом или вручную), чтобы нейросеть построила индивидуальный прогноз накопительного тренда и скоринг целей.
          </p>
        </div>
      ) : (
        <>
          {/* Main Grid: Trend & Wishlist AI Scoring */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
            {/* Scenario 1: Current Trend Prediction */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zen-900/70 border border-slate-200/80 dark:border-zen-800/80 backdrop-blur-md flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-zen-400 mb-1">
                  <TrendingUp size={14} className="text-income" />
                  <span>Прогноз накопительного тренда</span>
                </div>
                <span className="text-[10px] text-slate-500 dark:text-zen-400 block uppercase mt-2">Через {selectedMonths} месяцев накопишь:</span>
                <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                  {formatMoney(base6MonthsSavings)} <span className="text-sm font-normal text-slate-500 dark:text-zen-400">сум</span>
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-zen-800 flex items-center justify-between text-xs">
                <span className="text-[11px] text-emerald-600 dark:text-income font-bold flex items-center gap-1">
                  <ShieldCheck size={13} /> +33% норма накопления
                </span>
              </div>
            </div>

            {/* Scenario 2: Optimization AI Scoring */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#8B5CF6]/10 via-[#0066FF]/10 to-transparent dark:from-[#8B5CF6]/20 dark:via-[#0066FF]/20 border border-[#8B5CF6]/30 backdrop-blur-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#8B5CF6]">
                    <Zap size={14} className="text-[#8B5CF6]" />
                    <span>AI Анализ накоплений</span>
                  </div>

                  <span className="px-2 py-0.5 rounded-full bg-[#8B5CF6]/15 text-[#8B5CF6] text-[10px] font-extrabold">
                    Скоринг активности
                  </span>
                </div>

                <div className="mt-2 space-y-1">
                  <p className="text-xs text-slate-600 dark:text-zen-300 font-medium">
                    Текущее накопление в месяц: <strong className="text-slate-900 dark:text-white">{formatMoney(monthlySavings)} сум</strong>
                  </p>
                </div>
              </div>

              <div className="mt-3 p-2.5 rounded-xl bg-slate-100/90 dark:bg-zen-950/70 border border-slate-200 dark:border-zen-800 text-[11px] text-slate-700 dark:text-zen-300 space-y-1">
                <p className="flex items-center gap-1 font-semibold text-[#8B5CF6]">
                  <Sparkles size={12} /> AI Status: <span className="text-emerald-600 dark:text-emerald-400 font-bold">Баланс активен</span>
                </p>
                <p className="text-[10px] text-slate-500 dark:text-zen-400">
                  Расчёт сформирован на основе ваших реальных операций.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Action bar */}
          <div className="flex items-center justify-between pt-1 text-xs text-slate-500 dark:text-zen-400 relative z-10">
            <span className="text-[11px]">Расчёт основан на ваших реальных доходах и расходах</span>
            <Link
              href="/ai"
              className="flex items-center gap-1 text-[#0066FF] font-bold hover:underline text-xs"
            >
              Задать вопрос AI <ChevronRight size={14} />
            </Link>
          </div>
        </>
      )}
    </div>
  );
};
