'use client';

import React from 'react';
import { X, Flame, Trophy, Crown, Sparkles, CheckCircle2, Lock } from 'lucide-react';
import { StreakInfo } from '@/lib/streakTracker';

interface StreakModalProps {
  isOpen: boolean;
  onClose: () => void;
  streakInfo: StreakInfo;
}

export const StreakModal: React.FC<StreakModalProps> = ({ isOpen, onClose, streakInfo }) => {
  if (!isOpen) return null;

  const MILESTONES = [
    { days: 1, name: 'Новичок 🔥', desc: 'Первый день учёта', accessory: 'Базовый худи 7.', icon: Flame, unlocked: streakInfo.currentStreak >= 1 },
    { days: 3, name: 'В огне 🔥', desc: '3 дня подряд без пропусков', accessory: 'Огненная аура', icon: Sparkles, unlocked: streakInfo.currentStreak >= 3 },
    { days: 7, name: 'Профи 🎯', desc: '7 дней активного учёта', accessory: 'Стильные очки ZenRI', icon: Trophy, unlocked: streakInfo.currentStreak >= 7 },
    { days: 14, name: 'Мастер ⚡', desc: '14 дней финансовой дисциплины', accessory: 'Кепка + Солнцезащитные очки', icon: Trophy, unlocked: streakInfo.currentStreak >= 14 },
    { days: 30, name: 'Легенда 👑', desc: '30 дней! Абсолютный чемпион', accessory: 'Золотая корона + Цепь', icon: Crown, unlocked: streakInfo.currentStreak >= 30 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-gradient-to-b from-[#1E0F2B] via-[#120B20] to-[#0A0614] border border-purple-500/30 p-6 shadow-2xl text-white space-y-5 overflow-hidden">

        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-extrabold shadow-lg">
              <Flame size={22} className="fill-amber-400 animate-bounce" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">Огненный страйк</h3>
              <p className="text-[11px] text-purple-300">Каждый день учёта прокачивает Барсика!</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Current Streak Stat Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-purple-500/20 border border-amber-500/30 text-center space-y-1 relative z-10">
          <p className="text-[10px] font-black text-amber-300 uppercase tracking-widest">Текущая серия активных дней</p>
          <div className="flex items-center justify-center gap-2">
            <Flame size={28} className="text-amber-400 fill-amber-400 animate-pulse" />
            <span className="text-4xl font-black text-white">{streakInfo.currentStreak}</span>
            <span className="text-sm font-bold text-amber-300">дней</span>
          </div>
          <p className="text-xs text-purple-200 pt-0.5">
            Статус: <b className="text-white">{streakInfo.levelName}</b> • Аксессуар: <b className="text-amber-300">{streakInfo.accessory}</b>
          </p>
        </div>

        {/* Milestones list */}
        <div className="space-y-2 relative z-10 max-h-60 overflow-y-auto pr-1">
          <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Награды и Уровни Барсика</p>

          {MILESTONES.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.days}
                className={`p-3 rounded-2xl border flex items-center gap-3 transition-all ${
                  m.unlocked
                    ? 'bg-purple-950/40 border-purple-500/40 text-white'
                    : 'bg-black/40 border-white/5 opacity-50'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  m.unlocked ? 'bg-amber-500/20 text-amber-300' : 'bg-white/5 text-slate-500'
                }`}>
                  <Icon size={16} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-white">{m.name}</p>
                    <span className="text-[10px] text-purple-300 font-mono">({m.days} дн)</span>
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">{m.accessory}</p>
                </div>

                {m.unlocked ? (
                  <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
                ) : (
                  <Lock size={14} className="text-slate-600 flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
