import React from 'react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getAdminStatsAction, getAdminUsersListAction } from '@/app/actions/adminActions';
import { AdminClient } from './AdminClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ZenRI — Панель управления пользователями (Admin)',
  description: 'Панель администратора для мониторинга пользователей и управления доступом.',
};

export default async function AdminPage() {
  const session = await auth();
  const currentUserId = session?.user?.id || '';

  let currentUserRole = 'USER';
  let isAuthorized = false;

  if (currentUserId) {
    const user = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { role: true, email: true, isBlocked: true },
    });

    if (user && !user.isBlocked) {
      currentUserRole = user.role;
      if (user.role === 'ADMIN' || user.email === 'demo@zenri.app' || user.email.includes('admin')) {
        isAuthorized = true;
      }
    }
  }

  let initialStats = null;
  let initialUsers: any[] = [];

  if (isAuthorized) {
    const [statsRes, usersRes] = await Promise.all([
      getAdminStatsAction(),
      getAdminUsersListAction(),
    ]);

    if (statsRes.success && statsRes.stats) {
      initialStats = statsRes.stats;
    }
    if (usersRes.success && usersRes.users) {
      initialUsers = usersRes.users;
    }
  }

  return (
    <div className="min-h-screen bg-zen-50 dark:bg-[#0A0F1D] text-zen-900 dark:text-zen-100 p-3 sm:p-6">
      <AdminClient
        initialStats={initialStats}
        initialUsers={initialUsers as any}
        currentUserId={currentUserId}
        currentUserRole={currentUserRole}
        isAuthorized={isAuthorized}
      />
    </div>
  );
}
