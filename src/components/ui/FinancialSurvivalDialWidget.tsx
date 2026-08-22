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

  // Top Dome Arc Path calculations
  // Path starts at (20, 90) and arcs to (160, 90)
  // Arc length L = Math.PI * radius = Math.PI * 70 ≈ 219.9
  const arcLength = 220;
  const ratio = Math.min(1, Math.max(0, months / 12));
  const strokeDashoffset = arcLength * (1 - ratio);

  let statusText = 'Зона риска';
  let statusColor = '#EF4444';
  let badgeIcon = <ShieldAlert size={14} className="text-rose-400" />;
  let tipText = 'Откладывайте хотя бы 10% с каждого дохода для базовой подушки безопасности.';

  if (months >= 6) {
    statusText = 'Абсолютная Автономия';
    statusColor = '#F59E0B';
    badgeIcon = <Crown size={14} className="text-amber-400" />;
    tipText = 'У вас есть полгода полной финансовой свободы!';
  } else if (months >= 3) {
    statusText = 'Надежная Защита';
    statusColor = '#10B981';
    badgeIcon = <ShieldCheck size={14} className="text-emerald-400" />;
    tipText = 'Отличный запас автономии на 3+ месяца вперед.';
  } else if (months >= 1) {
    statusText = 'Базовая Стабильность';
    statusColor = '#00C2FF';
    badgeIcon = <Zap size={14} className="text-[#00C2FF]" />;
    tipText = 'Вы защищены на 1 месяц. Продолжайте формировать капитал!';
  }

  return (
    <div className="p-5 rounded-3xl bg-slate-900/90 border border-white/15 backdrop-blur-xl shadow-2xl space-y-3 relative overflow-hidden">
      {/* Ambient Glow */}
      <div className="absolute top-0 left-0 w-36 h-36 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Widget Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-[#00C2FF]">
            <Gauge size={16} />
          </div>
          <div>
            <h3 className="text-xs font-extrabold text-white">Спидометр Подушки Безопасности</h3>
            <p className="text-[10px] text-zen-400">Автономия на основе текущего баланса</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-[11px] font-black" style={{ color: statusColor }}>
          {badgeIcon}
          <span>{statusText}</span>
        </div>
      </div>

      {/* Top Dome Arc Speedometer (∩) */}
      <div className="flex flex-col items-center justify-center pt-2 relative z-10">
        <div className="relative w-48 h-28 flex flex-col items-center justify-end overflow-hidden">
          <svg className="w-48 h-48" viewBox="0 0 180 180">
            {/* Background Arch Track */}
            <path
              d="M 20 100 A 70 70 0 0 1 160 100"
              fill="none"
              stroke="rgba(255, 255, 255, 0.12)"
              strokeWidth="12"
              strokeLinecap="round"
            />
            {/* Active Arc Gauge */}
            <path
              d="M 20 100 A 70 70 0 0 1 160 100"
              fill="none"
              stroke={statusColor}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={arcLength}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-out"
              style={{ filter: `drop-shadow(0 0 8px ${statusColor})` }}
            />
          </svg>

          {/* Center Value */}
          <div className="absolute bottom-2 text-center">
            <span className="text-3xl font-black font-mono text-white tracking-tight leading-none">
              {months}
            </span>
            <span className="block text-[9px] font-extrabold text-zen-400 uppercase tracking-widest mt-1">
              {months === 1 ? 'месяц' : months >= 2 && months <= 4 ? 'месяца' : 'месяцев'} автономии
            </span>
          </div>
        </div>

        <p className="text-[11px] text-center text-slate-300 font-medium mt-2 px-2">
          {tipText}
        </p>
      </div>
    </div>
  );
};
