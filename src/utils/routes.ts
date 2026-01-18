// Route Constants
export const ROUTES = {
  // Public Routes
  LOGIN: '/login',
  UNAUTHORIZED: '/unauthorized',
  
  // Dashboard Routes
  DASHBOARD: '/dashboard',
  OVERVIEW: '/dashboard/overview',
  
  // User Management
  USERS: '/dashboard/users',
  USERS_LIST: '/dashboard/users/list',
  USERS_CREATE: '/dashboard/users/create',
  USERS_EDIT: '/dashboard/users/edit',
  USERS_PROFILE: '/dashboard/users/profile',
  
  // Project Management
  PROJECTS: '/dashboard/projects',
  PROJECTS_LIST: '/dashboard/projects/list',
  PROJECTS_CREATE: '/dashboard/projects/create',
  PROJECTS_EDIT: '/dashboard/projects/edit',
  PROJECTS_DETAILS: '/dashboard/projects/details',
  
  // Group Management
  GROUPS: '/dashboard/groups',
  GROUPS_LIST: '/dashboard/groups/list',
  GROUPS_CREATE: '/dashboard/groups/create',
  GROUPS_EDIT: '/dashboard/groups/edit',
  
  // Project Group Management
  PROJECT_GROUPS: '/dashboard/groups/project-groups',
  PROJECT_GROUPS_CREATE: '/dashboard/groups/project-groups/create',
  PROJECT_GROUPS_EDIT: '/dashboard/groups/project-groups/edit',
  PROJECT_GROUPS_DETAILS: '/dashboard/groups/project-groups',
  
  // RBAC Management
  PERMISSIONS: '/dashboard/permissions',
  PERMISSIONS_ROLES: '/dashboard/permissions/roles',
  PERMISSIONS_LIST: '/dashboard/permissions/permissions',
  PERMISSIONS_ASSIGNMENTS: '/dashboard/permissions/assignments',
  
  // Permission Management (UNIFIED)
  PERMISSION_MANAGEMENT: '/dashboard/permissions/management',
  
  // Global Roles Management (NEW)
  GLOBAL_ROLES: '/dashboard/permissions/global-roles',
  PERMISSION_GROUPS: '/dashboard/permissions/permission-groups',
  PERMISSION_ASSIGNMENTS_MGMT: '/dashboard/permissions/permission-assignments',
  ROLE_MANAGEMENT: '/dashboard/permissions/role-management',
  
  // Audit Log Monitor
  AUDIT: '/dashboard/audit',
  AUDIT_ACTIVITY: '/dashboard/audit/activity',
  AUDIT_SECURITY: '/dashboard/audit/security',
  AUDIT_STATISTICS: '/dashboard/audit/statistics',
  
  // System Management (ROOT only)
  SYSTEM: '/dashboard/system',
  SYSTEM_HEALTH: '/dashboard/system/health',
  SYSTEM_ADMINS: '/dashboard/system/admins',
  SYSTEM_SETTINGS: '/dashboard/system/settings',
  
  // Profile
  PROFILE: '/dashboard/profile',
} as const;

// Navigation Items
export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: string;
  allowedUserTypes: string[];
  children?: NavItem[];
}

export const NAVIGATION_ITEMS: NavItem[] = [
  {
    id: 'overview',
    label: 'Dashboard',
    path: ROUTES.OVERVIEW,
    icon: 'dashboard',
    allowedUserTypes: ['root', 'admin'],
  },
  {
    id: 'users',
    label: 'Users',
    path: ROUTES.USERS,
    icon: 'users',
    allowedUserTypes: ['root', 'admin'],
  },
  {
    id: 'projects',
    label: 'Projects',
    path: ROUTES.PROJECTS,
    icon: 'folder',
    allowedUserTypes: ['root', 'admin'],
  },
  {
    id: 'groups',
    label: 'Groups',
    path: ROUTES.GROUPS,
    icon: 'users-group',
    allowedUserTypes: ['root', 'admin'],
  },
  {
    id: 'permission-management',
    label: 'Permission Management',
    path: ROUTES.PERMISSION_MANAGEMENT,
    icon: 'shield',
    allowedUserTypes: ['root', 'admin'],
  },
  {
    id: 'role-management',
    label: 'Role Management',
    path: ROUTES.ROLE_MANAGEMENT,
    icon: 'user-badge',
    allowedUserTypes: ['root', 'admin'],
  },
  {
    id: 'audit',
    label: 'Audit Logs',
    path: ROUTES.AUDIT,
    icon: 'document',
    allowedUserTypes: ['root', 'admin'],
  },
  {
    id: 'system',
    label: 'System',
    path: ROUTES.SYSTEM,
    icon: 'settings',
    allowedUserTypes: ['root'],
  },
]; 