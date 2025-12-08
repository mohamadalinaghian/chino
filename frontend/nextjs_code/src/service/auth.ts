/**
 * Authentication Service
 *
 * This service handles all authentication-related API calls.
 * It provides a clean interface for login, logout, token refresh, and user profile.
 *
 * Follows Single Responsibility Principle:
 * - Only handles auth API communication
 * - Does not manage state (that's Zustand's job)
 * - Does not handle UI logic (that's components' job)
 *
 * @module service/auth
 */

import { apiClient } from './api/client';
import type {
  LoginCredentials,
  TokenPair,
  User,
  LogoutResponse,
  RefreshTokenRequest,
} from '@/types/auth';

/**
 * Authentication Service Class
 *
 * Provides methods for all auth-related operations:
 * - Login
 * - Logout
 * - Token refresh
 * - Get user profile
 *
 * @class AuthService
 *
 * @example
 * import { authService } from '@/service/auth';
 *
 * // Login
 * const tokens = await authService.login({
 *   mobile: '09123456789',
 *   password: 'password123'
 * });
 *
 * // Get user profile
 * const user = await authService.getMe();
 */
class AuthService {
  /**
   * Login with mobile and password
   *
   * Calls POST /auth/login endpoint and returns JWT tokens
   *
   * @param {LoginCredentials} credentials - User credentials
   * @returns {Promise<TokenPair>} Access and refresh tokens
   * @throws {Error} If login fails (401 for invalid credentials)
   *
   * @example
   * try {
   *   const tokens = await authService.login({
   *     mobile: '09123456789',
   *     password: 'testpass123'
   *   });
   *   console.log('Access token:', tokens.access);
   * } catch (error) {
   *   console.error('Login failed:', error.message);
   * }
   */
  async login(credentials: LoginCredentials): Promise<TokenPair> {
    return apiClient.post<TokenPair>('/auth/login', credentials);
  }

  /**
   * Logout current user
   *
   * Calls POST /auth/logout endpoint
   * Note: This is a stateless logout - the real cleanup happens on client side
   *
   * @returns {Promise<LogoutResponse>} Logout confirmation
   *
   * @example
   * await authService.logout();
   * // Remember to clear tokens from localStorage after this
   */
  async logout(): Promise<LogoutResponse> {
    return apiClient.post<LogoutResponse>('/auth/logout');
  }

  /**
   * Refresh access token
   *
   * Calls POST /auth/refresh with refresh token to get new token pair
   *
   * @param {string} refreshToken - Current refresh token
   * @returns {Promise<TokenPair>} New access and refresh tokens
   * @throws {Error} If refresh token is invalid or expired (401)
   *
   * @example
   * const refreshToken = localStorage.getItem('refresh_token');
   * if (refreshToken) {
   *   const newTokens = await authService.refreshToken(refreshToken);
   *   localStorage.setItem('access_token', newTokens.access);
   *   localStorage.setItem('refresh_token', newTokens.refresh);
   * }
   */
  async refreshToken(refreshToken: string): Promise<TokenPair> {
    const payload: RefreshTokenRequest = { refresh: refreshToken };
    return apiClient.post<TokenPair>('/auth/refresh', payload);
  }

  /**
   * Get current user profile
   *
   * Calls GET /auth/me with authentication token
   *
   * @returns {Promise<User>} Current user data
   * @throws {Error} If not authenticated (401) or token is invalid
   *
   * @example
   * try {
   *   const user = await authService.getMe();
   *   console.log('Current user:', user.name);
   * } catch (error) {
   *   console.error('Not authenticated');
   * }
   */
  async getMe(): Promise<User> {
    return apiClient.get<User>('/auth/me', { requiresAuth: true });
  }
}

/**
 * Default auth service instance
 *
 * Use this singleton instance throughout your application
 *
 * @example
 * import { authService } from '@/service/auth';
 * const user = await authService.getMe();
 */
export const authService = new AuthService();

/**
 * Token management utilities
 *
 * Helper functions for managing tokens in localStorage
 * Separated from AuthService to follow Single Responsibility Principle
 */
export const tokenManager = {
  /**
   * Save token pair to localStorage
   *
   * @param {TokenPair} tokens - Access and refresh tokens
   *
   * @example
   * tokenManager.setTokens({ access: 'xxx', refresh: 'yyy' });
   */
  setTokens(tokens: TokenPair): void {
    if (typeof window === 'undefined') return;

    localStorage.setItem('access_token', tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);
  },

  /**
   * Get access token from localStorage
   *
   * @returns {string | null} Access token or null if not found
   *
   * @example
   * const token = tokenManager.getAccessToken();
   * if (token) {
   *   // User is authenticated
   * }
   */
  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('access_token');
  },

  /**
   * Get refresh token from localStorage
   *
   * @returns {string | null} Refresh token or null if not found
   */
  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('refresh_token');
  },

  /**
   * Clear all tokens from localStorage
   *
   * Call this on logout
   *
   * @example
   * tokenManager.clearTokens();
   */
  clearTokens(): void {
    if (typeof window === 'undefined') return;

    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  /**
   * Check if user has valid tokens
   *
   * Note: This only checks if tokens exist, not if they're valid or expired
   *
   * @returns {boolean} True if both tokens exist
   *
   * @example
   * if (tokenManager.hasTokens()) {
   *   // Attempt to fetch user profile
   * }
   */
  hasTokens(): boolean {
    return !!(this.getAccessToken() && this.getRefreshToken());
  },
};
