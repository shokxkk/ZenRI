'use client';

export interface TabooChallenge {
  id: string;
  title: string;
  categoryKeyword: string;
  description: string;
  rewardText: string;
  hoursRemaining: number;
  completed: boolean;
  failed: boolean;
}

const TABOO_PRESETS: Omit<TabooChallenge, 'id' | 'hoursRemaining' | 'completed' | 'failed'>[] = [
  {
    title: '🚫 ТАБУ ДНЯ: 0 сум на Такси',
    categoryKeyword: 'такси',
    description: 'Выдержите 24 часа без трат на такси! Пользуйтесь общественным транспортом или пешими прогулками.',
    rewardText: 'Легендарные Очки Барсика 🕶️ + 500 XP',
  },
  {
    title: '🚫 ТАБУ ДНЯ: 0 сум на Кафе и Рестораны',
    categoryKeyword: 'еда',
    description: 'Готовьте еду дома 24 часа! Никаких доставок и ресторанов.',
    rewardText: 'Золотой Поварской Колпак 👨‍🍳 + 750 XP',
  },
  {
    title: '🚫 ТАБУ ДНЯ: 0 сум на Импульсивные Покупки',
    categoryKeyword: 'покупки',
    description: '24 часа без покупок на маркетплейсах и в магазинах одежды!',
    rewardText: 'Щит Финансовой Крепости 🛡️ + 1000 XP',
  },
];

export function getTodayTaboo(): TabooChallenge {
  if (typeof window === 'undefined') {
    return {
      id: 'taboo_default',
      ...TABOO_PRESETS[0],
      hoursRemaining: 14,
      completed: false,
      failed: false,
    };
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const storageKey = `zenri_taboo_${todayStr}`;
  const raw = localStorage.getItem(storageKey);

  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {}
  }

  // Day index picker
  const dayIndex = new Date().getDate() % TABOO_PRESETS.length;
  const taboo: TabooChallenge = {
    id: `taboo_${todayStr}`,
    ...TABOO_PRESETS[dayIndex],
    hoursRemaining: 16,
    completed: false,
    failed: false,
  };

  try {
    localStorage.setItem(storageKey, JSON.stringify(taboo));
  } catch {}

  return taboo;
}

export function claimTabooReward(tabooId: string): TabooChallenge {
  const current = getTodayTaboo();
  const updated: TabooChallenge = { ...current, completed: true };
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    localStorage.setItem(`zenri_taboo_${todayStr}`, JSON.stringify(updated));
  } catch {}
  return updated;
}
