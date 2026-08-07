'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { TaskPriority, TaskStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';

async function getUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  return session.user.id;
}

export async function getTasks() {
  const userId = await getUserId();
  return prisma.task.findMany({
    where: { userId },
    include: { subtasks: { orderBy: { createdAt: 'asc' } } },
    orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
  });
}

export async function createTask(data: {
  title: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: string;
  dueTime?: string;
  categoryName?: string;
}) {
  const userId = await getUserId();
  await prisma.task.create({
    data: {
      userId,
      title: data.title,
      description: data.description || null,
      priority: data.priority || TaskPriority.MEDIUM,
      status: TaskStatus.TODO,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      dueTime: data.dueTime || null,
      categoryName: data.categoryName || null,
    },
  });
  revalidatePath('/tasks');
  revalidatePath('/dashboard');
}

export async function updateTask(
  taskId: string,
  data: {
    title?: string;
    priority?: TaskPriority;
    dueTime?: string;
    categoryName?: string;
  }
) {
  const userId = await getUserId();
  await prisma.task.updateMany({
    where: { id: taskId, userId },
    data: {
      title: data.title || undefined,
      priority: data.priority || undefined,
      dueTime: data.dueTime !== undefined ? data.dueTime : undefined,
      categoryName: data.categoryName !== undefined ? data.categoryName : undefined,
    },
  });
  revalidatePath('/tasks');
  revalidatePath('/dashboard');
}

export async function updateTaskStatus(taskId: string, status: TaskStatus) {
  const userId = await getUserId();
  await prisma.task.updateMany({
    where: { id: taskId, userId },
    data: { status },
  });
  revalidatePath('/tasks');
  revalidatePath('/dashboard');
}

export async function deleteTask(taskId: string) {
  const userId = await getUserId();
  await prisma.task.deleteMany({ where: { id: taskId, userId } });
  revalidatePath('/tasks');
  revalidatePath('/dashboard');
}

export async function toggleSubtask(subtaskId: string, taskId: string, isCompleted: boolean) {
  const userId = await getUserId();
  const task = await prisma.task.findFirst({ where: { id: taskId, userId } });
  if (!task) throw new Error('Access denied');
  await prisma.subtask.update({
    where: { id: subtaskId },
    data: { isCompleted },
  });
  revalidatePath('/tasks');
}
