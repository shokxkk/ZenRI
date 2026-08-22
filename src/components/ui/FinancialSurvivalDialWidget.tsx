'use client';

import React from 'react';
import { ShieldCheck, ShieldAlert, Zap, Crown, Gauge } from 'lucide-react';

interface FinancialSurvivalDialWidgetProps {
  totalBalance: number;
  monthlyExpense: number;
}

export const FinancialSurvivalDialWidget: React.FC<FinancialSurvivalDialWidgetProps> = ({
  totalBalance,
  monthlyExpense,
}) => {
  const safeExpense = Math.max(100000, monthlyExpense || 1000000);
  const safeBalance = Math.max(0, totalBalance);
  const rawMonths = safeBalance / safeExpense;
  const months = Math.min(12, Math.round(rawMonths * 10) / 10);

  // SVG Gauge calculations (semi-circle arc)
  const radius = 70;
  const circumference = Math.PI * radius;
  // Percentage from 0 to 12 months (clamped 0 to 1)
  const ratio = Math.min(1, Math.max(0, months / 12));
  const strokeDashoffset = circumference * (1 - ratio);

  let statusText = 'Зона риска 🔴';
  let statusColor = '#EF4444';
  let badgeIcon = <ShieldAlert size={16} className="text-rose-400" />;
  let tipText = 'Совет Барсика: Откладывайте хотя бы 10% с каждого дохода для базовой защиты.';

  if (months >= 6) {
    statusText = 'Абсолютная Автономия 👑';
    statusColor = '#F59E0B';
    badgeIcon = <Crown size={16} className="text-amber-400" />;
    tipText = 'Потрясающе! У вас есть полгода полной финансовой свободы!';
  } else if (months >= 3) {
    statusText = 'Надежная Защита 🟢';
    statusColor = '#10B981';
    badgeIcon = <ShieldCheck size={16} className="text-emerald-400" />;
    tipText = 'Отличная подушка безопасности на 3+ месяца автономности.';
  } else if (months >= 1) {
    statusText = 'Базовая Стабильность 🟡';
    statusColor = '#00C2FF';
    badgeIcon = <Zap size={16} className="text-[#00C2FF]" />;
    tipText = 'Вы защищены на 1 месяц вперед. Продолжайте увеличивать капитал!';
  }

  return (
    <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/15 backdrop-blur-xl shadow-2xl space-y-4 relative overflow-hidden">
      {/* Ambient Glow */}
      <div className="absolute top-0 left-0 w-44 h-44 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-[#00C2FF]">
            <Gauge size={18} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white">Спидометр Подушки Безопасности</h3>
            <p className="text-[11px] text-zen-400">Автономия на основе текущего баланса</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-xs font-black" style={{ color: statusColor }}>
          {badgeIcon}
          <span>{statusText}</span>
        </div>
      </div>

      {/* Semi-Circle SVG Speedometer Gauge */}
      <div className="flex flex-col items-center justify-center pt-2 pb-1 relative z-10">
        <div className="relative w-44 h-24 flex items-end justify-center overflow-hidden">
          <svg className="w-44 h-44 -rotate-180 transform" viewBox="0 0 160 160">
            {/* Background Arc Track */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="14"
              strokeDasharray={circumference}
              strokeDashoffset="0"
              strokeLinecap="round"
            />
            {/* Active Neon Gauge Arc */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke={statusColor}
              strokeWidth="14"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
              style={{ filter: `drop-shadow(0 0 8px ${statusColor})` }}
            />
          </svg>

          {/* Center Value */}
          <div className="absolute bottom-1 text-center">
            <span className="text-3xl font-black font-mono text-white tracking-tight">
              {months}
            </span>
            <span className="block text-[10px] font-bold text-zen-400 uppercase tracking-widest">
              {months === 1 ? 'месяц' : months >= 2 && months <= 4 ? 'месяца' : 'месяцев'} автономии
            </span>
          </div>
        </div>

        <p className="text-xs text-center text-slate-300 font-medium mt-3 px-4">
          {tipText}
        </p>
      </div>
    </div>
  );
};
