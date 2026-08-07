import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const secret = process.env.NEXTAUTH_SECRET || 'zenri_dev_secret_only_for_local_development_environment';

const protectedRoutes = ['/dashboard', '/tasks', '/finances', '/habits', '/budgets', '/debts', '/ai', '/analytics', '/settings'];
const authRoutes = ['/login', '/register'];

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret });
  const { pathname } = req.nextUrl;

  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // 1. Unauthenticated user attempting to access protected route -> Redirect to /login
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Authenticated user attempting to access /login or /register -> Redirect to /dashboard
  if (isAuthRoute && token) {
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
