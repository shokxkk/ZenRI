'use client';

export type CardThemeId = 'CYBERPUNK' | 'DUBAI_GOLD' | 'APPLE_GLASS' | 'BLACK_OPS';

export interface CardThemeConfig {
  id: CardThemeId;
  name: string;
  icon: string;
  bgClass: string;
  borderColor: string;
  accentColor: string;
  badgeClass: string;
}

export const CARD_THEMES: Record<CardThemeId, CardThemeConfig> = {
  CYBERPUNK: {
    id: 'CYBERPUNK',
    name: 'Cyberpunk Aurora',
    icon: '🌌',
    bgClass: 'bg-gradient-to-br from-[#1E0936] via-[#120524] to-[#080214] shadow-[0_0_35px_rgba(168,85,247,0.25)]',
    borderColor: 'border-purple-500/50',
    accentColor: '#A855F7',
    badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  },
  DUBAI_GOLD: {
    id: 'DUBAI_GOLD',
    name: 'Dubai Gold Luxury',
    icon: '👑',
    bgClass: 'bg-gradient-to-br from-[#382607] via-[#241804] to-[#0D0801] shadow-[0_0_35px_rgba(245,158,11,0.3)]',
    borderColor: 'border-amber-400/50',
    accentColor: '#F59E0B',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold',
  },
  APPLE_GLASS: {
    id: 'APPLE_GLASS',
    name: 'Apple Frost Glass',
    icon: '💎',
    bgClass: 'bg-slate-900/60 backdrop-blur-xl border-white/25 shadow-[0_0_30px_rgba(255,255,255,0.1)]',
    borderColor: 'border-white/30',
    accentColor: '#00C2FF',
    badgeClass: 'bg-blue-500/20 text-[#00C2FF] border-blue-400/40',
  },
  BLACK_OPS: {
    id: 'BLACK_OPS',
    name: 'Black Ops Stealth',
    icon: '🔴',
    bgClass: 'bg-gradient-to-br from-[#121214] via-[#09090A] to-[#020202] shadow-[0_0_30px_rgba(239,68,68,0.2)]',
    borderColor: 'border-rose-500/40',
    accentColor: '#EF4444',
    badgeClass: 'bg-rose-500/20 text-rose-400 border-rose-500/40 font-bold',
  },
};

export function getSavedCardTheme(): CardThemeId {
  if (typeof window === 'undefined') return 'APPLE_GLASS';
  try {
    const saved = localStorage.getItem('zenri_card_theme') as CardThemeId;
    if (saved && CARD_THEMES[saved]) return saved;
  } catch {}
  return 'APPLE_GLASS';
}

export function saveCardTheme(themeId: CardThemeId) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('zenri_card_theme', themeId);
  } catch {}
}
