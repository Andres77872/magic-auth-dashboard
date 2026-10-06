// User Type Enumeration
export const UserType = {
  ROOT: 'root',
  ADMIN: 'admin',
  CONSUMER: 'consumer',
} as const;

export type UserType = (typeof UserType)[keyof typeof UserType];

// Authentication Interfaces

/** Platform sign-in creates the root/admin dashboard's cookie session. */
export interface PlatformLoginRequest {
  username: string;
  password: string;
  remember_me?: boolean;
}

/** Identity returned by login and validation; directory fields are fetched separately. */
export interface UserIdentity {
  user_hash: string;
  username: string;
  email: string | null;
  user_type: UserType | null;
  created_at?: string | null;
  updated_at?: string | null;
}

/** Current token-pair response from platform login and cookie refresh. */
export interface SessionResponse {
  success: boolean;
  message?: string | null;
  access_token?: string | null;
  refresh_token?: string | null;
  token_type?: string;
  expires_in?: number | null;
  refresh_expires_in?: number | null;
  remember_me: boolean;
  user?: UserIdentity | null;
  expires_at?: string | null;
  refresh_expires_at?: string | null;
}

export interface UserTypeInfo {
  user_id: string;
  user_hash: string;
  username: string;
  user_type: UserType;
  capabilities: string[];
  assigned_projects?: UserProjectAccess[] | null;
  total_assigned_projects?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
}

/** A user's group membership (`groups` on `/users/list` and `/users/{hash}`). */
export interface UserGroupAssignment {
  group_hash: string;
  group_name: string;
  group_description?: string | null;
  assigned_at?: string | null;
  assigned_by?: string | null;
  /** Present with `include_group_hierarchy=true`. */
  projects_count?: number;
}

/**
 * A project the user can reach. `/users/list` sends `project_group` and
 * `permissions`; `/users/{hash}` sends `project_description` and, with
 * `include_permission_details=true`, `effective_permissions`/`access_groups`.
 */
export interface UserProjectAccess {
  project_hash: string;
  project_name: string;
  project_description?: string | null;
  project_group?: string | null;
  permissions?: string[];
  effective_permissions?: string[];
  access_groups?: {
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
  /** Primary verified email; `null` for accounts without one. */
  email: string | null;
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
  groups: string[];
  accessible_projects: Project[];
  statistics: UserStatistics | null;
}

export interface Project {
  project_hash: string;
  project_name: string;
  project_description?: string;
}

export interface ValidationResponse {
  success: boolean;
  message?: string | null;
  valid: boolean;
  auth_method?: string;
  user?: UserIdentity | null;
  session?: {
    created_at?: string | null;
    expires_at?: string;
    refresh_expires_at?: string;
    remember_me?: boolean;
    scope?: string;
  } | null;
}

export interface AvailabilityResponse {
  success: boolean;
  message: string;
  username_available?: boolean | null;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: UserIdentity | null;
  isLoading: boolean;
  error: string | null;
  // Session expiry tracking
  sessionExpiresAt: string | null; // ISO 8601 from SessionResponse.expires_at
  refreshExpiresAt: string | null; // ISO 8601 from SessionResponse.refresh_expires_at
  rememberMe: boolean;
}

export const AuthActionType = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  SESSION_VALIDATED: 'SESSION_VALIDATED',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SESSION_EXPIRY_UPDATE: 'SESSION_EXPIRY_UPDATE',
} as const;

export type AuthActionType =
  (typeof AuthActionType)[keyof typeof AuthActionType];

export type AuthAction =
  | { type: typeof AuthActionType.LOGIN_START }
  | { type: typeof AuthActionType.LOGIN_SUCCESS; payload: SessionResponse }
  | { type: typeof AuthActionType.LOGIN_FAILURE; payload: { error: string } }
  | { type: typeof AuthActionType.LOGOUT }
  | {
      type: typeof AuthActionType.SESSION_VALIDATED;
      payload: {
        valid: boolean;
        user?: UserIdentity | null;
        expires_at?: string;
        refresh_expires_at?: string;
        remember_me?: boolean;
      };
    }
  | { type: typeof AuthActionType.CLEAR_ERROR }
  | {
      type: typeof AuthActionType.SESSION_EXPIRY_UPDATE;
      payload: {
        expires_at: string;
        refresh_expires_at?: string;
        remember_me?: boolean;
      };
    };
