import React from 'react';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { fetchLiveExchangeRates } from '@/lib/currencyRates';
import { CalculatorClient } from './CalculatorClient';

export const metadata = {
  title: 'Калькулятор & Курсы валют — ZenRI',
  description: 'Онлайн конвертер валют ЦБ РУз, финансовые калькуляторы вкладов, кредитов и целей',
};

export default async function CalculatorPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const userId = session.user.id;
  const [user, rates] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        defaultCurrency: true,
        accounts: {
          select: {
            id: true,
            name: true,
            currentBalance: true,
            currency: true,
          },
        },
      },
    }),
    fetchLiveExchangeRates(),
  ]);

  return (
    <CalculatorClient
      initialRates={rates}
      userCurrency={user?.defaultCurrency || 'UZS'}
      userAccounts={
        user?.accounts.map((a) => ({
          id: a.id,
          name: a.name,
          currentBalance: Number(a.currentBalance),
          currency: a.currency,
        })) || []
      }
    />
  );
}
