import React from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '@/hooks';

interface PermissionGuardProps {
  children: ReactNode;
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  fallback?: ReactNode;
  allowRoot?: boolean;
  userTypes?: ('root' | 'admin' | 'consumer')[];
}

/**
 * Component-level permission guard for conditional rendering.
 * Integrates with RBAC system through AuthContext.
 * 
 * @example
 * // Show content only if user has permission
 * <PermissionGuard permission="manage_users">
 *   <button>Manage Users</button>
 * </PermissionGuard>
 * 
 * @example
 * // Show content if user has ANY of the permissions
 * <PermissionGuard permissions={["admin", "manage_users"]}>
 *   <AdminPanel />
 * </PermissionGuard>
 * 
 * @example
 * // Show content if user has ALL permissions
 * <PermissionGuard permissions={["read", "write"]} requireAll>
 *   <Editor />
 * </PermissionGuard>
 * 
 * @example
 * // Show fallback if no permission
 * <PermissionGuard permission="admin" fallback={<p>Access Denied</p>}>
 *   <AdminContent />
 * </PermissionGuard>
 * 
 * @example
 * // Check by user type
 * <PermissionGuard userTypes={["root", "admin"]}>
 *   <AdminOnlyFeature />
 * </PermissionGuard>
 */
export function PermissionGuard({
  children,
  permission,
  permissions,
  requireAll = false,
  fallback = null,
  allowRoot = true,
  userTypes,
}: PermissionGuardProps): React.JSX.Element | null {
  const { isAuthenticated, hasPermission, userType } = useAuth();

  // Check if user has required permissions
  const hasRequiredPermissions = React.useMemo(() => {
    if (!isAuthenticated) return false;

    // User type check
    if (userTypes && userTypes.length > 0) {
      if (!userType || !userTypes.includes(userType)) {
        return false;
      }
    }

    // Root users bypass permission checks if allowed
    if (allowRoot && userType === 'root') return true;

    // Single permission check
    if (permission) {
      return hasPermission(permission);
    }

    // Multiple permissions check
    if (permissions && permissions.length > 0) {
      if (requireAll) {
        // User must have ALL permissions
        return permissions.every(p => hasPermission(p));
      } else {
        // User must have ANY permission
        return permissions.some(p => hasPermission(p));
      }
    }

    // No permissions specified, allow access
    return true;
  }, [isAuthenticated, userType, userTypes, permission, permissions, requireAll, hasPermission, allowRoot]);

  if (!hasRequiredPermissions) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export default PermissionGuard;
