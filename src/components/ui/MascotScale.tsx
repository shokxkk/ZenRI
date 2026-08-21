'use client';

import React from 'react';

interface MascotScaleProps {
  totalBalance: number;
  onOpenHub?: (tab?: 'CARD' | 'MEME' | 'VOICE') => void;
}

export const MascotScale: React.FC<MascotScaleProps> = ({ totalBalance, onOpenHub }) => {
  // Scale pointer percentage (6% to 94%)
  let pct = 25;
  if (totalBalance <= 0) {
    const minVal = -1_000_000;
    const clamped = Math.max(minVal, totalBalance);
    pct = Math.round(((clamped - minVal) / (0 - minVal)) * 20) + 6;
  } else if (totalBalance < 10_000_000) {
    pct = 25 + Math.round((totalBalance / 10_000_000) * 50);
  } else {
    const maxVal = 50_000_000;
    const clamped = Math.min(maxVal, totalBalance);
    pct = 75 + Math.round(((clamped - 10_000_000) / (maxVal - 10_000_000)) * 19);
  }
  pct = Math.max(6, Math.min(94, pct));

  let mascotState: 'ANGRY' | 'HAPPY' | 'RICH' = 'HAPPY';
  if (totalBalance <= 0) {
    mascotState = 'ANGRY';
  } else if (totalBalance >= 10_000_000) {
    mascotState = 'RICH';
  }

  const details = {
    ANGRY: {
      image: '/images/mascot_angry_hoodie.png',
      auraColor: 'rgba(239, 68, 68, 0.55)',
      pointerColor: 'bg-rose-500 shadow-[0_0_12px_#ef4444]',
    },
    HAPPY: {
      image: '/images/mascot_happy_hoodie.png',
      auraColor: 'rgba(0, 194, 255, 0.55)',
      pointerColor: 'bg-[#00C2FF] shadow-[0_0_12px_#00c2ff]',
    },
    RICH: {
      image: '/images/mascot_rich_hoodie.png',
      auraColor: 'rgba(245, 158, 11, 0.55)',
      pointerColor: 'bg-amber-400 shadow-[0_0_12px_#f59e0b]',
    },
  }[mascotState];

  return (
    <div className="mt-4 pt-2 border-t border-white/10 z-20 relative">
      {/* 3-Zone Dynamic Track with Neon Pointer Arrow & Dressed Snow Leopard Mascot */}
      <div
        onClick={() => onOpenHub?.('CARD')}
        className="relative pt-14 pb-1 cursor-pointer group"
        title="Нажмите на Барсика для открытия центра VIP-Карты, Мема и Голоса ИИ"
      >
        {/* Animated Neon Arrow Pointer & Mascot Avatar */}
        <div
          className="absolute top-0 transition-all duration-700 ease-out z-20 flex flex-col items-center group-hover:scale-110"
          style={{ left: `${pct}%`, transform: 'translateX(-50%)' }}
        >
          {/* Mascot avatar wearing black hoodie with logo 7. */}
          <div className="relative w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center">
            {/* Glowing Aura Ring */}
            <div
              className="absolute inset-0 rounded-2xl animate-ping opacity-50"
              style={{ backgroundColor: details.auraColor }}
            />
            <div
              className="absolute inset-0.5 rounded-2xl blur-md opacity-70"
              style={{ backgroundColor: details.auraColor }}
            />
            <div className="w-full h-full rounded-2xl overflow-hidden border-2 border-white/40 shadow-2xl bg-black/80 relative z-10">
              <img
                src={details.image}
                alt="Барсик в худи ZenRI"
                className="w-full h-full object-cover"
                style={{ animation: 'mascotFloat 3.2s ease-in-out infinite' }}
              />
            </div>
          </div>

          {/* Neon Pointer Arrow pointing down */}
          <div className={`w-3 h-3 ${details.pointerColor} rotate-45 -mt-1 shadow-lg border border-white/60 animate-pulse`} />
        </div>

        {/* 3-Zone Track */}
        <div className="h-3 w-full rounded-full bg-slate-950 p-0.5 border border-white/20 flex overflow-hidden shadow-inner relative">
          {/* Red Zone (0% - 25%) */}
          <div className="w-[25%] h-full bg-gradient-to-r from-rose-600 via-rose-500 to-rose-400 rounded-l-full" />
          {/* Middle Zone (25% - 75%) */}
          <div className="w-[50%] h-full bg-gradient-to-r from-blue-600 via-teal-500 to-emerald-500 border-x border-black/40" />
          {/* Gold Zone (75% - 100%) */}
          <div className="w-[25%] h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 rounded-r-full" />
        </div>

        {/* Labels */}
        <div className="flex justify-between items-center text-[10px] font-black mt-1 px-0.5 opacity-90">
          <span className="text-rose-400">🟥 Минус</span>
          <span className="text-[#00C2FF]">🟦 Норма</span>
          <span className="text-amber-300">🟨 Чемпион 👑</span>
        </div>
      </div>

      <style jsx global>{`
        @keyframes mascotFloat {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-5px) scale(1.05); }
        }
      `}</style>
    </div>
  );
};
