import { AppShell } from '@/components/layout/AppShell';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getAccounts, getTransactions, getCategories } from '@/app/actions/financeActions';
import { FinancesClient } from './FinancesClient';

export default async function FinancesPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const [accounts, transactions, categories] = await Promise.all([
    getAccounts(),
    getTransactions(50),
    getCategories(),
  ]);

  const serialized = {
    accounts: accounts.map((a) => ({
      ...a,
      initialBalance: a.initialBalance.toString(),
      currentBalance: a.currentBalance.toString(),
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    })),
    transactions: transactions.map((t) => ({
      ...t,
      amount: t.amount.toString(),
      feeAmount: t.feeAmount.toString(),
      date: t.date.toISOString(),
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    })),
    categories: categories.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    })),
  };

  return (
    <AppShell>
      <FinancesClient {...serialized} />
    </AppShell>
  );
}
