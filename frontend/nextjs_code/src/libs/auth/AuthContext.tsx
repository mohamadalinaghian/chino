/**
 * Authentication Context Provider
 *
 * Provides centralized auth state management across the application.
 * Implements Context API pattern for clean, maintainable code.
 *
 * Usage:
 * 1. Wrap app with <AuthProvider>
 * 2. Use useAuth() hook in components
 */

'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AuthService } from '@/service/authService';
import { UserInfo } from '@/types/authType';

/**
 * Authentication state interface
 */
interface AuthContextValue {
  /** Current authenticated user or null */
  user: UserInfo | null;
  /** Whether auth state is being loaded */
  loading: boolean;
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  /** Revalidate current auth state */
  revalidate: () => Promise<void>;
  /** Logout current user */
  logout: () => Promise<void>;
}

/**
 * Auth context with undefined default (must use within provider)
 */
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Props for AuthProvider component
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Authentication Provider Component
 *
 * Manages global authentication state and provides it to child components.
 * Automatically validates auth on mount.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Validates and loads current user information
   */
  const revalidate = async () => {
    try {
      setLoading(true);

      // Check if tokens exist
      if (!AuthService.isAuthenticated()) {
        setUser(null);
        return;
      }

      // Fetch current user info
      const userInfo = await AuthService.getCurrentUser();
      setUser(userInfo);
    } catch (error) {
      console.error('خطا در بارگذاری اطلاعات کاربر:', error);
      setUser(null);

      // Clear invalid tokens
      AuthService.logout();
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout handler
   */
  const logout = async () => {
    await AuthService.logout();
    setUser(null);
  };

  /**
   * Validate auth on mount
   */
  useEffect(() => {
    revalidate();
  }, []);

  const value: AuthContextValue = {
    user,
    loading,
    isAuthenticated: !!user,
    revalidate,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook to access auth context
 *
 * @returns Authentication context value
 * @throws Error if used outside AuthProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, isAuthenticated, logout } = useAuth();
 *
 *   if (!isAuthenticated) {
 *     return <div>لطفاً وارد شوید</div>;
 *   }
 *
 *   return <div>سلام {user.name}</div>;
 * }
 * ```
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth باید داخل AuthProvider استفاده شود');
  }

  return context;
}
