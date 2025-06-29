import { useAuth } from './useAuth';
import { PERMISSIONS } from '@/utils/permissions';

export function usePermissions() {
  const { hasPermission, userType, isAuthenticated } = useAuth();

  return {
    // Permission checking
    hasPermission,
    
    // User type checks
    isRoot: userType === 'root',
    isAdmin: userType === 'admin' || userType === 'root',
    isConsumer: userType === 'consumer',
    
    // Specific permission checks
    canCreateUser: hasPermission(PERMISSIONS.CREATE_USER),
    canCreateAdmin: hasPermission(PERMISSIONS.CREATE_ADMIN),
    canCreateRoot: hasPermission(PERMISSIONS.CREATE_ROOT),
    canCreateProject: hasPermission(PERMISSIONS.CREATE_PROJECT),
    canViewSystemHealth: hasPermission(PERMISSIONS.VIEW_SYSTEM_HEALTH),
    canManageSystem: hasPermission(PERMISSIONS.MANAGE_SYSTEM_SETTINGS),
    
    // General auth state
    isAuthenticated,
    userType,
  };
}

export default usePermissions; 