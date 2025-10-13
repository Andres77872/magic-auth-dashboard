import { useCallback } from 'react';
import { useAuth } from './useAuth';
import { rbacService } from '@/services/rbac.service';

/**
 * Hook for checking RBAC permissions with multiple strategies:
 * 1. Check cached effective permissions (fast, from AuthContext)
 * 2. Fall back to user type-based permissions for system operations
 * 3. Optionally make real-time API calls for critical checks
 */
export interface UseRBACPermissionCheckerReturn {
  // Basic permission checking
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  
  // Real-time API-based checking (for critical operations)
  checkPermissionLive: (permission: string) => Promise<boolean>;
  
  // Permission utilities
  getEffectivePermissions: () => string[];
  isPermissionsLoaded: boolean;
  isPermissionsLoading: boolean;
  refreshPermissions: () => Promise<void>;
  
  // User type checks
  isRoot: boolean;
  isAdmin: boolean;
  isConsumer: boolean;
  
  // Common permission checks (convenience methods)
  canManageUsers: boolean;
  canManageRoles: boolean;
  canManagePermissions: boolean;
  canViewAudit: boolean;
  canExportData: boolean;
  canImportData: boolean;
  canAccessAPI: boolean;
  canCreateContent: boolean;
  canEditContent: boolean;
  canDeleteContent: boolean;
}

export function useRBACPermissionChecker(): UseRBACPermissionCheckerReturn {
  const {
    user,
    userType,
    hasPermission: authHasPermission,
    effectivePermissions,
    permissionsLoading,
    loadUserPermissions,
    currentProject,
  } = useAuth();

  // Basic permission checking (uses cached permissions)
  const hasPermission = useCallback((permission: string): boolean => {
    return authHasPermission(permission);
  }, [authHasPermission]);

  // Check if user has ANY of the specified permissions
  const hasAnyPermission = useCallback((permissions: string[]): boolean => {
    if (!user) return false;
    
    // ROOT has all permissions
    if (userType === 'root') return true;
    
    return permissions.some(permission => hasPermission(permission));
  }, [user, userType, hasPermission]);

  // Check if user has ALL of the specified permissions
  const hasAllPermissions = useCallback((permissions: string[]): boolean => {
    if (!user) return false;
    
    // ROOT has all permissions
    if (userType === 'root') return true;
    
    return permissions.every(permission => hasPermission(permission));
  }, [user, userType, hasPermission]);

  // Real-time API check for critical operations
  const checkPermissionLive = useCallback(async (permission: string): Promise<boolean> => {
    if (!user || !currentProject) return false;
    
    // ROOT always has permission
    if (userType === 'root') return true;
    
    try {
      const response = await rbacService.checkUserPermission(
        user.user_hash,
        currentProject.project_hash,
        permission
      );
      
      return response.permission_check?.has_permission || false;
    } catch (error) {
      console.error('Failed to check permission:', error);
      // Fall back to cached permission check
      return hasPermission(permission);
    }
  }, [user, currentProject, userType, hasPermission]);

  // Get all effective permissions
  const getEffectivePermissions = useCallback((): string[] => {
    return effectivePermissions;
  }, [effectivePermissions]);

  // Refresh permissions from backend
  const refreshPermissions = useCallback(async (): Promise<void> => {
    await loadUserPermissions();
  }, [loadUserPermissions]);

  // User type checks
  const isRoot = userType === 'root';
  const isAdmin = userType === 'admin' || userType === 'root';
  const isConsumer = userType === 'consumer';

  // Common permission checks (based on standard RBAC permissions)
  const canManageUsers = hasPermission('manage_users');
  const canManageRoles = hasPermission('manage_roles');
  const canManagePermissions = hasPermission('manage_permissions') || hasPermission('admin');
  const canViewAudit = hasPermission('view_audit');
  const canExportData = hasPermission('export_data');
  const canImportData = hasPermission('import_data');
  const canAccessAPI = hasPermission('api_access');
  const canCreateContent = hasPermission('create') || hasPermission('write');
  const canEditContent = hasPermission('update') || hasPermission('write');
  const canDeleteContent = hasPermission('delete');

  return {
    // Basic checks
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    
    // Live checks
    checkPermissionLive,
    
    // Permission utilities
    getEffectivePermissions,
    isPermissionsLoaded: effectivePermissions.length > 0 || isRoot,
    isPermissionsLoading: permissionsLoading,
    refreshPermissions,
    
    // User type checks
    isRoot,
    isAdmin,
    isConsumer,
    
    // Common permission checks
    canManageUsers,
    canManageRoles,
    canManagePermissions,
    canViewAudit,
    canExportData,
    canImportData,
    canAccessAPI,
    canCreateContent,
    canEditContent,
    canDeleteContent,
  };
}

export default useRBACPermissionChecker;
