/**
 * Authentication Type Definitions
 *
 * This file contains all TypeScript types and interfaces related to authentication.
 * Following Single Responsibility Principle - only auth-related types are defined here.
 *
 * @module types/auth
 */

/**
 * User account information returned from the API
 *
 * @interface User
 * @property {number} id - Unique user identifier
 * @property {string} mobile - Iranian mobile number (09XXXXXXXXX format)
 * @property {string} name - User's full name
 * @property {boolean} is_staff - Whether user has staff privileges
 * @property {boolean} is_superuser - Whether user has superuser privileges
 */
export interface User {
  id: number;
  mobile: string;
  name: string;
  is_staff: boolean;
  is_superuser: boolean;
}

/**
 * JWT token pair returned from login/refresh endpoints
 *
 * @interface TokenPair
 * @property {string} access - Short-lived access token (15 minutes)
 * @property {string} refresh - Long-lived refresh token (7 hours)
 */
export interface TokenPair {
  access: string;
  refresh: string;
}

/**
 * Login credentials required for authentication
 *
 * @interface LoginCredentials
 * @property {string} mobile - Iranian mobile number
 * @property {string} password - User password
 */
export interface LoginCredentials {
  mobile: string;
  password: string;
}

/**
 * Refresh token request payload
 *
 * @interface RefreshTokenRequest
 * @property {string} refresh - Refresh token to exchange for new token pair
 */
export interface RefreshTokenRequest {
  refresh: string;
}

/**
 * Logout response from API
 *
 * @interface LogoutResponse
 * @property {boolean} success - Whether logout was successful
 * @property {string} message - Logout message
 */
export interface LogoutResponse {
  success: boolean;
  message: string;
}

/**
 * Authentication state managed by Zustand store
 *
 * @interface AuthState
 * @property {User | null} user - Currently authenticated user (null if not logged in)
 * @property {string | null} accessToken - Current access token
 * @property {string | null} refreshToken - Current refresh token
 * @property {boolean} isAuthenticated - Whether user is currently authenticated
 * @property {boolean} isLoading - Whether auth operation is in progress
 * @property {string | null} error - Current error message (null if no error)
 */
export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

/**
 * Authentication store actions
 *
 * @interface AuthActions
 */
export interface AuthActions {
  /**
   * Login with mobile and password
   * @param {LoginCredentials} credentials - User credentials
   * @returns {Promise<void>}
   */
  login: (credentials: LoginCredentials) => Promise<void>;

  /**
   * Logout current user and clear tokens
   * @returns {Promise<void>}
   */
  logout: () => Promise<void>;

  /**
   * Refresh access token using refresh token
   * @returns {Promise<void>}
   */
  refreshAccessToken: () => Promise<void>;

  /**
   * Fetch current user profile
   * @returns {Promise<void>}
   */
  fetchUser: () => Promise<void>;

  /**
   * Set authentication error
   * @param {string | null} error - Error message
   */
  setError: (error: string | null) => void;

  /**
   * Clear authentication error
   */
  clearError: () => void;

  /**
   * Reset entire auth state to initial values
   */
  reset: () => void;
}

/**
 * Complete auth store (state + actions)
 */
export type AuthStore = AuthState & AuthActions;

/**
 * API error response structure
 *
 * @interface ApiError
 * @property {string} detail - Error detail message
 * @property {number} [status] - HTTP status code
 */
export interface ApiError {
  detail: string;
  status?: number;
}

/**
 * Form validation errors
 *
 * @interface FormErrors
 */
export interface FormErrors {
  mobile?: string;
  password?: string;
  general?: string;
}
