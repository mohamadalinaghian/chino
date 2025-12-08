/**
 * Auth Provider Component
 *
 * Initializes authentication state when the app loads.
 * Checks for existing tokens and fetches user data if available.
 *
 * Follows Single Responsibility Principle:
 * - Only handles auth initialization on app mount
 * - Delegates auth logic to Zustand store
 * - Does not render UI (just wraps children)
 *
 * @module components/auth/AuthProvider
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { tokenManager } from '@/service/auth';

/**
 * AuthProvider component props
 */
export interface AuthProviderProps {
  /** Child components to render */
  children: React.ReactNode;
  /** Show loading state while initializing */
  showLoading?: boolean;
  /** Custom loading component */
  loadingComponent?: React.ReactNode;
}

/**
 * Default loading component
 */
const DefaultLoading: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
);

/**
 * AuthProvider Component
 *
 * Wraps the application and handles auth initialization.
 * Should be placed high in the component tree, typically in the root layout.
 *
 * Features:
 * - Checks for existing tokens on mount
 * - Fetches user data if tokens exist
 * - Handles automatic token refresh
 * - Shows loading state during initialization
 *
 * @component
 * @example
 * // In app/layout.tsx
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <AuthProvider>
 *           {children}
 *         </AuthProvider>
 *       </body>
 *     </html>
 *   );
 * }
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({
  children,
  showLoading = true,
  loadingComponent,
}) => {
  const { fetchUser, isLoading } = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);

  /**
   * Initialize auth state on mount
   */
  useEffect(() => {
    const initAuth = async () => {
      // Check if tokens exist
      const hasTokens = tokenManager.hasTokens();

      if (hasTokens) {
        try {
          // Fetch user data
          await fetchUser();
        } catch (error) {
          // If fetch fails, tokens are likely invalid
          console.error('Auth initialization failed:', error);
          // Store will handle cleanup
        }
      }

      // Mark as initialized
      setIsInitialized(true);
    };

    initAuth();
  }, [fetchUser]);

  // Show loading state during initialization
  if (showLoading && (!isInitialized || isLoading)) {
    return loadingComponent ? <>{loadingComponent}</> : <DefaultLoading />;
  }

  // Render children once initialized
  return <>{children}</>;
};

AuthProvider.displayName = 'AuthProvider';
