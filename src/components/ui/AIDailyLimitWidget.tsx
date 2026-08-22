'use client';

import React from 'react';
import { Bot, ShieldAlert, CheckCircle2, TrendingDown, Zap, ArrowRight } from 'lucide-react';

interface AIDailyLimitWidgetProps {
  totalBalance: number;
  monthlyExpense: number;
  todayExpense: number;
}

export const AIDailyLimitWidget: React.FC<AIDailyLimitWidgetProps> = ({
  totalBalance,
  monthlyExpense,
  todayExpense,
}) => {
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const currentDay = now.getDate();
  const daysRemaining = Math.max(1, daysInMonth - currentDay + 1);

  // Calculate safe daily limit: (balance - safety buffer) / remaining days
  const minBuffer = 200000;
  const availableBalance = Math.max(0, totalBalance - minBuffer);
  const safeDailyLimit = Math.max(50000, Math.round(availableBalance / daysRemaining));

  const spentToday = Math.max(0, todayExpense);
  const ratio = Math.min(1.5, spentToday / safeDailyLimit);
  const pct = Math.min(100, Math.round((spentToday / safeDailyLimit) * 100));

  const isOver = spentToday > safeDailyLimit;

  return (
    <div className="p-5 rounded-3xl bg-slate-900/90 border border-white/15 backdrop-blur-xl shadow-2xl space-y-4 relative overflow-hidden">
      {/* Ambient Glow */}
      <div
        className={`absolute top-0 right-0 w-36 h-36 rounded-full blur-3xl pointer-events-none ${
          isOver ? 'bg-rose-500/15' : 'bg-emerald-500/15'
        }`}
      />

      {/* Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-[#00C2FF]">
            <Bot size={18} className="animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-extrabold text-white">ИИ-Автопилот Дневного Лимита</h3>
            <p className="text-[10px] text-zen-400">Осталось {daysRemaining} дней в месяце</p>
          </div>
        </div>

        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[11px] font-black ${
            isOver
              ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
              : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
          }`}
        >
          {isOver ? <ShieldAlert size={14} /> : <CheckCircle2 size={14} />}
          <span>{isOver ? 'Лимит превышен!' : 'В пределах нормы'}</span>
        </div>
      </div>

      {/* Progress & Limit Display */}
      <div className="space-y-2 relative z-10">
        <div className="flex justify-between items-end text-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Потрачено за сегодня</span>
            <p className="text-lg font-black font-mono text-white">
              {spentToday.toLocaleString('ru-RU')} <span className="text-xs font-normal text-zen-400">сум</span>
            </p>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Безопасный лимит / день</span>
            <p className="text-lg font-black font-mono text-amber-300">
              {safeDailyLimit.toLocaleString('ru-RU')} <span className="text-xs font-normal text-amber-400/80">сум</span>
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-2.5 w-full bg-slate-950 rounded-full border border-white/10 p-0.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              isOver
                ? 'bg-gradient-to-r from-rose-600 to-rose-500 shadow-[0_0_12px_#ef4444]'
                : 'bg-gradient-to-r from-blue-500 via-teal-400 to-emerald-400 shadow-[0_0_12px_#10b981]'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* AI Advice Message */}
      <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between text-xs relative z-10">
        <p className="text-[11px] text-slate-300 font-medium leading-tight">
          {isOver
            ? `⚠️ Вы превысили дневной лимит на ${(spentToday - safeDailyLimit).toLocaleString('ru-RU')} сум. Постарайтесь не совершать трат до завтра!`
            : `Запас безопасных трат на сегодня: ${(safeDailyLimit - spentToday).toLocaleString('ru-RU')} сум.`}
        </p>
      </div>
    </div>
  );
};
