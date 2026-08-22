'use client';

export interface TarotCard {
  id: string;
  title: string;
  emoji: string;
  badge: string;
  color: string;
  gradient: string;
  quote: string;
  advice: string;
  luckBonus: string;
}

export const TAROT_CARDS: TarotCard[] = [
  {
    id: 'abundance',
    title: 'Карта Изобилия',
    emoji: '👑',
    badge: 'Удача +20%',
    color: '#F59E0B',
    gradient: 'from-amber-500/30 via-yellow-600/20 to-purple-900/40',
    quote: 'Денежный поток благоволит вам!',
    advice: 'Отличный день для важных переговоров, заключения сделок и поиска новых источников дохода.',
    luckBonus: '🚀 Шанс удачной сделки вырос на 20%',
  },
  {
    id: 'temptation',
    title: 'Карта Искушения',
    emoji: '🛑',
    badge: 'Осторожно',
    color: '#EF4444',
    gradient: 'from-rose-500/30 via-red-600/20 to-purple-900/40',
    quote: 'Риск импульсивных трат повышен!',
    advice: 'Барсик предупреждает: сегодня вам захочется потратить деньги на эмоциях (фастфуд, такси, мелочи). Держите кошелек на замке!',
    luckBonus: '⚠️ Держите паузу 24ч перед покупками',
  },
  {
    id: 'magnet',
    title: 'Денежный Магнит',
    emoji: '🧲',
    badge: 'Рост Накоплений',
    color: '#10B981',
    gradient: 'from-emerald-500/30 via-teal-600/20 to-purple-900/40',
    quote: 'Время увеличивать капитал!',
    advice: 'Любая сумма, отложенная сегодня в подушку безопасности, вернется к вам в двойном объеме.',
    luckBonus: '💎 +50 ZenCoins откладываются в копилку',
  },
  {
    id: 'wisdom',
    title: 'Карта Мудрости',
    emoji: '🦉',
    badge: 'Хладнокровие',
    color: '#00C2FF',
    gradient: 'from-blue-500/30 via-cyan-600/20 to-purple-900/40',
    quote: 'Разум побеждает сиюминутные эмоции.',
    advice: 'Прежде чем заплатить за что-либо сегодня, задайте себе 3 вопроса ИИ. Мудрые решения сэкономят максимум.',
    luckBonus: '🧠 100% Защита от финансового хаоса',
  },
  {
    id: 'breakthrough',
    title: 'Карта Прорыва',
    emoji: '🚀',
    badge: 'Новый Уровень',
    color: '#A855F7',
    gradient: 'from-purple-500/30 via-indigo-600/20 to-purple-900/40',
    quote: 'Ваш капитал выходит на новый уровень!',
    advice: 'Ваши финансовые привычки приносят первые мощные плоды. Ожидайте приятный бонус или возврат долга.',
    luckBonus: '🔥 Множитель страйка х2 на весь день',
  },
  {
    id: 'shield',
    title: 'Карта Щита',
    emoji: '🛡️',
    badge: 'Безопасность',
    color: '#3B82F6',
    gradient: 'from-blue-600/30 via-indigo-700/20 to-slate-900/40',
    quote: 'Полный контроль над утечками бюджета.',
    advice: 'Проверьте свои регулярные подписки и списания. Сегодня лучший день перекрыть незаметные дыры в бюджете.',
    luckBonus: '🛡️ Абсолютная защита баланса',
  },
];

const STORAGE_TAROT_KEY = 'zenri_tarot_daily_v1';

export function getDailyTarotCard(): { card: TarotCard; drawnDate: string } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_TAROT_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveDailyTarotCard(card: TarotCard) {
  if (typeof window === 'undefined') return;
  const todayStr = new Date().toISOString().split('T')[0];
  try {
    localStorage.setItem(STORAGE_TAROT_KEY, JSON.stringify({ card, drawnDate: todayStr }));
  } catch {}
}

export function hasDrawnTarotToday(): boolean {
  const data = getDailyTarotCard();
  if (!data) return false;
  const todayStr = new Date().toISOString().split('T')[0];
  return data.drawnDate === todayStr;
}
