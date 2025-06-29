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
  email: string;
  project_hash: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  user: User;
  project: Project;
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
  username_available?: boolean;
  email_available?: boolean;
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

export const AuthActionType = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  VALIDATE_TOKEN: 'VALIDATE_TOKEN',
  CLEAR_ERROR: 'CLEAR_ERROR',
} as const;

export type AuthActionType = typeof AuthActionType[keyof typeof AuthActionType];

export interface AuthAction {
  type: AuthActionType;
  payload?: any;
} 