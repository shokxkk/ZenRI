'use client';

import React, { useRef, useState } from 'react';
import { X, Share2, Download, Crown, Sparkles, ShieldCheck, Wifi, Cpu, CheckCircle2 } from 'lucide-react';
import { soundFx } from '@/lib/soundEffects';

interface ZenRIPersonalCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  totalBalance: number;
  currentStreak: number;
}

export const ZenRIPersonalCardModal: React.FC<ZenRIPersonalCardModalProps> = ({
  isOpen,
  onClose,
  userName,
  totalBalance,
  currentStreak,
}) => {
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const isNegative = totalBalance <= 0;
  const isHigh = totalBalance >= 10_000_000;

  const cardStatus = isNegative
    ? { title: 'Зона Риска 🔴', badge: 'ZenRI Black Alert', color: '#EF4444', gradient: 'from-[#2A0D15] via-[#1F0A0F] to-[#0A0305]', mascot: '/images/mascot_angry_hoodie.png' }
    : isHigh
    ? { title: 'Абсолютный Чемпион 👑', badge: 'ZenRI Gold VIP', color: '#F59E0B', gradient: 'from-[#382607] via-[#241804] to-[#0D0801]', mascot: '/images/mascot_rich_hoodie.png' }
    : { title: 'Финансовый Мастер 🎯', badge: 'ZenRI Platinum Member', color: '#00C2FF', gradient: 'from-[#0F1E36] via-[#0B1628] to-[#050A14]', mascot: '/images/mascot_happy_hoodie.png' };

  const formattedName = (userName || 'PRODAX').toUpperCase();

  const handleShareTelegram = () => {
    soundFx.playClick();
    const shareText = encodeURIComponent(
      `🔥 Моя персональная VIP-карта в ZenRI Life OS!\n\n` +
      `👤 Владелец: ${userName}\n` +
      `👑 Статус: ${cardStatus.title}\n` +
      `🔥 Серия активных дней: ${currentStreak} дн.\n\n` +
      `Управляй финансами и жизнью вместе со мной на www.zenri.uz 🚀`
    );
    window.open(`https://t.me/share/url?url=https://www.zenri.uz&text=${shareText}`, '_blank');
  };

  const handleCopyLink = () => {
    soundFx.playCopy();
    navigator.clipboard.writeText(`https://www.zenri.uz — Мой финансовый статус в ZenRI: ${cardStatus.title}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#060C1B] border border-white/15 p-6 shadow-2xl text-white space-y-6 overflow-hidden">

        {/* Top Header */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 font-black shadow-lg">
              <Crown size={18} />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">Персональная VIP-Карта</h3>
              <p className="text-[11px] text-slate-400">Ваша уникальная упаковка статуса ZenRI</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* ═══ 3D VIP HOLOGRAM CARD CONTAINER ═══ */}
        <div className="relative group perspective-1000">
          <div
            ref={cardRef}
            className={`w-full aspect-[1.586/1] rounded-3xl bg-gradient-to-br ${cardStatus.gradient} p-6 border shadow-2xl relative overflow-hidden flex flex-col justify-between transition-transform duration-500 hover:scale-[1.02]`}
            style={{
              borderColor: `${cardStatus.color}60`,
              boxShadow: `0 20px 50px -10px ${cardStatus.color}30, inset 0 0 30px ${cardStatus.color}15`,
            }}
          >
            {/* Hologram Light Reflection Overlay */}
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                background: 'linear-gradient(115deg, transparent 20%, rgba(255,255,255,0.4) 40%, transparent 60%)',
              }}
            />

            {/* Top Card Row */}
            <div className="flex justify-between items-start relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-white font-black text-xs">
                  7.
                </div>
                <div>
                  <span className="font-black text-sm text-white tracking-tight">ZenRI</span>
                  <span className="block text-[9px] font-mono tracking-widest text-slate-400 uppercase">{cardStatus.badge}</span>
                </div>
              </div>

              {/* NFC & Chip Icon */}
              <div className="flex items-center gap-2 text-slate-400 opacity-80">
                <Wifi size={18} className="rotate-90" />
                <Cpu size={22} className="text-amber-400" />
              </div>
            </div>

            {/* Middle Card Row: Mascot Character + Micro Details */}
            <div className="flex items-center justify-between my-2 relative z-10">
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Владелец Карты</span>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-wider font-mono">{formattedName}</h2>
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border"
                  style={{ backgroundColor: `${cardStatus.color}20`, borderColor: `${cardStatus.color}40`, color: cardStatus.color }}>
                  <Sparkles size={10} />
                  <span>{cardStatus.title}</span>
                </div>
              </div>

              {/* Mascot Character Avatar */}
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-white/30 bg-black/60 shadow-2xl flex-shrink-0">
                <img src={cardStatus.mascot} alt="Барсик" className="w-full h-full object-cover" />
              </div>
            </div>

            {/* Bottom Card Row */}
            <div className="flex justify-between items-end pt-2 border-t border-white/10 relative z-10">
              <div>
                <p className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">ID Аккаунта</p>
                <p className="text-xs font-mono font-bold text-slate-200">#8797-2026-VIP</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">Серия Активности</p>
                <p className="text-xs font-black text-amber-300">🔥 {currentStreak} дн. подряд</p>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <p className="text-center text-xs text-slate-400 leading-relaxed">
          💡 Сделайте скриншот этой VIP-карты и выложите в Telegram или Instagram-сториз с отметкой <b>www.zenri.uz</b>!
        </p>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 relative z-10">
          <button
            onClick={handleShareTelegram}
            className="py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#0088CC] to-[#2563EB] text-white font-extrabold text-xs flex items-center justify-center gap-2 hover:brightness-110 transition-all active:scale-95 shadow-lg"
          >
            <Share2 size={15} />
            <span>Поделиться в Telegram</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="py-3.5 px-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            {copied ? (
              <>
                <CheckCircle2 size={15} className="text-emerald-400" />
                <span className="text-emerald-400">Скопировано!</span>
              </>
            ) : (
              <>
                <Download size={15} />
                <span>Скопировать статус</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
