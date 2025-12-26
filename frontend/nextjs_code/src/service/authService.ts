/**
 * Authentication service - high-level API for auth operations.
 *
 * Responsibilities:
 * - Coordinate auth API calls and token storage
 * - Provide simple interface for components
 * - Handle authentication state
 *
 * Follows Single Responsibility Principle (SRP)
 */

import { tokenStorage } from '@/libs/auth/tokenStorage';
import { authenticatedFetchJSON } from '@/libs/auth/authFetch';
import { loginRequest, logoutRequest, meRequest } from '@/libs/auth/authApi';
import { TokenPair, UserInfo } from '@/types/authType';
import { CS_API_URL } from '@/libs/constants';

/**
 * Authentication service singleton
 */
export class AuthService {
  /**
   * Authenticates user and stores tokens
   *
   * @param mobile - User's mobile number
   * @param password - User's password
   * @returns Token pair
   * @throws Error with Persian message on failure
   */
  static async login(mobile: string, password: string): Promise<TokenPair> {
    const tokens = await loginRequest(mobile, password);
    tokenStorage.setTokens(tokens);
    return tokens;
  }

  /**
   * Retrieves current authenticated user information
   * Uses authenticated fetch with auto-refresh capability
   *
   * @returns User information
   * @throws Error if not authenticated or token invalid
   */
  static async getCurrentUser(): Promise<UserInfo> {
    const token = tokenStorage.getAccessToken();

    if (!token) {
      throw new Error('توکن دسترسی موجود نیست');
    }

    return meRequest(token);
  }

  /**
   * Validates current authentication state
   * Attempts to fetch user info to verify token validity
   *
   * @returns true if authenticated with valid token
   */
  static async validateAuth(): Promise<boolean> {
    if (!this.isAuthenticated()) {
      return false;
    }

    try {
      await this.getCurrentUser();
      return true;
    } catch {
      // Token is invalid or expired
      tokenStorage.clear();
      return false;
    }
  }

  /**
   * Logs out user by clearing tokens and redirecting to login
   * Makes server request (optional for JWT) then clears client state
   */
  static async logout(): Promise<void> {
    try {
      const token = tokenStorage.getAccessToken();

      // Attempt server-side logout (not critical for JWT)
      if (token) {
        await logoutRequest(token).catch(() => {
          // Ignore server logout errors
          console.warn('Server logout failed, proceeding with client cleanup');
        });
      }
    } finally {
      // Always clear tokens and redirect
      tokenStorage.clear();

      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  }

  /**
   * Checks if user appears to be authenticated (has tokens)
   * Note: Does not validate token - use validateAuth() for that
   *
   * @returns true if tokens exist in storage
   */
  static isAuthenticated(): boolean {
    return tokenStorage.isAuthenticated();
  }

  /**
   * Gets access token from storage
   *
   * @returns Access token or null if not found
   */
  static getAccessToken(): string | null {
    return tokenStorage.getAccessToken();
  }

  /**
   * Gets refresh token from storage
   *
   * @returns Refresh token or null if not found
   */
  static getRefreshToken(): string | null {
    return tokenStorage.getRefreshToken();
  }
}
