'use client';

import React from 'react';
import { Banknote, Landmark, PiggyBank, Building, Wallet, CreditCard } from 'lucide-react';

interface AccountBrandLogoProps {
  type: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const AccountBrandLogo: React.FC<AccountBrandLogoProps> = ({
  type,
  className = '',
  size = 'md',
  showLabel = false,
}) => {
  const normalizedType = (type || '').toUpperCase();

  const dimensions = {
    sm: { w: 'w-7', h: 'h-7', text: 'text-[10px]', svgW: 16, svgH: 16 },
    md: { w: 'w-9', h: 'h-9', text: 'text-xs', svgW: 20, svgH: 20 },
    lg: { w: 'w-12', h: 'h-12', text: 'text-sm', svgW: 26, svgH: 26 },
  }[size];

  // Brand 1: UZCARD
  if (normalizedType === 'UZCARD') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div
          className={`${dimensions.w} ${dimensions.h} rounded-xl bg-[#1E3A8A] border border-[#2563EB]/40 flex items-center justify-center font-black shadow-md flex-shrink-0 relative overflow-hidden`}
          title="Uzcard"
        >
          <svg viewBox="0 0 100 100" className="w-5 h-5">
            {/* Bold U shape */}
            <path
              d="M20 20 V55 C20 75 35 85 50 85 C65 85 80 75 80 55 V20 H62 V55 C62 65 57 70 50 70 C43 70 38 65 38 55 V20 H20 Z"
              fill="#FFFFFF"
            />
            {/* Sun dot accent top right */}
            <path d="M68 20 C68 20 80 20 80 32 C80 32 80 20 68 20 Z" fill="#F97316" />
          </svg>
        </div>
        {showLabel && <span className={`font-extrabold text-[#3B82F6] ${dimensions.text}`}>Uzcard</span>}
      </div>
    );
  }

  // Brand 2: HUMO
  if (normalizedType === 'HUMO') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div
          className={`${dimensions.w} ${dimensions.h} rounded-xl bg-gradient-to-br from-[#1E293B] via-[#0F172A] to-[#1E293B] border border-[#D97706]/40 flex items-center justify-center shadow-md flex-shrink-0 relative overflow-hidden`}
          title="Humo"
        >
          <svg viewBox="0 0 100 100" className="w-5 h-5">
            {/* Golden wings swoosh */}
            <path
              d="M15 65 C30 25 75 25 85 30 C60 40 40 60 30 75 Z"
              fill="url(#humoGoldGrad)"
            />
            <path
              d="M35 70 C50 35 85 35 90 40 C72 50 55 65 45 80 Z"
              fill="url(#humoGoldGrad)"
              opacity="0.8"
            />
            <defs>
              <linearGradient id="humoGoldGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#F59E0B" />
                <stop offset="50%" stopColor="#FCD34D" />
                <stop offset="100%" stopColor="#D97706" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        {showLabel && <span className={`font-extrabold text-[#F59E0B] ${dimensions.text}`}>Humo</span>}
      </div>
    );
  }

  // Brand 3: VISA
  if (normalizedType === 'VISA') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div
          className={`${dimensions.w} ${dimensions.h} rounded-xl bg-white dark:bg-[#0F172A] border border-[#1D4ED8]/40 flex flex-col items-center justify-center shadow-md flex-shrink-0 overflow-hidden p-1`}
          title="Visa"
        >
          <svg viewBox="0 0 100 40" className="w-full h-auto">
            <text
              x="50%"
              y="28"
              textAnchor="middle"
              fill="#1A1F71"
              className="dark:fill-[#60A5FA]"
              fontSize="32"
              fontWeight="900"
              fontStyle="italic"
              fontFamily="sans-serif"
            >
              VISA
            </text>
          </svg>
          <div className="w-full h-0.5 bg-[#EAB308] mt-0.5 rounded-full" />
        </div>
        {showLabel && <span className={`font-extrabold text-[#2563EB] ${dimensions.text}`}>Visa</span>}
      </div>
    );
  }

  // Brand 4: MASTERCARD
  if (normalizedType === 'MASTERCARD') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div
          className={`${dimensions.w} ${dimensions.h} rounded-xl bg-[#111827] border border-zen-700 flex items-center justify-center shadow-md flex-shrink-0 relative overflow-hidden`}
          title="MasterCard"
        >
          <div className="flex items-center -space-x-1.5">
            <div className="w-3.5 h-3.5 rounded-full bg-[#EB001B]" />
            <div className="w-3.5 h-3.5 rounded-full bg-[#F79E1B] opacity-90" />
          </div>
        </div>
        {showLabel && <span className={`font-extrabold text-white ${dimensions.text}`}>MasterCard</span>}
      </div>
    );
  }

  // Brand 5: CASH (Наличные)
  if (normalizedType === 'CASH') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div
          className={`${dimensions.w} ${dimensions.h} rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 flex items-center justify-center shadow-md flex-shrink-0 font-bold`}
          title="Наличные"
        >
          <Banknote size={dimensions.svgW} />
        </div>
        {showLabel && <span className={`font-extrabold text-emerald-500 ${dimensions.text}`}>Наличные</span>}
      </div>
    );
  }

  // Brand 6: SAVINGS (Накопительный)
  if (normalizedType === 'SAVINGS') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div
          className={`${dimensions.w} ${dimensions.h} rounded-xl bg-gradient-to-tr from-purple-600/20 to-pink-500/20 border border-purple-500/30 text-purple-400 flex items-center justify-center shadow-md flex-shrink-0 font-bold`}
          title="Накопительный"
        >
          <PiggyBank size={dimensions.svgW} />
        </div>
        {showLabel && <span className={`font-extrabold text-purple-400 ${dimensions.text}`}>Накопительный</span>}
      </div>
    );
  }

  // Brand 7: PAYME
  if (normalizedType === 'PAYME') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div
          className={`${dimensions.w} ${dimensions.h} rounded-xl bg-[#00CCCC]/15 border border-[#00CCCC]/40 text-[#00CCCC] flex items-center justify-center font-black text-xs shadow-md flex-shrink-0`}
          title="Payme"
        >
          P
        </div>
        {showLabel && <span className={`font-extrabold text-[#00CCCC] ${dimensions.text}`}>Payme</span>}
      </div>
    );
  }

  // Brand 8: CLICK
  if (normalizedType === 'CLICK') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div
          className={`${dimensions.w} ${dimensions.h} rounded-xl bg-[#0066FF]/15 border border-[#0066FF]/40 text-[#0066FF] flex items-center justify-center font-black text-xs shadow-md flex-shrink-0`}
          title="Click"
        >
          C
        </div>
        {showLabel && <span className={`font-extrabold text-[#0066FF] ${dimensions.text}`}>Click</span>}
      </div>
    );
  }

  // Default fallback
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className={`${dimensions.w} ${dimensions.h} rounded-xl bg-zen-100 dark:bg-zen-800 border border-zen-200 dark:border-zen-700 text-zen-400 flex items-center justify-center shadow-md flex-shrink-0`}
      >
        <CreditCard size={dimensions.svgW} />
      </div>
      {showLabel && <span className={`font-extrabold text-zen-300 ${dimensions.text}`}>Карта</span>}
    </div>
  );
};
