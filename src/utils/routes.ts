// Route Constants
export const ROUTES = {
  // Public Routes
  LOGIN: '/login',
  UNAUTHORIZED: '/unauthorized',

  // Landing / Home (canonical root)
  HOME: '/',

  // User Management
  USERS: '/users',
  USER: '/users',  // base path for /users/:hash

  // Project Management
  PROJECTS: '/projects',
  PROJECT: '/projects',  // base path for /projects/:hash

  // Group Management
  GROUPS: '/groups',
  GROUP: '/groups',  // base path for /groups/:hash

  // Project Group Management (route-based, under groups)
  PROJECT_GROUPS: '/groups/project-groups',
  PROJECT_GROUPS_CREATE: '/groups/project-groups/create',
  PROJECT_GROUPS_EDIT: '/groups/project-groups/edit',
  PROJECT_GROUPS_DETAILS: '/groups/project-groups',

  // Permission Management (top-level)
  PERMISSIONS: '/permissions',
  PERMISSIONS_GLOBAL_ROLES: '/permissions/global-roles',

  // Role Management (top-level, separate)
  ROLES: '/roles',

  // Audit Log
  AUDIT: '/audit',

  // API Tokens
  TOKENS: '/tokens',

  // System Management (ROOT only)
  SYSTEM: '/system',

  // Personal Routes (no Home prefix in breadcrumbs)
  PROFILE: '/profile',
  SETTINGS: '/settings',
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
    id: 'home',
    label: 'Home',
    path: ROUTES.HOME,
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
    id: 'permissions',
    label: 'Permissions',
    path: ROUTES.PERMISSIONS,
    icon: 'shield',
    allowedUserTypes: ['root', 'admin'],
  },
  {
    id: 'roles',
    label: 'Roles',
    path: ROUTES.ROLES,
    icon: 'user-badge',
    allowedUserTypes: ['root', 'admin'],
  },
  {
    id: 'tokens',
    label: 'API Tokens',
    path: ROUTES.TOKENS,
    icon: 'key',
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