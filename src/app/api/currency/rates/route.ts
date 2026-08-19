import { NextResponse } from 'next/server';
import { fetchLiveExchangeRates } from '@/lib/currencyRates';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rates = await fetchLiveExchangeRates();
    return NextResponse.json({
      success: true,
      source: 'Central Bank of the Republic of Uzbekistan (CBU) & bank.uz',
      syncedAt: new Date().toISOString(),
      rates,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch rates' }, { status: 500 });
  }
}
