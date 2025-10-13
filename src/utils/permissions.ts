import type { UserType } from '@/types/auth.types';

/**
 * Standard RBAC Permission Names
 * These align with the API documentation and RBAC system
 */
export const PERMISSIONS = {
  // General CRUD Permissions
  READ: 'read',
  WRITE: 'write',
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  
  // Admin Permissions
  ADMIN: 'admin',
  FULL_ACCESS: 'full_access',
  
  // User Management
  CREATE_USER: 'create_user',
  READ_USER: 'read_user',
  UPDATE_USER: 'update_user',
  DELETE_USER: 'delete_user',
  MANAGE_USERS: 'manage_users',
  CREATE_ADMIN: 'create_admin',
  CREATE_ROOT: 'create_root',
  
  // Project Management
  CREATE_PROJECT: 'create_project',
  READ_PROJECT: 'read_project',
  UPDATE_PROJECT: 'update_project',
  DELETE_PROJECT: 'delete_project',
  
  // RBAC Management
  MANAGE_ROLES: 'manage_roles',
  MANAGE_PERMISSIONS: 'manage_permissions',
  
  // Data Operations
  EXPORT_DATA: 'export_data',
  IMPORT_DATA: 'import_data',
  
  // System Operations
  VIEW_SYSTEM_HEALTH: 'view_system_health',
  MANAGE_SYSTEM_SETTINGS: 'manage_system_settings',
  VIEW_AUDIT: 'view_audit',
  
  // API Access
  API_ACCESS: 'api_access',
  
  // Content Operations
  MODERATE_CONTENT: 'moderate_content',
} as const;

type PermissionName = typeof PERMISSIONS[keyof typeof PERMISSIONS];

/**
 * User type-based permission checker (legacy system compatibility)
 * Note: This is a fallback for system-level operations.
 * RBAC permissions should be checked first through AuthContext.
 */
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
      PERMISSIONS.MANAGE_USERS,
      PERMISSIONS.READ,
      PERMISSIONS.WRITE,
      PERMISSIONS.CREATE,
      PERMISSIONS.UPDATE,
    ];
    return adminPermissions.includes(permission as PermissionName);
  }
  
  return false; // CONSUMER permissions determined by RBAC roles
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