import { AppShell } from '@/components/layout/AppShell';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getAccounts } from '@/app/actions/financeActions';
import { BooksClient } from './BooksClient';

export default async function BooksPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  let accounts: { id: string; name: string; currentBalance: string }[] = [];
  try {
    const rawAccounts = await getAccounts();
    accounts = rawAccounts.map((a) => ({
      id: a.id,
      name: a.name,
      currentBalance: String(a.currentBalance),
    }));
  } catch (e) {
    console.error('Failed to load accounts for books page:', e);
  }

  return (
    <AppShell>
      <BooksClient userAccounts={accounts} />
    </AppShell>
  );
}
