/**
 * Token storage service using both localStorage and cookies.
 *
 * LocalStorage: For client-side JavaScript access
 * Cookies: For Next.js middleware and SSR access
 *
 * This dual approach ensures tokens are accessible in all contexts.
 */

import { STORAGE_KEYS } from '@/libs/constants';
import { TokenPair } from '@/types/authType';

/**
 * Cookie configuration for secure token storage
 */
const COOKIE_OPTIONS = {
  path: '/',
  maxAge: 60 * 60 * 24 * 7, // 7 days
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
};

/**
 * Sets a cookie with proper security options
 */
function setCookie(name: string, value: string, maxAge?: number): void {
  const options = maxAge ? { ...COOKIE_OPTIONS, maxAge } : COOKIE_OPTIONS;

  const cookieString = [
    `${name}=${value}`,
    `path=${options.path}`,
    `max-age=${options.maxAge}`,
    `samesite=${options.sameSite}`,
    options.secure ? 'secure' : '',
  ]
    .filter(Boolean)
    .join('; ');

  document.cookie = cookieString;
}

/**
 * Removes a cookie by setting its max-age to 0
 */
function removeCookie(name: string): void {
  document.cookie = `${name}=; path=/; max-age=0`;
}

/**
 * Token storage service with localStorage and cookie support
 */
export const tokenStorage = {
  /**
   * Stores both access and refresh tokens in localStorage and cookies
   */
  setTokens(tokens: TokenPair): void {
    // Store in localStorage for client-side access
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.access);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refresh);

    // Store in cookies for middleware/SSR access
    setCookie(STORAGE_KEYS.ACCESS_TOKEN, tokens.access, 60 * 15); // 15 minutes
    setCookie(STORAGE_KEYS.REFRESH_TOKEN, tokens.refresh, 60 * 60 * 24 * 7); // 7 days
  },

  /**
   * Updates only the access token (used after refresh)
   */
  setAccessToken(token: string): void {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
    setCookie(STORAGE_KEYS.ACCESS_TOKEN, token, 60 * 15); // 15 minutes
  },

  /**
   * Retrieves the access token from localStorage
   */
  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  },

  /**
   * Retrieves the refresh token from localStorage
   */
  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  },

  /**
   * Clears all tokens from both localStorage and cookies
   */
  clear(): void {
    // Clear localStorage
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);

    // Clear cookies
    removeCookie(STORAGE_KEYS.ACCESS_TOKEN);
    removeCookie(STORAGE_KEYS.REFRESH_TOKEN);
  },

  /**
   * Checks if user has valid authentication tokens
   */
  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;

    const hasAccess = !!localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const hasRefresh = !!localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

    // Valid if we have at least a refresh token
    return hasAccess || hasRefresh;
  },
};
