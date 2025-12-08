/**
 * Authentication Store (Zustand)
 *
 * Global state management for authentication using Zustand.
 * This store manages user state, tokens, and auth-related operations.
 *
 * Follows Single Responsibility Principle:
 * - Only manages auth state
 * - Delegates API calls to authService
 * - Does not handle UI logic
 *
 * @module store/authStore
 */

'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { authService, tokenManager } from '@/service/auth';
import type {
  AuthStore,
  LoginCredentials,
  User,
} from '@/types/auth';

/**
 * Initial authentication state
 *
 * All values are null/false when user is not authenticated
 */
const initialState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

/**
 * Authentication Store
 *
 * Zustand store for managing authentication state and actions.
 *
 * Features:
 * - Persistent storage (tokens saved to localStorage)
 * - DevTools integration (for debugging)
 * - Automatic token refresh
 * - Error handling
 *
 * @example
 * import { useAuthStore } from '@/store/authStore';
 *
 * function LoginPage() {
 *   const { login, isLoading, error } = useAuthStore();
 *
 *   const handleLogin = async () => {
 *     await login({ mobile: '09123456789', password: 'pass' });
 *   };
 * }
 */
export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set, get) => ({
        // ============================================================
        // State
        // ============================================================
        ...initialState,

        // ============================================================
        // Actions
        // ============================================================

        /**
         * Login with credentials
         *
         * Performs login, saves tokens, and fetches user profile
         *
         * @param {LoginCredentials} credentials - Mobile and password
         * @throws {Error} If login fails
         */
        login: async (credentials: LoginCredentials) => {
          try {
            // Set loading state
            set({ isLoading: true, error: null });

            // Call login API
            const tokens = await authService.login(credentials);

            // Save tokens to localStorage
            tokenManager.setTokens(tokens);

            // Update state with tokens
            set({
              accessToken: tokens.access,
              refreshToken: tokens.refresh,
            });

            // Fetch user profile
            const user = await authService.getMe();

            // Update state with user
            set({
              user,
              isAuthenticated: true,
              isLoading: false,
            });
          } catch (error) {
            // Handle errors
            const errorMessage =
              error instanceof Error ? error.message : 'Login failed';

            set({
              error: errorMessage,
              isLoading: false,
              isAuthenticated: false,
            });

            // Re-throw for component-level handling if needed
            throw error;
          }
        },

        /**
         * Logout current user
         *
         * Calls logout API, clears tokens, and resets state
         */
        logout: async () => {
          try {
            set({ isLoading: true });

            // Call logout API (optional, since it's stateless)
            await authService.logout();
          } catch (error) {
            // Continue with logout even if API call fails
            console.error('Logout API call failed:', error);
          } finally {
            // Clear tokens from localStorage
            tokenManager.clearTokens();

            // Reset state to initial values
            set({
              ...initialState,
            });
          }
        },

        /**
         * Refresh access token
         *
         * Uses refresh token to get new token pair
         * Automatically called when access token expires
         */
        refreshAccessToken: async () => {
          try {
            const { refreshToken } = get();

            if (!refreshToken) {
              throw new Error('No refresh token available');
            }

            // Call refresh API
            const tokens = await authService.refreshToken(refreshToken);

            // Save new tokens
            tokenManager.setTokens(tokens);

            // Update state
            set({
              accessToken: tokens.access,
              refreshToken: tokens.refresh,
            });
          } catch (error) {
            // If refresh fails, logout user
            const errorMessage =
              error instanceof Error
                ? error.message
                : 'Token refresh failed';

            set({ error: errorMessage });

            // Logout user
            get().logout();

            throw error;
          }
        },

        /**
         * Fetch current user profile
         *
         * Gets user data from /auth/me endpoint
         * Useful for verifying authentication on app load
         */
        fetchUser: async () => {
          try {
            set({ isLoading: true, error: null });

            // Check if tokens exist
            if (!tokenManager.hasTokens()) {
              set({ isLoading: false });
              return;
            }

            // Fetch user profile
            const user = await authService.getMe();

            // Update state
            set({
              user,
              isAuthenticated: true,
              isLoading: false,
            });
          } catch (error) {
            // If fetch fails (e.g., token expired), try to refresh
            try {
              await get().refreshAccessToken();
              // Retry fetching user after refresh
              const user = await authService.getMe();
              set({
                user,
                isAuthenticated: true,
                isLoading: false,
              });
            } catch (refreshError) {
              // Both failed, logout
              set({
                ...initialState,
              });
              tokenManager.clearTokens();
            }
          }
        },

        /**
         * Set error message
         *
         * @param {string | null} error - Error message
         */
        setError: (error: string | null) => {
          set({ error });
        },

        /**
         * Clear error message
         */
        clearError: () => {
          set({ error: null });
        },

        /**
         * Reset auth state to initial values
         *
         * Useful for testing or manual state cleanup
         */
        reset: () => {
          tokenManager.clearTokens();
          set(initialState);
        },
      }),
      {
        name: 'auth-storage', // localStorage key
        // Only persist tokens, not user data or loading states
        partialize: (state) => ({
          accessToken: state.accessToken,
          refreshToken: state.refreshToken,
        }),
      }
    ),
    {
      name: 'AuthStore', // DevTools name
    }
  )
);

/**
 * Selector hooks for accessing specific parts of auth state
 *
 * Using selectors improves performance by preventing unnecessary re-renders
 *
 * @example
 * import { useUser, useIsAuthenticated } from '@/store/authStore';
 *
 * function UserProfile() {
 *   const user = useUser();
 *   const isAuthenticated = useIsAuthenticated();
 *
 *   if (!isAuthenticated) return <div>Please login</div>;
 *   return <div>Hello {user?.name}</div>;
 * }
 */

/**
 * Get current user
 */
export const useUser = () => useAuthStore((state) => state.user);

/**
 * Get authentication status
 */
export const useIsAuthenticated = () =>
  useAuthStore((state) => state.isAuthenticated);

/**
 * Get loading state
 */
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);

/**
 * Get error state
 */
export const useAuthError = () => useAuthStore((state) => state.error);

/**
 * Get login action
 */
export const useLogin = () => useAuthStore((state) => state.login);

/**
 * Get logout action
 */
export const useLogout = () => useAuthStore((state) => state.logout);

/**
 * Get all auth actions
 */
export const useAuthActions = () =>
  useAuthStore((state) => ({
    login: state.login,
    logout: state.logout,
    refreshAccessToken: state.refreshAccessToken,
    fetchUser: state.fetchUser,
  }));
