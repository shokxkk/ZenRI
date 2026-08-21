'use client';

export interface StreakInfo {
  currentStreak: number;
  bestStreak: number;
  lastActiveDate: string; // YYYY-MM-DD
  levelName: string;
  accessory: string;
}

const STORAGE_KEY = 'zenri_user_streak_info';

export function getTodayDateString(): string {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

export function getStreakInfo(): StreakInfo {
  if (typeof window === 'undefined') {
    return {
      currentStreak: 1,
      bestStreak: 1,
      lastActiveDate: getTodayDateString(),
      levelName: 'Новичок 🔥',
      accessory: 'Базовый худи 7.',
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw) as StreakInfo;
      const today = getTodayDateString();

      // Check if last active was yesterday or today
      if (data.lastActiveDate === today) {
        return getLevelDetails(data);
      }

      const lastDate = new Date(data.lastActiveDate);
      const currentDate = new Date(today);
      const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Yesterday — streak continues!
        return getLevelDetails(data);
      } else if (diffDays > 1) {
        // Streak broken
        const resetData: StreakInfo = {
          currentStreak: 1,
          bestStreak: data.bestStreak || 1,
          lastActiveDate: today,
          levelName: 'Новичок 🔥',
          accessory: 'Базовый худи 7.',
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(resetData));
        return resetData;
      }
    }
  } catch {
    // Default fallback
  }

  // Initial streak
  const initial: StreakInfo = {
    currentStreak: 1,
    bestStreak: 1,
    lastActiveDate: getTodayDateString(),
    levelName: 'Новичок 🔥',
    accessory: 'Базовый худи 7.',
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  } catch {}
  return initial;
}

export function recordStreakActivity(): StreakInfo {
  const current = getStreakInfo();
  const today = getTodayDateString();

  if (current.lastActiveDate === today) {
    return current;
  }

  const newStreak = current.currentStreak + 1;
  const newBest = Math.max(current.bestStreak, newStreak);

  const updated: StreakInfo = {
    ...current,
    currentStreak: newStreak,
    bestStreak: newBest,
    lastActiveDate: today,
  };

  const finalInfo = getLevelDetails(updated);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(finalInfo));
  } catch {}
  return finalInfo;
}

function getLevelDetails(info: StreakInfo): StreakInfo {
  const s = info.currentStreak;
  let levelName = 'Новичок 🔥';
  let accessory = 'Базовый худи 7.';

  if (s >= 30) {
    levelName = 'Легенда 👑';
    accessory = 'Золотая корона + Цепь + Очки';
  } else if (s >= 14) {
    levelName = 'Мастер ⚡';
    accessory = 'Кепка + Солнцезащитные очки';
  } else if (s >= 7) {
    levelName = 'Профи 🎯';
    accessory = 'Стильные очки ZenRI';
  } else if (s >= 3) {
    levelName = 'В огне 🔥';
    accessory = 'Огненная аура';
  }

  return {
    ...info,
    levelName,
    accessory,
  };
}
