export type SupportedCurrency = 'UZS' | 'USD' | 'EUR' | 'RUB';

export interface ExchangeRateInfo {
  code: SupportedCurrency;
  name: string;
  symbol: string;
  rateToUZS: number; // How many UZS per 1 unit of this currency
  diff24h: number; // e.g. +15.5 UZS or +0.12%
  diffPercent: number;
  date: string;
}

// Baseline official rates (Central Bank of Uzbekistan fallback)
export const DEFAULT_RATES: Record<SupportedCurrency, ExchangeRateInfo> = {
  UZS: {
    code: 'UZS',
    name: 'Узбекский сум',
    symbol: 'сум',
    rateToUZS: 1,
    diff24h: 0,
    diffPercent: 0,
    date: new Date().toLocaleDateString('ru-RU'),
  },
  USD: {
    code: 'USD',
    name: 'Доллар США',
    symbol: '$',
    rateToUZS: 12900,
    diff24h: 18.5,
    diffPercent: 0.14,
    date: new Date().toLocaleDateString('ru-RU'),
  },
  EUR: {
    code: 'EUR',
    name: 'Евро',
    symbol: '€',
    rateToUZS: 13950,
    diff24h: -12.0,
    diffPercent: -0.09,
    date: new Date().toLocaleDateString('ru-RU'),
  },
  RUB: {
    code: 'RUB',
    name: 'Российский рубль',
    symbol: '₽',
    rateToUZS: 142.5,
    diff24h: 0.8,
    diffPercent: 0.56,
    date: new Date().toLocaleDateString('ru-RU'),
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
  return `${clean.toLocaleString('ru-RU', { maximumFractionDigits: 0 })} сум`;
}

/**
 * Fetch live exchange rates from Central Bank of Uzbekistan (CBU) or open API
 */
export async function fetchLiveExchangeRates(): Promise<Record<SupportedCurrency, ExchangeRateInfo>> {
  try {
    const res = await fetch('https://cbu.uz/ru/arkhiv-kursov-valyut/json/', {
      next: { revalidate: 3600 }, // Cache 1 hour
    });

    if (!res.ok) return DEFAULT_RATES;

    const data = await res.json();
    if (!Array.isArray(data)) return DEFAULT_RATES;

    const rates: Record<SupportedCurrency, ExchangeRateInfo> = { ...DEFAULT_RATES };

    const usd = data.find((item: { Ccy: string }) => item.Ccy === 'USD');
    const eur = data.find((item: { Ccy: string }) => item.Ccy === 'EUR');
    const rub = data.find((item: { Ccy: string }) => item.Ccy === 'RUB');

    if (usd) {
      const rate = parseFloat(usd.Rate) || 12900;
      const diff = parseFloat(usd.Diff) || 0;
      rates.USD = {
        code: 'USD',
        name: 'Доллар США',
        symbol: '$',
        rateToUZS: rate,
        diff24h: diff,
        diffPercent: Number(((diff / rate) * 100).toFixed(2)),
        date: usd.Date || new Date().toLocaleDateString('ru-RU'),
      };
    }

    if (eur) {
      const rate = parseFloat(eur.Rate) || 13950;
      const diff = parseFloat(eur.Diff) || 0;
      rates.EUR = {
        code: 'EUR',
        name: 'Евро',
        symbol: '€',
        rateToUZS: rate,
        diff24h: diff,
        diffPercent: Number(((diff / rate) * 100).toFixed(2)),
        date: eur.Date || new Date().toLocaleDateString('ru-RU'),
      };
    }

    if (rub) {
      const rate = parseFloat(rub.Rate) || 142.5;
      const diff = parseFloat(rub.Diff) || 0;
      rates.RUB = {
        code: 'RUB',
        name: 'Российский рубль',
        symbol: '₽',
        rateToUZS: rate,
        diff24h: diff,
        diffPercent: Number(((diff / rate) * 100).toFixed(2)),
        date: rub.Date || new Date().toLocaleDateString('ru-RU'),
      };
    }

    return rates;
  } catch (error) {
    console.error('Failed to fetch live CBU rates, using defaults:', error);
    return DEFAULT_RATES;
  }
}
