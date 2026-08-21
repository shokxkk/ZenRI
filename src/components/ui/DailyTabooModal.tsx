'use client';

import React, { useState } from 'react';
import { X, ShieldAlert, Sparkles, CheckCircle2, Gift, Flame } from 'lucide-react';
import { soundFx } from '@/lib/soundEffects';
import { TabooChallenge, claimTabooReward } from '@/lib/dailyTaboo';
import { triggerFlyingCoins } from '@/lib/coinAnimation';

interface DailyTabooModalProps {
  isOpen: boolean;
  onClose: () => void;
  taboo: TabooChallenge;
  onRewardClaimed?: () => void;
}

export const DailyTabooModal: React.FC<DailyTabooModalProps> = ({
  isOpen,
  onClose,
  taboo: initialTaboo,
  onRewardClaimed,
}) => {
  const [taboo, setTaboo] = useState<TabooChallenge>(initialTaboo);

  if (!isOpen) return null;

  const handleClaim = (e: React.MouseEvent) => {
    soundFx.playHabitSuccessSound();
    triggerFlyingCoins(e.clientX, e.clientY, true);
    const updated = claimTabooReward(taboo.id);
    setTaboo(updated);
    onRewardClaimed?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-gradient-to-b from-[#1C0A10] via-[#12060B] to-[#0A0306] border border-rose-500/40 p-6 shadow-2xl text-white space-y-5 overflow-hidden">

        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 font-extrabold shadow-lg">
              <ShieldAlert size={22} className="animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">ИИ-Табу Дня</h3>
              <p className="text-[11px] text-rose-300">Испытание финансовой дисциплины</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Main Challenge Card */}
        <div className="p-5 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-center space-y-3 relative z-10">
          <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-black border border-rose-500/40 inline-block">
            {taboo.title}
          </span>

          <p className="text-xs text-slate-200 leading-relaxed font-medium">
            {taboo.description}
          </p>

          <div className="pt-2 border-t border-white/10 flex justify-between items-center text-xs">
            <span className="text-slate-400">Осталось времени:</span>
            <span className="font-mono font-black text-amber-300">⏳ {taboo.hoursRemaining} часов</span>
          </div>
        </div>

        {/* Reward Section */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2 relative z-10">
          <div className="flex items-center gap-2 text-amber-300 font-extrabold text-xs">
            <Gift size={16} />
            <span>Награда за прохождение 24 часов:</span>
          </div>
          <p className="text-xs font-bold text-white pl-6">
            {taboo.rewardText}
          </p>
        </div>

        {/* Claim Action Button */}
        {taboo.completed ? (
          <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-extrabold text-center flex items-center justify-center gap-2 relative z-10">
            <CheckCircle2 size={16} />
            <span>Награда получена! Вы прошли испытание дня 🎉</span>
          </div>
        ) : (
          <button
            onClick={handleClaim}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-rose-600 via-amber-500 to-emerald-600 hover:brightness-110 text-white font-black text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg relative z-10"
          >
            <Sparkles size={16} />
            <span>Подтвердить 24ч без трат и забрать скин</span>
          </button>
        )}
      </div>
    </div>
  );
};
