import { AppShell } from '@/components/layout/AppShell';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getDebts } from '@/app/actions/debtActions';
import { DebtsClient } from './DebtsClient';

export default async function DebtsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const debts = await getDebts();

  const serialized = debts.map((d) => ({
    ...d,
    originalAmount: d.originalAmount.toString(),
    remainingAmount: d.remainingAmount.toString(),
    dueDate: d.dueDate?.toISOString() || null,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
    payments: d.payments.map((p) => ({
      ...p,
      amount: p.amount.toString(),
      date: p.date.toISOString(),
      createdAt: p.createdAt.toISOString(),
    })),
  }));

  return (
    <AppShell>
      <DebtsClient debts={serialized} />
    </AppShell>
  );
}
