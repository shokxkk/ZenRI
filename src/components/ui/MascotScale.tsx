'use client';

import React from 'react';

interface MascotScaleProps {
  totalBalance: number;
}

export const MascotScale: React.FC<MascotScaleProps> = ({ totalBalance }) => {
  // Calculate pointer position percentage (6% to 94%)
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

  // Determine state
  let mascotState: 'ANGRY' | 'HAPPY' | 'RICH' = 'HAPPY';
  if (totalBalance <= 0) {
    mascotState = 'ANGRY';
  } else if (totalBalance >= 10_000_000) {
    mascotState = 'RICH';
  }

  const details = {
    ANGRY: {
      image: '/images/mascot_angry_clean.png',
      auraColor: 'rgba(239, 68, 68, 0.45)',
      pointerColor: 'bg-rose-500',
    },
    HAPPY: {
      image: '/images/mascot_happy_clean.png',
      auraColor: 'rgba(0, 194, 255, 0.45)',
      pointerColor: 'bg-[#00C2FF]',
    },
    RICH: {
      image: '/images/mascot_rich_clean.png',
      auraColor: 'rgba(245, 158, 11, 0.45)',
      pointerColor: 'bg-amber-400',
    },
  }[mascotState];

  return (
    <div className="mt-4 pt-2 border-t border-white/10 z-20 relative">
      {/* Dynamic 3-Zone Track with Floating Mascot Standing on the Arrow Pointer */}
      <div className="relative pt-16 pb-1">
        {/* Animated Mascot Character & Arrow Pointer */}
        <div
          className="absolute top-0 transition-all duration-700 ease-out z-20 flex flex-col items-center pointer-events-none"
          style={{ left: `${pct}%`, transform: 'translateX(-50%)' }}
        >
          {/* Animated Mascot Character Container */}
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center">
            {/* Glowing Aura Ring */}
            <div
              className="absolute inset-0 rounded-full animate-ping opacity-60"
              style={{ backgroundColor: details.auraColor }}
            />
            <div
              className="absolute inset-1 rounded-full blur-md opacity-75"
              style={{ backgroundColor: details.auraColor }}
            />

            {/* Mascot Image with live floating animation */}
            <img
              src={details.image}
              alt="Маскот"
              className="w-full h-full object-contain relative z-10 filter drop-shadow-xl"
              style={{
                animation: 'mascotFloat 3.2s ease-in-out infinite',
              }}
            />
          </div>

          {/* Glowing Arrow Pin pointing down at the scale */}
          <div className={`w-3 h-3 ${details.pointerColor} rotate-45 -mt-1 shadow-lg border border-white/40 animate-pulse`} />
        </div>

        {/* 3-Zone Gradient Scale Track */}
        <div className="h-3 w-full rounded-full bg-slate-950 p-0.5 border border-white/20 flex overflow-hidden shadow-inner relative">
          {/* Red Zone (0% - 25%) */}
          <div className="w-[25%] h-full bg-gradient-to-r from-rose-600 via-rose-500 to-rose-400 rounded-l-full" />
          {/* Middle Zone (25% - 75%) */}
          <div className="w-[50%] h-full bg-gradient-to-r from-blue-600 via-teal-500 to-emerald-500 border-x border-black/40" />
          {/* Gold Zone (75% - 100%) */}
          <div className="w-[25%] h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 rounded-r-full" />
        </div>

        {/* Scale level labels */}
        <div className="flex justify-between items-center text-[10px] font-black mt-1 px-0.5 opacity-90">
          <span className="text-rose-400">🟥 Минус</span>
          <span className="text-[#00C2FF]">🟦 Норма</span>
          <span className="text-amber-300">🟨 Чемпион 👑</span>
        </div>
      </div>

      <style jsx global>{`
        @keyframes mascotFloat {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-6px) scale(1.05); }
        }
      `}</style>
    </div>
  );
};
