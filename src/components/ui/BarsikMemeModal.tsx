'use client';

import React, { useState } from 'react';
import { X, Share2, Sparkles, Laugh, CheckCircle2 } from 'lucide-react';
import { soundFx } from '@/lib/soundEffects';
import { BarsikMeme } from '@/lib/barsikMemes';

interface BarsikMemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  meme: BarsikMeme | null;
  amount?: number;
}

export const BarsikMemeModal: React.FC<BarsikMemeModalProps> = ({
  isOpen,
  onClose,
  meme,
  amount,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !meme) return null;

  const handleShareTelegram = () => {
    soundFx.playClick();
    const shareText = encodeURIComponent(
      `🎭 Мем от Барсика из ZenRI Life OS:\n\n` +
      `«${meme.topText}»\n` +
      `«${meme.bottomText}»\n\n` +
      `Управляй финансами и с юмором на www.zenri.uz 🚀`
    );
    window.open(`https://t.me/share/url?url=https://www.zenri.uz&text=${shareText}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-[#080E1C] border border-amber-500/30 p-6 shadow-2xl text-white space-y-5 overflow-hidden">

        {/* Top Header */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white font-black shadow-lg">
              <Laugh size={18} />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">Мем-Лаборатория Барсика</h3>
              <p className="text-[11px] text-slate-400">ИИ-юмор по вашему расходу</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* ═══ VIRAL MEME TEMPLATE CARD ═══ */}
        <div className={`p-5 rounded-3xl bg-gradient-to-b ${meme.bgGradient} border border-white/20 shadow-2xl relative overflow-hidden flex flex-col items-center justify-between text-center space-y-4`}>
          {/* Top Meme Text */}
          <h2 className="text-base sm:text-lg font-black text-amber-300 uppercase tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] px-2">
            {meme.topText}
          </h2>

          {/* Center Mascot Image */}
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center">
            <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-xl animate-pulse" />
            <img
              src={meme.mascotImage}
              alt="Барсик Мем"
              className="w-full h-full object-contain relative z-10 filter drop-shadow-2xl hover:scale-105 transition-transform"
            />
          </div>

          {/* Amount Badge if present */}
          {amount && amount > 0 && (
            <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-black/60 border border-amber-400/40 text-amber-300 font-mono font-black text-xs">
              <span>Сумма: {amount.toLocaleString('ru-RU')} сум</span>
            </div>
          )}

          {/* Bottom Meme Text */}
          <p className="text-xs sm:text-sm font-bold text-white leading-snug drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] px-2">
            {meme.bottomText}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 relative z-10">
          <button
            onClick={handleShareTelegram}
            className="py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#0088CC] to-[#2563EB] text-white font-extrabold text-xs flex items-center justify-center gap-2 hover:brightness-110 transition-all active:scale-95 shadow-lg"
          >
            <Share2 size={15} />
            <span>Переслать в Telegram</span>
          </button>

          <button
            onClick={onClose}
            className="py-3.5 px-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <span>Закрыть</span>
          </button>
        </div>
      </div>
    </div>
  );
};
