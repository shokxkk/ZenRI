'use client';

import React, { useState, useEffect } from 'react';
import {
  Clock,
  Briefcase,
  Car,
  Smartphone,
  Dumbbell,
  BookOpen,
  Heart,
  Moon,
  Sparkles,
  Zap,
  HelpCircle,
  Hourglass,
  Edit3,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';

export type TimeCategory = {
  id: string;
  name: string;
  hours: number;
  color: string;
  iconName: string;
};

const DEFAULT_TIME_CATEGORIES: TimeCategory[] = [
  { id: 'work', name: 'Работа', hours: 168, color: '#3B82F6', iconName: 'Briefcase' },
  { id: 'commute', name: 'Дорога / Транспорт', hours: 31, color: '#F59E0B', iconName: 'Car' },
  { id: 'social', name: 'Соцсети / Экран', hours: 42, color: '#EC4899', iconName: 'Smartphone' },
  { id: 'sport', name: 'Спорт / Здоровье', hours: 11, color: '#10B981', iconName: 'Dumbbell' },
  { id: 'reading', name: 'Саморазвитие / Чтение', hours: 7, color: '#8B5CF6', iconName: 'BookOpen' },
  { id: 'family', name: 'Семья и Близкие', hours: 36, color: '#00C2FF', iconName: 'Heart' },
  { id: 'sleep', name: 'Сон и Отдых', hours: 210, color: '#64748B', iconName: 'Moon' },
];

const ICON_MAP: Record<string, React.ElementType> = {
  Briefcase,
  Car,
  Smartphone,
  Dumbbell,
  BookOpen,
  Heart,
  Moon,
};

function formatMoney(val: number) {
  return val.toLocaleString('ru-RU');
}

export const LifeTimeAuditWidget: React.FC<{
  monthlyIncome?: number;
}> = ({ monthlyIncome = 10000000 }) => {
  const [categories, setCategories] = useState<TimeCategory[]>(DEFAULT_TIME_CATEGORIES);
  const [monthlyWageInput, setMonthlyWageInput] = useState<number>(monthlyIncome || 10000000);
  const [workHoursPerMonth, setWorkHoursPerMonth] = useState<number>(168);
  const [sampleExpenseAmount, setSampleExpenseAmount] = useState<string>('500000');
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('zenri_life_time_audit');
    if (stored) {
      try {
        setCategories(JSON.parse(stored));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const saveCategories = (updated: TimeCategory[]) => {
    setCategories(updated);
    localStorage.setItem('zenri_life_time_audit', JSON.stringify(updated));
  };

  // Math Calculations
  const hourlyWage = Math.round(monthlyWageInput / (workHoursPerMonth || 1));
  const expenseInLifeHours = sampleExpenseAmount
    ? (Number(sampleExpenseAmount) / (hourlyWage || 1)).toFixed(1)
    : '0';

  const totalLoggedHours = categories.reduce((sum, c) => sum + c.hours, 0);

  const socialCategory = categories.find((c) => c.id === 'social')?.hours || 42;
  const readingCategory = categories.find((c) => c.id === 'reading')?.hours || 7;
  const familyCategory = categories.find((c) => c.id === 'family')?.hours || 36;
  const workCategory = categories.find((c) => c.id === 'work')?.hours || 168;

  return (
    <div className="bg-white dark:bg-gradient-to-br dark:from-[#0F172A] dark:via-[#1E1B4B] dark:to-[#0F172A] rounded-card p-6 text-slate-800 dark:text-white border border-slate-200/90 dark:border-[#8B5CF6]/30 shadow-apple space-y-6 relative overflow-hidden card-hover">
      {/* Decorative Glow */}
      <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-[#8B5CF6]/10 dark:bg-[#8B5CF6]/20 blur-[90px] pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-[#EC4899]/10 dark:bg-[#EC4899]/15 blur-[90px] pointer-events-none" />

      {/* Header Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#8B5CF6] to-[#EC4899] flex items-center justify-center text-white shadow-glow flex-shrink-0">
            <Hourglass size={20} />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              Life Time & Стоимость Времени
              <span className="px-2.5 py-0.5 rounded-full bg-[#8B5CF6]/15 dark:bg-[#8B5CF6]/25 border border-[#8B5CF6]/30 dark:border-[#8B5CF6]/40 text-[#8B5CF6] dark:text-[#C084FC] text-[10px] font-extrabold flex items-center gap-1">
                <Sparkles size={11} /> Four Thousand Weeks
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-zen-300 mt-0.5">
              ZenRI показывает не только деньги, но и куда уходит время вашей единственной жизни.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowEditModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#8B5CF6]/10 dark:bg-[#8B5CF6]/20 hover:bg-[#8B5CF6]/30 border border-[#8B5CF6]/30 text-xs font-bold text-[#8B5CF6] dark:text-white transition-all active:scale-95 self-start sm:self-auto"
        >
          <Edit3 size={14} /> Настроить часы
        </button>
      </div>

      {/* Section 1: Стоимость часа жизни (Time Value Calculator) */}
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zen-950/70 border border-slate-200 dark:border-[#8B5CF6]/30 backdrop-blur-md space-y-3 relative z-10">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#8B5CF6] dark:text-[#C084FC] uppercase tracking-wider flex items-center gap-1.5">
            <Zap size={14} /> Стоимость Вашего Времени (Часовая Ставка)
          </span>
          <span className="text-xs text-slate-500 dark:text-zen-400">1 мес. ≈ {workHoursPerMonth} рабочих часов</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center pt-1">
          {/* Calculated Hourly Wage */}
          <div className="p-3.5 rounded-xl bg-[#8B5CF6]/10 dark:bg-[#8B5CF6]/15 border border-[#8B5CF6]/20 dark:border-[#8B5CF6]/30">
            <p className="text-[11px] text-slate-600 dark:text-zen-300 font-semibold">Ваш 1 час жизни на работе стоит:</p>
            <p className="text-2xl font-black text-[#8B5CF6] dark:text-[#C084FC] mt-0.5">
              {formatMoney(hourlyWage)} <span className="text-xs font-medium text-slate-500 dark:text-zen-400">сум / час</span>
            </p>
          </div>

          {/* Interactive Purchase Converter */}
          <div className="md:col-span-2 p-3.5 rounded-xl bg-white dark:bg-zen-900/80 border border-slate-200 dark:border-zen-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex-1 w-full">
              <label className="block text-[11px] text-slate-600 dark:text-zen-300 font-semibold mb-1">
                Перевести покупку из сум в Часы Жизни:
              </label>
              <input
                type="number"
                value={sampleExpenseAmount}
                onChange={(e) => setSampleExpenseAmount(e.target.value)}
                placeholder="500 000"
                className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-zen-950 border border-slate-300 dark:border-zen-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-[#8B5CF6]"
              />
            </div>

            <div className="p-2.5 rounded-lg bg-[#EC4899]/10 dark:bg-[#EC4899]/15 border border-[#EC4899]/30 text-right self-stretch sm:self-auto flex flex-col justify-center min-w-[140px]">
              <span className="text-[10px] text-[#EC4899] font-extrabold uppercase">Цена в часах</span>
              <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                {expenseInLifeHours} <span className="text-xs font-normal text-slate-500 dark:text-zen-300">часа жизни</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Life Time Breakdown (Аудит времени за месяц) */}
      <div className="space-y-3 relative z-10">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-600 dark:text-zen-300 uppercase tracking-wider flex items-center gap-1.5">
            <Clock size={14} className="text-[#0066FF] dark:text-[#00C2FF]" /> Распределение часов жизни за этот месяц ({totalLoggedHours} ч.)
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
          {categories.map((c) => {
            const IconComponent = ICON_MAP[c.iconName] || Clock;
            const pct = Math.round((c.hours / (totalLoggedHours || 1)) * 100);

            return (
              <div
                key={c.id}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-zen-900/60 border border-slate-200 dark:border-zen-800 flex items-center gap-2.5 hover:border-[#8B5CF6]/50 transition-all shadow-sm"
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center font-bold flex-shrink-0"
                  style={{ backgroundColor: `${c.color}20`, color: c.color, border: `1px solid ${c.color}40` }}
                >
                  <IconComponent size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{c.name}</p>
                  <p className="text-[11px] font-extrabold text-slate-700 dark:text-zen-300 mt-0.5">
                    {c.hours} ч. <span className="text-[10px] text-slate-500 dark:text-zen-400 font-normal">({pct}%)</span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 3: AI Provocative Life OS Insight Box */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-[#8B5CF6]/10 via-[#EC4899]/10 to-[#0066FF]/10 dark:from-[#8B5CF6]/20 dark:via-[#EC4899]/20 dark:to-[#00C2FF]/20 border border-[#EC4899]/30 dark:border-[#EC4899]/40 relative z-10 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-[#EC4899]">
          <HelpCircle size={16} className="text-[#EC4899] animate-pulse" />
          <span>Главный вопрос от AI Life Assistant (Four Thousand Weeks):</span>
        </div>

        <blockquote className="text-sm font-semibold text-slate-900 dark:text-white italic border-l-2 border-[#EC4899] pl-3 py-1 leading-relaxed">
          «Соответствует ли текущее распределение времени тому, что для вас действительно важно?»
        </blockquote>

        <div className="p-3 rounded-xl bg-white/90 dark:bg-zen-950/70 border border-slate-200 dark:border-white/10 text-xs text-slate-700 dark:text-zen-200 leading-relaxed space-y-1 shadow-sm">
          <p>
            • Вы потратили <strong className="text-[#EC4899]">{socialCategory} часов</strong> на соцсети и экран против{' '}
            <strong className="text-[#8B5CF6] dark:text-[#C084FC]">{readingCategory} часов</strong> на книги и саморазвитие.
          </p>
          <p>
            • На работу ушло <strong className="text-[#0066FF] dark:text-[#60A5FA]">{workCategory} часов</strong>, а семье уделено{' '}
            <strong className="text-[#00C2FF]">{familyCategory} часов</strong>.
          </p>
        </div>
      </div>

      {/* Modal to edit monthly hours */}
      <Modal open={showEditModal} onClose={() => setShowEditModal(false)} title="Аудит часов жизни за месяц">
        <div className="space-y-4">
          <p className="text-xs text-slate-500 dark:text-zen-400">
            Укажите примерное количество часов, которое вы тратите в месяц на разные сферы жизни:
          </p>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {categories.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-100 dark:bg-zen-800">
                <span className="text-xs font-bold text-slate-900 dark:text-zen-100 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                  {c.name}
                </span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={c.hours}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 0;
                      const updated = categories.map((cat) => (cat.id === c.id ? { ...cat, hours: val } : cat));
                      saveCategories(updated);
                    }}
                    className="w-20 px-2 py-1.5 rounded-lg bg-white dark:bg-zen-900 border border-slate-300 dark:border-zen-700 text-xs font-bold text-center text-slate-900 dark:text-zen-100"
                  />
                  <span className="text-xs text-slate-500 dark:text-zen-400 font-medium">ч.</span>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setShowEditModal(false)}
            className="w-full py-3.5 rounded-2xl font-bold text-sm text-white bg-[#8B5CF6] hover:bg-[#7C3AED] shadow-glow transition-all"
          >
            Сохранить аудит времени
          </button>
        </div>
      </Modal>
    </div>
  );
};
