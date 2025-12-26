/**
 * Next.js Middleware for route protection and authentication.
 * Runs on every request to validate authentication state.
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/middleware
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { STORAGE_KEYS, PUBLIC_ROUTES, AUTH_ROUTES, LOGIN_PATH, DEFAULT_AUTH_REDIRECT } from '@/libs/constants';

/**
 * Checks if the given path is a public route (doesn't require auth)
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => {
    // Exact match or starts with (for sub-routes)
    return pathname === route || pathname.startsWith(`${route}/`);
  });
}

/**
 * Checks if the given path is an auth route (login, register, etc.)
 */
function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * Checks if user has valid authentication tokens
 */
function hasAuthTokens(request: NextRequest): boolean {
  const accessToken = request.cookies.get(STORAGE_KEYS.ACCESS_TOKEN)?.value;
  const refreshToken = request.cookies.get(STORAGE_KEYS.REFRESH_TOKEN)?.value;

  // We need at least refresh token to maintain session
  return !!(accessToken || refreshToken);
}

/**
 * Main middleware function - runs on every request
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAuthenticated = hasAuthTokens(request);

  // 1. Allow all public routes (menu, about, etc.)
  if (isPublicRoute(pathname)) {
    // Special case: If authenticated user tries to access auth routes (login)
    // Redirect them to dashboard
    if (isAuthRoute(pathname) && isAuthenticated) {
      return NextResponse.redirect(new URL(DEFAULT_AUTH_REDIRECT, request.url));
    }

    // Allow access to public routes
    return NextResponse.next();
  }

  // 2. Protected routes require authentication
  if (!isAuthenticated) {
    const loginUrl = new URL(LOGIN_PATH, request.url);
    // Preserve the intended destination for redirect after login
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3. Authenticated user accessing protected route - allow
  return NextResponse.next();
}

/**
 * Configure which routes this middleware should run on
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
