'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { DebtType, DebtStatus, CurrencyCode, Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';

async function getUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  return session.user.id;
}

export async function getDebts() {
  const userId = await getUserId();
  return prisma.debt.findMany({
    where: { userId },
    include: { payments: { orderBy: { date: 'desc' }, take: 5 } },
    orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
  });
}

export async function createDebt(data: {
  personName: string;
  phone?: string;
  type: DebtType;
  originalAmount: number;
  dueDate?: string;
  comment?: string;
}) {
  const userId = await getUserId();
  const amount = new Prisma.Decimal(data.originalAmount);
  await prisma.debt.create({
    data: {
      userId,
      personName: data.personName,
      phone: data.phone || null,
      type: data.type,
      originalAmount: amount,
      remainingAmount: amount,
      currency: CurrencyCode.UZS,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      comment: data.comment || null,
      status: DebtStatus.ACTIVE,
    },
  });
  revalidatePath('/debts');
}

export async function addDebtPayment(debtId: string, amount: number, comment?: string) {
  const userId = await getUserId();
  const debt = await prisma.debt.findFirst({ where: { id: debtId, userId } });
  if (!debt) throw new Error('Access denied');

  const paymentAmount = new Prisma.Decimal(amount);
  const newRemaining = debt.remainingAmount.sub(paymentAmount);

  let newStatus: DebtStatus = DebtStatus.PARTIALLY_PAID;
  if (newRemaining.lte(0)) newStatus = DebtStatus.CLOSED;

  await prisma.$transaction([
    prisma.debtPayment.create({
      data: {
        userId,
        debtId,
        amount: paymentAmount,
        comment: comment || null,
        date: new Date(),
      },
    }),
    prisma.debt.update({
      where: { id: debtId },
      data: {
        remainingAmount: newRemaining.lte(0) ? new Prisma.Decimal(0) : newRemaining,
        status: newStatus,
      },
    }),
  ]);

  revalidatePath('/debts');
}
