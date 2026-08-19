export type SupportedCurrency = 'UZS' | 'USD' | 'EUR' | 'RUB' | 'GBP' | 'AED' | 'KZT';

export interface ExchangeRateInfo {
  code: SupportedCurrency;
  name: string;
  symbol: string;
  rateToUZS: number; // How many UZS per 1 unit of this currency
  diff24h: number; // e.g. -36.95 UZS
  diffPercent: number;
  date: string;
  bankBuy?: number; // Commercial bank approximate buy rate
  bankSell?: number; // Commercial bank approximate sell rate
}

// Baseline official rates matching Central Bank of Uzbekistan (CBU) / bank.uz
export const DEFAULT_RATES: Record<SupportedCurrency, ExchangeRateInfo> = {
  UZS: {
    code: 'UZS',
    name: 'Узбекский сум',
    symbol: 'сум',
    rateToUZS: 1,
    diff24h: 0,
    diffPercent: 0,
    date: new Date().toLocaleDateString('ru-RU'),
    bankBuy: 1,
    bankSell: 1,
  },
  USD: {
    code: 'USD',
    name: 'Доллар США',
    symbol: '$',
    rateToUZS: 11820.40,
    diff24h: -36.95,
    diffPercent: -0.31,
    date: new Date().toLocaleDateString('ru-RU'),
    bankBuy: 11780.00,
    bankSell: 11860.00,
  },
  EUR: {
    code: 'EUR',
    name: 'Евро',
    symbol: '€',
    rateToUZS: 13684.48,
    diff24h: -61.75,
    diffPercent: -0.45,
    date: new Date().toLocaleDateString('ru-RU'),
    bankBuy: 13600.00,
    bankSell: 13780.00,
  },
  RUB: {
    code: 'RUB',
    name: 'Российский рубль',
    symbol: '₽',
    rateToUZS: 139.05,
    diff24h: -0.27,
    diffPercent: -0.19,
    date: new Date().toLocaleDateString('ru-RU'),
    bankBuy: 135.00,
    bankSell: 143.00,
  },
  GBP: {
    code: 'GBP',
    name: 'Фунт стерлингов',
    symbol: '£',
    rateToUZS: 15990.64,
    diff24h: -84.37,
    diffPercent: -0.52,
    date: new Date().toLocaleDateString('ru-RU'),
    bankBuy: 15850.00,
    bankSell: 16150.00,
  },
  AED: {
    code: 'AED',
    name: 'Дирхам ОАЭ',
    symbol: 'AED',
    rateToUZS: 3218.54,
    diff24h: -10.06,
    diffPercent: -0.31,
    date: new Date().toLocaleDateString('ru-RU'),
    bankBuy: 3180.00,
    bankSell: 3260.00,
  },
  KZT: {
    code: 'KZT',
    name: 'Казахстанский тенге',
    symbol: '₸',
    rateToUZS: 25.58,
    diff24h: -0.15,
    diffPercent: -0.58,
    date: new Date().toLocaleDateString('ru-RU'),
    bankBuy: 24.50,
    bankSell: 26.50,
  },
};

/**
 * Convert any amount between any two supported currencies
 */
export function convertCurrency(
  amount: number,
  from: string,
  to: string,
  customRates?: Record<string, number>
): number {
  if (from === to || isNaN(amount)) return amount;

  const getRate = (code: string) => {
    if (customRates && customRates[code]) return customRates[code];
    const key = code.toUpperCase() as SupportedCurrency;
    return DEFAULT_RATES[key]?.rateToUZS || 1;
  };

  const fromRateInUZS = getRate(from);
  const toRateInUZS = getRate(to);

  // Convert `from` -> UZS -> `to`
  const inUZS = amount * fromRateInUZS;
  const result = inUZS / toRateInUZS;

  return result;
}

/**
 * Format money with currency symbol
 */
export function formatWithCurrency(amount: number, currency: string = 'UZS'): string {
  const code = currency.toUpperCase() as SupportedCurrency;
  const clean = Number(amount) || 0;

  if (code === 'USD') {
    return `$${clean.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  }
  if (code === 'EUR') {
    return `€${clean.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  }
  if (code === 'RUB') {
    return `${clean.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ₽`;
  }
  if (code === 'GBP') {
    return `£${clean.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  }
  if (code === 'AED') {
    return `${clean.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} AED`;
  }
  if (code === 'KZT') {
    return `${clean.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} ₸`;
  }
  return `${clean.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} сум`;
}

/**
 * Fetch live real-time exchange rates from Central Bank of Uzbekistan (CBU)
 * Official JSON endpoint: https://cbu.uz/ru/arkhiv-kursov-valyut/json/
 */
export async function fetchLiveExchangeRates(): Promise<Record<SupportedCurrency, ExchangeRateInfo>> {
  try {
    const res = await fetch('https://cbu.uz/ru/arkhiv-kursov-valyut/json/', {
      cache: 'no-store', // Always fetch the freshest live market rates
    });

    if (!res.ok) return DEFAULT_RATES;

    const data = await res.json();
    if (!Array.isArray(data)) return DEFAULT_RATES;

    const rates: Record<SupportedCurrency, ExchangeRateInfo> = { ...DEFAULT_RATES };

    data.forEach((item: { Ccy: string; Rate: string; Diff: string; Date: string }) => {
      const code = item.Ccy as SupportedCurrency;
      if (rates[code]) {
        const rate = parseFloat(item.Rate) || rates[code].rateToUZS;
        const diff = parseFloat(item.Diff) || 0;
        rates[code] = {
          ...rates[code],
          rateToUZS: rate,
          diff24h: diff,
          diffPercent: Number(((diff / rate) * 100).toFixed(2)),
          date: item.Date || new Date().toLocaleDateString('ru-RU'),
          bankBuy: Number((rate * 0.996).toFixed(2)),
          bankSell: Number((rate * 1.004).toFixed(2)),
        };
      }
    });

    return rates;
  } catch (error) {
    console.error('Failed to fetch live CBU rates, using defaults:', error);
    return DEFAULT_RATES;
  }
}
