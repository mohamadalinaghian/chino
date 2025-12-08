/**
 * Authentication Middleware
 *
 * Next.js middleware that protects routes requiring authentication.
 * Runs on the Edge Runtime for optimal performance.
 *
 * This middleware checks for authentication tokens and redirects
 * unauthenticated users to the login page.
 *
 * @module middleware
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Routes that require authentication
 *
 * Add your protected routes here
 */
const PROTECTED_ROUTES = [
  '/dashboard',
  '/profile',
  '/settings',
  // Add more protected routes as needed
];

/**
 * Routes that are only for unauthenticated users
 * (e.g., login page - if user is already logged in, redirect to dashboard)
 */
const AUTH_ROUTES = ['/login'];

/**
 * Public routes that don't require authentication
 */
const PUBLIC_ROUTES = [
  '/',
  '/menu',
  // Add more public routes as needed
];

/**
 * Check if route is protected
 *
 * @param {string} pathname - Current route pathname
 * @returns {boolean} True if route requires authentication
 */
function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
}

/**
 * Check if route is auth-only (login/signup)
 *
 * @param {string} pathname - Current route pathname
 * @returns {boolean} True if route is for unauthenticated users only
 */
function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some((route) => pathname.startsWith(route));
}

/**
 * Check if user has authentication tokens
 *
 * Checks for access_token in cookies or localStorage (from request headers)
 *
 * @param {NextRequest} request - Next.js request object
 * @returns {boolean} True if user appears to be authenticated
 */
function hasAuthTokens(request: NextRequest): boolean {
  // Check for token in cookies
  const accessToken = request.cookies.get('access_token')?.value;

  if (accessToken) {
    return true;
  }

  // Note: We can't directly access localStorage in middleware
  // But we can check if the request came from a client with tokens
  // by checking the Referer header or a custom header
  // For now, we rely on cookies or will need client-side redirect

  return false;
}

/**
 * Middleware function
 *
 * Runs on every request and handles authentication checks
 *
 * Flow:
 * 1. Check if route is protected
 * 2. If protected and no token -> redirect to login
 * 3. If auth route (login) and has token -> redirect to dashboard
 * 4. Otherwise, allow request to proceed
 *
 * @param {NextRequest} request - Next.js request object
 * @returns {NextResponse} Response (either redirect or continue)
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get authentication status
  const isAuthenticated = hasAuthTokens(request);

  // If accessing protected route without authentication
  if (isProtectedRoute(pathname) && !isAuthenticated) {
    // Store the attempted URL for redirect after login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);

    return NextResponse.redirect(loginUrl);
  }

  // If accessing auth route (login) while authenticated
  if (isAuthRoute(pathname) && isAuthenticated) {
    // Redirect to dashboard if already logged in
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Allow request to proceed
  return NextResponse.next();
}

/**
 * Middleware configuration
 *
 * Specifies which routes this middleware should run on
 */
export const config = {
  /**
   * Match all routes except:
   * - API routes
   * - Static files (_next/static)
   * - Image optimization (_next/image)
   * - Favicon
   */
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
