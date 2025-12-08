/**
 * User Profile Component
 *
 * Displays current user information and provides logout functionality.
 *
 * Follows Single Responsibility Principle:
 * - Only handles user profile display
 * - Delegates logout to LogoutButton component
 * - Gets user data from Zustand store
 *
 * @module components/auth/UserProfile
 */

'use client';

import React from 'react';
import { useUser, useIsAuthenticated } from '@/store/authStore';
import { LogoutButton } from './LogoutButton';

/**
 * UserProfile component props
 */
export interface UserProfileProps {
  /** Show logout button */
  showLogout?: boolean;
  /** Custom class name for container */
  className?: string;
  /** Show user badges (staff, superuser) */
  showBadges?: boolean;
}

/**
 * UserProfile Component
 *
 * Displays user information including name, mobile, and role badges.
 *
 * Features:
 * - Shows user name and mobile number
 * - Displays staff/superuser badges
 * - Optional logout button
 * - Loading and unauthenticated states
 *
 * @component
 * @example
 * // Basic usage
 * <UserProfile />
 *
 * @example
 * // With logout button
 * <UserProfile showLogout />
 *
 * @example
 * // Minimal display
 * <UserProfile showBadges={false} showLogout={false} />
 */
export const UserProfile: React.FC<UserProfileProps> = ({
  showLogout = true,
  className = '',
  showBadges = true,
}) => {
  const user = useUser();
  const isAuthenticated = useIsAuthenticated();

  // Not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className={`p-4 bg-gray-50 rounded-lg ${className}`}>
        <p className="text-sm text-gray-600">Not logged in</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      {/* User avatar/icon */}
      <div className="flex items-center space-x-4 mb-4">
        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
          <svg
            className="w-10 h-10 text-indigo-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        <div className="flex-1">
          {/* User name */}
          <h3 className="text-xl font-semibold text-gray-900">
            {user.name}
          </h3>

          {/* Mobile number */}
          <p className="text-sm text-gray-600 flex items-center mt-1">
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
            {user.mobile}
          </p>
        </div>
      </div>

      {/* Role badges */}
      {showBadges && (user.is_staff || user.is_superuser) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {user.is_superuser && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              <svg
                className="w-3 h-3 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Superuser
            </span>
          )}

          {user.is_staff && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              <svg
                className="w-3 h-3 mr-1"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                  clipRule="evenodd"
                />
              </svg>
              Staff
            </span>
          )}
        </div>
      )}

      {/* User info grid */}
      <div className="border-t border-gray-200 pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">User ID:</span>
          <span className="font-medium text-gray-900">#{user.id}</span>
        </div>
      </div>

      {/* Logout button */}
      {showLogout && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <LogoutButton
            variant="outline"
            size="md"
            fullWidth
            showConfirmation
          >
            Logout
          </LogoutButton>
        </div>
      )}
    </div>
  );
};

UserProfile.displayName = 'UserProfile';
