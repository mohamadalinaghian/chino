/**
 * Logout Button Component
 *
 * Button component that handles user logout functionality.
 *
 * Follows Single Responsibility Principle:
 * - Only handles logout button UI and click event
 * - Delegates logout logic to Zustand store
 * - Does not handle navigation (can be passed as prop)
 *
 * @module components/auth/LogoutButton
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/common/Button';

/**
 * LogoutButton component props
 */
export interface LogoutButtonProps {
  /** Variant of the button */
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  /** Size of the button */
  size?: 'sm' | 'md' | 'lg';
  /** Route to redirect to after logout */
  redirectTo?: string;
  /** Custom class name */
  className?: string;
  /** Show logout confirmation dialog */
  showConfirmation?: boolean;
  /** Custom button text */
  children?: React.ReactNode;
}

/**
 * LogoutButton Component
 *
 * A button that logs out the current user and optionally redirects.
 *
 * Features:
 * - Calls logout action from auth store
 * - Optional confirmation dialog
 * - Loading state during logout
 * - Customizable appearance
 * - Auto-redirect after logout
 *
 * @component
 * @example
 * // Basic usage
 * <LogoutButton>Logout</LogoutButton>
 *
 * @example
 * // With confirmation and redirect
 * <LogoutButton
 *   showConfirmation
 *   redirectTo="/login"
 *   variant="danger"
 * >
 *   Sign Out
 * </LogoutButton>
 */
export const LogoutButton: React.FC<LogoutButtonProps> = ({
  variant = 'outline',
  size = 'md',
  redirectTo = '/login',
  className = '',
  showConfirmation = false,
  children = 'Logout',
}) => {
  const router = useRouter();
  const { logout } = useAuthStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  /**
   * Handle logout click
   */
  const handleLogout = async () => {
    // Show confirmation if enabled
    if (showConfirmation) {
      const confirmed = window.confirm(
        'Are you sure you want to logout?'
      );

      if (!confirmed) {
        return;
      }
    }

    try {
      setIsLoggingOut(true);

      // Call logout from store
      await logout();

      // Redirect after logout
      router.push(redirectTo);
    } catch (error) {
      console.error('Logout error:', error);

      // Still redirect even if logout API fails
      // since tokens are cleared locally
      router.push(redirectTo);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleLogout}
      isLoading={isLoggingOut}
      disabled={isLoggingOut}
      className={className}
      leftIcon={
        !isLoggingOut && (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
        )
      }
    >
      {children}
    </Button>
  );
};

LogoutButton.displayName = 'LogoutButton';
