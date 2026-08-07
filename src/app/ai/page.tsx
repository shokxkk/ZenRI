import { AppShell } from '@/components/layout/AppShell';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AIClient } from './AIClient';

export default async function AIPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  return (
    <AppShell>
      <AIClient userName={session.user.name || 'Пользователь'} />
    </AppShell>
  );
}
