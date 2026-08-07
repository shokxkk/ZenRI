import { AppShell } from '@/components/layout/AppShell';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getHabits } from '@/app/actions/habitActions';
import { HabitsClient } from './HabitsClient';

export default async function HabitsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const habits = await getHabits();

  const serialized = habits.map((h) => ({
    ...h,
    startDate: h.startDate.toISOString(),
    createdAt: h.createdAt.toISOString(),
    updatedAt: h.updatedAt.toISOString(),
    completions: h.completions.map((c) => ({
      ...c,
      date: c.date.toISOString(),
      createdAt: c.createdAt.toISOString(),
    })),
  }));

  return (
    <AppShell>
      <HabitsClient habits={serialized} />
    </AppShell>
  );
}
