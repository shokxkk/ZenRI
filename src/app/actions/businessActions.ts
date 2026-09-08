'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

async function getUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  return session.user.id;
}

// ─── Helper: get date range for a period ────────────────────────────────────
export async function getPeriodRange(period: string): Promise<{ start: Date; end: Date }> {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  switch (period) {
    case 'day': {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      return { start, end };
    }
    case 'week': {
      const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1;
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - dayOfWeek, 0, 0, 0, 0);
      return { start, end };
    }
    case 'month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      return { start, end };
    }
    case 'quarter': {
      const quarterStart = Math.floor(now.getMonth() / 3) * 3;
      const start = new Date(now.getFullYear(), quarterStart, 1, 0, 0, 0, 0);
      return { start, end };
    }
    case '6months': {
      const start = new Date(now.getFullYear(), now.getMonth() - 5, 1, 0, 0, 0, 0);
      return { start, end };
    }
    case 'year': {
      const start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      return { start, end };
    }
    default: {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      return { start, end };
    }
  }
}

// ─── 1. Get all businesses with P&L summary ──────────────────────────────────
export async function getBusinesses(period = 'month') {
  const userId = await getUserId();
  const { start, end } = await getPeriodRange(period);

  const businesses = await prisma.business.findMany({
    where: { userId, isActive: true },
    orderBy: { createdAt: 'asc' },
  });

  const businessesWithStats = await Promise.all(
    businesses.map(async (b) => {
      const [income, expense] = await Promise.all([
        prisma.transaction.aggregate({
          where: { userId, businessId: b.id, type: 'INCOME', date: { gte: start, lte: end } },
          _sum: { amount: true },
        }),
        prisma.transaction.aggregate({
          where: { userId, businessId: b.id, type: 'EXPENSE', date: { gte: start, lte: end } },
          _sum: { amount: true },
        }),
      ]);

      const totalIncome = Number(income._sum.amount || 0);
      const totalExpense = Number(expense._sum.amount || 0);

      return {
        ...b,
        totalIncome,
        totalExpense,
        profit: totalIncome - totalExpense,
      };
    })
  );

  // All-businesses summary
  const totalIncome = businessesWithStats.reduce((s, b) => s + b.totalIncome, 0);
  const totalExpense = businessesWithStats.reduce((s, b) => s + b.totalExpense, 0);

  return {
    businesses: businessesWithStats,
    summary: {
      totalIncome,
      totalExpense,
      totalProfit: totalIncome - totalExpense,
    },
  };
}

// ─── 2. Get business detail with category breakdown ──────────────────────────
export async function getBusinessDetail(businessId: string, period = 'month') {
  const userId = await getUserId();
  const { start, end } = await getPeriodRange(period);

  const business = await prisma.business.findFirst({
    where: { id: businessId, userId },
  });
  if (!business) throw new Error('Business not found');

  const transactions = await prisma.transaction.findMany({
    where: { userId, businessId, date: { gte: start, lte: end } },
    include: {
      category: { select: { name: true, color: true, icon: true } },
      account: { select: { name: true, type: true } },
    },
    orderBy: { date: 'desc' },
    take: 100,
  });

  // Category breakdown
  const expenseByCategory: Record<string, { name: string; color: string; amount: number }> = {};
  const incomeByCategory: Record<string, { name: string; color: string; amount: number }> = {};

  let totalIncome = 0;
  let totalExpense = 0;

  for (const tx of transactions) {
    const amt = Number(tx.amount);
    const catName = tx.category?.name || 'Без категории';
    const catColor = tx.category?.color || '#71717A';

    if (tx.type === 'INCOME') {
      totalIncome += amt;
      if (!incomeByCategory[catName]) incomeByCategory[catName] = { name: catName, color: catColor, amount: 0 };
      incomeByCategory[catName].amount += amt;
    } else if (tx.type === 'EXPENSE') {
      totalExpense += amt;
      if (!expenseByCategory[catName]) expenseByCategory[catName] = { name: catName, color: catColor, amount: 0 };
      expenseByCategory[catName].amount += amt;
    }
  }

  return {
    business,
    transactions,
    totalIncome,
    totalExpense,
    profit: totalIncome - totalExpense,
    expenseByCategory: Object.values(expenseByCategory).sort((a, b) => b.amount - a.amount),
    incomeByCategory: Object.values(incomeByCategory).sort((a, b) => b.amount - a.amount),
  };
}

// ─── 3. Create business ───────────────────────────────────────────────────────
export async function createBusiness(data: {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
}) {
  const userId = await getUserId();
  await prisma.business.create({
    data: {
      userId,
      name: data.name.trim(),
      description: data.description?.trim() || null,
      color: data.color || '#0066FF',
      icon: data.icon || 'briefcase',
    },
  });
  revalidatePath('/business');
  revalidatePath('/finances');
  return { success: true };
}

// ─── 4. Update business ───────────────────────────────────────────────────────
export async function updateBusiness(
  id: string,
  data: { name?: string; description?: string; color?: string; icon?: string }
) {
  const userId = await getUserId();
  await prisma.business.updateMany({
    where: { id, userId },
    data: {
      name: data.name?.trim(),
      description: data.description?.trim() || null,
      color: data.color,
      icon: data.icon,
    },
  });
  revalidatePath('/business');
  return { success: true };
}

// ─── 5. Delete business ───────────────────────────────────────────────────────
export async function deleteBusiness(id: string) {
  const userId = await getUserId();
  // Unlink all transactions first
  await prisma.transaction.updateMany({
    where: { userId, businessId: id },
    data: { businessId: null },
  });
  await prisma.business.deleteMany({ where: { id, userId } });
  revalidatePath('/business');
  revalidatePath('/finances');
  return { success: true };
}

// ─── 6. Get personal finances (no businessId) ────────────────────────────────
export async function getPersonalFinancials(period = 'month') {
  const userId = await getUserId();
  const { start, end } = await getPeriodRange(period);

  const [income, expense] = await Promise.all([
    prisma.transaction.aggregate({
      where: { userId, businessId: null, type: 'INCOME', date: { gte: start, lte: end } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, businessId: null, type: 'EXPENSE', date: { gte: start, lte: end } },
      _sum: { amount: true },
    }),
  ]);

  const totalIncome = Number(income._sum.amount || 0);
  const totalExpense = Number(expense._sum.amount || 0);

  // Top expense categories (personal)
  const expenseGroups = await prisma.transaction.groupBy({
    by: ['categoryId'],
    where: { userId, businessId: null, type: 'EXPENSE', date: { gte: start, lte: end }, categoryId: { not: null } },
    _sum: { amount: true },
    orderBy: { _sum: { amount: 'desc' } },
    take: 8,
  });

  const topCategories = await Promise.all(
    expenseGroups.map(async (g) => {
      const cat = g.categoryId ? await prisma.category.findUnique({ where: { id: g.categoryId } }) : null;
      const amount = Number(g._sum.amount || 0);
      return {
        name: cat?.name || 'Без категории',
        color: cat?.color || '#71717A',
        amount,
        percent: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0,
      };
    })
  );

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    topCategories,
  };
}
