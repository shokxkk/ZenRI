'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';

async function getUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  return session.user.id;
}

// ─── 1. Get all goals ─────────────────────────────────────────────────────────
export async function getGoals() {
  const userId = await getUserId();
  try {
    const goals = await prisma.financialGoal.findMany({
      where: { userId },
      orderBy: [{ isCompleted: 'asc' }, { createdAt: 'desc' }],
    });

    return goals.map((g) => ({
      ...g,
      targetAmount: Number(g.targetAmount),
      savedAmount: Number(g.savedAmount),
    }));
  } catch (err) {
    console.error('Goals query failed:', err);
    return [];
  }
}

// ─── 2. Create goal ───────────────────────────────────────────────────────────
export async function createGoal(data: {
  name: string;
  description?: string;
  targetAmount: number;
  savedAmount?: number;
  deadline?: string;
  type: 'SHORT_TERM' | 'LONG_TERM';
}) {
  const userId = await getUserId();

  await prisma.financialGoal.create({
    data: {
      userId,
      name: data.name.trim(),
      description: data.description?.trim() || null,
      targetAmount: new Prisma.Decimal(data.targetAmount),
      savedAmount: new Prisma.Decimal(data.savedAmount || 0),
      deadline: data.deadline ? new Date(data.deadline) : null,
      type: data.type,
    },
  });

  revalidatePath('/goals');
  return { success: true };
}

// ─── 3. Update goal (add savings or edit) ────────────────────────────────────
export async function updateGoal(
  id: string,
  data: {
    name?: string;
    description?: string;
    targetAmount?: number;
    savedAmount?: number;
    deadline?: string;
    type?: 'SHORT_TERM' | 'LONG_TERM';
    isCompleted?: boolean;
  }
) {
  const userId = await getUserId();
  const goal = await prisma.financialGoal.findFirst({ where: { id, userId } });
  if (!goal) throw new Error('Goal not found');

  await prisma.financialGoal.update({
    where: { id },
    data: {
      name: data.name?.trim() ?? goal.name,
      description: data.description !== undefined ? data.description?.trim() || null : goal.description,
      targetAmount: data.targetAmount !== undefined ? new Prisma.Decimal(data.targetAmount) : undefined,
      savedAmount: data.savedAmount !== undefined ? new Prisma.Decimal(data.savedAmount) : undefined,
      deadline: data.deadline !== undefined ? (data.deadline ? new Date(data.deadline) : null) : goal.deadline,
      type: data.type ?? goal.type,
      isCompleted: data.isCompleted !== undefined ? data.isCompleted : goal.isCompleted,
    },
  });

  revalidatePath('/goals');
  return { success: true };
}

// ─── 4. Add to savings (contribute amount to goal) ───────────────────────────
export async function addSavingsToGoal(id: string, amount: number) {
  const userId = await getUserId();
  const goal = await prisma.financialGoal.findFirst({ where: { id, userId } });
  if (!goal) throw new Error('Goal not found');

  const newSaved = Number(goal.savedAmount) + amount;
  const isCompleted = newSaved >= Number(goal.targetAmount);

  await prisma.financialGoal.update({
    where: { id },
    data: {
      savedAmount: new Prisma.Decimal(newSaved),
      isCompleted,
    },
  });

  revalidatePath('/goals');
  return { success: true, newSaved, isCompleted };
}

// ─── 5. Delete goal ───────────────────────────────────────────────────────────
export async function deleteGoal(id: string) {
  const userId = await getUserId();
  await prisma.financialGoal.deleteMany({ where: { id, userId } });
  revalidatePath('/goals');
  return { success: true };
}

// ─── 6. AI Goal Prediction ────────────────────────────────────────────────────
export async function getAIGoalPrediction(goalId: string): Promise<{
  canSavePerMonth: number;
  monthsToGoal: number;
  prediction: string;
}> {
  const userId = await getUserId();

  const goal = await prisma.financialGoal.findFirst({ where: { id: goalId, userId } });
  if (!goal) throw new Error('Goal not found');

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Get last 3 months average income and expense
  const start3m = new Date(now.getFullYear(), now.getMonth() - 2, 1);

  const [income3m, expense3m] = await Promise.all([
    prisma.transaction.aggregate({
      where: { userId, type: 'INCOME', date: { gte: start3m, lte: new Date() } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, type: 'EXPENSE', date: { gte: start3m, lte: new Date() } },
      _sum: { amount: true },
    }),
  ]);

  const avgMonthlyIncome = Number(income3m._sum.amount || 0) / 3;
  const avgMonthlyExpense = Number(expense3m._sum.amount || 0) / 3;
  const canSavePerMonth = Math.max(0, avgMonthlyIncome - avgMonthlyExpense);

  const remaining = Number(goal.targetAmount) - Number(goal.savedAmount);
  const monthsToGoal = canSavePerMonth > 0 ? Math.ceil(remaining / canSavePerMonth) : 999;

  const targetAmount = Number(goal.targetAmount).toLocaleString('ru-RU');
  const savedAmount = Number(goal.savedAmount).toLocaleString('ru-RU');
  const canSaveStr = canSavePerMonth.toLocaleString('ru-RU');

  let prediction = '';
  if (canSavePerMonth <= 0) {
    prediction = `⚠️ В последние 3 месяца расходы превышают доходы. Чтобы достичь цели "${goal.name}" (${targetAmount} сум), нужно сначала снизить расходы или увеличить доход.`;
  } else if (monthsToGoal <= 0) {
    prediction = `✅ Цель "${goal.name}" уже достигнута! Накоплено ${savedAmount} из ${targetAmount} сум.`;
  } else if (monthsToGoal <= 6) {
    prediction = `🚀 Отличный темп! При текущем сбережении ~${canSaveStr} сум/мес, вы достигнете цели "${goal.name}" примерно через ${monthsToGoal} мес. (около ${new Date(now.getFullYear(), now.getMonth() + monthsToGoal).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}).`;
  } else if (monthsToGoal <= 24) {
    prediction = `📈 Вы на правильном пути. Откладывая ~${canSaveStr} сум/мес, достигнете "${goal.name}" через ${monthsToGoal} мес. Если увеличить сбережения на 20%, срок сократится до ~${Math.ceil(monthsToGoal * 0.8)} мес.`;
  } else {
    const years = Math.floor(monthsToGoal / 12);
    const months = monthsToGoal % 12;
    prediction = `💡 Цель "${goal.name}" будет достигнута через ${years} лет ${months > 0 ? `и ${months} мес.` : ''} при текущем темпе (${canSaveStr} сум/мес). Подумайте о дополнительных источниках дохода для ускорения.`;
  }

  // Save prediction to DB
  await prisma.financialGoal.update({
    where: { id: goalId },
    data: {
      aiPredictionMonths: monthsToGoal === 999 ? null : monthsToGoal,
      aiLastAnalyzedAt: new Date(),
    },
  });

  revalidatePath('/goals');
  return { canSavePerMonth, monthsToGoal, prediction };
}
