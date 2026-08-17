'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Zap,
  Wallet,
  CheckCircle2,
  Smile,
  Flame,
  Activity,
  Plus,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';

type Timeframe = 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';

export interface LifeGraphTransaction {
  id: string;
  type: string;
  amount: number;
  date: string;
}

interface LifeGraphWidgetProps {
  totalBalance?: number;
  allTransactions?: LifeGraphTransaction[];
  tasksTotalCount?: number;
  tasksCompletedCount?: number;
  habitsTotalCount?: number;
  habitsCompletedCount?: number;
}

interface DataPoint {
  label: string;
  energy: number; // 0-100
  money: number;  // 0-100 normalized
  moneyRaw: string;
  tasks: number;  // 0-100
  mood: number;   // 0-100
  habits: number; // 0-100
}

const DIMENSIONS = [
  { key: 'energy', name: 'Энергия', color: '#F59E0B', icon: Zap },
  { key: 'money', name: 'Деньги', color: '#0066FF', icon: Wallet },
  { key: 'tasks', name: 'Задачи', color: '#10B981', icon: CheckCircle2 },
  { key: 'mood', name: 'Настроение', color: '#8B5CF6', icon: Smile },
  { key: 'habits', name: 'Привычки', color: '#EC4899', icon: Flame },
] as const;

function formatShortMoney(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(amount) >= 1_000) {
    return `${(amount / 1_000).toFixed(0)}K`;
  }
  return `${amount}`;
}

export const LifeGraphWidget: React.FC<LifeGraphWidgetProps> = ({
  totalBalance = 0,
  allTransactions = [],
  tasksTotalCount = 0,
  tasksCompletedCount = 0,
  habitsTotalCount = 0,
  habitsCompletedCount = 0,
}) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('DAY');
  const [activeVisible, setActiveVisible] = useState<Record<string, boolean>>({
    energy: true,
    money: true,
    tasks: true,
    mood: true,
    habits: true,
  });

  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Check-in State with local storage persistence
  const [showCheckin, setShowCheckin] = useState(false);
  const [userMood, setUserMood] = useState(85); // 0-100
  const [userEnergy, setUserEnergy] = useState(80); // 0-100

  useEffect(() => {
    const savedCheckin = localStorage.getItem('zenri_lifegraph_checkin');
    if (savedCheckin) {
      try {
        const parsed = JSON.parse(savedCheckin);
        if (parsed.mood) setUserMood(parsed.mood);
        if (parsed.energy) setUserEnergy(parsed.energy);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleSaveCheckin = () => {
    localStorage.setItem(
      'zenri_lifegraph_checkin',
      JSON.stringify({ mood: userMood, energy: userEnergy, updatedAt: new Date().toISOString() })
    );
    setShowCheckin(false);
  };

  const tasksRate = tasksTotalCount > 0 ? Math.round((tasksCompletedCount / tasksTotalCount) * 100) : 80;
  const habitsRate = habitsTotalCount > 0 ? Math.round((habitsCompletedCount / habitsTotalCount) * 100) : 75;

  // Build dynamic timeframe data based on real user finance & activity
  const timeframeData: Record<Timeframe, DataPoint[]> = useMemo(() => {
    const now = new Date();

    // 1. DAY: 6 time points today
    const dayLabels = ['08:00', '11:00', '14:00', '17:00', '20:00', '23:00'];
    const currentHour = now.getHours();

    const todayTxs = allTransactions.filter((t) => {
      const d = new Date(t.date);
      return d.toDateString() === now.toDateString();
    });

    const dayNetCash = todayTxs.reduce(
      (sum, t) => sum + (t.type === 'INCOME' ? t.amount : t.type === 'EXPENSE' ? -t.amount : 0),
      0
    );

    const dayPoints: DataPoint[] = dayLabels.map((label, idx) => {
      const pointHour = parseInt(label.split(':')[0], 10);
      const isPastOrCurrent = pointHour <= currentHour + 2;

      let moneyVal = 50;
      let rawStr = '0 сум';

      if (totalBalance > 0 || dayNetCash !== 0) {
        // Base money score normalized between 35% and 95%
        const normalized = Math.min(95, Math.max(30, 50 + (totalBalance / 20_000_000) * 35));
        moneyVal = Math.round(normalized + (idx - 2) * (dayNetCash >= 0 ? 3 : -3));
        moneyVal = Math.min(100, Math.max(10, moneyVal));

        if (dayNetCash > 0) {
          rawStr = `+${formatShortMoney(dayNetCash)} сум`;
        } else if (dayNetCash < 0) {
          rawStr = `−${formatShortMoney(Math.abs(dayNetCash))} сум`;
        } else {
          rawStr = `${formatShortMoney(totalBalance)} сум`;
        }
      }

      const tasksVal = isPastOrCurrent ? Math.min(100, Math.round(tasksRate * ((idx + 1) / dayLabels.length))) : 20;
      const habitsVal = isPastOrCurrent ? Math.min(100, Math.round(habitsRate * ((idx + 1.5) / dayLabels.length))) : 30;
      const energyVal = Math.max(20, Math.min(100, userEnergy - (idx > 3 ? (idx - 3) * 8 : 0)));
      const moodVal = Math.max(30, Math.min(100, userMood + (dayNetCash > 0 ? 5 : 0)));

      return {
        label,
        energy: energyVal,
        money: moneyVal,
        moneyRaw: rawStr,
        tasks: tasksVal,
        mood: moodVal,
        habits: habitsVal,
      };
    });

    // 2. WEEK: 7 days of this week (Пн, Вт, Ср, Чт, Пт, Сб, Вс)
    const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    const currentDayIdx = (now.getDay() + 6) % 7; // 0 = Mon, 6 = Sun

    const weekPoints: DataPoint[] = weekDays.map((dayLabel, idx) => {
      // Find transactions on this relative day of week
      const dayDiff = idx - currentDayIdx;
      const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayDiff);
      
      const dayTxs = allTransactions.filter((t) => {
        const d = new Date(t.date);
        return d.toDateString() === targetDate.toDateString();
      });

      const net = dayTxs.reduce(
        (sum, t) => sum + (t.type === 'INCOME' ? t.amount : t.type === 'EXPENSE' ? -t.amount : 0),
        0
      );

      let rawStr = '0 сум';
      if (net > 0) {
        rawStr = `+${formatShortMoney(net)}`;
      } else if (net < 0) {
        rawStr = `−${formatShortMoney(Math.abs(net))}`;
      } else if (totalBalance > 0) {
        rawStr = `${formatShortMoney(totalBalance)}`;
      }

      const moneyScore = Math.min(
        95,
        Math.max(25, 55 + (totalBalance > 0 ? 15 : 0) + (net > 0 ? 18 : net < 0 ? -12 : 0))
      );

      return {
        label: dayLabel,
        energy: Math.max(40, Math.min(95, userEnergy + (idx === 4 ? 10 : idx === 6 ? -5 : 0))),
        money: moneyScore,
        moneyRaw: rawStr,
        tasks: Math.min(100, Math.max(30, tasksRate + (idx <= currentDayIdx ? 10 : -20))),
        mood: Math.max(40, Math.min(95, userMood + (net > 0 ? 10 : 0))),
        habits: Math.min(100, Math.max(35, habitsRate + (idx <= currentDayIdx ? 5 : -15))),
      };
    });

    // 3. MONTH: 4 weekly quarters (1-7, 8-14, 15-21, 22-31)
    const monthQuarters = ['1-7 дн', '8-14 дн', '15-21 дн', '22-31 дн'];
    const currentQuarter = Math.min(3, Math.floor((now.getDate() - 1) / 7));

    const monthPoints: DataPoint[] = monthQuarters.map((qLabel, idx) => {
      const qStart = idx * 7 + 1;
      const qEnd = idx === 3 ? 31 : (idx + 1) * 7;

      const qTxs = allTransactions.filter((t) => {
        const d = new Date(t.date);
        return (
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear() &&
          d.getDate() >= qStart &&
          d.getDate() <= qEnd
        );
      });

      const net = qTxs.reduce(
        (sum, t) => sum + (t.type === 'INCOME' ? t.amount : t.type === 'EXPENSE' ? -t.amount : 0),
        0
      );

      let rawStr = '0 сум';
      if (net > 0) rawStr = `+${formatShortMoney(net)}`;
      else if (net < 0) rawStr = `−${formatShortMoney(Math.abs(net))}`;
      else if (totalBalance > 0) rawStr = `${formatShortMoney(totalBalance)}`;

      const moneyScore = Math.min(95, Math.max(30, 50 + (net > 0 ? 25 : net < 0 ? -15 : 5)));

      return {
        label: qLabel,
        energy: Math.max(45, Math.min(95, userEnergy + (idx === currentQuarter ? 5 : -5))),
        money: moneyScore,
        moneyRaw: rawStr,
        tasks: Math.min(100, Math.max(40, tasksRate + (idx <= currentQuarter ? 10 : -10))),
        mood: Math.max(45, Math.min(95, userMood + (net >= 0 ? 5 : -5))),
        habits: Math.min(100, Math.max(40, habitsRate)),
      };
    });

    // 4. YEAR: Last 6 months
    const yearLabels: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      yearLabels.push(d.toLocaleString('ru-RU', { month: 'short' }));
    }

    const yearPoints: DataPoint[] = yearLabels.map((mLabel, idx) => {
      const targetMonth = (now.getMonth() - (5 - idx) + 12) % 12;
      const mTxs = allTransactions.filter((t) => new Date(t.date).getMonth() === targetMonth);
      const net = mTxs.reduce(
        (sum, t) => sum + (t.type === 'INCOME' ? t.amount : t.type === 'EXPENSE' ? -t.amount : 0),
        0
      );

      let rawStr = '0 сум';
      if (net > 0) rawStr = `+${formatShortMoney(net)}`;
      else if (net < 0) rawStr = `−${formatShortMoney(Math.abs(net))}`;
      else if (totalBalance > 0) rawStr = `${formatShortMoney(totalBalance)}`;

      const moneyScore = Math.min(95, Math.max(35, 45 + idx * 8 + (net > 0 ? 15 : 0)));

      return {
        label: mLabel,
        energy: Math.min(95, 65 + idx * 5),
        money: moneyScore,
        moneyRaw: rawStr,
        tasks: Math.min(98, 60 + idx * 6),
        mood: Math.min(95, 70 + idx * 4),
        habits: Math.min(95, 65 + idx * 5),
      };
    });

    return {
      DAY: dayPoints,
      WEEK: weekPoints,
      MONTH: monthPoints,
      YEAR: yearPoints,
    };
  }, [totalBalance, allTransactions, tasksRate, habitsRate, userEnergy, userMood]);

  const data = timeframeData[timeframe];

  const toggleDimension = (key: string) => {
    setActiveVisible((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Convert points to SVG polyline coordinates
  const svgWidth = 600;
  const svgHeight = 180;
  const paddingX = 40;
  const paddingY = 20;

  const getCoordinates = (metricKey: keyof DataPoint) => {
    const totalPoints = data.length;
    return data.map((pt, idx) => {
      const x = paddingX + (idx / (totalPoints - 1)) * (svgWidth - paddingX * 2);
      const val = (pt[metricKey] as number) || 0;
      const y = svgHeight - paddingY - (val / 100) * (svgHeight - paddingY * 2);
      return { x, y, val };
    });
  };

  const hoveredPoint = hoveredIdx !== null ? data[hoveredIdx] : null;

  return (
    <div className="bg-white dark:bg-[#131C2E] border border-zen-200 dark:border-zen-800/80 rounded-card p-5 sm:p-6 shadow-apple space-y-4 sm:space-y-5 card-hover relative overflow-hidden">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#8B5CF6] to-[#0066FF] flex items-center justify-center text-white shadow-glow flex-shrink-0">
            <Activity size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-zen-900 dark:text-zen-100">
                Граф Жизни
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-[#8B5CF6]/15 text-[#8B5CF6] text-[10px] font-extrabold">
                Life Graph
              </span>
            </div>
            <p className="text-xs text-zen-400 mt-0.5">
              Синхронная шкала баланса финансов, продуктивности и энергии
            </p>
          </div>
        </div>

        {/* Timeframe Selector Pills */}
        <div className="flex items-center gap-1.5 bg-zen-100 dark:bg-zen-900 p-1 rounded-2xl border border-zen-200/80 dark:border-zen-800 self-start sm:self-auto flex-wrap">
          {[
            { key: 'DAY', label: 'День' },
            { key: 'WEEK', label: 'Неделя' },
            { key: 'MONTH', label: 'Месяц' },
            { key: 'YEAR', label: 'Год' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTimeframe(t.key as Timeframe)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                timeframe === t.key
                  ? 'bg-[#0066FF] text-white shadow-glow scale-105'
                  : 'text-zen-500 dark:text-zen-400 hover:text-zen-900 dark:hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}

          <button
            onClick={() => setShowCheckin(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-bold shadow-glow transition-all active:scale-95 ml-auto"
            title="Записать настроение и энергию"
          >
            <Plus size={14} /> Чек-ин
          </button>
        </div>
      </div>

      {/* Metric Dimension Toggles Legend */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-zen-100 dark:border-zen-800/60">
        {DIMENSIONS.map((dim) => {
          const Icon = dim.icon;
          const isVisible = activeVisible[dim.key];
          return (
            <button
              key={dim.key}
              onClick={() => toggleDimension(dim.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                isVisible
                  ? 'bg-zen-100 dark:bg-zen-800/90 text-zen-900 dark:text-white border-zen-300 dark:border-zen-700 shadow-sm'
                  : 'opacity-40 bg-transparent text-zen-400 border-dashed border-zen-300 dark:border-zen-800'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: dim.color }}
              />
              <Icon size={14} style={{ color: dim.color }} />
              <span>{dim.name}</span>
            </button>
          );
        })}
      </div>

      {/* SVG Interactive Multi-Line Life Graph */}
      <div className="relative w-full overflow-hidden bg-zen-50/50 dark:bg-zen-950/40 rounded-2xl p-3 border border-zen-200/50 dark:border-zen-800/60">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-48 sm:h-52 overflow-visible"
        >
          {/* Background Horizontal Grid Lines */}
          {[0, 25, 50, 75, 100].map((val) => {
            const y = svgHeight - paddingY - (val / 100) * (svgHeight - paddingY * 2);
            return (
              <g key={val}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={svgWidth - paddingX}
                  y2={y}
                  stroke="#334155"
                  strokeOpacity="0.2"
                  strokeDasharray="4 4"
                />
                <text
                  x={10}
                  y={y + 3}
                  fontSize="9"
                  fill="#94A3B8"
                  fontWeight="600"
                >
                  {val}%
                </text>
              </g>
            );
          })}

          {/* Render Active Dimension Spline Curves */}
          {DIMENSIONS.map((dim) => {
            if (!activeVisible[dim.key]) return null;
            const coords = getCoordinates(dim.key as keyof DataPoint);
            const pathD = coords.reduce((acc, pt, i) => {
              return i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
            }, '');

            return (
              <g key={dim.key}>
                {/* Glow Line */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={dim.color}
                  strokeWidth="4"
                  strokeOpacity="0.25"
                />
                {/* Main Line */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={dim.color}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Data Points */}
                {coords.map((pt, idx) => (
                  <circle
                    key={idx}
                    cx={pt.x}
                    cy={pt.y}
                    r={hoveredIdx === idx ? 6 : 4}
                    fill={dim.color}
                    stroke="#FFFFFF"
                    strokeWidth="2"
                    className="transition-all duration-150 cursor-pointer"
                  />
                ))}
              </g>
            );
          })}

          {/* X Axis Labels & Interactive Hover Vertical Lines */}
          {data.map((pt, idx) => {
            const x = paddingX + (idx / (data.length - 1)) * (svgWidth - paddingX * 2);
            return (
              <g
                key={idx}
                className="cursor-pointer group"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {/* Invisible Hover Hitbox Area */}
                <rect
                  x={x - 25}
                  y={0}
                  width={50}
                  height={svgHeight}
                  fill="transparent"
                />
                {/* Vertical Cursor Guide Line */}
                {hoveredIdx === idx && (
                  <line
                    x1={x}
                    y1={0}
                    x2={x}
                    y2={svgHeight - paddingY}
                    stroke="#0066FF"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                )}
                {/* X Axis Time Labels */}
                <text
                  x={x}
                  y={svgHeight - 2}
                  textAnchor="middle"
                  fontSize="10"
                  fill={hoveredIdx === idx ? '#0066FF' : '#94A3B8'}
                  fontWeight={hoveredIdx === idx ? 'bold' : '500'}
                >
                  {pt.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Hover Information Detail Panel (Synchronized Metrics) */}
      {hoveredPoint && (
        <div className="p-3.5 rounded-2xl bg-zen-900 text-white border border-[#0066FF]/40 shadow-glow flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-150">
          <span className="text-xs font-extrabold text-[#00C2FF]">
            📍 {hoveredPoint.label}:
          </span>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-bold">
            <span className="flex items-center gap-1 text-[#F59E0B]">
              <Zap size={14} /> Энергия: {hoveredPoint.energy}%
            </span>
            <span className="flex items-center gap-1 text-[#0066FF]">
              <Wallet size={14} /> Деньги: {hoveredPoint.moneyRaw}
            </span>
            <span className="flex items-center gap-1 text-[#10B981]">
              <CheckCircle2 size={14} /> Задачи: {hoveredPoint.tasks}%
            </span>
            <span className="flex items-center gap-1 text-[#8B5CF6]">
              <Smile size={14} /> Настроение: {hoveredPoint.mood}%
            </span>
            <span className="flex items-center gap-1 text-[#EC4899]">
              <Flame size={14} /> Привычки: {hoveredPoint.habits}%
            </span>
          </div>
        </div>
      )}

      {/* Quick Check-in Modal */}
      <Modal
        open={showCheckin}
        onClose={() => setShowCheckin(false)}
        title="Быстрый чек-ин состояния"
      >
        <div className="space-y-4">
          <p className="text-xs text-zen-400">
            Оцените ваше текущее настроение и запас энергии. Данные сразу отобразятся на графике.
          </p>

          <div>
            <label className="block text-xs font-bold text-zen-700 dark:text-zen-300 mb-1 flex items-center justify-between">
              <span>😊 Настроение ({Math.round(userMood / 10)}/10)</span>
              <span className="text-[#8B5CF6] font-extrabold">{userMood}%</span>
            </label>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={userMood}
              onChange={(e) => setUserMood(Number(e.target.value))}
              className="w-full accent-[#8B5CF6]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zen-700 dark:text-zen-300 mb-1 flex items-center justify-between">
              <span>⚡️ Уровень энергии</span>
              <span className="text-[#F59E0B] font-extrabold">{userEnergy}%</span>
            </label>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={userEnergy}
              onChange={(e) => setUserEnergy(Number(e.target.value))}
              className="w-full accent-[#F59E0B]"
            />
          </div>

          <button
            onClick={handleSaveCheckin}
            className="w-full py-3.5 rounded-2xl font-bold text-sm text-white bg-[#8B5CF6] hover:bg-[#7C3AED] shadow-glow transition-all active:scale-95"
          >
            Сохранить чек-ин
          </button>
        </div>
      </Modal>
    </div>
  );
};
