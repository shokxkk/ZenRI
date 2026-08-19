'use server';

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { CurrencyCode } from '@prisma/client';

const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Имя должно содержать минимум 2 символа').max(50, 'Имя слишком длинное'),
    email: z.string().trim().toLowerCase().email('Некорректный адрес электронной почты'),
    password: z.string().min(6, 'Пароль должен содержать минимум 6 символов'),
    confirmPassword: z.string().min(1, 'Подтверждение пароля обязательно'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export async function registerUser(formData: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}) {
  const parseResult = registerSchema.safeParse(formData);
  if (!parseResult.success) {
    return { success: false, error: parseResult.error.errors[0].message };
  }

  const { name, email: normalizedEmail, password } = parseResult.data;

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return { success: false, error: 'Пользователь с таким email уже существует' };
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email: normalizedEmail,
          passwordHash,
          defaultCurrency: CurrencyCode.UZS,
          settings: {
            create: {
              language: 'ru',
              theme: 'light',
            },
          },
        },
      });

      const defaultCategories = [
        { name: 'Продукты', type: 'EXPENSE' as const, icon: 'shopping-cart', color: '#3B82F6' },
        { name: 'Кафе и рестораны', type: 'EXPENSE' as const, icon: 'coffee', color: '#F59E0B' },
        { name: 'Бензин / Авто', type: 'EXPENSE' as const, icon: 'car', color: '#EF4444' },
        { name: 'Коммунальные / Аренда', type: 'EXPENSE' as const, icon: 'home', color: '#8B5CF6' },
        { name: 'Зарплата', type: 'INCOME' as const, icon: 'briefcase', color: '#10B981' },
        { name: 'Бизнес / Фриланс', type: 'INCOME' as const, icon: 'trending-up', color: '#059669' },
      ];

      await tx.category.createMany({
        data: defaultCategories.map((cat) => ({
          userId: user.id,
          name: cat.name,
          type: cat.type,
          icon: cat.icon,
          color: cat.color,
          isSystem: true,
        })),
      });

      await tx.account.create({
        data: {
          userId: user.id,
          name: 'Основной счёт (Uzcard)',
          type: 'UZCARD',
          currency: CurrencyCode.UZS,
          initialBalance: 0,
          currentBalance: 0,
          icon: 'credit-card',
        },
      });

      return user;
    });

    return { success: true, userId: newUser.id };
  } catch (err: unknown) {
    console.error('Registration internal error:', err);
    return { success: false, error: 'Произошла ошибка при регистрации. Попробуйте позже.' };
  }
}

export async function verifyTelegramMagicToken(token: string) {
  const { verifyMagicLoginToken } = await import('@/lib/telegramBot');
  const result = verifyMagicLoginToken(token);

  if (!result.valid || !result.userId) {
    return { success: false, error: 'Ссылка для входа устарела или недействительна. Запросите новую ссылку в боте.' };
  }

  const user = await prisma.user.findUnique({
    where: { id: result.userId },
    select: { id: true, name: true, email: true, avatarUrl: true, isBlocked: true, blockReason: true },
  });

  if (!user) {
    return { success: false, error: 'Пользователь не найден' };
  }

  if (user.isBlocked) {
    return {
      success: false,
      error: `🚫 Ваш доступ к приложению приостановлен администратором. ${user.blockReason ? `Причина: ${user.blockReason}` : ''}`,
    };
  }

  return {
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
    },
  };
}

export async function verifyTelegramSixDigitCode(code: string) {
  const cleanCode = code.replace(/\D/g, '').trim();

  if (cleanCode.length !== 6) {
    return { success: false, error: 'Введите 6-значный цифровой код из Telegram' };
  }

  // 1. Direct database check from User record (works across all serverless instances)
  let user = await prisma.user.findFirst({
    where: {
      passwordHash: {
        startsWith: `TGCODE:${cleanCode}:`,
      },
    },
    select: { id: true, name: true, email: true, avatarUrl: true, passwordHash: true, isBlocked: true, blockReason: true },
  });

  // 2. Fallback to memory store if DB query was empty
  if (!user) {
    const { getTelegramAuthCode } = await import('@/lib/telegramBot');
    const memoryRecord = getTelegramAuthCode(cleanCode);
    if (memoryRecord?.userId) {
      user = await prisma.user.findFirst({
        where: { OR: [{ id: memoryRecord.userId }, { telegramId: memoryRecord.telegramId }] },
        select: { id: true, name: true, email: true, avatarUrl: true, passwordHash: true, isBlocked: true, blockReason: true },
      });
    }
  }

  if (!user) {
    return {
      success: false,
      error: 'Неверный или устаревший код. Откройте @zenriauthefication_bot и нажмите Start.',
    };
  }

  // Check if user is blocked by Admin
  if (user.isBlocked) {
    return {
      success: false,
      error: `🚫 Ваш доступ к приложению приостановлен администратором. ${user.blockReason ? `Причина: ${user.blockReason}` : ''}`,
    };
  }

  // Check code expiration if present in passwordHash
  if (user.passwordHash?.startsWith('TGCODE:')) {
    const parts = user.passwordHash.split(':');
    const expiresAt = parseInt(parts[2] || '0', 10);
    if (expiresAt > 0 && Date.now() > expiresAt) {
      return { success: false, error: 'Срок действия кода истёк. Запросите новый код в боте.' };
    }

    // Clear code after successful verification
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: null },
    });
  }

  return {
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
    },
  };
}




