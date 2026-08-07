import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { getAccounts, getTransactions } from '@/app/actions/financeActions';
import { getTasks } from '@/app/actions/taskActions';
import { getHabits } from '@/app/actions/habitActions';
import { DashboardClient } from './DashboardClient';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const [accounts, transactions, tasks, habits] = await Promise.all([
    getAccounts(),
    getTransactions(5),
    getTasks(),
    getHabits(),
  ]);

  const today = new Date();

  const serialized = {
    userName: session.user.name || 'Пользователь',
    totalBalance: accounts
      .filter((a) => a.includeInTotal)
      .reduce((sum, a) => sum + Number(a.currentBalance), 0),
    accounts: accounts.map((a) => ({
      id: a.id, name: a.name, type: a.type,
      currentBalance: a.currentBalance.toString(), currency: a.currency,
    })),
    recentTransactions: transactions.slice(0, 5).map((t) => ({
      id: t.id, type: t.type, amount: t.amount.toString(), date: t.date.toISOString(),
      comment: t.comment,
      categoryName: t.category?.name || null,
      accountName: t.account.name,
    })),
    todayTasks: tasks
      .filter((t) => t.dueDate && new Date(t.dueDate).toDateString() === today.toDateString() && t.status !== 'COMPLETED')
      .map((t) => ({ id: t.id, title: t.title, priority: t.priority, status: t.status, dueTime: t.dueTime })),
    habits: habits.map((h) => ({
      id: h.id, name: h.name, currentStreak: h.currentStreak,
      doneToday: h.completions.some((c) => c.isCompleted),
    })),
    thisMonthIncome: transactions
      .filter((t) => t.type === 'INCOME' && new Date(t.date).getMonth() === today.getMonth())
      .reduce((s, t) => s + Number(t.amount), 0),
    thisMonthExpense: transactions
      .filter((t) => t.type === 'EXPENSE' && new Date(t.date).getMonth() === today.getMonth())
      .reduce((s, t) => s + Number(t.amount), 0),
  };

  return (
    <AppShell>
      <DashboardClient data={serialized} />
    </AppShell>
  );
}
