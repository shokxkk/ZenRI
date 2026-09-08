import { AppShell } from '@/components/layout/AppShell';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getGoals } from '@/app/actions/goalActions';
import { GoalsClient } from './GoalsClient';

export const metadata = {
  title: 'Финансовые цели — ZenRI',
  description: 'Ваши краткосрочные и долгосрочные финансовые цели с AI-прогнозом',
};

export default async function GoalsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const goals = await getGoals();

  return (
    <AppShell>
      <GoalsClient goals={goals} />
    </AppShell>
  );
}
