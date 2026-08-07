import { describe, it, expect, beforeEach, vi } from 'vitest';
import { registerUser } from '../app/actions/authActions';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

describe('Hardened Registration Server Action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should reject registration if password confirmation does not match', async () => {
    const res = await registerUser({
      name: 'Шохрух',
      email: 'user@example.com',
      password: 'password123',
      confirmPassword: 'differentPassword',
    });

    expect(res.success).toBe(false);
    expect(res.error).toBe('Пароли не совпадают');
  });

  it('should reject registration if password is too short', async () => {
    const res = await registerUser({
      name: 'Шохрух',
      email: 'user@example.com',
      password: '123',
      confirmPassword: '123',
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain('минимум 6 символов');
  });

  it('should reject registration if email is duplicate', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'existing-id',
      email: 'user@example.com',
    } as never);

    const res = await registerUser({
      name: 'Шохрух',
      email: ' USER@example.com ',
      password: 'password123',
      confirmPassword: 'password123',
    });

    expect(res.success).toBe(false);
    expect(res.error).toBe('Пользователь с таким email уже существует');
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'user@example.com' },
    });
  });

  it('should successfully execute $transaction and create user with settings, account, and categories', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
      const mockTx = {
        user: {
          create: vi.fn().mockResolvedValue({ id: 'new-user-id', email: 'test@zenri.app' }),
        },
        category: {
          createMany: vi.fn().mockResolvedValue({ count: 6 }),
        },
        account: {
          create: vi.fn().mockResolvedValue({ id: 'account-id' }),
        },
      };
      return await callback(mockTx as never);
    });

    const res = await registerUser({
      name: 'Новый Пользователь',
      email: ' TEST@Zenri.App ',
      password: 'password123',
      confirmPassword: 'password123',
    });

    expect(res.success).toBe(true);
    expect(res.userId).toBe('new-user-id');
    expect(prisma.$transaction).toHaveBeenCalled();
  });
});
