/**
 * API Client Configuration
 *
 * This module provides a configured fetch wrapper for making API requests.
 * It handles base URL configuration, headers, and response parsing.
 *
 * Follows Single Responsibility Principle:
 * - Only handles HTTP client configuration and request execution
 * - Does not handle business logic (that's in service layer)
 * - Does not handle state management (that's in Zustand store)
 *
 * @module service/api/client
 */

/**
 * Base API URL from environment variables
 * Falls back to localhost if not set
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_DJANGO_URL || 'http://localhost:8000/api';

/**
 * API request configuration options
 *
 * @interface ApiRequestConfig
 */
interface ApiRequestConfig extends RequestInit {
  /** Whether to include authentication token in request */
  requiresAuth?: boolean;
  /** Custom headers to merge with defaults */
  customHeaders?: Record<string, string>;
}

/**
 * API client class for making HTTP requests
 *
 * This class provides methods for GET, POST, PUT, DELETE requests
 * with built-in error handling and token management.
 *
 * @class ApiClient
 *
 * @example
 * const client = new ApiClient();
 * const data = await client.get('/auth/me', { requiresAuth: true });
 */
export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Get access token from localStorage
   *
   * @private
   * @returns {string | null} Access token or null if not found
   */
  private getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('access_token');
  }

  /**
   * Build request headers
   *
   * @private
   * @param {boolean} requiresAuth - Whether to include auth token
   * @param {Record<string, string>} customHeaders - Additional headers
   * @returns {HeadersInit} Complete headers object
   */
  private buildHeaders(
    requiresAuth: boolean = false,
    customHeaders: Record<string, string> = {}
  ): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };

    if (requiresAuth) {
      const token = this.getAccessToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  /**
   * Handle API response
   *
   * Parses JSON response and handles errors
   *
   * @private
   * @template T
   * @param {Response} response - Fetch API response
   * @returns {Promise<T>} Parsed response data
   * @throws {Error} If response is not OK
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    // Parse JSON response
    const data = await response.json();

    // Check if response is successful
    if (!response.ok) {
      // Extract error message from response
      const errorMessage = data.detail || data.message || 'An error occurred';

      // Create error with status code
      const error = new Error(errorMessage) as Error & { status: number; data: any };
      error.status = response.status;
      error.data = data;

      throw error;
    }

    return data;
  }

  /**
   * Make a GET request
   *
   * @template T
   * @param {string} endpoint - API endpoint (e.g., '/auth/me')
   * @param {ApiRequestConfig} config - Request configuration
   * @returns {Promise<T>} Response data
   *
   * @example
   * const user = await apiClient.get<User>('/auth/me', { requiresAuth: true });
   */
  async get<T>(endpoint: string, config: ApiRequestConfig = {}): Promise<T> {
    const { requiresAuth = false, customHeaders = {}, ...fetchConfig } = config;

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'GET',
      headers: this.buildHeaders(requiresAuth, customHeaders),
      ...fetchConfig,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Make a POST request
   *
   * @template T
   * @param {string} endpoint - API endpoint
   * @param {any} body - Request body (will be JSON stringified)
   * @param {ApiRequestConfig} config - Request configuration
   * @returns {Promise<T>} Response data
   *
   * @example
   * const tokens = await apiClient.post<TokenPair>('/auth/login', {
   *   mobile: '09123456789',
   *   password: 'password123'
   * });
   */
  async post<T>(
    endpoint: string,
    body?: any,
    config: ApiRequestConfig = {}
  ): Promise<T> {
    const { requiresAuth = false, customHeaders = {}, ...fetchConfig } = config;

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: this.buildHeaders(requiresAuth, customHeaders),
      body: body ? JSON.stringify(body) : undefined,
      ...fetchConfig,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Make a PUT request
   *
   * @template T
   * @param {string} endpoint - API endpoint
   * @param {any} body - Request body
   * @param {ApiRequestConfig} config - Request configuration
   * @returns {Promise<T>} Response data
   */
  async put<T>(
    endpoint: string,
    body?: any,
    config: ApiRequestConfig = {}
  ): Promise<T> {
    const { requiresAuth = false, customHeaders = {}, ...fetchConfig } = config;

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: this.buildHeaders(requiresAuth, customHeaders),
      body: body ? JSON.stringify(body) : undefined,
      ...fetchConfig,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Make a DELETE request
   *
   * @template T
   * @param {string} endpoint - API endpoint
   * @param {ApiRequestConfig} config - Request configuration
   * @returns {Promise<T>} Response data
   */
  async delete<T>(endpoint: string, config: ApiRequestConfig = {}): Promise<T> {
    const { requiresAuth = false, customHeaders = {}, ...fetchConfig } = config;

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: this.buildHeaders(requiresAuth, customHeaders),
      ...fetchConfig,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Make a PATCH request
   *
   * @template T
   * @param {string} endpoint - API endpoint
   * @param {any} body - Request body
   * @param {ApiRequestConfig} config - Request configuration
   * @returns {Promise<T>} Response data
   */
  async patch<T>(
    endpoint: string,
    body?: any,
    config: ApiRequestConfig = {}
  ): Promise<T> {
    const { requiresAuth = false, customHeaders = {}, ...fetchConfig } = config;

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PATCH',
      headers: this.buildHeaders(requiresAuth, customHeaders),
      body: body ? JSON.stringify(body) : undefined,
      ...fetchConfig,
    });

    return this.handleResponse<T>(response);
  }
}

/**
 * Default API client instance
 *
 * Use this singleton instance throughout your application
 *
 * @example
 * import { apiClient } from '@/service/api/client';
 * const user = await apiClient.get('/auth/me', { requiresAuth: true });
 */
export const apiClient = new ApiClient();
