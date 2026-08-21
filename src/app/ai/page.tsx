import { AppShell } from '@/components/layout/AppShell';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getAccounts } from '@/app/actions/financeActions';
import { AIClient } from './AIClient';

export default async function AIPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const userId = session.user.id;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const start6m = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [accounts, monthlyIncomeAgg, monthlyExpenseAgg, topExpenseGroup, income6mAgg, expense6mAgg] = await Promise.all([
    getAccounts(),
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
      take: 6,
    }),
    prisma.transaction.aggregate({
      where: { userId, type: 'INCOME', date: { gte: start6m } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, type: 'EXPENSE', date: { gte: start6m } },
      _sum: { amount: true },
    }),
  ]);

  const totalBalance = accounts
    .filter((a) => a.includeInTotal)
    .reduce((sum, a) => sum + Number(a.currentBalance), 0);

  const monthlyIncome = Number(monthlyIncomeAgg._sum.amount || 0);
  const monthlyExpense = Number(monthlyExpenseAgg._sum.amount || 0);
  const income6m = Number(income6mAgg._sum.amount || 0);
  const expense6m = Number(expense6mAgg._sum.amount || 0);
  const savingsRate = income6m > 0 ? Math.round(((income6m - expense6m) / income6m) * 100) : 0;

  let topCategoryName = 'Расходы';
  let topCategoryAmount = 0;
  const totalExpenseMonth = topExpenseGroup.reduce((s, g) => s + Number(g._sum.amount || 0), 0);

  const topExpenseCategories: { name: string; amount: number; percent: number; color: string }[] = [];

  for (const g of topExpenseGroup) {
    if (!g.categoryId) continue;
    const cat = await prisma.category.findUnique({ where: { id: g.categoryId } });
    if (!cat) continue;
    const amount = Number(g._sum.amount || 0);
    if (topExpenseCategories.length === 0) {
      topCategoryName = cat.name;
      topCategoryAmount = amount;
    }
    topExpenseCategories.push({
      name: cat.name,
      color: cat.color || '#71717A',
      amount,
      percent: totalExpenseMonth > 0 ? Math.round((amount / totalExpenseMonth) * 100) : 0,
    });
  }

  return (
    <AppShell>
      <AIClient
        userName={session.user.name || 'Пользователь'}
        totalBalance={totalBalance}
        monthlyIncome={monthlyIncome}
        monthlyExpense={monthlyExpense}
        topCategoryName={topCategoryName}
        topCategoryAmount={topCategoryAmount}
        savingsRate={savingsRate}
        topExpenseCategories={topExpenseCategories}
      />
    </AppShell>
  );
}
