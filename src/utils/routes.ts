// Route Constants
export const ROUTES = {
  // Public Routes
  LOGIN: '/login',
  UNAUTHORIZED: '/unauthorized',
  ABOUT: '/about', // public overview; also shown at `/` while signed out

  // Landing / Home (canonical root)
  HOME: '/',

  // User Management
  USERS: '/users',
  USER: '/users', // base path for /users/:hash

  // Project Management
  PROJECTS: '/projects',
  PROJECT: '/projects', // base path for /projects/:hash

  // Billing (groups, catalog, per-account Stripe credentials)
  BILLING: '/billing',
  BILLING_GROUP: '/billing', // base path for /billing/:groupHash

  // OAuth (connections, per-project bindings, write-only provider credentials)
  OAUTH: '/oauth',
  OAUTH_CONNECTION: '/oauth', // base path for /oauth/:connectionHash

  // Group Management
  GROUPS: '/groups',
  GROUP: '/groups', // base path for /groups/:hash

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

  // Email Templates (ROOT only)
  EMAIL_TEMPLATES: '/email-templates',

  // Patreon Operations (ROOT only)
  PATREON: '/system/patreon',

  // Personal Routes (no Home prefix in breadcrumbs)
  PROFILE: '/profile',
  SETTINGS: '/settings',
} as const;

// Navigation
export interface NavItem {
  id: string;
  label: string;
  path: string;
  /** Icon key resolved by NavigationItem. */
  icon: string;
  allowedUserTypes: string[];
  /** Short description used by the command palette. */
  description?: string;
  /**
   * Custom active-state matcher. Without it an item is active on its path and
   * any nested path, with the most specific sibling winning.
   */
  isActive?: (pathname: string, searchParams: URLSearchParams) => boolean;
  children?: NavItem[];
}

export interface NavSection {
  id: string;
  label: string;
  allowedUserTypes: string[];
  items: NavItem[];
}

const isProjectGroupsLocation = (
  pathname: string,
  searchParams: URLSearchParams
): boolean =>
  (pathname === ROUTES.GROUPS &&
    searchParams.get('tab') === 'project-groups') ||
  pathname === ROUTES.PROJECT_GROUPS ||
  pathname.startsWith(`${ROUTES.PROJECT_GROUPS}/`);

/**
 * Sidebar information architecture. Every page is one click away; there is no
 * nested navigation. Item ids and icon keys are stable identifiers used by tests.
 */
export const NAVIGATION_SECTIONS: NavSection[] = [
  {
    id: 'overview',
    label: 'Workspace',
    allowedUserTypes: ['root', 'admin'],
    items: [
      {
        id: 'home',
        label: 'Overview',
        path: ROUTES.HOME,
        icon: 'dashboard',
        description: 'Platform totals, activity and health',
        allowedUserTypes: ['root', 'admin'],
      },
    ],
  },
  {
    id: 'access-management',
    label: 'Access management',
    allowedUserTypes: ['root', 'admin'],
    items: [
      {
        id: 'users',
        label: 'Users',
        path: ROUTES.USERS,
        icon: 'users',
        description: 'Accounts, user types and status',
        allowedUserTypes: ['root', 'admin'],
      },
      {
        id: 'user-groups',
        label: 'User groups',
        path: ROUTES.GROUPS,
        icon: 'users-group',
        description: 'Collections of users that receive access',
        allowedUserTypes: ['root', 'admin'],
        isActive: (pathname, searchParams) =>
          !isProjectGroupsLocation(pathname, searchParams) &&
          (pathname === ROUTES.GROUPS ||
            pathname.startsWith(`${ROUTES.GROUPS}/`)),
      },
      {
        id: 'projects',
        label: 'Projects',
        path: ROUTES.PROJECTS,
        icon: 'folder',
        description: 'Tenants that users sign in to',
        allowedUserTypes: ['root', 'admin'],
      },
      {
        id: 'project-groups',
        label: 'Project groups',
        path: `${ROUTES.GROUPS}?tab=project-groups`,
        icon: 'layers',
        description: 'Bundles of projects granted to user groups',
        allowedUserTypes: ['root', 'admin'],
        isActive: isProjectGroupsLocation,
      },
      {
        id: 'permissions',
        label: 'Roles & permissions',
        path: ROUTES.PERMISSIONS,
        icon: 'shield',
        description: 'Global roles, permission groups and assignments',
        allowedUserTypes: ['root', 'admin'],
        isActive: (pathname) =>
          pathname === ROUTES.PERMISSIONS ||
          pathname.startsWith(`${ROUTES.PERMISSIONS}/`) ||
          pathname === ROUTES.ROLES,
      },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    allowedUserTypes: ['root', 'admin'],
    items: [
      {
        id: 'tokens',
        label: 'API keys',
        path: ROUTES.TOKENS,
        icon: 'key',
        description: 'Project-scoped keys for server-to-server access',
        allowedUserTypes: ['root', 'admin'],
      },
      {
        id: 'audit',
        label: 'Audit log',
        path: ROUTES.AUDIT,
        icon: 'document',
        description: 'Activity, security events and request statistics',
        allowedUserTypes: ['root', 'admin'],
      },
      {
        id: 'billing',
        label: 'Billing',
        path: ROUTES.BILLING,
        icon: 'credit-card',
        description: 'Billing groups, catalog and Stripe accounts',
        allowedUserTypes: ['root', 'admin'],
      },
      {
        id: 'oauth',
        label: 'OAuth',
        path: ROUTES.OAUTH,
        icon: 'key-round',
        description: 'Sign-in providers and project bindings',
        allowedUserTypes: ['root', 'admin'],
      },
    ],
  },
  {
    id: 'system',
    label: 'System',
    allowedUserTypes: ['root'],
    items: [
      {
        id: 'system',
        label: 'System',
        path: ROUTES.SYSTEM,
        icon: 'settings',
        description: 'Service health, cache and integrations',
        allowedUserTypes: ['root'],
      },
      {
        id: 'email-templates',
        label: 'Email templates',
        path: ROUTES.EMAIL_TEMPLATES,
        icon: 'mail',
        description: 'Transactional email content',
        allowedUserTypes: ['root'],
      },
      {
        id: 'patreon',
        label: 'Patreon',
        path: ROUTES.PATREON,
        icon: 'heart-handshake',
        description: 'Patreon entitlements and sync',
        allowedUserTypes: ['root'],
      },
    ],
  },
];

/** Flat list of every navigation item, in sidebar order. */
export const NAVIGATION_ITEMS: NavItem[] = NAVIGATION_SECTIONS.flatMap(
  (section) => section.items
);
