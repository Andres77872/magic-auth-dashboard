import React from 'react';
import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks';
import { ROUTES } from '@/utils/routes';
import { ProtectedRoute } from './ProtectedRoute';

interface PermissionRouteProps {
  children: ReactNode;
  permission?: string;
  permissions?: string[]; // Support multiple permissions
  requireAll?: boolean; // If true, user must have ALL permissions; if false, ANY permission
  fallbackRoute?: string;
  allowRoot?: boolean; // If true, root users bypass permission check
}

/**
 * Route guard that checks RBAC permissions.
 * Uses integrated AuthContext with RBAC support.
 * 
 * @example
 * // Require single permission
 * <PermissionRoute permission="manage_users">
 *   <UserManagementPage />
 * </PermissionRoute>
 * 
 * @example
 * // Require ANY of multiple permissions
 * <PermissionRoute permissions={["admin", "manage_users"]}>
 *   <AdminPage />
 * </PermissionRoute>
 * 
 * @example
 * // Require ALL permissions
 * <PermissionRoute permissions={["read", "write"]} requireAll>
 *   <EditorPage />
 * </PermissionRoute>
 */
export function PermissionRoute({
  children,
  permission,
  permissions,
  requireAll = false,
  fallbackRoute = ROUTES.UNAUTHORIZED,
  allowRoot = true,
}: PermissionRouteProps): React.JSX.Element {
  const { isAuthenticated, hasPermission, userType } = useAuth();

  // Determine if user has required permissions
  const hasRequiredPermissions = React.useMemo(() => {
    if (!isAuthenticated) return false;
    
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
  }, [isAuthenticated, userType, permission, permissions, requireAll, hasPermission, allowRoot]);

  return (
    <ProtectedRoute>
      {isAuthenticated && !hasRequiredPermissions ? (
        <Navigate to={fallbackRoute} replace />
      ) : (
        <>{children}</>
      )}
    </ProtectedRoute>
  );
}

export default PermissionRoute; 