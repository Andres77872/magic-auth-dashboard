import { useAuth } from './useAuth';
import { PERMISSIONS } from '@/utils/permissions';

interface UsePermissionsReturn {
  // Auth-based Permission Checking
  hasPermission: (permission: string) => boolean;
  isRoot: boolean;
  isAdmin: boolean;
  isConsumer: boolean;
  canCreateUser: boolean;
  canCreateAdmin: boolean;
  canCreateRoot: boolean;
  canCreateProject: boolean;
  canViewSystemHealth: boolean;
  canManageSystem: boolean;
  isAuthenticated: boolean;
  userType: any;
}

/**
 * Hook for checking user permissions based on their authentication status.
 * 
 * Note: This hook previously included RBAC management functionality (CRUD operations
 * for project-scoped permissions via `/rbac/projects/{hash}/permissions` endpoints).
 * That functionality was removed because those backend endpoints never existed.
 * The current implementation only provides auth-based permission checking.
 */
export function usePermissions(): UsePermissionsReturn {
  const { hasPermission, userType, isAuthenticated } = useAuth();
  
  return {
    hasPermission,
    isRoot: userType === 'root',
    isAdmin: userType === 'admin' || userType === 'root',
    isConsumer: userType === 'consumer',
    canCreateUser: hasPermission(PERMISSIONS.CREATE_USER),
    canCreateAdmin: hasPermission(PERMISSIONS.CREATE_ADMIN),
    canCreateRoot: hasPermission(PERMISSIONS.CREATE_ROOT),
    canCreateProject: hasPermission(PERMISSIONS.CREATE_PROJECT),
    canViewSystemHealth: hasPermission(PERMISSIONS.VIEW_SYSTEM_HEALTH),
    canManageSystem: hasPermission(PERMISSIONS.MANAGE_SYSTEM_SETTINGS),
    isAuthenticated,
    userType,
  };
}

export default usePermissions;