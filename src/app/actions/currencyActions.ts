'use server';

import { fetchLiveExchangeRates, type ExchangeRateInfo, type SupportedCurrency } from '@/lib/currencyRates';
import { revalidatePath } from 'next/cache';

export async function getLiveRatesAction(): Promise<{
  success: boolean;
  rates: Record<SupportedCurrency, ExchangeRateInfo>;
  syncedAt: string;
}> {
  const rates = await fetchLiveExchangeRates();
  revalidatePath('/calculator');
  revalidatePath('/dashboard');
  revalidatePath('/finances');

  return {
    success: true,
    rates,
    syncedAt: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  };
}
