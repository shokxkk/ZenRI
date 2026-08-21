'use client';

export interface LeagueMember {
  rank: number;
  name: string;
  avatarUrl: string;
  savingsRate: number; // e.g. 54%
  division: 'BRONZE' | 'SILVER' | 'GOLD' | 'DIAMOND';
  badge: string;
  isUser?: boolean;
}

export function calculateSavingsRate(income: number, expense: number): number {
  if (income <= 0) return 0;
  const net = income - expense;
  if (net <= 0) return 0;
  return Math.min(99, Math.round((net / income) * 100));
}

export function getUserDivision(savingsRate: number): {
  name: string;
  code: 'BRONZE' | 'SILVER' | 'GOLD' | 'DIAMOND';
  color: string;
  icon: string;
} {
  if (savingsRate >= 50) {
    return { name: 'Алмазная Лига 💎', code: 'DIAMOND', color: '#00C2FF', icon: '💎' };
  } else if (savingsRate >= 30) {
    return { name: 'Золотая Лига 🥇', code: 'GOLD', color: '#F59E0B', icon: '🥇' };
  } else if (savingsRate >= 15) {
    return { name: 'Серебряная Лига 🥈', code: 'SILVER', color: '#94A3B8', icon: '🥈' };
  }
  return { name: 'Бронзовая Лига 🥉', code: 'BRONZE', color: '#D97706', icon: '🥉' };
}

export function getLeaderboardData(userName: string, userSavingsRate: number): LeagueMember[] {
  const userDiv = getUserDivision(userSavingsRate);

  const anonymousBots: LeagueMember[] = [
    { rank: 1, name: 'CyberShark #942', avatarUrl: '/images/mascot_rich_hoodie.png', savingsRate: 68, division: 'DIAMOND', badge: 'Элита 💎' },
    { rank: 2, name: 'ZenTrader #108', avatarUrl: '/images/mascot_happy_hoodie.png', savingsRate: 61, division: 'DIAMOND', badge: 'Гуру ⚡' },
    { rank: 3, name: 'CryptoTiger #512', avatarUrl: '/images/mascot_rich_hoodie.png', savingsRate: 55, division: 'DIAMOND', badge: 'Мастер 👑' },
    { rank: 4, name: 'AlphaWolf #331', avatarUrl: '/images/mascot_happy_hoodie.png', savingsRate: 48, division: 'GOLD', badge: 'Профи 🎯' },
    { rank: 5, name: 'Samurai #777', avatarUrl: '/images/mascot_angry_hoodie.png', savingsRate: 42, division: 'GOLD', badge: 'Активист 🔥' },
    { rank: 6, name: 'ZenMaster #009', avatarUrl: '/images/mascot_happy_hoodie.png', savingsRate: 35, division: 'GOLD', badge: 'Накопитель 💰' },
    { rank: 7, name: 'Phoenix #204', avatarUrl: '/images/mascot_angry_hoodie.png', savingsRate: 28, division: 'SILVER', badge: 'Дисциплинированный 🛡️' },
    { rank: 8, name: 'NeonRider #619', avatarUrl: '/images/mascot_happy_hoodie.png', savingsRate: 22, division: 'SILVER', badge: 'Новичок 🚀' },
  ];

  const userEntry: LeagueMember = {
    rank: 0,
    name: `${userName || 'PRODAX'} (ВЫ)`,
    avatarUrl: userSavingsRate >= 50 ? '/images/mascot_rich_hoodie.png' : '/images/mascot_happy_hoodie.png',
    savingsRate: userSavingsRate,
    division: userDiv.code,
    badge: userDiv.name,
    isUser: true,
  };

  const combined = [...anonymousBots, userEntry].sort((a, b) => b.savingsRate - a.savingsRate);
  combined.forEach((item, index) => {
    item.rank = index + 1;
  });

  return combined;
}
