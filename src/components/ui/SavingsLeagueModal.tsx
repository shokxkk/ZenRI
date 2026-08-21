'use client';

import React from 'react';
import { X, Trophy, Crown, Share2, Shield, Sparkles, Flame, CheckCircle2 } from 'lucide-react';
import { soundFx } from '@/lib/soundEffects';
import { calculateSavingsRate, getUserDivision, getLeaderboardData } from '@/lib/savingsLeague';

interface SavingsLeagueModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  monthlyIncome: number;
  monthlyExpense: number;
}

export const SavingsLeagueModal: React.FC<SavingsLeagueModalProps> = ({
  isOpen,
  onClose,
  userName,
  monthlyIncome,
  monthlyExpense,
}) => {
  if (!isOpen) return null;

  const savingsRate = calculateSavingsRate(monthlyIncome, monthlyExpense);
  const division = getUserDivision(savingsRate);
  const leaderboard = getLeaderboardData(userName, savingsRate);
  const userRankEntry = leaderboard.find((m) => m.isUser);

  const handleShareLeague = () => {
    soundFx.playClick();
    const shareText = encodeURIComponent(
      `🏆 Моё место в «Лиге Сбережений ZenRI»!\n\n` +
      `👤 Игрок: ${userName}\n` +
      `🛡 Дивизион: ${division.name}\n` +
      `💰 Процент сбережений: ${savingsRate}%\n` +
      `🥇 Ранг в Таблице Чемпионов: #${userRankEntry?.rank || 1}\n\n` +
      `Присоединяйся к дивизиону на www.zenri.uz 🚀`
    );
    window.open(`https://t.me/share/url?url=https://www.zenri.uz&text=${shareText}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-gradient-to-b from-[#130E26] via-[#0D091B] to-[#07050F] border border-amber-500/30 p-6 shadow-2xl text-white space-y-5 overflow-hidden">

        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-extrabold shadow-lg">
              <Trophy size={22} className="animate-bounce" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">Анонимная Лига Сбережений</h3>
              <p className="text-[11px] text-amber-300">Сезонный чемпионат ZenRI Community</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* User Division Status Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-blue-500/20 border border-amber-400/40 flex items-center justify-between relative z-10">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ваш Дивизион</span>
            <h2 className="text-xl font-black text-white flex items-center gap-1.5 mt-0.5">
              <span>{division.icon}</span>
              <span>{division.name}</span>
            </h2>
            <p className="text-[11px] text-amber-300 font-bold mt-1">
              Сбережено за месяц: <b className="text-white">{savingsRate}%</b> дохода
            </p>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Место в рейтинге</span>
            <div className="text-3xl font-black text-amber-400 font-mono">#{userRankEntry?.rank || 1}</div>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="space-y-2 relative z-10">
          <div className="flex justify-between items-center px-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Лидеры Чемпионата</span>
            <span className="text-[10px] text-amber-300 font-mono">Обновлено только что</span>
          </div>

          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {leaderboard.map((m) => (
              <div
                key={m.rank}
                className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                  m.isUser
                    ? 'bg-amber-500/20 border-amber-400/60 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                    : 'bg-black/40 border-white/10 opacity-80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-6 text-center font-black text-xs ${
                    m.rank === 1 ? 'text-amber-400 text-sm font-extrabold' : m.rank === 2 ? 'text-slate-300' : m.rank === 3 ? 'text-amber-600' : 'text-slate-500'
                  }`}>
                    {m.rank === 1 ? '🥇' : m.rank === 2 ? '🥈' : m.rank === 3 ? '🥉' : `#${m.rank}`}
                  </span>

                  <div className="w-8 h-8 rounded-xl overflow-hidden border border-white/20 bg-black/60 flex-shrink-0">
                    <img src={m.avatarUrl} alt={m.name} className="w-full h-full object-cover" />
                  </div>

                  <div>
                    <p className={`text-xs font-bold ${m.isUser ? 'text-amber-300 font-black' : 'text-white'}`}>
                      {m.name}
                    </p>
                    <span className="text-[9px] text-slate-400">{m.badge}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-mono font-black text-amber-400">{m.savingsRate}%</span>
                  <span className="block text-[9px] text-slate-500">сбережений</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Share Action */}
        <button
          onClick={handleShareLeague}
          className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 via-purple-600 to-blue-600 hover:brightness-110 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg relative z-10"
        >
          <Share2 size={15} />
          <span>Поделиться рангом в Telegram</span>
        </button>
      </div>
    </div>
  );
};
