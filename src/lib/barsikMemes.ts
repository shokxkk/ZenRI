'use client';

export interface BarsikMeme {
  id: string;
  categoryKeyword: string;
  topText: string;
  bottomText: string;
  mascotImage: string;
  bgGradient: string;
  emoji: string;
}

export const BARSIK_MEMES: BarsikMeme[] = [
  {
    id: 'taxi_1',
    categoryKeyword: 'такси',
    topText: 'БРАТ, ВЕЗУ ТЕБЯ НА ПОСЛЕДНИЕ 25 000 СУМ!',
    bottomText: 'Яндекс Такси в 18:00 — когда 2 км стоят как полёт в космос 🚀',
    mascotImage: '/images/mascot_angry_hoodie.png',
    bgGradient: 'from-amber-600/30 via-rose-600/20 to-purple-900/40',
    emoji: '🚖',
  },
  {
    id: 'food_1',
    categoryKeyword: 'еда',
    topText: 'КОГДА ЛЕНЬ ПОЖАРИТЬ 2 ЯЙЦА ДОМА',
    bottomText: 'И заказываешь доставку бургера за 65 000 сум 🍔',
    mascotImage: '/images/mascot_happy_hoodie.png',
    bgGradient: 'from-[#0066FF]/30 via-teal-600/20 to-slate-900/40',
    emoji: '🍔',
  },
  {
    id: 'shopping_1',
    categoryKeyword: 'покупки',
    topText: 'БАЛАНС КРИЧИТ: "НЕ НАДО!"',
    bottomText: 'Палец нажимает «Оплатить на маркетплейсе» 🛍️',
    mascotImage: '/images/mascot_angry_hoodie.png',
    bgGradient: 'from-rose-600/30 via-purple-600/20 to-black/40',
    emoji: '🛍️',
  },
  {
    id: 'income_1',
    categoryKeyword: 'доход',
    topText: 'БАРСИК В ШОКЕ: ПРИШЛА ЗАРПЛАТА! 🤑',
    bottomText: 'Главное — не раздать всё за 24 часа по «хотелкам»!',
    mascotImage: '/images/mascot_rich_hoodie.png',
    bgGradient: 'from-amber-500/30 via-emerald-600/20 to-black/40',
    emoji: '💰',
  },
  {
    id: 'general_1',
    categoryKeyword: 'разное',
    topText: 'МОЗГ: "ЭТО БЫЛО ЖИЗНЕННО НЕОБХОДИМО!"',
    bottomText: 'Кошелёк: "Чувак, ты купил какую-то ерунду..." 🧠',
    mascotImage: '/images/mascot_happy_hoodie.png',
    bgGradient: 'from-blue-600/30 via-indigo-600/20 to-black/40',
    emoji: '🎭',
  },
];

export function getRandomMemeForCategory(categoryOrComment?: string, isIncome: boolean = false): BarsikMeme {
  if (isIncome) {
    return BARSIK_MEMES.find((m) => m.categoryKeyword === 'доход') || BARSIK_MEMES[3];
  }

  const query = (categoryOrComment || '').toLowerCase();

  if (query.includes('такси') || query.includes('транспорт') || query.includes('машина')) {
    return BARSIK_MEMES[0];
  } else if (query.includes('еда') || query.includes('ресторан') || query.includes('кафе') || query.includes('ужин') || query.includes('обед')) {
    return BARSIK_MEMES[1];
  } else if (query.includes('покупки') || query.includes('одежда') || query.includes('магазин') || query.includes('шопинг')) {
    return BARSIK_MEMES[2];
  }

  // Pick random fallback meme
  const fallbacks = [BARSIK_MEMES[0], BARSIK_MEMES[1], BARSIK_MEMES[2], BARSIK_MEMES[4]];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}
