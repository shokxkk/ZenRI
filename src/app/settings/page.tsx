import { AppShell } from '@/components/layout/AppShell';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getUserSettings, getAllCategories } from '@/app/actions/analyticsActions';
import { SettingsClient } from './SettingsClient';

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const [user, categoriesData] = await Promise.all([
    getUserSettings(),
    getAllCategories(),
  ]);

  const allCategories = [...categoriesData.expense, ...categoriesData.income];

  const serializedCategories = allCategories.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));

  return (
    <AppShell>
      <SettingsClient
        user={{
          id: user!.id,
          name: user!.name,
          email: user!.email,
          defaultCurrency: user!.defaultCurrency,
          avatarUrl: user!.avatarUrl || null,
          authProvider: user!.authProvider,
          telegramUsername: user!.telegramUsername || null,
        }}
        categories={serializedCategories}
      />
    </AppShell>
  );
}
