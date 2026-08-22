'use server';

import { prisma } from '@/lib/prisma';

export interface RealLeagueMember {
  rank: number;
  userId: string;
  name: string;
  avatarUrl: string | null;
  savingsRate: number;
  division: 'BRONZE' | 'SILVER' | 'GOLD' | 'DIAMOND';
  badge: string;
  isUser: boolean;
  isOnline: boolean;
  lastSeenText: string;
}

export async function getRealLeagueLeaderboard(currentUserId?: string): Promise<RealLeagueMember[]> {
  try {
    const users = await prisma.user.findMany({
      where: {
        isBlocked: false,
      },
      select: {
        id: true,
        name: true,
        telegramUsername: true,
        avatarUrl: true,
        updatedAt: true,
        transactions: {
          select: {
            type: true,
            amount: true,
            date: true,
          },
        },
      },
    });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);

    const members: Omit<RealLeagueMember, 'rank'>[] = users.map((u) => {
      let monthlyIncome = 0;
      let monthlyExpense = 0;

      for (const tx of u.transactions) {
        const amt = Number(tx.amount) || 0;
        if (new Date(tx.date) >= startOfMonth) {
          if (tx.type === 'INCOME') {
            monthlyIncome += amt;
          } else if (tx.type === 'EXPENSE') {
            monthlyExpense += amt;
          }
        }
      }

      let savingsRate = 0;
      if (monthlyIncome > 0) {
        const net = monthlyIncome - monthlyExpense;
        if (net > 0) {
          savingsRate = Math.min(99, Math.round((net / monthlyIncome) * 100));
        }
      }

      let division: 'BRONZE' | 'SILVER' | 'GOLD' | 'DIAMOND' = 'BRONZE';
      let badge = 'Бронзовая Лига 🥉';

      if (savingsRate >= 50) {
        division = 'DIAMOND';
        badge = 'Алмазная Лига 💎';
      } else if (savingsRate >= 30) {
        division = 'GOLD';
        badge = 'Золотая Лига 🥇';
      } else if (savingsRate >= 15) {
        division = 'SILVER';
        badge = 'Серебряная Лига 🥈';
      }

      let displayName = u.name || (u.telegramUsername ? `@${u.telegramUsername}` : `Инвестор #${u.id.slice(0, 4)}`);

      const isCurrent = currentUserId ? u.id === currentUserId : false;
      if (isCurrent) {
        displayName = `${displayName} (ВЫ)`;
      }

      // Calculate Real Presence: Active within 5 minutes or current session user
      const diffMs = now.getTime() - new Date(u.updatedAt).getTime();
      const isOnline = isCurrent || diffMs < 5 * 60 * 1000;
      const minutesAgo = Math.floor(diffMs / 60000);
      const hoursAgo = Math.floor(minutesAgo / 60);

      let lastSeenText = 'онлайн';
      if (!isOnline) {
        if (minutesAgo < 60) {
          lastSeenText = `был ${minutesAgo}м назад`;
        } else if (hoursAgo < 24) {
          lastSeenText = `был ${hoursAgo}ч назад`;
        } else {
          lastSeenText = 'оффлайн';
        }
      }

      return {
        userId: u.id,
        name: displayName,
        avatarUrl: u.avatarUrl || '/images/mascot_happy_hoodie.png',
        savingsRate,
        division,
        badge,
        isUser: isCurrent,
        isOnline,
        lastSeenText,
      };
    });

    // Sort by online status first, then savingsRate descending
    members.sort((a, b) => {
      if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
      return b.savingsRate - a.savingsRate;
    });

    // Assign dynamic ranks
    const rankedMembers: RealLeagueMember[] = members.map((m, idx) => ({
      ...m,
      rank: idx + 1,
    }));

    return rankedMembers;
  } catch (err) {
    console.error('Error fetching real league leaderboard:', err);
    return [];
  }
}
