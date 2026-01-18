// User Type Enumeration
export const UserType = {
  ROOT: 'root',
  ADMIN: 'admin',
  CONSUMER: 'consumer',
} as const;

export type UserType = typeof UserType[keyof typeof UserType];

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

export interface RegisterRequest {
  username: string;
  password: string;
  user_group_hash: string;
  email?: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  user: User;
  project: Project;
}

// User Type Info for enhanced user details - Updated to handle full API response
export interface UserTypeInfo {
  user_id?: string;
  user_hash?: string;
  username?: string;
  user_type: UserType | null;
  capabilities?: string[];
  accessible_projects?: string[];
  user_groups?: string[];
  error?: string; // Handle database errors like missing tables
}

// User Group assignment information
export interface UserGroupAssignment {
  group_hash: string;
  group_name: string;
  group_description: string;
  assigned_at: string;
  assigned_by: string;
  projects_count: number;
}

// User Project access information
export interface UserProjectAccess {
  project_hash: string;
  project_name: string;
  project_description: string;
  effective_permissions: string[];
  access_groups: {
    group_hash: string;
    group_name: string;
    permissions: string[];
  }[];
}

// User Statistics
export interface UserStatistics {
  total_groups: number;
  total_accessible_projects: number;
  total_permissions: number;
  account_age_days: number;
}

// Enhanced User interface to match API response
export interface User {
  user_hash: string;
  username: string;
  email: string;
  user_type: UserType;
  user_type_info?: UserTypeInfo;
  created_at: string;
  updated_at?: string | null;
  last_login?: string | null;
  is_active: boolean;
  groups?: UserGroupAssignment[];
  projects?: UserProjectAccess[];
}

// User Profile Response Interface - Updated to match actual API response
export interface UserProfileResponse {
  success: boolean;
  message: string | null;
  user: User;
  permissions: string[];
  groups: any[]; // Legacy field, usually empty
  accessible_projects: any[]; // Legacy field, usually empty
  statistics: UserStatistics | null;
}

export interface Project {
  project_hash: string;
  project_name: string;
  project_description?: string;
}

export interface ValidationResponse {
  success: boolean;
  message: string;
  valid: boolean;
  user: User;
  project?: Project;
  session: {
    session_id: string;
    expires_at: string;
  };
}

export interface AvailabilityRequest {
  username?: string;
  email?: string;
}

export interface AvailabilityResponse {
  success: boolean;
  message: string;
  username_available?: boolean | null;
  email_available?: boolean | null;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  currentProject: Project | null;
  accessibleProjects: Project[];
  isLoading: boolean;
  error: string | null;
  // RBAC Integration
  effectivePermissions: string[]; // List of permission names user has through roles
  permissionsLoading: boolean;
}

export const AuthActionType = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  VALIDATE_TOKEN: 'VALIDATE_TOKEN',
  CLEAR_ERROR: 'CLEAR_ERROR',
  LOAD_PERMISSIONS_START: 'LOAD_PERMISSIONS_START',
  LOAD_PERMISSIONS_SUCCESS: 'LOAD_PERMISSIONS_SUCCESS',
  LOAD_PERMISSIONS_FAILURE: 'LOAD_PERMISSIONS_FAILURE',
} as const;

export type AuthActionType = typeof AuthActionType[keyof typeof AuthActionType];

export type AuthAction = 
  | { type: typeof AuthActionType.LOGIN_START }
  | { type: typeof AuthActionType.LOGIN_SUCCESS; payload: LoginResponse }
  | { type: typeof AuthActionType.LOGIN_FAILURE; payload: { error: string } }
  | { type: typeof AuthActionType.LOGOUT }
  | { type: typeof AuthActionType.VALIDATE_TOKEN; payload: { valid: boolean; user?: User; project?: Project } }
  | { type: typeof AuthActionType.CLEAR_ERROR }
  | { type: typeof AuthActionType.LOAD_PERMISSIONS_START }
  | { type: typeof AuthActionType.LOAD_PERMISSIONS_SUCCESS; payload: { permissions: string[] } }
  | { type: typeof AuthActionType.LOAD_PERMISSIONS_FAILURE; payload: { error: string } }; 