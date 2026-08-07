import { prisma } from '@/lib/prisma';
import { AccountType, CurrencyCode, Prisma } from '@prisma/client';

export interface CreateAccountInput {
  name: string;
  type: AccountType;
  currency?: CurrencyCode;
  initialBalance?: number;
  icon?: string;
  includeInTotal?: boolean;
}

export interface UpdateAccountInput {
  name?: string;
  type?: AccountType;
  currency?: CurrencyCode;
  icon?: string;
  includeInTotal?: boolean;
  isActive?: boolean;
}

export class AccountRepository {
  /**
   * Create account for authenticated user.
   */
  static async create(userId: string, data: CreateAccountInput) {
    const initialBalance = new Prisma.Decimal(data.initialBalance ?? 0);
    return await prisma.account.create({
      data: {
        userId,
        name: data.name,
        type: data.type,
        currency: data.currency ?? CurrencyCode.UZS,
        initialBalance,
        currentBalance: initialBalance,
        icon: data.icon ?? 'wallet',
        includeInTotal: data.includeInTotal ?? true,
      },
    });
  }

  /**
   * Read account belonging strictly to authenticated user.
   * Returns null if non-existent or owned by another user.
   */
  static async getById(userId: string, accountId: string) {
    return await prisma.account.findFirst({
      where: {
        id: accountId,
        userId, // Strict database level filtering
      },
    });
  }

  /**
   * List all active accounts belonging to authenticated user.
   */
  static async listByUser(userId: string) {
    return await prisma.account.findMany({
      where: {
        userId,
        isActive: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Update account belonging strictly to authenticated user.
   * Throws or returns count 0 if non-existent or owned by another user.
   */
  static async update(userId: string, accountId: string, data: UpdateAccountInput) {
    // Uses updateMany with id + userId to enforce DB-level multi-tenant boundary
    const result = await prisma.account.updateMany({
      where: {
        id: accountId,
        userId,
      },
      data,
    });

    if (result.count === 0) {
      throw new Error('Account not found or access denied');
    }

    return await this.getById(userId, accountId);
  }

  /**
   * Soft-delete account belonging strictly to authenticated user.
   */
  static async delete(userId: string, accountId: string) {
    const result = await prisma.account.updateMany({
      where: {
        id: accountId,
        userId,
      },
      data: {
        isActive: false,
      },
    });

    if (result.count === 0) {
      throw new Error('Account not found or access denied');
    }

    return true;
  }
}
