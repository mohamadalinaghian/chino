/**
 * Base Dashboard Card Component
 *
 * Single Responsibility: Provide consistent card layout for dashboard metrics
 *
 * Features:
 * - Consistent styling across dashboard
 * - Loading state
 * - Error state
 * - Mobile responsive
 */

'use client';

import { ReactNode } from 'react';

interface Props {
  /** Card title */
  title: string;

  /** Optional icon */
  icon?: string;

  /** Card content */
  children: ReactNode;

  /** Loading state */
  loading?: boolean;

  /** Error message */
  error?: string;

  /** Optional action button */
  action?: {
    label: string;
    onClick: () => void;
  };

  /** Color theme */
  theme?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

const themeColors = {
  default: {
    border: 'border-gray-700 hover:border-indigo-500',
    icon: 'text-gray-400',
  },
  success: {
    border: 'border-gray-700 hover:border-green-500',
    icon: 'text-green-400',
  },
  warning: {
    border: 'border-gray-700 hover:border-yellow-500',
    icon: 'text-yellow-400',
  },
  danger: {
    border: 'border-gray-700 hover:border-red-500',
    icon: 'text-red-400',
  },
  info: {
    border: 'border-gray-700 hover:border-blue-500',
    icon: 'text-blue-400',
  },
};

export function DashboardCard({
  title,
  icon,
  children,
  loading = false,
  error,
  action,
  theme = 'default',
}: Props) {
  const colors = themeColors[theme];

  return (
    <div
      className={`
        rounded-xl bg-gray-800 p-4
        shadow-md
        border ${colors.border}
        transition-all duration-200
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {icon && (
            <span className={`text-lg ${colors.icon}`}>{icon}</span>
          )}
          <h3 className="text-sm font-bold text-gray-100">{title}</h3>
        </div>
        {action && (
          <button
            onClick={action.onClick}
            className="
              text-sm text-indigo-400 hover:text-indigo-300
              font-medium transition-colors
              focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800
              rounded px-2 py-1
            "
          >
            {action.label}
          </button>
        )}
      </div>

      {/* Content */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin text-3xl">⏳</div>
        </div>
      )}

      {error && !loading && (
        <div className="py-4 text-center">
          <div className="text-2xl mb-2">⚠️</div>
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="text-gray-200">{children}</div>
      )}
    </div>
  );
}
