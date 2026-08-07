import { AppShell } from '@/components/layout/AppShell';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getTasks } from '@/app/actions/taskActions';
import { TasksClient } from './TasksClient';

export default async function TasksPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const tasks = await getTasks();

  const serialized = tasks.map((t) => ({
    ...t,
    dueDate: t.dueDate?.toISOString() || null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    linkedAmount: t.linkedAmount?.toString() || null,
    subtasks: t.subtasks.map((s) => ({
      ...s,
      createdAt: s.createdAt.toISOString(),
    })),
  }));

  return (
    <AppShell>
      <TasksClient tasks={serialized} />
    </AppShell>
  );
}
