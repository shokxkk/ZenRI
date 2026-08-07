import { PrismaClient, CurrencyCode, AccountType, CategoryType, TransactionType, TaskPriority, TaskStatus, DebtType, DebtStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding ZenRI database...');

  // Create or clean demo user
  const email = 'demo@zenri.app';
  await prisma.user.deleteMany({ where: { email } });

  const passwordHash = await bcrypt.hash('password123', 10);
  const user = await prisma.user.create({
    data: {
      email,
      name: 'Шохрух',
      passwordHash,
      defaultCurrency: CurrencyCode.UZS,
      settings: {
        create: {
          language: 'ru',
          theme: 'light',
          weekStart: 'monday',
          dailySummaryTime: '09:00',
        },
      },
    },
  });

  console.log(`Created demo user: ${user.email} (ID: ${user.id})`);

  // 1. Accounts
  const uzcard = await prisma.account.create({
    data: {
      userId: user.id,
      name: 'Uzcard',
      type: AccountType.UZCARD,
      currency: CurrencyCode.UZS,
      initialBalance: 5000000,
      currentBalance: 4245000,
      icon: 'credit-card',
      includeInTotal: true,
    },
  });

  const humo = await prisma.account.create({
    data: {
      userId: user.id,
      name: 'Humo',
      type: AccountType.HUMO,
      currency: CurrencyCode.UZS,
      initialBalance: 2000000,
      currentBalance: 1750000,
      icon: 'credit-card',
      includeInTotal: true,
    },
  });

  const cash = await prisma.account.create({
    data: {
      userId: user.id,
      name: 'Наличные',
      type: AccountType.CASH,
      currency: CurrencyCode.UZS,
      initialBalance: 1200000,
      currentBalance: 980000,
      icon: 'banknote',
      includeInTotal: true,
    },
  });

  const savings = await prisma.account.create({
    data: {
      userId: user.id,
      name: 'Накопительный',
      type: AccountType.SAVINGS,
      currency: CurrencyCode.UZS,
      initialBalance: 10000000,
      currentBalance: 10000000,
      icon: 'piggy-bank',
      includeInTotal: true,
    },
  });

  // 2. Categories
  const catIncomeSalary = await prisma.category.create({
    data: {
      userId: user.id,
      name: 'Зарплата',
      type: CategoryType.INCOME,
      icon: 'briefcase',
      color: '#10B981',
      isSystem: true,
    },
  });

  const catIncomeBusiness = await prisma.category.create({
    data: {
      userId: user.id,
      name: 'Бизнес',
      type: CategoryType.INCOME,
      icon: 'trending-up',
      color: '#059669',
      isSystem: true,
    },
  });

  const catFood = await prisma.category.create({
    data: {
      userId: user.id,
      name: 'Продукты',
      type: CategoryType.EXPENSE,
      icon: 'shopping-cart',
      color: '#3B82F6',
      isSystem: true,
    },
  });

  const catCafe = await prisma.category.create({
    data: {
      userId: user.id,
      name: 'Кафе и рестораны',
      type: CategoryType.EXPENSE,
      icon: 'coffee',
      color: '#F59E0B',
      isSystem: true,
    },
  });

  const catGas = await prisma.category.create({
    data: {
      userId: user.id,
      name: 'Бензин / Автомобиль',
      type: CategoryType.EXPENSE,
      icon: 'car',
      color: '#EF4444',
      isSystem: true,
    },
  });

  const catRent = await prisma.category.create({
    data: {
      userId: user.id,
      name: 'Аренда и коммунальные',
      type: CategoryType.EXPENSE,
      icon: 'home',
      color: '#8B5CF6',
      isSystem: true,
    },
  });

  // 3. Transactions
  await prisma.transaction.create({
    data: {
      userId: user.id,
      type: TransactionType.INCOME,
      amount: 12000000,
      currency: CurrencyCode.UZS,
      accountId: uzcard.id,
      categoryId: catIncomeSalary.id,
      comment: 'Зарплата за текущий месяц',
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.transaction.create({
    data: {
      userId: user.id,
      type: TransactionType.EXPENSE,
      amount: 340000,
      currency: CurrencyCode.UZS,
      accountId: uzcard.id,
      categoryId: catFood.id,
      comment: 'Покупка продуктов в Korzinka',
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.transaction.create({
    data: {
      userId: user.id,
      type: TransactionType.EXPENSE,
      amount: 85000,
      currency: CurrencyCode.UZS,
      accountId: uzcard.id,
      categoryId: catGas.id,
      comment: 'Заправка бензин',
      date: new Date(),
    },
  });

  await prisma.transaction.create({
    data: {
      userId: user.id,
      type: TransactionType.EXPENSE,
      amount: 120000,
      currency: CurrencyCode.UZS,
      accountId: humo.id,
      categoryId: catCafe.id,
      comment: 'Обед в кофейне',
      date: new Date(),
    },
  });

  // 4. Monthly Budget
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const budget = await prisma.budget.create({
    data: {
      userId: user.id,
      month: currentMonth,
      totalLimit: 8000000,
      reserveAmount: 1000000,
      targetSavings: 3000000,
    },
  });

  await prisma.budgetCategory.createMany({
    data: [
      {
        userId: user.id,
        budgetId: budget.id,
        categoryId: catFood.id,
        limitAmount: 3000000,
      },
      {
        userId: user.id,
        budgetId: budget.id,
        categoryId: catCafe.id,
        limitAmount: 1000000,
      },
      {
        userId: user.id,
        budgetId: budget.id,
        categoryId: catGas.id,
        limitAmount: 1500000,
      },
    ],
  });

  // 5. Tasks
  await prisma.task.create({
    data: {
      userId: user.id,
      title: 'Подготовить финансовый отчёт по проекту',
      priority: TaskPriority.HIGH,
      status: TaskStatus.TODO,
      dueDate: new Date(),
      dueTime: '15:00',
      categoryName: 'Работа',
    },
  });

  await prisma.task.create({
    data: {
      userId: user.id,
      title: 'Оплатить интернет и коммунальные услуги',
      priority: TaskPriority.HIGH,
      status: TaskStatus.TODO,
      dueDate: new Date(),
      dueTime: '18:00',
      categoryName: 'Финансы',
      linkedAmount: 250000,
      linkedAccountId: humo.id,
      linkedCategoryId: catRent.id,
    },
  });

  await prisma.task.create({
    data: {
      userId: user.id,
      title: 'Заказать замену фильтров автомобиля',
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.TODO,
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      categoryName: 'Личное',
    },
  });

  // 6. Habits
  await prisma.habit.create({
    data: {
      userId: user.id,
      name: 'Утренний отчёт расходов',
      icon: 'file-text',
      frequency: 'daily',
      timeReminder: '09:00',
      currentStreak: 5,
      bestStreak: 12,
    },
  });

  await prisma.habit.create({
    data: {
      userId: user.id,
      name: 'Выпить 2 литра воды',
      icon: 'droplet',
      frequency: 'daily',
      timeReminder: '10:00',
      currentStreak: 3,
      bestStreak: 8,
    },
  });

  // 7. Debts
  await prisma.debt.create({
    data: {
      userId: user.id,
      personName: 'Алишер',
      phone: '+998901234567',
      type: DebtType.THEY_OWE_ME,
      originalAmount: 1500000,
      remainingAmount: 1000000,
      currency: CurrencyCode.UZS,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      comment: 'Займ на ремонт компьютера',
      status: DebtStatus.PARTIALLY_PAID,
    },
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
