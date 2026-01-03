/**
 * Authenticated fetch wrapper with automatic token refresh.
 *
 * Handles:
 * - Adding Authorization header
 * - Token refresh on 401 errors
 * - Token cleanup on auth failure
 * - Race condition prevention for concurrent refreshes
 */

import { tokenStorage } from './tokenStorage';
import { refreshTokenRequest } from '@/libs/auth/authApi';

/**
 * Promise for ongoing refresh request (prevents race conditions)
 */
let refreshPromise: Promise<string> | null = null;

/**
 * Attempts to refresh the access token using the refresh token
 * Implements singleton pattern to prevent concurrent refresh requests
 */
async function refreshAccessToken(): Promise<string> {
  // If refresh is already in progress, wait for it
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const refresh = tokenStorage.getRefreshToken();

      if (!refresh) {
        throw new Error('هیچ توکن رفرش موجود نیست');
      }

      const data = await refreshTokenRequest(refresh);
      tokenStorage.setAccessToken(data.access);

      return data.access;
    } catch (error) {
      // Clear tokens on refresh failure
      tokenStorage.clear();

      // Redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }

      throw new Error('احراز هویت منقضی شده است');
    } finally {
      // Clear the refresh promise
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Performs fetch with authorization token
 */
async function fetchWithToken(
  url: string,
  token: string | null,
  options: RequestInit
): Promise<Response> {
  const headers = new Headers(options.headers);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Ensure Content-Type is set for POST/PUT/PATCH requests with body
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  try {
    return await fetch(url, { ...options, headers });
  } catch (error) {
    // Network errors
    console.error('Network error:', error);
    throw new Error('خطا در برقراری ارتباط با سرور');
  }
}

/**
 * Main authenticated fetch function with automatic retry on 401
 *
 * @param url - Full URL or relative path to API endpoint
 * @param options - Standard fetch options
 * @returns Response object
 * @throws Error if authentication fails after retry
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Get current access token
  let accessToken = tokenStorage.getAccessToken();

  // First attempt with current token
  let response = await fetchWithToken(url, accessToken, options);

  // If unauthorized, try to refresh and retry
  if (response.status === 401) {
    try {
      // Refresh the token
      const newAccessToken = await refreshAccessToken();

      // Retry the request with new token
      response = await fetchWithToken(url, newAccessToken, options);

      // If still unauthorized after refresh, clear and redirect
      if (response.status === 401) {
        tokenStorage.clear();

        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }

        throw new Error('احراز هویت ناموفق بود');
      }
    } catch (error) {
      // Re-throw the error from refreshAccessToken
      throw error;
    }
  }

  return response;
}

/**
 * Authenticated fetch with automatic JSON parsing and error handling
 *
 * @param url - Full URL or relative path to API endpoint
 * @param options - Standard fetch options
 * @returns Parsed JSON response
 */
export async function authenticatedFetchJSON<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await authenticatedFetch(url, options);

  if (!response.ok) {
    let errorMessage = 'خطا در درخواست';

    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorData.message || errorMessage;
    } catch {
      // If JSON parsing fails, use status text
      errorMessage = response.statusText || errorMessage;
    }

    throw new Error(errorMessage);
  }

  return response.json();
}
