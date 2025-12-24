// lib/auth/authService.ts
/**
 * Authentication service for managing JWT tokens and API requests.
 * Handles token storage, refresh logic, and authenticated requests.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface TokenPair {
  access: string;
  refresh: string;
}

interface UserInfo {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
  permissions: string[];
}

/**
 * Storage keys for tokens in localStorage
 */
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'auth_access_token',
  REFRESH_TOKEN: 'auth_refresh_token',
} as const;

export class AuthService {
  /**
   * Authenticates user with credentials and stores tokens.
   */
  static async login(username: string, password: string): Promise<TokenPair> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Login failed');
    }

    const tokens: TokenPair = await response.json();

    // Store tokens in localStorage
    this.setTokens(tokens);

    return tokens;
  }

  /**
   * Refreshes access token using stored refresh token.
   */
  static async refreshAccessToken(): Promise<string | null> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      return null;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (!response.ok) {
        this.clearTokens();
        return null;
      }

      const data = await response.json();
      this.setAccessToken(data.access);

      return data.access;
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearTokens();
      return null;
    }
  }

  /**
   * Fetches current user information.
   */
  static async getCurrentUser(): Promise<UserInfo> {
    const response = await this.authenticatedFetch(`${API_BASE_URL}/auth/me`);
    return response.json();
  }

  /**
   * Logs out user by clearing stored tokens.
   */
  static logout(): void {
    this.clearTokens();
    window.location.href = '/login';
  }

  /**
   * Makes authenticated API request with automatic token refresh.
   */
  static async authenticatedFetch(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    let accessToken = this.getAccessToken();

    // Attempt request with current token
    let response = await this.fetchWithToken(url, accessToken, options);

    // If 401, try refreshing token and retry once
    if (response.status === 401) {
      accessToken = await this.refreshAccessToken();

      if (!accessToken) {
        this.logout();
        throw new Error('Authentication failed');
      }

      response = await this.fetchWithToken(url, accessToken, options);
    }

    return response;
  }

  /**
   * Helper method to make request with specific token.
   */
  private static async fetchWithToken(
    url: string,
    token: string | null,
    options: RequestInit
  ): Promise<Response> {
    const headers = new Headers(options.headers);

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    return fetch(url, { ...options, headers });
  }

  /**
   * Token storage methods
   */
  static setTokens(tokens: TokenPair): void {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.access);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refresh);
  }

  static setAccessToken(token: string): void {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
  }

  static getAccessToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  }

  static getRefreshToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  static clearTokens(): void {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  static isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }
}
