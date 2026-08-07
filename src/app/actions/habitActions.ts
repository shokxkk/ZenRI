'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

async function getUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  return session.user.id;
}

export async function getHabits() {
  const userId = await getUserId();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return prisma.habit.findMany({
    where: { userId, isActive: true },
    include: {
      completions: {
        where: {
          date: { gte: today, lt: tomorrow },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });
}

export async function createHabit(data: {
  name: string;
  icon?: string;
  frequency?: string;
  timeReminder?: string;
}) {
  const userId = await getUserId();
  await prisma.habit.create({
    data: {
      userId,
      name: data.name,
      icon: data.icon || 'check-circle',
      frequency: data.frequency || 'daily',
      timeReminder: data.timeReminder || null,
    },
  });
  revalidatePath('/habits');
  revalidatePath('/dashboard');
}

export async function updateHabit(
  habitId: string,
  data: {
    name?: string;
    icon?: string;
  }
) {
  const userId = await getUserId();
  await prisma.habit.updateMany({
    where: { id: habitId, userId },
    data: {
      name: data.name || undefined,
      icon: data.icon || undefined,
    },
  });
  revalidatePath('/habits');
  revalidatePath('/dashboard');
}

export async function toggleHabitCompletion(habitId: string, completed: boolean) {
  const userId = await getUserId();
  const habit = await prisma.habit.findFirst({ where: { id: habitId, userId } });
  if (!habit) throw new Error('Access denied');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (completed) {
    await prisma.habitCompletion.upsert({
      where: { habitId_date: { habitId, date: today } },
      create: { habitId, userId, date: today, isCompleted: true },
      update: { isCompleted: true },
    });
    await prisma.habit.update({
      where: { id: habitId },
      data: {
        currentStreak: { increment: 1 },
        bestStreak: habit.currentStreak + 1 > habit.bestStreak
          ? habit.currentStreak + 1
          : undefined,
      },
    });
  } else {
    await prisma.habitCompletion.deleteMany({
      where: { habitId, date: today },
    });
    await prisma.habit.update({
      where: { id: habitId },
      data: { currentStreak: Math.max(0, habit.currentStreak - 1) },
    });
  }

  revalidatePath('/habits');
  revalidatePath('/dashboard');
}

export async function deleteHabit(habitId: string) {
  const userId = await getUserId();
  await prisma.habit.updateMany({
    where: { id: habitId, userId },
    data: { isActive: false },
  });
  revalidatePath('/habits');
  revalidatePath('/dashboard');
}
