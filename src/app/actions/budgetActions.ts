'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';

async function getUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  return session.user.id;
}

export async function getCurrentBudget() {
  const userId = await getUserId();
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const budget = await prisma.budget.findUnique({
    where: { userId_month: { userId, month } },
    include: {
      categories: {
        include: { category: true },
      },
    },
  });

  if (!budget) return null;

  // Get actual spending per category this month
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const spending = await prisma.transaction.groupBy({
    by: ['categoryId'],
    where: {
      userId,
      type: 'EXPENSE',
      date: { gte: startOfMonth, lte: endOfMonth },
      isBudgetTracked: true,
    },
    _sum: { amount: true },
  });

  const spendingMap = Object.fromEntries(
    spending.map((s) => [s.categoryId, s._sum.amount || new Prisma.Decimal(0)])
  );

  const totalSpent = spending.reduce(
    (acc, s) => acc.add(s._sum.amount || 0),
    new Prisma.Decimal(0)
  );

  return {
    ...budget,
    totalSpent,
    categories: budget.categories.map((bc) => ({
      ...bc,
      spent: spendingMap[bc.categoryId] || new Prisma.Decimal(0),
    })),
  };
}

export async function createBudget(data: {
  totalLimit: number;
  reserveAmount?: number;
  targetSavings?: number;
}) {
  const userId = await getUserId();
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  await prisma.budget.upsert({
    where: { userId_month: { userId, month } },
    update: {
      totalLimit: new Prisma.Decimal(data.totalLimit),
      reserveAmount: new Prisma.Decimal(data.reserveAmount || 0),
      targetSavings: new Prisma.Decimal(data.targetSavings || 0),
    },
    create: {
      userId,
      month,
      totalLimit: new Prisma.Decimal(data.totalLimit),
      reserveAmount: new Prisma.Decimal(data.reserveAmount || 0),
      targetSavings: new Prisma.Decimal(data.targetSavings || 0),
    },
  });

  revalidatePath('/budgets');
}

export async function setBudgetCategoryLimit(categoryId: string, limitAmount: number) {
  const userId = await getUserId();
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const budget = await prisma.budget.findUnique({
    where: { userId_month: { userId, month } },
  });
  if (!budget) throw new Error('Бюджет на текущий месяц не создан');

  await prisma.budgetCategory.upsert({
    where: { budgetId_categoryId: { budgetId: budget.id, categoryId } },
    update: { limitAmount: new Prisma.Decimal(limitAmount) },
    create: {
      userId,
      budgetId: budget.id,
      categoryId,
      limitAmount: new Prisma.Decimal(limitAmount),
    },
  });

  revalidatePath('/budgets');
}
