import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/prisma';
import { AccountRepository } from '../accountRepository';
import { AccountType } from '@prisma/client';
import bcrypt from 'bcryptjs';

describe('Multi-Tenant Database Isolation Tests', () => {
  let userAId: string;
  let userBId: string;
  let userAAccountId: string;

  beforeAll(async () => {
    // Cleanup test users
    await prisma.user.deleteMany({
      where: {
        email: { in: ['usera@test.com', 'userb@test.com'] },
      },
    });

    const hash = await bcrypt.hash('password123', 10);

    // Create User A
    const userA = await prisma.user.create({
      data: {
        email: 'usera@test.com',
        name: 'User A',
        passwordHash: hash,
      },
    });
    userAId = userA.id;

    // Create User B
    const userB = await prisma.user.create({
      data: {
        email: 'userb@test.com',
        name: 'User B',
        passwordHash: hash,
      },
    });
    userBId = userB.id;

    // Create User A's private account
    const accountA = await AccountRepository.create(userAId, {
      name: 'User A Secret Uzcard',
      type: AccountType.UZCARD,
      initialBalance: 5000000,
    });
    userAAccountId = accountA.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: { in: ['usera@test.com', 'userb@test.com'] },
      },
    });
    await prisma.$disconnect();
  });

  it('1. User A can access their own entity', async () => {
    const account = await AccountRepository.getById(userAId, userAAccountId);
    expect(account).not.toBeNull();
    expect(account?.id).toBe(userAAccountId);
    expect(account?.name).toBe('User A Secret Uzcard');
  });

  it('2. User B CANNOT read User A entity', async () => {
    const account = await AccountRepository.getById(userBId, userAAccountId);
    expect(account).toBeNull();
  });

  it('3. User B CANNOT update User A entity', async () => {
    await expect(
      AccountRepository.update(userBId, userAAccountId, { name: 'Hacked Account Name' })
    ).rejects.toThrow('Account not found or access denied');

    // Verify account name was untouched in DB
    const accountCheck = await AccountRepository.getById(userAId, userAAccountId);
    expect(accountCheck?.name).toBe('User A Secret Uzcard');
  });

  it('4. User B CANNOT delete User A entity', async () => {
    await expect(
      AccountRepository.delete(userBId, userAAccountId)
    ).rejects.toThrow('Account not found or access denied');

    // Verify account remains active for User A
    const accountCheck = await AccountRepository.getById(userAId, userAAccountId);
    expect(accountCheck?.isActive).toBe(true);
  });
});
