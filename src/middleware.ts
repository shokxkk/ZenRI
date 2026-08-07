import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'zenri_prod_jwt_secret_key_2026_zenri_app';

const protectedRoutes = ['/dashboard', '/tasks', '/finances', '/habits', '/budgets', '/debts', '/ai', '/analytics', '/settings'];
const authRoutes = ['/login', '/register'];

export async function middleware(req: NextRequest) {
  let token = await getToken({ req, secret });

  // NextAuth v5 compatibility check for production HTTPS cookies
  if (!token) {
    token = await getToken({ req, secret, cookieName: '__Secure-authjs.session-token' });
  }
  if (!token) {
    token = await getToken({ req, secret, cookieName: 'authjs.session-token' });
  }
  if (!token) {
    token = await getToken({ req, secret, cookieName: '__Secure-next-auth.session-token' });
  }

  // Backup check: if any session cookie exists in headers
  const hasSessionCookie = Boolean(
    req.cookies.get('__Secure-authjs.session-token') ||
    req.cookies.get('authjs.session-token') ||
    req.cookies.get('__Secure-next-auth.session-token') ||
    req.cookies.get('next-auth.session-token')
  );

  const isAuthenticated = Boolean(token || hasSessionCookie);

  const { pathname } = req.nextUrl;

  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // 1. Unauthenticated user attempting to access protected route -> Redirect to /login
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Authenticated user attempting to access /login or /register -> Redirect to /dashboard
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/tasks/:path*',
    '/finances/:path*',
    '/habits/:path*',
    '/budgets/:path*',
    '/debts/:path*',
    '/ai/:path*',
    '/analytics/:path*',
    '/settings/:path*',
    '/login',
    '/register',
  ],
};
