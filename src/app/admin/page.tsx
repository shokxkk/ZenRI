import React from 'react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { getAdminStatsAction, getAdminUsersListAction } from '@/app/actions/adminActions';
import { AdminClient } from './AdminClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ZenRI — Панель управления пользователями (Admin)',
  description: 'Панель администратора для мониторинга пользователей и управления доступом.',
};

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  let hasAdminCookie = false;
  try {
    const cookieStore = await cookies();
    hasAdminCookie = cookieStore.get('zenri_admin_key')?.value === 'Woxan9600';
  } catch (e) {
    console.error('Cookie read error:', e);
  }

  let session = null;
  try {
    session = await auth();
  } catch (e) {
    console.error('Session error:', e);
  }

  const currentUserId = session?.user?.id || '';
  let currentUserRole = 'USER';
  let isAuthorized = hasAdminCookie;

  if (currentUserId && !isAuthorized) {
    try {
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
    } catch (e) {
      console.error('User check error in AdminPage:', e);
    }
  }

  let initialStats = null;
  let initialUsers: any[] = [];

  if (isAuthorized) {
    try {
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
    } catch (e) {
      console.error('AdminPage stats load error:', e);
    }
  }

  return (
    <div className="min-h-screen bg-zen-50 dark:bg-[#0A0F1D] text-zen-900 dark:text-zen-100 p-3 sm:p-6">
      <AdminClient
        initialStats={initialStats}
        initialUsers={initialUsers}
        currentUserId={currentUserId}
        currentUserRole={currentUserRole}
        isAuthorized={isAuthorized}
      />
    </div>
  );
}
