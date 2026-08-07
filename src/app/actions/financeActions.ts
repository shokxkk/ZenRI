'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { TransactionType, CurrencyCode, Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';

async function getUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  return session.user.id;
}

export async function getAccounts() {
  const userId = await getUserId();
  const accounts = await prisma.account.findMany({
    where: { userId, isActive: true },
    orderBy: { createdAt: 'asc' },
  });
  return accounts.map((acc) => ({
    ...acc,
    initialBalance: Number(acc.initialBalance),
    currentBalance: Number(acc.currentBalance),
  }));
}

export async function getTransactions(limit = 30) {
  const userId = await getUserId();
  const txs = await prisma.transaction.findMany({
    where: { userId },
    include: {
      category: true,
      account: { select: { name: true, type: true } },
      targetAccount: { select: { name: true } },
    },
    orderBy: { date: 'desc' },
    take: limit,
  });
  return txs.map((tx) => ({
    ...tx,
    amount: Number(tx.amount),
    feeAmount: Number(tx.feeAmount),
  }));
}

export async function getCategories() {
  const userId = await getUserId();
  return prisma.category.findMany({
    where: { userId, isHidden: false },
    orderBy: [{ type: 'asc' }, { name: 'asc' }],
  });
}

export async function addTransaction(data: {
  type: TransactionType;
  amount: number;
  accountId: string;
  categoryId?: string;
  targetAccountId?: string;
  comment?: string;
  date?: string;
}) {
  const userId = await getUserId();
  const amount = new Prisma.Decimal(data.amount);

  await prisma.$transaction(async (tx) => {
    await tx.transaction.create({
      data: {
        userId,
        type: data.type,
        amount,
        currency: CurrencyCode.UZS,
        accountId: data.accountId,
        categoryId: data.categoryId || null,
        targetAccountId: data.targetAccountId || null,
        comment: data.comment || null,
        date: data.date ? new Date(data.date) : new Date(),
      },
    });

    if (data.type === TransactionType.INCOME) {
      await tx.account.update({
        where: { id: data.accountId },
        data: { currentBalance: { increment: amount } },
      });
    } else if (data.type === TransactionType.EXPENSE) {
      await tx.account.update({
        where: { id: data.accountId },
        data: { currentBalance: { decrement: amount } },
      });
    } else if (data.type === TransactionType.TRANSFER && data.targetAccountId) {
      await tx.account.update({
        where: { id: data.accountId },
        data: { currentBalance: { decrement: amount } },
      });
      await tx.account.update({
        where: { id: data.targetAccountId },
        data: { currentBalance: { increment: amount } },
      });
    }
  });

  revalidatePath('/finances');
  revalidatePath('/dashboard');
}

export async function updateTransaction(
  id: string,
  data: {
    amount?: number;
    categoryId?: string;
    comment?: string;
  }
) {
  const userId = await getUserId();
  const tx = await prisma.transaction.findFirst({ where: { id, userId } });
  if (!tx) throw new Error('Transaction not found');

  await prisma.transaction.update({
    where: { id },
    data: {
      amount: data.amount ? new Prisma.Decimal(data.amount) : undefined,
      categoryId: data.categoryId || undefined,
      comment: data.comment !== undefined ? data.comment : undefined,
    },
  });

  revalidatePath('/finances');
  revalidatePath('/dashboard');
}

export async function deleteTransaction(id: string) {
  const userId = await getUserId();
  const tx = await prisma.transaction.findFirst({ where: { id, userId } });
  if (!tx) throw new Error('Transaction not found');

  await prisma.$transaction(async (trx) => {
    // Reverse balance effect
    if (tx.type === TransactionType.INCOME) {
      await trx.account.update({
        where: { id: tx.accountId },
        data: { currentBalance: { decrement: tx.amount } },
      });
    } else if (tx.type === TransactionType.EXPENSE) {
      await trx.account.update({
        where: { id: tx.accountId },
        data: { currentBalance: { increment: tx.amount } },
      });
    } else if (tx.type === TransactionType.TRANSFER && tx.targetAccountId) {
      await trx.account.update({
        where: { id: tx.accountId },
        data: { currentBalance: { increment: tx.amount } },
      });
      await trx.account.update({
        where: { id: tx.targetAccountId },
        data: { currentBalance: { decrement: tx.amount } },
      });
    }

    await trx.transaction.delete({ where: { id } });
  });

  revalidatePath('/finances');
  revalidatePath('/dashboard');
}

export async function createAccount(data: {
  name: string;
  type: string;
  initialBalance: number;
  icon?: string;
}) {
  const userId = await getUserId();
  const balance = new Prisma.Decimal(data.initialBalance);
  await prisma.account.create({
    data: {
      userId,
      name: data.name,
      type: data.type as never,
      currency: CurrencyCode.UZS,
      initialBalance: balance,
      currentBalance: balance,
      icon: data.icon || 'wallet',
    },
  });
  revalidatePath('/finances');
}
