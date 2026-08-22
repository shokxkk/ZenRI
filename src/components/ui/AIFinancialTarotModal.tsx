'use client';

import React, { useState, useEffect } from 'react';
import { X, Sparkles, Share2, Award, CheckCircle2, RotateCcw, Flame } from 'lucide-react';
import { soundFx } from '@/lib/soundEffects';
import { triggerFlyingCoins, triggerHaptic } from '@/lib/coinAnimation';
import { addCoinsToUser } from '@/lib/barsikShopStore';
import {
  TarotCard,
  TAROT_CARDS,
  getDailyTarotCard,
  saveDailyTarotCard,
  hasDrawnTarotToday,
} from '@/lib/financialTarot';

interface AIFinancialTarotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCoinsAwarded?: () => void;
}

export const AIFinancialTarotModal: React.FC<AIFinancialTarotModalProps> = ({
  isOpen,
  onClose,
  onCoinsAwarded,
}) => {
  const [selectedCardIdx, setSelectedCardIdx] = useState<number | null>(null);
  const [revealedCard, setRevealedCard] = useState<TarotCard | null>(null);
  const [alreadyDrawn, setAlreadyDrawn] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const drawnData = getDailyTarotCard();
      const todayStr = new Date().toISOString().split('T')[0];

      if (drawnData && drawnData.drawnDate === todayStr) {
        setRevealedCard(drawnData.card);
        setAlreadyDrawn(true);
      } else {
        setRevealedCard(null);
        setSelectedCardIdx(null);
        setAlreadyDrawn(false);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePickCard = (cardIdx: number, e: React.MouseEvent) => {
    if (alreadyDrawn || selectedCardIdx !== null) return;

    soundFx.playCoin();
    triggerHaptic(40);
    triggerFlyingCoins(e.clientX, e.clientY, true);

    setSelectedCardIdx(cardIdx);

    // Pick a random card from pool
    const randomCard = TAROT_CARDS[Math.floor(Math.random() * TAROT_CARDS.length)];

    setTimeout(() => {
      setRevealedCard(randomCard);
      saveDailyTarotCard(randomCard);
      addCoinsToUser(50);
      if (onCoinsAwarded) onCoinsAwarded();
    }, 700);
  };

  const handleShare = () => {
    soundFx.playClick();
    if (!revealedCard) return;

    const textToShare = `🎴 Моя Карта Удачи в ZenRI на сегодня: «${revealedCard.title}» ${revealedCard.emoji}\n✨ ${revealedCard.quote}\n💡 ${revealedCard.advice}\n\nПопробуй в ZenRI 👉 www.zenri.uz`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(textToShare);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-gradient-to-b from-[#1C0D2E] via-[#120721] to-[#080212] border border-purple-500/40 p-6 shadow-2xl text-white space-y-6 overflow-hidden">

        {/* Ambient Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 font-extrabold shadow-lg">
              <Sparkles size={22} className="animate-spin" style={{ animationDuration: '6s' }} />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">ИИ-Таро Финансовой Удачи</h3>
              <p className="text-[11px] text-purple-300">Ваш персональный предсказатель на сегодня</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Card Pick Phase (3 Face-Down Cards) */}
        {!revealedCard ? (
          <div className="space-y-5 text-center relative z-10">
            <p className="text-xs font-bold text-purple-200">
              Выберите 1 из 3 магических карт судьбы и заберите +50 ZenCoins 🪙
            </p>

            <div className="grid grid-cols-3 gap-3 pt-2">
              {[0, 1, 2].map((idx) => {
                const isSelected = selectedCardIdx === idx;
                return (
                  <button
                    key={idx}
                    onClick={(e) => handlePickCard(idx, e)}
                    className={`h-44 rounded-2xl border flex flex-col items-center justify-center p-3 relative transition-all duration-700 transform cursor-pointer group ${
                      isSelected
                        ? 'rotate-y-180 scale-105 border-amber-400 bg-amber-500/20 shadow-[0_0_30px_rgba(245,158,11,0.5)]'
                        : 'bg-gradient-to-b from-[#2A1545] via-[#1F0E34] to-[#120623] border-purple-500/40 hover:border-purple-400 hover:scale-105 shadow-xl'
                    }`}
                  >
                    {/* Card Back Design */}
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300 font-mono text-xs font-black group-hover:scale-110 transition-transform">
                      🔮
                    </div>
                    <span className="text-[10px] font-black text-purple-300 uppercase tracking-widest mt-3">
                      Карта #{idx + 1}
                    </span>
                    <span className="text-[9px] text-amber-300 font-mono mt-1">+50 🪙</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Card Revealed Phase */
          <div className="space-y-5 text-center relative z-10 animate-in zoom-in duration-300">
            <div
              className={`p-6 rounded-3xl bg-gradient-to-b ${revealedCard.gradient} border border-white/20 shadow-2xl space-y-4 text-left relative overflow-hidden`}
              style={{ borderColor: revealedCard.color }}
            >
              <div className="flex justify-between items-start">
                <span className="text-4xl">{revealedCard.emoji}</span>
                <span
                  className="px-3 py-1 rounded-xl text-xs font-black text-slate-950 shadow-md"
                  style={{ backgroundColor: revealedCard.color }}
                >
                  {revealedCard.badge}
                </span>
              </div>

              <div>
                <h4 className="text-lg font-black text-white">{revealedCard.title}</h4>
                <p className="text-xs font-extrabold text-amber-300 mt-0.5">"{revealedCard.quote}"</p>
              </div>

              <p className="text-xs text-slate-200 leading-relaxed font-medium pt-1 border-t border-white/10">
                {revealedCard.advice}
              </p>

              <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex items-center gap-2 text-[11px] font-bold text-emerald-400">
                <CheckCircle2 size={15} />
                <span>{revealedCard.luckBonus}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleShare}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:brightness-110 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
              >
                <Share2 size={16} />
                <span>{copied ? 'Скопировано для Сторис! 📋' : 'Поделиться в Сторис'}</span>
              </button>

              <button
                onClick={onClose}
                className="py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs"
              >
                Закрыть
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
