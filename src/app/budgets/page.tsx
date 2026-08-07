import { AppShell } from '@/components/layout/AppShell';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getCurrentBudget } from '@/app/actions/budgetActions';
import { getCategories } from '@/app/actions/financeActions';
import { BudgetsClient } from './BudgetsClient';

export default async function BudgetsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const [budget, categories] = await Promise.all([
    getCurrentBudget(),
    getCategories(),
  ]);

  const serializedBudget = budget
    ? {
        ...budget,
        totalLimit: budget.totalLimit.toString(),
        reserveAmount: budget.reserveAmount.toString(),
        targetSavings: budget.targetSavings.toString(),
        totalSpent: budget.totalSpent.toString(),
        createdAt: budget.createdAt.toISOString(),
        updatedAt: budget.updatedAt.toISOString(),
        categories: budget.categories.map((bc) => ({
          ...bc,
          limitAmount: bc.limitAmount.toString(),
          spent: bc.spent.toString(),
          createdAt: bc.createdAt.toISOString(),
          updatedAt: bc.updatedAt.toISOString(),
          category: {
            ...bc.category,
            createdAt: bc.category.createdAt.toISOString(),
            updatedAt: bc.category.updatedAt.toISOString(),
          },
        })),
      }
    : null;

  const serializedCategories = categories.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));

  return (
    <AppShell>
      <BudgetsClient budget={serializedBudget} categories={serializedCategories} />
    </AppShell>
  );
}
