import { describe, it, expect, vi } from 'vitest';
import { middleware } from '../middleware';
import { NextRequest } from 'next/server';
import * as jwt from 'next-auth/jwt';

vi.mock('next-auth/jwt', () => ({
  getToken: vi.fn(),
}));

describe('Server-Side Middleware Route Protection', () => {
  it('should redirect unauthenticated user from /dashboard to /login', async () => {
    vi.mocked(jwt.getToken).mockResolvedValue(null);

    const req = new NextRequest('http://localhost:3000/dashboard');
    const res = await middleware(req);

    expect(res.status).toBe(307); // Temporary Redirect
    expect(res.headers.get('location')).toContain('/login');
  });

  it('should allow authenticated user to access /dashboard', async () => {
    vi.mocked(jwt.getToken).mockResolvedValue({ id: 'user-123', email: 'test@example.com' });

    const req = new NextRequest('http://localhost:3000/dashboard');
    const res = await middleware(req);

    expect(res.status).toBe(200); // Allowed through
  });

  it('should redirect authenticated user from /login to /dashboard', async () => {
    vi.mocked(jwt.getToken).mockResolvedValue({ id: 'user-123', email: 'test@example.com' });

    const req = new NextRequest('http://localhost:3000/login');
    const res = await middleware(req);

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/dashboard');
  });
});
