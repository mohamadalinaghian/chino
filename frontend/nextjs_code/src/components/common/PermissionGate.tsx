/**
 * PermissionGate Component
 *
 * Single Responsibility: Conditional rendering based on Django permissions
 *
 * Usage:
 * <PermissionGate permission="sale.view_revenue_data">
 *   <RevenueCard />
 * </PermissionGate>
 */

'use client';

import { ReactNode } from 'react';
import { usePermissions } from '@/hooks/usePermissions';

interface PermissionGateProps {
  /** Django permission string (e.g., 'sale.close_sale') */
  permission?: string;

  /** Array of permissions - user needs ANY one */
  anyOf?: string[];

  /** Array of permissions - user needs ALL */
  allOf?: string[];

  /** Content to render if user has permission */
  children: ReactNode;

  /** Optional fallback content if permission denied */
  fallback?: ReactNode;

  /** Require staff status */
  requireStaff?: boolean;
}

/**
 * Gate component for permission-based rendering
 *
 * @param props - Permission gate configuration
 * @returns Children if permitted, fallback otherwise
 */
export function PermissionGate({
  permission,
  anyOf,
  allOf,
  children,
  fallback = null,
  requireStaff = false,
}: PermissionGateProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isStaff, loading } =
    usePermissions();

  // While loading, don't render anything to prevent flash
  if (loading) {
    return null;
  }

  // Check staff requirement
  if (requireStaff && !isStaff) {
    return <>{fallback}</>;
  }

  // Check single permission
  if (permission && !hasPermission(permission)) {
    return <>{fallback}</>;
  }

  // Check any of permissions
  if (anyOf && anyOf.length > 0 && !hasAnyPermission(anyOf)) {
    return <>{fallback}</>;
  }

  // Check all permissions
  if (allOf && allOf.length > 0 && !hasAllPermissions(allOf)) {
    return <>{fallback}</>;
  }

  // Permission granted
  return <>{children}</>;
}

/**
 * Inverse permission gate - renders when user LACKS permission
 *
 * Useful for showing "upgrade" messages or permission denied notices
 */
export function PermissionGateInverse({
  permission,
  children,
}: {
  permission: string;
  children: ReactNode;
}) {
  const { hasPermission, loading } = usePermissions();

  if (loading) {
    return null;
  }

  return hasPermission(permission) ? null : <>{children}</>;
}
