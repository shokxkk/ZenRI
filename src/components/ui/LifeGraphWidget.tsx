'use client';

import React, { useState } from 'react';
import {
  Zap,
  Wallet,
  CheckCircle2,
  Smile,
  Flame,
  Calendar,
  Activity,
  Plus,
  TrendingUp,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';

type Timeframe = 'DAY' | 'WEEK' | 'MONTH' | 'YEAR';

interface DataPoint {
  label: string;
  energy: number; // 0-100
  money: number;  // 0-100 normalized
  moneyRaw: string;
  tasks: number;  // 0-100
  mood: number;   // 0-100
  habits: number; // 0-100
}

const TIMEFRAME_DATA: Record<Timeframe, DataPoint[]> = {
  DAY: [
    { label: '08:00', energy: 90, money: 60, moneyRaw: '+12.0M', tasks: 20, mood: 85, habits: 100 },
    { label: '11:00', energy: 85, money: 55, moneyRaw: '-120K', tasks: 50, mood: 80, habits: 100 },
    { label: '14:00', energy: 65, money: 52, moneyRaw: '-85K', tasks: 75, mood: 70, habits: 75 },
    { label: '17:00', energy: 75, money: 48, moneyRaw: '-340K', tasks: 90, mood: 75, habits: 75 },
    { label: '20:00', energy: 80, money: 48, moneyRaw: '0', tasks: 100, mood: 90, habits: 100 },
    { label: '23:00', energy: 50, money: 48, moneyRaw: '0', tasks: 100, mood: 85, habits: 100 },
  ],
  WEEK: [
    { label: 'Пн', energy: 85, money: 70, moneyRaw: '+12.0M', tasks: 80, mood: 80, habits: 90 },
    { label: 'Вт', energy: 75, money: 65, moneyRaw: '-250K', tasks: 90, mood: 75, habits: 85 },
    { label: 'Ср', energy: 60, money: 62, moneyRaw: '-120K', tasks: 70, mood: 65, habits: 70 },
    { label: 'Чт', energy: 80, money: 58, moneyRaw: '-545K', tasks: 100, mood: 85, habits: 100 },
    { label: 'Пт', energy: 95, money: 55, moneyRaw: '-400K', tasks: 95, mood: 95, habits: 90 },
    { label: 'Сб', energy: 90, money: 50, moneyRaw: '-800K', tasks: 60, mood: 90, habits: 80 },
    { label: 'Вс', energy: 85, money: 48, moneyRaw: '-150K', tasks: 50, mood: 90, habits: 85 },
  ],
  MONTH: [
    { label: '1-7 авг', energy: 80, money: 85, moneyRaw: '+12.0M', tasks: 85, mood: 82, habits: 88 },
    { label: '8-14 авг', energy: 75, money: 78, moneyRaw: '-1.2M', tasks: 80, mood: 78, habits: 82 },
    { label: '15-21 авг', energy: 85, money: 70, moneyRaw: '-1.5M', tasks: 92, mood: 88, habits: 90 },
    { label: '22-31 авг', energy: 90, money: 65, moneyRaw: '-900K', tasks: 95, mood: 90, habits: 95 },
  ],
  YEAR: [
    { label: 'Янв', energy: 70, money: 50, moneyRaw: '8.5M', tasks: 70, mood: 70, habits: 75 },
    { label: 'Мар', energy: 80, money: 60, moneyRaw: '10.2M', tasks: 85, mood: 80, habits: 80 },
    { label: 'Май', energy: 75, money: 68, moneyRaw: '11.8M', tasks: 78, mood: 75, habits: 82 },
    { label: 'Июл', energy: 90, money: 78, moneyRaw: '14.0M', tasks: 90, mood: 88, habits: 88 },
    { label: 'Сен', energy: 85, money: 85, moneyRaw: '15.5M', tasks: 92, mood: 85, habits: 90 },
    { label: 'Ноя', energy: 95, money: 95, moneyRaw: '16.9M', tasks: 98, mood: 95, habits: 96 },
  ],
};

const DIMENSIONS = [
  { key: 'energy', name: 'Энергия', color: '#F59E0B', icon: Zap },
  { key: 'money', name: 'Деньги', color: '#0066FF', icon: Wallet },
  { key: 'tasks', name: 'Задачи', color: '#10B981', icon: CheckCircle2 },
  { key: 'mood', name: 'Настроение', color: '#8B5CF6', icon: Smile },
  { key: 'habits', name: 'Привычки', color: '#EC4899', icon: Flame },
] as const;

export const LifeGraphWidget: React.FC = () => {
  const [timeframe, setTimeframe] = useState<Timeframe>('DAY');
  const [activeVisible, setActiveVisible] = useState<Record<string, boolean>>({
    energy: true,
    money: true,
    tasks: true,
    mood: true,
    habits: true,
  });

  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Check-in State
  const [showCheckin, setShowCheckin] = useState(false);
  const [userMood, setUserMood] = useState(8);
  const [userEnergy, setUserEnergy] = useState(85);

  const data = TIMEFRAME_DATA[timeframe];

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
    <div className="bg-white dark:bg-[#131C2E] border border-zen-200 dark:border-zen-800/80 rounded-card p-6 shadow-apple space-y-5 card-hover relative overflow-hidden">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#8B5CF6] to-[#0066FF] flex items-center justify-center text-white shadow-glow">
            <Activity size={18} />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-zen-900 dark:text-zen-100 flex items-center gap-2">
              Life Graph
              <span className="px-2 py-0.5 rounded-full bg-[#8B5CF6]/15 text-[#8B5CF6] text-[10px] font-extrabold">
                Граф Жизни
              </span>
            </h2>
            <p className="text-xs text-zen-400 mt-0.5">Единая синхронная жизненная шкала</p>
          </div>
        </div>

        {/* Timeframe Selector Pills (День, Неделя, Месяц, Год) */}
        <div className="flex items-center gap-1.5 bg-zen-100 dark:bg-zen-900 p-1 rounded-2xl border border-zen-200/80 dark:border-zen-800 self-start sm:self-auto">
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
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-bold shadow-glow transition-all"
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
          className="w-full h-48 overflow-visible"
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
                  x={12}
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
                  strokeOpacity="0.2"
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
                  x={x - 20}
                  y={0}
                  width={40}
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

      {/* Hover Information Detail Panel (Synchronized 5 Metrics) */}
      {hoveredPoint && (
        <div className="p-3.5 rounded-2xl bg-zen-900 text-white border border-[#0066FF]/40 shadow-glow flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-150">
          <span className="text-xs font-extrabold text-[#00C2FF]">
            📍 {hoveredPoint.label}:
          </span>
          <div className="flex flex-wrap items-center gap-4 text-xs font-bold">
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
              <Smile size={14} /> Настроение: {hoveredPoint.mood}/100
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
          <div>
            <label className="block text-xs font-bold text-zen-700 dark:text-zen-300 mb-1 flex items-center justify-between">
              <span>😊 Настроение ({userMood}/10)</span>
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={userMood}
              onChange={(e) => setUserMood(Number(e.target.value))}
              className="w-full accent-[#8B5CF6]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zen-700 dark:text-zen-300 mb-1 flex items-center justify-between">
              <span>⚡️ Уровень энергии ({userEnergy}%)</span>
            </label>
            <input
              type="range"
              min="10"
              max="100"
              value={userEnergy}
              onChange={(e) => setUserEnergy(Number(e.target.value))}
              className="w-full accent-[#F59E0B]"
            />
          </div>

          <button
            onClick={() => setShowCheckin(false)}
            className="w-full py-3.5 rounded-2xl font-bold text-sm text-white bg-[#8B5CF6] hover:bg-[#7C3AED] shadow-glow transition-all"
          >
            Сохранить чек-ин
          </button>
        </div>
      </Modal>
    </div>
  );
};
