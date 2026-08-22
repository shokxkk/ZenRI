'use client';

export interface ShopItem {
  id: string;
  name: string;
  icon: string;
  category: 'ACCESSORY' | 'AURA' | 'CLOTHES';
  priceCoins: number;
  description: string;
  image?: string;
  auraClass?: string;
}

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'cyber_glasses',
    name: 'Легендарные Кибер-Очки 🕶️',
    icon: '🕶️',
    category: 'ACCESSORY',
    priceCoins: 250,
    description: 'Очки финансового кибер-гуру с неоновой подсветкой.',
  },
  {
    id: 'gold_crown',
    name: 'Золотая Корона Капитала 👑',
    icon: '👑',
    category: 'ACCESSORY',
    priceCoins: 500,
    description: 'Атрибут истинного чемпиона сбережений и накопителя.',
  },
  {
    id: 'neon_fire_aura',
    name: 'Неоновая Огненная Аура 🔥',
    icon: '🔥',
    category: 'AURA',
    priceCoins: 750,
    description: 'Огненный анимированный ореол вокруг Барсика.',
    auraClass: 'shadow-[0_0_35px_#f59e0b] border-amber-400',
  },
  {
    id: 'gold_vip_hoodie',
    name: 'Золотое VIP-Худи "7." 🧥',
    icon: '🧥',
    category: 'CLOTHES',
    priceCoins: 1000,
    description: 'Эксклюзивное худи из жидкого золота с тиснением логотипа 7.',
    image: '/images/mascot_rich_hoodie.png',
  },
  {
    id: 'shield_matrix',
    name: 'Щит Финансовой Матрицы 🛡️',
    icon: '🛡️',
    category: 'AURA',
    priceCoins: 1500,
    description: 'Защитный купол от непредвиденных трат и импульсивных покупок.',
    auraClass: 'shadow-[0_0_35px_#00c2ff] border-[#00c2ff]',
  },
];

export interface UserShopData {
  zenCoins: number;
  unlockedItemIds: string[];
  equippedItemId: string | null;
}

const STORAGE_KEY = 'zenri_barsik_shop_v1';

export function getUserShopData(): UserShopData {
  if (typeof window === 'undefined') {
    return {
      zenCoins: 1250, // Default welcome bonus ZenCoins!
      unlockedItemIds: ['cyber_glasses'],
      equippedItemId: 'cyber_glasses',
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}

  const initial: UserShopData = {
    zenCoins: 1250,
    unlockedItemIds: ['cyber_glasses'],
    equippedItemId: 'cyber_glasses',
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  } catch {}

  return initial;
}

export function saveUserShopData(data: UserShopData) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

export function buyShopItem(itemId: string): { success: boolean; message: string; updatedData: UserShopData } {
  const data = getUserShopData();
  const item = SHOP_ITEMS.find((i) => i.id === itemId);

  if (!item) {
    return { success: false, message: 'Предмет не найден', updatedData: data };
  }

  if (data.unlockedItemIds.includes(itemId)) {
    return { success: false, message: 'Предмет уже куплен!', updatedData: data };
  }

  if (data.zenCoins < item.priceCoins) {
    return { success: false, message: `Недостаточно ZenCoins! Нужно ${item.priceCoins} 🪙`, updatedData: data };
  }

  const updated: UserShopData = {
    ...data,
    zenCoins: data.zenCoins - item.priceCoins,
    unlockedItemIds: [...data.unlockedItemIds, itemId],
    equippedItemId: itemId, // Auto-equip on purchase
  };

  saveUserShopData(updated);
  return { success: true, message: `Куплено и надето: ${item.name}! 🎉`, updatedData: updated };
}

export function equipShopItem(itemId: string | null): UserShopData {
  const data = getUserShopData();
  const updated: UserShopData = {
    ...data,
    equippedItemId: itemId,
  };
  saveUserShopData(updated);
  return updated;
}

export function addCoinsToUser(amount: number): UserShopData {
  const data = getUserShopData();
  const updated: UserShopData = {
    ...data,
    zenCoins: data.zenCoins + amount,
  };
  saveUserShopData(updated);
  return updated;
}
