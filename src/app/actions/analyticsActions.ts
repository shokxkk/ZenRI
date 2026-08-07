'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { CurrencyCode } from '@prisma/client';

async function getUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');
  return session.user.id;
}

export async function getAnalytics() {
  const userId = await getUserId();

  // Last 6 months data
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      label: d.toLocaleString('ru', { month: 'short', year: '2-digit' }),
      start: new Date(d.getFullYear(), d.getMonth(), 1),
      end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59),
    });
  }

  const monthlyData = await Promise.all(
    months.map(async (m) => {
      const [income, expense] = await Promise.all([
        prisma.transaction.aggregate({
          where: { userId, type: 'INCOME', date: { gte: m.start, lte: m.end } },
          _sum: { amount: true },
        }),
        prisma.transaction.aggregate({
          where: { userId, type: 'EXPENSE', date: { gte: m.start, lte: m.end } },
          _sum: { amount: true },
        }),
      ]);
      return {
        month: m.label,
        income: Number(income._sum.amount || 0),
        expense: Number(expense._sum.amount || 0),
      };
    })
  );

  // Top expense categories (current month)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const topCategories = await prisma.transaction.groupBy({
    by: ['categoryId'],
    where: {
      userId,
      type: 'EXPENSE',
      date: { gte: startOfMonth },
      categoryId: { not: null },
    },
    _sum: { amount: true },
    orderBy: { _sum: { amount: 'desc' } },
    take: 5,
  });

  const categoryDetails = await Promise.all(
    topCategories.map(async (c) => {
      const cat = c.categoryId
        ? await prisma.category.findUnique({ where: { id: c.categoryId } })
        : null;
      return {
        name: cat?.name || 'Без категории',
        color: cat?.color || '#71717A',
        amount: Number(c._sum.amount || 0),
      };
    })
  );

  return { monthlyData, topCategories: categoryDetails };
}

export async function getUserSettings() {
  const userId = await getUserId();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { settings: true },
  });
  return user;
}

export async function updateUserProfile(data: { name: string; defaultCurrency: string }) {
  const userId = await getUserId();
  await prisma.user.update({
    where: { id: userId },
    data: {
      name: data.name,
      defaultCurrency: data.defaultCurrency as never,
    },
  });
  revalidatePath('/settings');
  revalidatePath('/dashboard');
}

export async function getExpenseCategories() {
  const userId = await getUserId();
  return prisma.category.findMany({
    where: { userId, type: 'EXPENSE', isHidden: false },
    orderBy: { name: 'asc' },
  });
}

export async function createCategory(data: {
  name: string;
  type: 'INCOME' | 'EXPENSE';
  icon?: string;
  color?: string;
}) {
  const userId = await getUserId();
  await prisma.category.create({
    data: {
      userId,
      name: data.name,
      type: data.type,
      icon: data.icon || 'tag',
      color: data.color || '#71717A',
    },
  });
  revalidatePath('/settings');
  revalidatePath('/finances');
}

export async function resetAllUserData() {
  const userId = await getUserId();

  await prisma.$transaction(async (tx) => {
    // 1. Delete transactions and debts
    await tx.transaction.deleteMany({ where: { userId } });
    await tx.debtPayment.deleteMany({ where: { userId } });
    await tx.debt.deleteMany({ where: { userId } });

    // 2. Delete tasks and subtasks
    await tx.subtask.deleteMany({ where: { task: { userId } } });
    await tx.task.deleteMany({ where: { userId } });

    // 3. Delete habits & completions
    await tx.habitCompletion.deleteMany({ where: { userId } });
    await tx.habit.deleteMany({ where: { userId } });

    // 4. Delete budgets
    await tx.budgetCategory.deleteMany({ where: { userId } });
    await tx.budget.deleteMany({ where: { userId } });

    // 5. Delete AI messages & conversations & audit logs
    await tx.aIMessage.deleteMany({ where: { conversation: { userId } } });
    await tx.aIConversation.deleteMany({ where: { userId } });
    await tx.auditLog.deleteMany({ where: { userId } });

    // 6. Reset account balances to 0
    await tx.account.updateMany({
      where: { userId },
      data: { currentBalance: 0, initialBalance: 0 },
    });
  });

  revalidatePath('/dashboard');
  revalidatePath('/finances');
  revalidatePath('/tasks');
  revalidatePath('/habits');
  revalidatePath('/debts');
  revalidatePath('/budgets');
  revalidatePath('/analytics');
  revalidatePath('/settings');

  return { success: true };
}

export async function seedDemoDataAction() {
  const userId = await getUserId();

  await prisma.$transaction(async (tx) => {
    // 1. Reset current data
    await tx.transaction.deleteMany({ where: { userId } });
    await tx.debtPayment.deleteMany({ where: { userId } });
    await tx.debt.deleteMany({ where: { userId } });
    await tx.subtask.deleteMany({ where: { task: { userId } } });
    await tx.task.deleteMany({ where: { userId } });
    await tx.habitCompletion.deleteMany({ where: { userId } });
    await tx.habit.deleteMany({ where: { userId } });
    await tx.account.deleteMany({ where: { userId } });
    await tx.category.deleteMany({ where: { userId } });

    // 2. Create Accounts
    const uzcard = await tx.account.create({
      data: {
        userId,
        name: 'Основная Uzcard',
        type: 'UZCARD',
        currency: CurrencyCode.UZS,
        initialBalance: 4500000,
        currentBalance: 4500000,
        icon: 'credit-card',
      },
    });

    const humo = await tx.account.create({
      data: {
        userId,
        name: 'Карта Humo',
        type: 'HUMO',
        currency: CurrencyCode.UZS,
        initialBalance: 2800000,
        currentBalance: 2800000,
        icon: 'credit-card',
      },
    });

    const visa = await tx.account.create({
      data: {
        userId,
        name: 'Visa Travel Card',
        type: 'VISA',
        currency: CurrencyCode.UZS,
        initialBalance: 10880000,
        currentBalance: 10880000,
        icon: 'credit-card',
      },
    });

    const cash = await tx.account.create({
      data: {
        userId,
        name: 'Наличные деньги',
        type: 'CASH',
        currency: CurrencyCode.UZS,
        initialBalance: 1200000,
        currentBalance: 1200000,
        icon: 'banknote',
      },
    });

    const savings = await tx.account.create({
      data: {
        userId,
        name: 'Накопительный депозит',
        type: 'SAVINGS',
        currency: CurrencyCode.UZS,
        initialBalance: 15000000,
        currentBalance: 15000000,
        icon: 'piggy-bank',
      },
    });

    // 3. Create Categories
    const catSalary = await tx.category.create({ data: { userId, name: 'Зарплата', type: 'INCOME', icon: 'briefcase', color: '#10B981', isSystem: true } });
    const catFreelance = await tx.category.create({ data: { userId, name: 'Фриланс', type: 'INCOME', icon: 'trending-up', color: '#059669', isSystem: true } });

    const catGroceries = await tx.category.create({ data: { userId, name: 'Продукты', type: 'EXPENSE', icon: 'shopping-cart', color: '#0066FF', isSystem: true } });
    const catFuel = await tx.category.create({ data: { userId, name: 'Бензин / Авто', type: 'EXPENSE', icon: 'car', color: '#10B981', isSystem: true } });
    const catCafe = await tx.category.create({ data: { userId, name: 'Кафе и рестораны', type: 'EXPENSE', icon: 'coffee', color: '#F59E0B', isSystem: true } });
    const catUtilities = await tx.category.create({ data: { userId, name: 'Коммунальные', type: 'EXPENSE', icon: 'home', color: '#EF4444', isSystem: true } });

    // 4. Create Transactions
    await tx.transaction.create({
      data: {
        userId,
        type: 'INCOME',
        amount: 15000000,
        accountId: uzcard.id,
        categoryId: catSalary.id,
        comment: 'Основная зарплата IT',
        date: new Date(),
      },
    });

    await tx.transaction.create({
      data: {
        userId,
        type: 'INCOME',
        amount: 3500000,
        accountId: humo.id,
        categoryId: catFreelance.id,
        comment: 'Оплата за мобильное приложение',
        date: new Date(Date.now() - 86400000 * 2),
      },
    });

    await tx.transaction.create({
      data: {
        userId,
        type: 'EXPENSE',
        amount: 650000,
        accountId: uzcard.id,
        categoryId: catGroceries.id,
        comment: 'Покупка продуктов в Korzinka',
        date: new Date(Date.now() - 3600000 * 5),
      },
    });

    await tx.transaction.create({
      data: {
        userId,
        type: 'EXPENSE',
        amount: 350000,
        accountId: uzcard.id,
        categoryId: catFuel.id,
        comment: 'Заправка LUKOIL AI-95',
        date: new Date(Date.now() - 86400000 * 1),
      },
    });

    await tx.transaction.create({
      data: {
        userId,
        type: 'EXPENSE',
        amount: 280000,
        accountId: humo.id,
        categoryId: catCafe.id,
        comment: 'Ужин с друзьями',
        date: new Date(Date.now() - 86400000 * 3),
      },
    });

    // 5. Create Tasks
    const today = new Date();
    await tx.task.create({
      data: {
        userId,
        title: 'Оплатить коммунальные услуги (РЭС и Газ)',
        priority: 'HIGH',
        status: 'TODO',
        categoryName: 'Платеж',
        dueDate: today,
        dueTime: '18:00',
      },
    });

    await tx.task.create({
      data: {
        userId,
        title: 'Завершить разработку модуля Аналитики',
        priority: 'HIGH',
        status: 'TODO',
        categoryName: 'Работа',
        dueDate: today,
        dueTime: '20:00',
      },
    });

    await tx.task.create({
      data: {
        userId,
        title: 'Зайти в спортзал (Силовая тренировка)',
        priority: 'MEDIUM',
        status: 'COMPLETED',
        categoryName: 'Здоровье',
        dueDate: today,
        dueTime: '08:00',
      },
    });

    await tx.task.create({
      data: {
        userId,
        title: 'Прочесть 2 главы «Four Thousand Weeks»',
        priority: 'LOW',
        status: 'TODO',
        categoryName: 'Личное',
        dueDate: today,
        dueTime: '22:00',
      },
    });

    // 6. Create Habits & Completions
    const habitReading = await tx.habit.create({
      data: {
        userId,
        name: 'Чтение 30 мин',
        icon: 'book-open',
        currentStreak: 14,
        bestStreak: 21,
      },
    });

    const habitSport = await tx.habit.create({
      data: {
        userId,
        name: 'Спорт',
        icon: 'dumbbell',
        currentStreak: 7,
        bestStreak: 12,
      },
    });

    const habitWater = await tx.habit.create({
      data: {
        userId,
        name: 'Вода 2л',
        icon: 'droplets',
        currentStreak: 21,
        bestStreak: 30,
      },
    });

    const habitMeditation = await tx.habit.create({
      data: {
        userId,
        name: 'Медитация',
        icon: 'sun',
        currentStreak: 9,
        bestStreak: 15,
      },
    });

    await tx.habitCompletion.create({ data: { habitId: habitReading.id, userId, date: today, isCompleted: true } });
    await tx.habitCompletion.create({ data: { habitId: habitSport.id, userId, date: today, isCompleted: true } });
    await tx.habitCompletion.create({ data: { habitId: habitWater.id, userId, date: today, isCompleted: true } });

    // 7. Create Debts
    await tx.debt.create({
      data: {
        userId,
        personName: 'Алишер',
        phone: '+998 90 123 45 67',
        type: 'THEY_OWE_ME',
        originalAmount: 1500000,
        remainingAmount: 1500000,
        currency: CurrencyCode.UZS,
        dueDate: new Date(Date.now() + 86400000 * 10),
        comment: 'В долг на ремонт машины',
      },
    });

    await tx.debt.create({
      data: {
        userId,
        personName: 'Зафар',
        type: 'I_OWE',
        originalAmount: 400000,
        remainingAmount: 400000,
        currency: CurrencyCode.UZS,
        dueDate: new Date(Date.now() + 86400000 * 5),
        comment: 'Возврат за билеты',
      },
    });
  });

  revalidatePath('/dashboard');
  revalidatePath('/finances');
  revalidatePath('/tasks');
  revalidatePath('/habits');
  revalidatePath('/debts');
  revalidatePath('/budgets');
  revalidatePath('/analytics');
  revalidatePath('/settings');

  return { success: true };
}
