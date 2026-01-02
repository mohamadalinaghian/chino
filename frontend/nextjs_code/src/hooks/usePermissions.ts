/**
 * Permission Management Hook
 *
 * Single Responsibility: Extract and provide user permissions from auth context
 *
 * Uses Django permission strings (e.g., 'sale.view_revenue_data')
 * Not role-based - permissions come from Django groups/permissions
 */

import { useEffect, useState } from 'react';
import { AuthService } from '@/service/authService';
import type { UserInfo } from '@/types/authType';

/**
 * Hook to get current user permissions
 *
 * @returns Object containing permissions and helper functions
 */
export function usePermissions() {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserPermissions = async () => {
      try {
        const currentUser = await AuthService.getCurrentUser();
        setUser(currentUser);
        setPermissions(currentUser.permissions || []);
      } catch (error) {
        console.error('Failed to load user permissions:', error);
        setPermissions([]);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUserPermissions();
  }, []);

  /**
   * Check if user has a specific permission
   *
   * @param permission - Django permission string (e.g., 'sale.close_sale')
   * @returns true if user has the permission
   */
  const hasPermission = (permission: string): boolean => {
    return permissions.includes(permission);
  };

  /**
   * Check if user has ANY of the specified permissions
   *
   * @param perms - Array of permission strings
   * @returns true if user has at least one permission
   */
  const hasAnyPermission = (perms: string[]): boolean => {
    return perms.some((perm) => permissions.includes(perm));
  };

  /**
   * Check if user has ALL of the specified permissions
   *
   * @param perms - Array of permission strings
   * @returns true if user has all permissions
   */
  const hasAllPermissions = (perms: string[]): boolean => {
    return perms.every((perm) => permissions.includes(perm));
  };

  return {
    permissions,
    user,
    loading,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isStaff: user?.is_staff || false,
  };
}

/**
 * Sale-specific permission constants
 * Matches backend policies exactly
 */
export const SalePermissions = {
  OPEN_SALE: 'sale.open_sale',
  VIEW_SALE_LIST: 'sale.view_sale_list',
  VIEW_SALE_DETAIL: 'sale.view_sale_detail',
  MODIFY_SALE: 'sale.modify_sale',
  CLOSE_SALE: 'sale.close_sale',
  CANCEL_SALE: 'sale.cancel_sale',
  VIEW_REVENUE_DATA: 'sale.view_revenue_data',
  VIEW_DAILY_REPORT: 'sale.view_dailyreport',
  ADD_DAILY_REPORT: 'sale.add_dailyreport',
  CHANGE_DAILY_REPORT: 'sale.change_dailyreport',
  APPROVE_DAILY_REPORT: 'sale.approve_dailyreport',
} as const;

/**
 * Simple hook to check a single permission
 *
 * @param permission - Permission to check
 * @returns true if user has the permission
 */
export function useHasPermission(permission: string): boolean {
  const { hasPermission } = usePermissions();
  return hasPermission(permission);
}
