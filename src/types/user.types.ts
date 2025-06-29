import type { UserType, User } from './auth.types';
import type { ApiResponse, PaginatedResponse } from './api.types';

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

export interface CreateRootUserResponse extends ApiResponse {
  user: User;
}

export interface CreateAdminUserResponse extends ApiResponse {
  user: User & {
    assigned_projects: Array<{
      project_id: number;
      project_name: string;
    }>;
  };
}

export interface UserProfile {
  user: User;
  accessible_projects: Array<{
    project_hash: string;
    project_name: string;
    project_description?: string;
  }>;
  current_project?: {
    project_hash: string;
    project_name: string;
  };
}

export interface UserProfileResponse extends ApiResponse {
  user: User;
  accessible_projects: Array<{
    project_hash: string;
    project_name: string;
    project_description?: string;
  }>;
  current_project?: {
    project_hash: string;
    project_name: string;
  };
}

export interface UpdateProfileRequest {
  username?: string;
  email?: string;
}

export interface UpdateProfileResponse extends ApiResponse {
  user: User;
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

export interface AdminUserListResponse extends PaginatedResponse<User> {
  users: User[];
}

export interface UserListResponse extends PaginatedResponse<User> {
  user_access_level: UserType;
} 