import type { UserType } from '@/types/auth.types';

// Permission Names
export const PERMISSIONS = {
  CREATE_USER: 'create_user',
  READ_USER: 'read_user',
  UPDATE_USER: 'update_user',
  DELETE_USER: 'delete_user',
  CREATE_ADMIN: 'create_admin',
  CREATE_ROOT: 'create_root',
  CREATE_PROJECT: 'create_project',
  READ_PROJECT: 'read_project',
  UPDATE_PROJECT: 'update_project',
  DELETE_PROJECT: 'delete_project',
  VIEW_SYSTEM_HEALTH: 'view_system_health',
  MANAGE_SYSTEM_SETTINGS: 'manage_system_settings',
} as const;

type PermissionName = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Permission Checker Utility
export function hasPermission(
  userType: UserType,
  permission: string
): boolean {
  if (userType === 'root') {
    return true; // ROOT has all permissions
  }
  
  if (userType === 'admin') {
    // ADMIN permissions (excluding system management)
    const adminPermissions: PermissionName[] = [
      PERMISSIONS.CREATE_USER,
      PERMISSIONS.READ_USER,
      PERMISSIONS.UPDATE_USER,
      PERMISSIONS.DELETE_USER,
      PERMISSIONS.READ_PROJECT,
      PERMISSIONS.UPDATE_PROJECT,
    ];
    return adminPermissions.includes(permission as PermissionName);
  }
  
  return false; // CONSUMER has no admin permissions
}

// Check if user can access route
export function canAccessRoute(
  userType: UserType,
  routePath: string
): boolean {
  if (userType === 'root') {
    return true;
  }
  
  if (userType === 'admin') {
    return !routePath.startsWith('/dashboard/system');
  }
  
  return false; // CONSUMER cannot access dashboard
} 