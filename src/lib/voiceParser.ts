export type TransactionType = 'INCOME' | 'EXPENSE';

export interface ParsedVoiceCommand {
  type: TransactionType;
  amount: number;
  comment: string;
  rawText: string;
}

// Keywords indicating EXPENSE (расход / харажат)
const EXPENSE_KEYWORDS = [
  'расход', 'харажат', 'чиким', 'потратил', 'потратила', 'купил', 'купила',
  'заплатил', 'заплатила', 'оплатил', 'оплатила', 'вышел', 'вышла',
  'истратил', 'истратила', 'списал', 'списала', 'expense', 'chiqim',
  'to\'lov', 'tolov', 'sotib', 'oldi', 'автобус', 'такси', 'обед', 'ужин',
  'продукты', 'магазин', 'покупка', 'билет', 'метро', 'авто', 'машина',
];

// Keywords indicating INCOME (доход / даромад)
const INCOME_KEYWORDS = [
  'доход', 'даромад', 'тушум', 'получил', 'получила', 'заработал', 'заработала',
  'зарплата', 'зарплату', 'пришло', 'пришли', 'начислили', 'income',
  'kirim', 'maosh', 'oylik', 'topdi', 'ishlaganim', 'перевод', 'аванс',
];

// Number word map in Russian and Uzbek
const NUMBER_WORDS: Record<string, number> = {
  'один': 1, 'одна': 1, 'одно': 1, 'бир': 1,
  'два': 2, 'две': 2, 'икки': 2,
  'три': 3, 'уч': 3,
  'четыре': 4, 'тўрт': 4, 'торт': 4,
  'пять': 5, 'беш': 5,
  'шесть': 6, 'олти': 6, 'оти': 6,
  'семь': 7, 'етти': 7,
  'восемь': 8, 'саккиз': 8, 'ваз': 8,
  'девять': 9, 'тўққиз': 9, 'токкиз': 9,
  'десять': 10, 'ўн': 10, 'он': 10,
  'двадцать': 20, 'йигирма': 20,
  'тридцать': 30, 'ўттиз': 30,
  'сорок': 40, 'қирқ': 40,
  'пятьдесят': 50, 'эллик': 50,
  'шестьдесят': 60, 'олтмиш': 60,
  'семьдесят': 70, 'етмиш': 70,
  'восемьдесят': 80, 'саксон': 80,
  'девяносто': 90, 'тўқсон': 90,
  'сто': 100, 'двести': 200, 'триста': 300, 'четыреста': 400,
  'пятьсот': 500, 'шестьсот': 600, 'семьсот': 700, 'восемьсот': 800, 'девятьсот': 900,
  'юз': 100,
};

// Multiplier words
const MULTIPLIERS: Record<string, number> = {
  'тысяч': 1000,
  'тысячи': 1000,
  'тысячу': 1000,
  'тыс': 1000,
  'тыс.': 1000,
  'k': 1000,
  'к': 1000,
  'ming': 1000,
  'минг': 1000,
  'миллион': 1000000,
  'миллиона': 1000000,
  'миллионов': 1000000,
  'млн': 1000000,
  'million': 1000000,
  'mln': 1000000,
  'млрд': 1000000000,
  'миллиард': 1000000000,
  'milliard': 1000000000,
};

/**
 * Extract numeric amount from text.
 */
function extractAmount(tokens: string[]): { amount: number; indices: number[] } | null {
  // 1. Check numeric digits first
  for (let i = 0; i < tokens.length; i++) {
    const cleanNum = tokens[i].replace(/[^\d.]/g, '');
    const num = parseFloat(cleanNum);
    if (!isNaN(num) && num > 0) {
      const nextToken = tokens[i + 1]?.replace(/[^а-яёa-z]/g, '');
      if (nextToken && MULTIPLIERS[nextToken]) {
        return { amount: Math.round(num * MULTIPLIERS[nextToken]), indices: [i, i + 1] };
      }
      return { amount: Math.round(num), indices: [i] };
    }
  }

  // 2. Check word numbers
  let currentWordSum = 0;
  const usedIndices: number[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const clean = tokens[i].replace(/[^а-яёa-z]/g, '');
    if (NUMBER_WORDS[clean]) {
      currentWordSum += NUMBER_WORDS[clean];
      usedIndices.push(i);
    } else if (MULTIPLIERS[clean]) {
      usedIndices.push(i);
      const mult = MULTIPLIERS[clean];
      const finalAmount = (currentWordSum || 1) * mult;
      return { amount: finalAmount, indices: usedIndices };
    }
  }

  if (currentWordSum > 0) {
    return { amount: currentWordSum, indices: usedIndices };
  }

  return null;
}

/**
 * Detect transaction type.
 */
function detectType(text: string): TransactionType {
  const lower = text.toLowerCase();
  for (const kw of INCOME_KEYWORDS) {
    if (lower.includes(kw)) return 'INCOME';
  }
  return 'EXPENSE';
}

/**
 * Extract clean description/comment by excluding amount tokens, numbers, currency terms, and fillers.
 */
function extractComment(tokens: string[], amountIndices: number[]): string {
  const IGNORE_WORDS = new Set([
    'сум', 'сумов', 'сума', 'сўм', 'uzs', 'so\'m', 'som', 'расход', 'доход',
    'харажат', 'чиким', 'тушум', 'рублей', 'рубль', 'долларов', 'доллар',
    'купил', 'потратил', 'оплатил', 'получил', 'заработал', 'сделал',
  ]);

  const filtered = tokens.filter((t, i) => {
    if (amountIndices.includes(i)) return false;
    const clean = t.replace(/[^а-яёa-z0-9]/g, '');
    // Ignore pure numbers
    if (/^\d+$/.test(clean)) return false;
    // Ignore currency or action filler words
    if (IGNORE_WORDS.has(clean)) return false;
    // Ignore multiplier words
    if (MULTIPLIERS[clean]) return false;
    // Ignore number words
    if (NUMBER_WORDS[clean]) return false;
    return true;
  });

  const rawComment = filtered
    .join(' ')
    .replace(/[^\wа-яёА-ЯЁa-z0-9\s]/gi, '')
    .trim()
    .replace(/\s+/g, ' ');

  if (!rawComment) return '';
  return rawComment.charAt(0).toUpperCase() + rawComment.slice(1);
}

/**
 * Main parse function.
 */
export function parseVoiceCommand(transcript: string): ParsedVoiceCommand {
  const rawText = transcript.trim().toLowerCase();
  const tokens = rawText.split(/\s+/);
  const amountResult = extractAmount(tokens);
  const type = detectType(rawText);
  const comment = amountResult ? extractComment(tokens, amountResult.indices) : '';

  return {
    type,
    amount: amountResult ? amountResult.amount : 0,
    comment: comment || (type === 'INCOME' ? 'Доход' : 'Расход'),
    rawText: transcript.trim(),
  };
}
