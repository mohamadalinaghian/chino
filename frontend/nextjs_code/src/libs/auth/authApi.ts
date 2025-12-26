/**
 * Authentication API client for Django backend.
 * Handles all auth-related HTTP requests.
 */

import { CS_API_URL } from '@/libs/constants';
import { TokenPair, UserInfo } from '@/types/authType';

/**
 * Base URL for authentication endpoints
 */
const AUTH_BASE_URL = `${CS_API_URL}/auth`;

/**
 * Authenticates user with mobile and password
 *
 * @param mobile - User's mobile number (e.g., 09xxxxxxxxx)
 * @param password - User's password
 * @returns Token pair (access + refresh)
 * @throws Error with Persian message on failure
 */
export async function loginRequest(
  mobile: string,
  password: string
): Promise<TokenPair> {
  try {
    const res = await fetch(`${AUTH_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile, password }),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));

      // Handle specific error codes from backend
      if (error.code === 'invalid_credentials') {
        throw new Error('شماره موبایل یا رمز عبور نادرست است');
      }

      if (error.code === 'account_disabled') {
        throw new Error('حساب کاربری غیرفعال است');
      }

      throw new Error(error.detail || 'خطا در ورود به سیستم');
    }

    return res.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('خطای اتصال به سرور');
  }
}

/**
 * Refreshes access token using refresh token
 *
 * @param refresh - Valid refresh token
 * @returns New access token
 * @throws Error if refresh token is invalid or expired
 */
export async function refreshTokenRequest(
  refresh: string
): Promise<{ access: string }> {
  try {
    const res = await fetch(`${AUTH_BASE_URL}/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.detail || 'توکن رفرش نامعتبر است');
    }

    return res.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('خطا در به‌روزرسانی توکن');
  }
}

/**
 * Fetches current user information
 *
 * @param token - Valid access token
 * @returns User information including permissions
 * @throws Error if token is invalid
 */
export async function meRequest(token: string): Promise<UserInfo> {
  try {
    const res = await fetch(`${AUTH_BASE_URL}/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      if (res.status === 401) {
        throw new Error('احراز هویت نامعتبر است');
      }

      const error = await res.json().catch(() => ({}));
      throw new Error(error.detail || 'خطا در دریافت اطلاعات کاربر');
    }

    return res.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('خطای اتصال به سرور');
  }
}

/**
 * Logs out the current user (client-side only for JWT)
 *
 * @param token - Valid access token
 * @returns Success message
 */
export async function logoutRequest(token: string): Promise<{ detail: string }> {
  try {
    const res = await fetch(`${AUTH_BASE_URL}/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      // Don't throw error on logout - just proceed with client-side cleanup
      console.warn('Server logout failed, proceeding with client-side cleanup');
    }

    return res.json().catch(() => ({ detail: 'Logged out' }));
  } catch (error) {
    // Don't throw error on logout - just proceed with client-side cleanup
    console.warn('Logout request failed:', error);
    return { detail: 'Logged out' };
  }
}
