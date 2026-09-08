import { AppShell } from '@/components/layout/AppShell';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getFullAnalytics, getAnalyticsByPeriod } from '@/app/actions/analyticsActions';
import { AnalyticsClient } from './AnalyticsClient';

export const metadata = {
  title: 'Аналитика — ZenRI',
  description: 'Детальная финансовая аналитика по периодам с AI-анализом',
};

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const params = await searchParams;
  const period = params.period || 'month';

  const [data, periodData] = await Promise.all([
    getFullAnalytics(),
    getAnalyticsByPeriod(period),
  ]);

  return (
    <AppShell>
      <AnalyticsClient data={data} periodData={periodData} currentPeriod={period} />
    </AppShell>
  );
}
