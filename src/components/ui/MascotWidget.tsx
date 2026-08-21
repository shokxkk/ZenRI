'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Sparkles, TrendingUp, TrendingDown, ShieldAlert, Award, X } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { soundFx } from '@/lib/soundEffects';

interface MascotWidgetProps {
  totalBalance: number;
  monthlyIncome?: number;
  monthlyExpense?: number;
  compact?: boolean;
}

export const MascotWidget: React.FC<MascotWidgetProps> = ({
  totalBalance,
  monthlyIncome = 0,
  monthlyExpense = 0,
  compact = false,
}) => {
  const [showModal, setShowModal] = useState(false);

  // Determine state: SAD (<= 0), HAPPY (0 .. 10M), RICH (>= 10M)
  let mascotState: 'SAD' | 'HAPPY' | 'RICH' = 'HAPPY';
  if (totalBalance <= 0) {
    mascotState = 'SAD';
  } else if (totalBalance >= 10_000_000) {
    mascotState = 'RICH';
  }

  const stateDetails = {
    SAD: {
      title: 'Баланс в минусе',
      mood: 'Паст (Грустное) 🌧️',
      image: '/images/mascot_sad.png',
      badgeClass: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
      glowClass: 'from-rose-500/20 to-transparent',
      quote: 'Сейчас может быть трудно, но ты точно справишься! Главное — контролировать расходы.',
      bullets: [
        { icon: TrendingDown, text: 'Доход ниже лимита трат', color: 'text-rose-400' },
        { icon: ShieldAlert, text: 'Расходы требуют жесткого контроля', color: 'text-rose-400' },
        { icon: X, text: 'Резервная подушка исчерпана', color: 'text-rose-400' },
      ],
    },
    HAPPY: {
      title: 'Баланс ўртача',
      mood: 'Ўйинчан (Игривое) 🎯',
      image: '/images/mascot_happy.png',
      badgeClass: 'bg-[#0066FF]/20 text-[#00C2FF] border-[#0066FF]/30',
      glowClass: 'from-[#0066FF]/20 to-transparent',
      quote: 'Жуда яхши! Продолжай в том же духе, финансовые цели близко!',
      bullets: [
        { icon: TrendingUp, text: 'Доходы стабильны и поступают', color: 'text-[#00C2FF]' },
        { icon: Sparkles, text: 'Расходы под полным контролем', color: 'text-emerald-400' },
        { icon: Award, text: 'Планы и хотелки выполняются', color: 'text-[#00C2FF]' },
      ],
    },
    RICH: {
      title: 'Баланс катта',
      mood: 'Чемпион 👑',
      image: '/images/mascot_rich.png',
      badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      glowClass: 'from-amber-500/20 to-transparent',
      quote: 'Сен чемпионсан! Вперёд к ещё более грандиозным целям!',
      bullets: [
        { icon: Award, text: 'Доход очень высокий', color: 'text-amber-400' },
        { icon: Sparkles, text: 'Расходы под абсолютным контролем', color: 'text-emerald-400' },
        { icon: TrendingUp, text: 'Инвестиции и накопления работают', color: 'text-amber-400' },
      ],
    },
  }[mascotState];

  const handleMascotClick = () => {
    soundFx.playClick();
    setShowModal(true);
  };

  if (compact) {
    return (
      <>
        <button
          onClick={handleMascotClick}
          type="button"
          className="relative group cursor-pointer flex-shrink-0 transition-transform active:scale-95"
          title={`Маскот Барсик: ${stateDetails.title}`}
        >
          {/* Animated Mascot Badge */}
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border border-white/20 shadow-glow bg-gradient-to-b from-white/10 to-black/30 backdrop-blur-md flex items-center justify-center">
            {/* Animated Glow Halo */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#0066FF]/30 to-violet-500/30 animate-pulse pointer-events-none" />
            <img
              src={stateDetails.image}
              alt="ZenRI Mascot"
              className="w-full h-full object-cover rounded-2xl transform group-hover:scale-110 transition-transform duration-300 animate-float"
              style={{
                animation: 'floatMascot 4s ease-in-out infinite',
              }}
            />
            {/* Mood indicator badge */}
            <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#0F1E36] animate-ping" />
            <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#0F1E36]" />
          </div>
        </button>

        {/* Modal on Click */}
        <Modal open={showModal} onClose={() => setShowModal(false)} title="Маскот Барсик • ZenRI">
          <div className="space-y-4 text-center">
            <div className="relative w-44 h-44 mx-auto rounded-3xl overflow-hidden border border-white/20 shadow-2xl bg-gradient-to-b from-[#0066FF]/20 to-black/40">
              <img src={stateDetails.image} alt={stateDetails.title} className="w-full h-full object-cover animate-pulse" />
            </div>

            <div>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-black border uppercase mb-1 ${stateDetails.badgeClass}`}>
                {stateDetails.mood}
              </span>
              <h3 className="text-lg font-black text-zen-900 dark:text-zen-100">{stateDetails.title}</h3>
              <p className="text-xs text-zen-400 mt-1 italic max-w-xs mx-auto font-medium">«{stateDetails.quote}»</p>
            </div>

            <div className="space-y-2 text-left bg-zen-50 dark:bg-zen-900/60 p-4 rounded-2xl border border-zen-200 dark:border-zen-800">
              {stateDetails.bullets.map((b, i) => (
                <div key={i} className="flex items-center gap-2.5 text-xs font-bold">
                  <b.icon size={15} className={b.color} />
                  <span className="text-zen-800 dark:text-zen-200">{b.text}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="w-full py-3 rounded-2xl bg-[#0066FF] text-white font-black text-xs shadow-glow hover:bg-[#0052CC] transition-all"
            >
              Отлично
            </button>
          </div>
        </Modal>

        {/* Global keyframe for mascot floating */}
        <style jsx global>{`
          @keyframes floatMascot {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-4px) rotate(1deg); }
          }
        `}</style>
      </>
    );
  }

  return (
    <div className="bg-white dark:bg-[#131C2E] border border-zen-200 dark:border-zen-800/80 rounded-card p-5 shadow-apple relative overflow-hidden flex flex-col justify-between space-y-4">
      {/* Background ambient glow */}
      <div className={`absolute top-0 right-0 w-48 h-48 bg-gradient-to-br ${stateDetails.glowClass} rounded-full blur-3xl pointer-events-none`} />

      <div className="flex items-center justify-between z-10">
        <div>
          <p className="text-[10px] text-zen-400 uppercase font-black tracking-widest">{stateDetails.title}</p>
          <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase ${stateDetails.badgeClass}`}>
            Настроение: {stateDetails.mood}
          </span>
        </div>

        <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/20 shadow-glow relative">
          <img src={stateDetails.image} alt={stateDetails.title} className="w-full h-full object-cover animate-pulse" />
        </div>
      </div>

      <div className="space-y-2 z-10">
        {stateDetails.bullets.map((b, i) => (
          <div key={i} className="flex items-center gap-2 text-xs font-bold">
            <b.icon size={14} className={b.color} />
            <span className="text-zen-700 dark:text-zen-300">{b.text}</span>
          </div>
        ))}
      </div>

      <p className="text-xs text-zen-400 italic z-10 border-t border-zen-100 dark:border-zen-800/60 pt-2 font-medium">
        «{stateDetails.quote}»
      </p>
    </div>
  );
};
