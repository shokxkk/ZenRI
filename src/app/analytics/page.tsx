import { AppShell } from '@/components/layout/AppShell';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getFullAnalytics } from '@/app/actions/analyticsActions';
import { AnalyticsClient } from './AnalyticsClient';

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const data = await getFullAnalytics();

  return (
    <AppShell>
      <AnalyticsClient data={data} />
    </AppShell>
  );
}
