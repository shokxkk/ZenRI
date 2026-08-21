import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { getAccounts, getTransactions } from '@/app/actions/financeActions';
import { getTasks } from '@/app/actions/taskActions';
import { getHabits } from '@/app/actions/habitActions';
import { prisma } from '@/lib/prisma';
import { DashboardClient } from './DashboardClient';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const userId = session.user.id;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    accounts,
    transactions,
    allTransactions,
    tasks,
    habits,
    monthlyIncomeAgg,
    monthlyExpenseAgg,
    topExpenseGroup,
    userCategories,
  ] = await Promise.all([
    getAccounts(),
    getTransactions(10),
    getTransactions(60),
    getTasks(),
    getHabits(),
    prisma.transaction.aggregate({
      where: { userId, type: 'INCOME', date: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, type: 'EXPENSE', date: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    prisma.transaction.groupBy({
      by: ['categoryId'],
      where: { userId, type: 'EXPENSE', date: { gte: startOfMonth }, categoryId: { not: null } },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: 1,
    }),
    prisma.category.findMany({
      where: { userId, isHidden: false },
      select: { id: true, name: true, type: true, color: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  let topCategoryName = 'Расходы';
  let topCategoryAmount = 0;

  if (topExpenseGroup.length > 0 && topExpenseGroup[0].categoryId) {
    const cat = await prisma.category.findUnique({
      where: { id: topExpenseGroup[0].categoryId },
    });
    if (cat) {
      topCategoryName = cat.name;
      topCategoryAmount = Number(topExpenseGroup[0]._sum.amount || 0);
    }
  }

  const today = new Date();
  const todayTasks = tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate).toDateString() === today.toDateString()
  );
  const todayTasksCompletedCount = todayTasks.filter((t) => t.status === 'COMPLETED').length;

  const totalBalance = accounts
    .filter((a) => a.includeInTotal)
    .reduce((sum, a) => sum + Number(a.currentBalance), 0);

  const thisMonthIncome = Number(monthlyIncomeAgg._sum.amount || 0);
  const thisMonthExpense = Number(monthlyExpenseAgg._sum.amount || 0);

  const serialized = {
    userName: session.user.name || 'Пользователь',
    totalBalance,
    accounts: accounts.map((a) => ({
      id: a.id,
      name: a.name,
      type: a.type,
      currentBalance: a.currentBalance.toString(),
      currency: a.currency,
    })),
    recentTransactions: transactions.slice(0, 5).map((t) => ({
      id: t.id,
      type: t.type,
      amount: t.amount.toString(),
      date: t.date.toISOString(),
      comment: t.comment,
      categoryName: t.category?.name || null,
      accountName: t.account.name,
    })),
    allTransactions: allTransactions.map((t) => ({
      id: t.id,
      type: t.type,
      amount: Number(t.amount),
      date: t.date.toISOString(),
    })),
    todayTasks: todayTasks
      .filter((t) => t.status !== 'COMPLETED')
      .map((t) => ({ id: t.id, title: t.title, priority: t.priority, status: t.status, dueTime: t.dueTime })),
    todayTasksTotalCount: todayTasks.length,
    todayTasksCompletedCount,
    habits: habits.map((h) => ({
      id: h.id,
      name: h.name,
      currentStreak: h.currentStreak,
      doneToday: h.completions.some((c) => c.isCompleted),
    })),
    thisMonthIncome,
    thisMonthExpense,
    topCategoryName,
    topCategoryAmount,
    categories: userCategories,
  };

  return (
    <AppShell>
      <DashboardClient data={serialized} />
    </AppShell>
  );
}
