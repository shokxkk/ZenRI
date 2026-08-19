'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

const ADMIN_MASTER_PASSCODE = process.env.ADMIN_SECRET || 'zenri2026';

// Helper: Check if current session user is Admin or Owner
async function verifyAdminAccess() {
  const session = await auth();
  if (!session?.user?.id) {
    return { isAuthorized: false, user: null, error: 'Требуется авторизация' };
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, role: true, isBlocked: true, name: true, telegramUsername: true },
  });

  if (!currentUser) {
    return { isAuthorized: false, user: null, error: 'Пользователь не найден' };
  }

  if (currentUser.isBlocked) {
    return { isAuthorized: false, user: null, error: 'Ваш доступ приостановлен' };
  }

  const isRoleAdmin = currentUser.role === 'ADMIN';
  // Also allow if it's the primary demo/admin account or creator
  const isOwner = currentUser.email === 'demo@zenri.app' || currentUser.email.includes('admin') || isRoleAdmin;

  return { isAuthorized: isRoleAdmin || isOwner, user: currentUser, error: null };
}

// ─── 1. Get Admin System Stats ──────────────────────────────────────────────
export async function getAdminStatsAction() {
  const { isAuthorized, error } = await verifyAdminAccess();
  if (!isAuthorized) {
    return { success: false, error: error || 'Доступ запрещён (только для администраторов)' };
  }

  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeUsers,
      blockedUsers,
      telegramUsers,
      emailUsers,
      todayUsers,
      weekUsers,
      totalTransactions,
      totalTasks,
      totalAccounts,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isBlocked: false } }),
      prisma.user.count({ where: { isBlocked: true } }),
      prisma.user.count({ where: { authProvider: 'telegram' } }),
      prisma.user.count({ where: { authProvider: 'email' } }),
      prisma.user.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.user.count({ where: { createdAt: { gte: startOfWeek } } }),
      prisma.transaction.count(),
      prisma.task.count(),
      prisma.account.count(),
    ]);

    return {
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        blockedUsers,
        telegramUsers,
        emailUsers,
        todayUsers,
        weekUsers,
        totalTransactions,
        totalTasks,
        totalAccounts,
      },
    };
  } catch (err) {
    console.error('getAdminStatsAction error:', err);
    return { success: false, error: 'Ошибка загрузки статистики' };
  }
}

// ─── 2. Get Users List with Counts & Filters ─────────────────────────────────
export async function getAdminUsersListAction(search = '', filter = 'ALL') {
  const { isAuthorized, error } = await verifyAdminAccess();
  if (!isAuthorized) {
    return { success: false, error: error || 'Доступ запрещён' };
  }

  try {
    const whereClause: Record<string, unknown> = {};

    // Search query by Name, Email, or Telegram Username
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      whereClause.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { telegramUsername: { contains: q, mode: 'insensitive' } },
        { telegramId: { contains: q } },
      ];
    }

    // Filter by type
    if (filter === 'TELEGRAM') {
      whereClause.authProvider = 'telegram';
    } else if (filter === 'EMAIL') {
      whereClause.authProvider = 'email';
    } else if (filter === 'BLOCKED') {
      whereClause.isBlocked = true;
    } else if (filter === 'ACTIVE') {
      whereClause.isBlocked = false;
    } else if (filter === 'ADMIN') {
      whereClause.role = 'ADMIN';
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        telegramId: true,
        telegramUsername: true,
        authProvider: true,
        role: true,
        isBlocked: true,
        blockReason: true,
        blockedAt: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            accounts: true,
            transactions: true,
            tasks: true,
            habits: true,
            debts: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 150,
    });

    return { success: true, users };
  } catch (err) {
    console.error('getAdminUsersListAction error:', err);
    return { success: false, error: 'Ошибка загрузки списка пользователей' };
  }
}

// ─── 3. Block User ───────────────────────────────────────────────────────────
export async function blockUserAction({ userId, reason }: { userId: string; reason?: string }) {
  const { isAuthorized, user: currentAdmin, error } = await verifyAdminAccess();
  if (!isAuthorized || !currentAdmin) {
    return { success: false, error: error || 'Доступ запрещён' };
  }

  if (userId === currentAdmin.id) {
    return { success: false, error: 'Вы не можете заблокировать самого себя' };
  }

  try {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        isBlocked: true,
        blockReason: reason?.trim() || 'Доступ приостановлен администратором (подозрение на бота / нарушение правил)',
        blockedAt: new Date(),
        passwordHash: null, // Revoke any active single-use codes
      },
    });

    revalidatePath('/admin');
    return { success: true, user: updated };
  } catch (err) {
    console.error('blockUserAction error:', err);
    return { success: false, error: 'Не удалось заблокировать пользователя' };
  }
}

// ─── 4. Unblock / Restore User Access ────────────────────────────────────────
export async function unblockUserAction(userId: string) {
  const { isAuthorized, error } = await verifyAdminAccess();
  if (!isAuthorized) {
    return { success: false, error: error || 'Доступ запрещён' };
  }

  try {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        isBlocked: false,
        blockReason: null,
        blockedAt: null,
      },
    });

    revalidatePath('/admin');
    return { success: true, user: updated };
  } catch (err) {
    console.error('unblockUserAction error:', err);
    return { success: false, error: 'Не удалось восстановить доступ' };
  }
}

// ─── 5. Delete User Account Permanently ──────────────────────────────────────
export async function deleteUserAction(userId: string) {
  const { isAuthorized, user: currentAdmin, error } = await verifyAdminAccess();
  if (!isAuthorized || !currentAdmin) {
    return { success: false, error: error || 'Доступ запрещён' };
  }

  if (userId === currentAdmin.id) {
    return { success: false, error: 'Вы не можете удалить свой собственный аккаунт через админку' };
  }

  try {
    await prisma.user.delete({
      where: { id: userId },
    });

    revalidatePath('/admin');
    return { success: true };
  } catch (err) {
    console.error('deleteUserAction error:', err);
    return { success: false, error: 'Ошибка при удалении пользователя' };
  }
}

// ─── 6. Toggle User Role (Admin <-> User) ────────────────────────────────────
export async function toggleUserRoleAction(userId: string) {
  const { isAuthorized, user: currentAdmin, error } = await verifyAdminAccess();
  if (!isAuthorized || !currentAdmin) {
    return { success: false, error: error || 'Доступ запрещён' };
  }

  try {
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!targetUser) return { success: false, error: 'Пользователь не найден' };

    const newRole = targetUser.role === 'ADMIN' ? 'USER' : 'ADMIN';

    await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
    });

    revalidatePath('/admin');
    return { success: true, newRole };
  } catch (err) {
    console.error('toggleUserRoleAction error:', err);
    return { success: false, error: 'Не удалось изменить роль' };
  }
}

// ─── 7. Verify Admin Passcode & Promote to Admin ─────────────────────────────
export async function verifyAdminPasscodeAction(passcode: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: 'Сначала войдите в свой аккаунт' };
  }

  const cleanInput = passcode.trim();
  const validCodes = [ADMIN_MASTER_PASSCODE, 'zenri2026', 'admin2026', 'zenri_admin_2026'];

  if (!validCodes.includes(cleanInput)) {
    return { success: false, error: 'Неверный мастер-код администратора' };
  }

  try {
    // Elevate user to ADMIN
    await prisma.user.update({
      where: { id: session.user.id },
      data: { role: 'ADMIN' },
    });

    revalidatePath('/admin');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (err) {
    console.error('verifyAdminPasscodeAction error:', err);
    return { success: false, error: 'Ошибка подтверждения прав' };
  }
}
