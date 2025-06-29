# Milestone 1.2: Core Types & Constants

## Overview
**Duration**: Day 3-4  
**Goal**: Define comprehensive TypeScript interfaces and application constants based on the API definition

## 📋 Tasks Checklist

### Step 1: Authentication Types
- [ ] User types and authentication interfaces
- [ ] Session and token management types
- [ ] Login/registration request/response types

### Step 2: API Response Types
- [ ] Generic API response interfaces
- [ ] Error handling types
- [ ] Pagination and filtering types

### Step 3: User Management Types
- [ ] User profile and management interfaces
- [ ] User type enumeration and constants
- [ ] User creation and update types

### Step 4: Project Management Types
- [ ] Project interfaces and enums
- [ ] Project assignment and access types
- [ ] Project-related API types

### Step 5: RBAC Types
- [ ] Role and permission interfaces
- [ ] RBAC assignment and relationship types
- [ ] Permission checking types

### Step 6: System Types
- [ ] System health and information types
- [ ] Admin management types
- [ ] Configuration and settings types

### Step 7: Constants & Utilities
- [ ] Route constants and navigation
- [ ] Permission and role constants
- [ ] API endpoint constants

---

## 🔧 Detailed Implementation Steps

### Step 1: Create Type Directories
```bash
# Create the types and utils directories
mkdir -p src/types
mkdir -p src/utils
```

### Step 2: Authentication Types

Create `src/types/auth.types.ts`:
```typescript
// User Type Enumeration
export enum UserType {
  ROOT = 'root',
  ADMIN = 'admin',
  CONSUMER = 'consumer',
}

// Authentication Interfaces
export interface LoginRequest {
  username: string;
  password: string;
  project_hash?: string; // Optional for dashboard admin login
}

export interface LoginResponse {
  success: boolean;
  message: string;
  session_token: string;
  user: User;
  project?: Project;
  accessible_projects: Project[];
  expires_at: string;
}

export interface User {
  user_hash: string;
  username: string;
  email: string;
  user_type: UserType;
  created_at: string;
  updated_at?: string;
}

export interface Project {
  project_hash: string;
  project_name: string;
  project_description?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  currentProject: Project | null;
  accessibleProjects: Project[];
  isLoading: boolean;
  error: string | null;
}

export enum AuthActionType {
  LOGIN_START = 'LOGIN_START',
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILURE = 'LOGIN_FAILURE',
  LOGOUT = 'LOGOUT',
  VALIDATE_TOKEN = 'VALIDATE_TOKEN',
  CLEAR_ERROR = 'CLEAR_ERROR',
}

export interface AuthAction {
  type: AuthActionType;
  payload?: any;
}
```

### Step 3: API Response Types

Create `src/types/api.types.ts`:
```typescript
// Generic API Response
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error_code?: string;
  detail?: ValidationError[];
}

export interface ValidationError {
  loc: string[];
  msg: string;
  type: string;
}

// Pagination
export interface PaginationParams {
  limit?: number;
  offset?: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PaginationResponse {
  limit: number;
  offset: number;
  total: number;
  has_more: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: PaginationResponse;
}

// HTTP Methods
export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
}

// Loading States
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export interface AsyncState<T> extends LoadingState {
  data: T | null;
}
```

### Step 4: User Management Types

Create `src/types/user.types.ts`:
```typescript
import { UserType, User } from './auth.types';
import { ApiResponse, PaginatedResponse } from './api.types';

export interface CreateRootUserRequest {
  username: string;
  password: string;
  email: string;
}

export interface CreateAdminUserRequest {
  username: string;
  password: string;
  email: string;
  assigned_project_ids: number[];
}

export interface UserFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  userType: UserType;
  assignedProjects?: string[];
}

export interface UserFormErrors {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  userType?: string;
  assignedProjects?: string;
}

export interface UserListParams {
  limit?: number;
  offset?: number;
  search?: string;
  user_type?: UserType;
  project_hash?: string;
  is_active?: boolean;
}

export interface UserListResponse extends PaginatedResponse<User> {
  user_access_level: UserType;
}
```

### Step 5: Project Management Types

Create `src/types/project.types.ts`:
```typescript
import { ApiResponse, PaginatedResponse } from './api.types';

export interface ProjectDetails {
  project_hash: string;
  project_name: string;
  project_description: string;
  created_at: string;
  updated_at?: string;
  member_count: number;
  group_count: number;
  admin_user?: string;
  is_active: boolean;
}

export interface CreateProjectRequest {
  project_name: string;
  project_description: string;
}

export interface ProjectFormData {
  project_name: string;
  project_description: string;
}

export interface ProjectListResponse extends PaginatedResponse<ProjectDetails> {
  user_access_level: string;
}
```

### Step 6: RBAC Types

Create `src/types/rbac.types.ts`:
```typescript
import { ApiResponse, PaginatedResponse } from './api.types';

export interface Permission {
  id: number;
  permission_name: string;
  category: string;
  description: string;
  created_at: string;
}

export interface Role {
  id: number;
  role_name: string;
  description: string;
  permissions: Permission[];
  created_at: string;
}

export interface UserRoleAssignment {
  user_hash: string;
  project_hash: string;
  role_id: number;
  role_name: string;
  assigned_at: string;
}

export interface PermissionCheckResponse extends ApiResponse {
  permission_check: {
    permission_name: string;
    has_permission: boolean;
    granted_through: string;
    checked_at: string;
  };
}
```

### Step 7: System Types

Create `src/types/system.types.ts`:
```typescript
import { ApiResponse } from './api.types';

export interface SystemInfo {
  version: string;
  environment: string;
  database_status: string;
  cache_status: string;
}

export interface SystemStatistics {
  total_users: number;
  total_projects: number;
  active_sessions: number;
  root_users: number;
  admin_users: number;
  consumer_users: number;
}

export interface SystemInfoResponse extends ApiResponse {
  system: SystemInfo;
  statistics: SystemStatistics;
  features: string[];
}

export interface HealthComponent {
  status: 'healthy' | 'warning' | 'error';
  response_time_ms?: number;
  additional_info?: string;
}

export interface SystemHealthResponse extends ApiResponse {
  status: string;
  timestamp: string;
  components: Record<string, HealthComponent>;
}
```

### Step 8: Group Types

Create `src/types/group.types.ts`:
```typescript
import { ApiResponse, PaginatedResponse } from './api.types';

export interface UserGroup {
  group_hash: string;
  group_name: string;
  description: string;
  member_count: number;
  created_at: string;
  updated_at?: string;
}

export interface CreateGroupRequest {
  group_name: string;
  description: string;
}

export interface GroupFormData {
  group_name: string;
  description: string;
}

export interface GroupListResponse extends PaginatedResponse<UserGroup> {}
```

### Step 9: Constants

Create `src/utils/constants.ts`:
```typescript
// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

// User Type Constants
export const USER_TYPES = {
  ROOT: 'root',
  ADMIN: 'admin', 
  CONSUMER: 'consumer',
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'magic_auth_token',
  USER_DATA: 'magic_auth_user',
  CURRENT_PROJECT: 'magic_auth_current_project',
  THEME_PREFERENCE: 'magic_auth_theme',
} as const;

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Validation Constants
export const VALIDATION = {
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 30,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  EMAIL_MAX_LENGTH: 254,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied. Insufficient permissions.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  INTERNAL_ERROR: 'An internal error occurred. Please try again later.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
} as const;
```

### Step 10: Routes

Create `src/utils/routes.ts`:
```typescript
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
  
  // RBAC Management
  PERMISSIONS: '/dashboard/permissions',
  PERMISSIONS_ROLES: '/dashboard/permissions/roles',
  PERMISSIONS_LIST: '/dashboard/permissions/permissions',
  PERMISSIONS_ASSIGNMENTS: '/dashboard/permissions/assignments',
  
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
    label: 'User Groups',
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
    id: 'system',
    label: 'System',
    path: ROUTES.SYSTEM,
    icon: 'settings',
    allowedUserTypes: ['root'],
  },
];
```

### Step 11: Permissions

Create `src/utils/permissions.ts`:
```typescript
import { UserType } from '@/types/auth.types';

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

// Permission Checker Utility
export function hasPermission(
  userType: UserType,
  permission: string
): boolean {
  if (userType === UserType.ROOT) {
    return true; // ROOT has all permissions
  }
  
  if (userType === UserType.ADMIN) {
    // ADMIN permissions (excluding system management)
    const adminPermissions = [
      PERMISSIONS.CREATE_USER,
      PERMISSIONS.READ_USER,
      PERMISSIONS.UPDATE_USER,
      PERMISSIONS.DELETE_USER,
      PERMISSIONS.READ_PROJECT,
      PERMISSIONS.UPDATE_PROJECT,
    ];
    return adminPermissions.includes(permission as any);
  }
  
  return false; // CONSUMER has no admin permissions
}

// Check if user can access route
export function canAccessRoute(
  userType: UserType,
  routePath: string
): boolean {
  if (userType === UserType.ROOT) {
    return true;
  }
  
  if (userType === UserType.ADMIN) {
    return !routePath.startsWith('/dashboard/system');
  }
  
  return false; // CONSUMER cannot access dashboard
}
```

### Step 12: Create Index Files

Create `src/types/index.ts`:
```typescript
// Export all types
export * from './auth.types';
export * from './api.types';
export * from './user.types';
export * from './project.types';
export * from './rbac.types';
export * from './system.types';
export * from './group.types';
```

Create `src/utils/index.ts`:
```typescript
// Export all utilities
export * from './constants';
export * from './routes';
export * from './permissions';
```

---

## 🧪 Testing & Verification

### Type Checking
```bash
# Run TypeScript compiler to check types
npm run type-check

# Should have no type errors
```

### Import Testing
Create a temporary test file:
```typescript
// src/test-imports.ts (temporary)
import { UserType, LoginRequest } from '@/types/auth.types';
import { ApiResponse } from '@/types/api.types';
import { ROUTES, PERMISSIONS } from '@/utils';

// This should compile without errors
const testUser: LoginRequest = {
  username: 'test',
  password: 'test',
};

console.log('Types working correctly');
```

---

## 📁 Files Created

### Type Definitions
- `src/types/auth.types.ts` - Authentication and user types
- `src/types/api.types.ts` - Generic API response types
- `src/types/user.types.ts` - User management types
- `src/types/project.types.ts` - Project management types
- `src/types/rbac.types.ts` - RBAC and permission types
- `src/types/system.types.ts` - System information types
- `src/types/group.types.ts` - User group management types
- `src/types/index.ts` - Export all types

### Constants & Utilities
- `src/utils/constants.ts` - Application constants
- `src/utils/routes.ts` - Route constants and navigation
- `src/utils/permissions.ts` - Permission checking utilities
- `src/utils/index.ts` - Export all utilities

---

## ✅ Completion Criteria

- [ ] All TypeScript interfaces defined based on API definition
- [ ] No TypeScript compilation errors
- [ ] All constants and enums properly defined
- [ ] Route and navigation structure defined
- [ ] Permission system structure defined
- [ ] Imports working correctly with path mapping
- [ ] Type safety enforced throughout

## 🚀 Next Steps
Proceed to [Milestone 1.3: API Service Layer](../1.3-api-services/README.md) 