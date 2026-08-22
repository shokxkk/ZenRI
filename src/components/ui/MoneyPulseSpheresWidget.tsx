'use client';

import React, { useState } from 'react';
import { Sparkles, PieChart, Info } from 'lucide-react';
import { soundFx } from '@/lib/soundEffects';
import { triggerHaptic } from '@/lib/coinAnimation';

export interface CategoryItem {
  name: string;
  amount: number;
  color: string;
}

interface MoneyPulseSpheresWidgetProps {
  categories?: CategoryItem[];
}

export const MoneyPulseSpheresWidget: React.FC<MoneyPulseSpheresWidgetProps> = ({ categories = [] }) => {
  const [selectedCat, setSelectedCat] = useState<CategoryItem | null>(null);

  const displayCats = categories.filter((c) => c.amount > 0);
  const maxAmount = Math.max(...displayCats.map((c) => c.amount), 1);
  const totalAmount = displayCats.reduce((acc, c) => acc + c.amount, 0);

  const handleSphereClick = (cat: CategoryItem) => {
    soundFx.playClick();
    triggerHaptic(20);
    setSelectedCat(cat);
  };

  return (
    <div className="p-5 rounded-3xl bg-slate-900/90 border border-white/15 backdrop-blur-xl shadow-2xl space-y-3 relative overflow-hidden">
      {/* Ambient Glow */}
      <div className="absolute top-0 right-0 w-36 h-36 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Widget Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Sparkles size={16} className="animate-spin" style={{ animationDuration: '8s' }} />
          </div>
          <div>
            <h3 className="text-xs font-extrabold text-white">Пульсирующие Сферы Расходов</h3>
            <p className="text-[10px] text-zen-400">Живая визуализация категорий трат</p>
          </div>
        </div>

        {selectedCat && (
          <span className="text-[11px] font-black text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-xl">
            {selectedCat.name}: {selectedCat.amount.toLocaleString('ru-RU')} сум
          </span>
        )}
      </div>

      {/* Dynamic Floating Spheres Area */}
      {displayCats.length === 0 ? (
        <div className="py-8 px-4 rounded-2xl bg-black/40 border border-white/10 text-center space-y-2">
          <PieChart size={24} className="mx-auto text-zen-500" />
          <p className="text-xs text-zen-300 font-medium">Нет трат за текущий период</p>
          <p className="text-[10px] text-zen-500">Добавьте расход через кнопку + или Telegram-бота для оживления сфер!</p>
        </div>
      ) : (
        <div className="relative min-h-[180px] p-3 rounded-2xl bg-black/40 border border-white/10 flex flex-wrap items-center justify-center gap-3 overflow-hidden">
          {displayCats.map((cat, idx) => {
            const ratio = cat.amount / maxAmount;
            // Responsive sphere size (between 58px and 96px)
            const sizePx = Math.max(58, Math.min(96, Math.round(58 + ratio * 38)));
            const pct = totalAmount > 0 ? Math.round((cat.amount / totalAmount) * 100) : 0;
            const isSelected = selectedCat?.name === cat.name;

            return (
              <button
                key={cat.name}
                onClick={() => handleSphereClick(cat)}
                className={`relative rounded-full flex flex-col items-center justify-center transition-all duration-300 group ${
                  isSelected ? 'scale-110 shadow-[0_0_20px_rgba(255,255,255,0.4)] z-20' : 'hover:scale-105 active:scale-95'
                }`}
                style={{
                  width: `${sizePx}px`,
                  height: `${sizePx}px`,
                  background: `radial-gradient(circle at 35% 35%, ${cat.color}, #090D16)`,
                  boxShadow: `0 0 15px ${cat.color}45`,
                  animation: `floatSphere 4s ease-in-out infinite ${idx * 0.6}s`,
                }}
              >
                {/* Outer pulsing ring */}
                <div
                  className="absolute inset-0 rounded-full animate-ping opacity-30 pointer-events-none"
                  style={{ backgroundColor: cat.color }}
                />

                {/* Sphere Labels */}
                <span className="text-[10px] font-black text-white drop-shadow-md text-center px-1 leading-tight">
                  {cat.name.split(' ')[0]}
                </span>
                <span className="text-[8px] font-mono font-bold text-white/90 drop-shadow">
                  {pct}%
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Selected category detail */}
      {selectedCat && (
        <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex justify-between items-center text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedCat.color }} />
            <span className="font-bold text-white text-xs">{selectedCat.name}</span>
          </div>
          <span className="font-mono font-black text-amber-300 text-xs">
            {selectedCat.amount.toLocaleString('ru-RU')} сум ({Math.round((selectedCat.amount / Math.max(1, totalAmount)) * 100)}%)
          </span>
        </div>
      )}

      <style jsx global>{`
        @keyframes floatSphere {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
};
