import { AppShell } from '@/components/layout/AppShell';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getBusinesses, getPersonalFinancials } from '@/app/actions/businessActions';
import { getQuickAddDataAction } from '@/app/actions/financeActions';
import { BusinessClient } from './BusinessClient';

export const metadata = {
  title: 'Финансы Бизнеса — ZenRI',
  description: 'Учёт доходов, расходов и прибыли по каждому бизнесу',
};

export default async function BusinessPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const params = await searchParams;
  const period = params.period || 'month';

  const [businessData, personal, quickAddData] = await Promise.all([
    getBusinesses(period),
    getPersonalFinancials(period),
    getQuickAddDataAction(),
  ]);

  return (
    <AppShell>
      <BusinessClient
        businesses={businessData.businesses}
        summary={businessData.summary}
        personal={personal}
        businesses_list={quickAddData.businesses}
        period={period}
      />
    </AppShell>
  );
}
