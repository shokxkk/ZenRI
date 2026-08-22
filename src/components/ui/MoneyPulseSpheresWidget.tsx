'use client';

import React, { useState } from 'react';
import { Sparkles, Utensils, Car, ShoppingBag, Coffee, Home, Phone, Wifi, Dumbbell, BookOpen, HeartPulse, Tag } from 'lucide-react';
import { soundFx } from '@/lib/soundEffects';
import { triggerHaptic } from '@/lib/coinAnimation';

interface CategoryItem {
  name: string;
  amount: number;
  color: string;
  icon?: string;
}

interface MoneyPulseSpheresWidgetProps {
  categories?: CategoryItem[];
}

const DEFAULT_CATEGORIES: CategoryItem[] = [
  { name: 'Еда и кафе', amount: 1450000, color: '#F59E0B' },
  { name: 'Такси / Авто', amount: 820000, color: '#3B82F6' },
  { name: 'Продукты', amount: 1850000, color: '#10B981' },
  { name: 'Одежда', amount: 650000, color: '#A855F7' },
  { name: 'Развлечения', amount: 420000, color: '#EC4899' },
  { name: 'Связь и Инет', amount: 150000, color: '#00C2FF' },
];

export const MoneyPulseSpheresWidget: React.FC<MoneyPulseSpheresWidgetProps> = ({ categories = DEFAULT_CATEGORIES }) => {
  const [selectedCat, setSelectedCat] = useState<CategoryItem | null>(null);

  const displayCats = categories.length > 0 ? categories : DEFAULT_CATEGORIES;
  const maxAmount = Math.max(...displayCats.map((c) => c.amount), 1);
  const totalAmount = displayCats.reduce((acc, c) => acc + c.amount, 0);

  const handleSphereClick = (cat: CategoryItem) => {
    soundFx.playClick();
    triggerHaptic(20);
    setSelectedCat(cat);
  };

  return (
    <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/15 backdrop-blur-xl shadow-2xl space-y-4 relative overflow-hidden">
      {/* Ambient Glow */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Widget Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Sparkles size={18} className="animate-spin" style={{ animationDuration: '8s' }} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white">Пульсирующие Сферы Расходов</h3>
            <p className="text-[11px] text-zen-400">Живая визуализация трат по категориям</p>
          </div>
        </div>

        {selectedCat && (
          <span className="text-xs font-black text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-xl">
            {selectedCat.name}: {selectedCat.amount.toLocaleString('ru-RU')} сум
          </span>
        )}
      </div>

      {/* Dynamic Floating Spheres Area */}
      <div className="relative min-h-[220px] p-4 rounded-2xl bg-black/40 border border-white/10 flex flex-wrap items-center justify-center gap-4 overflow-hidden">
        {displayCats.map((cat, idx) => {
          const ratio = cat.amount / maxAmount;
          // Sphere size between 64px and 110px
          const sizePx = Math.max(68, Math.min(115, Math.round(68 + ratio * 47)));
          const pct = totalAmount > 0 ? Math.round((cat.amount / totalAmount) * 100) : 0;
          const isSelected = selectedCat?.name === cat.name;

          return (
            <button
              key={cat.name}
              onClick={() => handleSphereClick(cat)}
              className={`relative rounded-full flex flex-col items-center justify-center transition-all duration-300 group ${
                isSelected ? 'scale-110 shadow-[0_0_25px_rgba(255,255,255,0.4)] z-20' : 'hover:scale-105 active:scale-95'
              }`}
              style={{
                width: `${sizePx}px`,
                height: `${sizePx}px`,
                background: `radial-gradient(circle at 35% 35%, ${cat.color}, #090D16)`,
                boxShadow: `0 0 20px ${cat.color}45`,
                animation: `floatSphere 4s ease-in-out infinite ${idx * 0.6}s`,
              }}
            >
              {/* Outer pulsing ring */}
              <div
                className="absolute inset-0 rounded-full animate-ping opacity-30 pointer-events-none"
                style={{ backgroundColor: cat.color }}
              />

              {/* Sphere Labels */}
              <span className="text-[11px] font-black text-white drop-shadow-md text-center px-1 leading-tight">
                {cat.name.split(' ')[0]}
              </span>
              <span className="text-[9px] font-mono font-bold text-white/90 drop-shadow">
                {pct}%
              </span>
            </button>
          );
        })}
      </div>

      {/* Category breakdown bar if selected */}
      {selectedCat && (
        <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex justify-between items-center text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedCat.color }} />
            <span className="font-bold text-white">{selectedCat.name}</span>
          </div>
          <span className="font-mono font-black text-amber-300">
            {selectedCat.amount.toLocaleString('ru-RU')} сум ({Math.round((selectedCat.amount / Math.max(1, totalAmount)) * 100)}%)
          </span>
        </div>
      )}

      <style jsx global>{`
        @keyframes floatSphere {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-7px); }
        }
      `}</style>
    </div>
  );
};
