'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { soundFx } from '@/lib/soundEffects';
import { TrendingDown, TrendingUp, Award, ShieldAlert, Sparkles, X } from 'lucide-react';

function formatMoney(v: number) {
  return Math.round(v).toLocaleString('ru-RU');
}

interface MascotScaleProps {
  totalBalance: number;
}

export const MascotScale: React.FC<MascotScaleProps> = ({ totalBalance }) => {
  const [showModal, setShowModal] = useState(false);

  // Calculate pointer position (4% to 96%)
  let pct = 25;
  if (totalBalance <= 0) {
    const minVal = -1_000_000;
    const clamped = Math.max(minVal, totalBalance);
    pct = Math.round(((clamped - minVal) / (0 - minVal)) * 21) + 4;
  } else if (totalBalance < 10_000_000) {
    pct = 25 + Math.round((totalBalance / 10_000_000) * 50);
  } else {
    const maxVal = 50_000_000;
    const clamped = Math.min(maxVal, totalBalance);
    pct = 75 + Math.round(((clamped - 10_000_000) / (maxVal - 10_000_000)) * 21);
  }
  pct = Math.max(4, Math.min(96, pct));

  // Determine state & mascot image
  let mascotState: 'SAD' | 'HAPPY' | 'RICH' = 'HAPPY';
  if (totalBalance <= 0) {
    mascotState = 'SAD';
  } else if (totalBalance >= 10_000_000) {
    mascotState = 'RICH';
  }

  const details = {
    SAD: {
      title: 'Баланс в минусе',
      mood: 'Злость / Минус 🔴',
      image: '/images/mascot_angry.png',
      badgeClass: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
      borderColor: 'border-rose-500 shadow-rose-500/50',
      pointerColor: 'bg-rose-500',
      quote: `У нас минус (${formatMoney(Math.abs(totalBalance))} сум)! Барсик сердится и держит шкалу на красной зоне — срочно сокращаем расходы!`,
      bullets: [
        { icon: TrendingDown, text: 'Баланс ушёл в отрицательную зону', color: 'text-rose-400' },
        { icon: ShieldAlert, text: 'Необходим жесткий контроль трат', color: 'text-rose-400' },
        { icon: X, text: 'Не совершайте незапланированных покупок', color: 'text-rose-400' },
      ],
    },
    HAPPY: {
      title: 'Баланс в норме',
      mood: 'В норме 🎯',
      image: '/images/mascot_happy.png',
      badgeClass: 'bg-[#0066FF]/20 text-[#00C2FF] border-[#0066FF]/30',
      borderColor: 'border-[#00C2FF] shadow-[#00C2FF]/50',
      pointerColor: 'bg-[#00C2FF]',
      quote: `Баланс в норме (+${formatMoney(totalBalance)} сум)! Барсик держит шкалу на сине-зелёном уровне — отличный темп!`,
      bullets: [
        { icon: TrendingUp, text: 'Доходы поступают стабильно', color: 'text-[#00C2FF]' },
        { icon: Sparkles, text: 'Расходы под понятным контролем', color: 'text-emerald-400' },
        { icon: Award, text: 'Цели и хотелки всё ближе', color: 'text-[#00C2FF]' },
      ],
    },
    RICH: {
      title: 'Баланс высокий',
      mood: 'Чемпион 👑',
      image: '/images/mascot_rich.png',
      badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      borderColor: 'border-amber-400 shadow-amber-500/50',
      pointerColor: 'bg-amber-400',
      quote: `Высокий капитал (+${formatMoney(totalBalance)} сум)! Барсик держит шкалу на золотом уровне — мы чемпионы!`,
      bullets: [
        { icon: Award, text: 'Высокий запас финансовых средств', color: 'text-amber-400' },
        { icon: Sparkles, text: 'Расходы под полным контролем', color: 'text-emerald-400' },
        { icon: TrendingUp, text: 'Инвестиции и накопления приносят рост', color: 'text-amber-400' },
      ],
    },
  }[mascotState];

  const handleOpen = () => {
    soundFx.playClick();
    setShowModal(true);
  };

  return (
    <div className="mt-4 pt-3 border-t border-white/10 space-y-2 z-20 relative">
      {/* Top Header Label */}
      <div className="flex justify-between items-center text-[11px]">
        <span className="text-zen-400 font-extrabold uppercase tracking-wider flex items-center gap-1.5">
          Уровень баланса
        </span>
        <button
          onClick={handleOpen}
          type="button"
          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border transition-transform hover:scale-105 active:scale-95 ${details.badgeClass}`}
        >
          {details.mood}
        </button>
      </div>

      {/* Dynamic 3-Zone Track with Pointer & Mascot Avatar */}
      <div className="relative pt-10 pb-1">
        {/* Pointer Pin & Mascot Thumbnail */}
        <div
          className="absolute top-0 transition-all duration-700 ease-out z-20 cursor-pointer group"
          style={{ left: `${pct}%`, transform: 'translateX(-50%)' }}
          onClick={handleOpen}
          title="Нажмите, чтобы посмотреть состояние маскота"
        >
          {/* Mascot avatar bubble */}
          <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl overflow-hidden border-2 ${details.borderColor} shadow-xl bg-slate-950 group-hover:scale-110 transition-transform relative`}>
            <img src={details.image} alt="Барсик" className="w-full h-full object-cover" />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-slate-900" />
          </div>
          {/* Arrow pointing down */}
          <div className={`w-2.5 h-2.5 ${details.pointerColor} rotate-45 mx-auto -mt-1 shadow-md`} />
        </div>

        {/* 3-Zone Gradient Scale Track */}
        <div className="h-3 w-full rounded-full bg-slate-950 p-0.5 border border-white/15 flex overflow-hidden shadow-inner relative">
          {/* Red Zone (0% - 25%) */}
          <div className="w-[25%] h-full bg-gradient-to-r from-rose-600 via-rose-500 to-rose-400 rounded-l-full" title="Минус / Низкий" />
          {/* Middle Zone (25% - 75%) */}
          <div className="w-[50%] h-full bg-gradient-to-r from-blue-600 via-teal-500 to-emerald-500 border-x border-black/40" title="Средний / Норма" />
          {/* Gold Zone (75% - 100%) */}
          <div className="w-[25%] h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 rounded-r-full" title="Высокий / Чемпион" />
        </div>

        {/* Bottom Scale Labels */}
        <div className="flex justify-between items-center text-[10px] font-black mt-1.5 px-0.5">
          <span className="text-rose-400">🟥 Минус</span>
          <span className="text-[#00C2FF]">🟦 Норма</span>
          <span className="text-amber-300">🟨 Чемпион 👑</span>
        </div>
      </div>

      {/* Modal on Click */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Барсик • Маскот ZenRI">
        <div className="space-y-4 text-center">
          <div className="relative w-44 h-44 mx-auto rounded-3xl overflow-hidden border border-white/20 shadow-2xl bg-gradient-to-b from-[#0066FF]/20 to-black/40">
            <img src={details.image} alt={details.title} className="w-full h-full object-cover animate-pulse" />
          </div>

          <div>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-black border uppercase mb-1 ${details.badgeClass}`}>
              {details.mood}
            </span>
            <h3 className="text-lg font-black text-zen-900 dark:text-zen-100">{details.title}</h3>
            <p className="text-xs text-zen-400 mt-1.5 italic max-w-xs mx-auto font-medium">«{details.quote}»</p>
          </div>

          <div className="space-y-2 text-left bg-zen-50 dark:bg-zen-900/60 p-4 rounded-2xl border border-zen-200 dark:border-zen-800">
            {details.bullets.map((b, i) => (
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
            Понятно
          </button>
        </div>
      </Modal>
    </div>
  );
};
