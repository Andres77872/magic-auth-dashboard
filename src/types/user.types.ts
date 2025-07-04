import type { UserType, User } from './auth.types';
import type { ApiResponse, PaginationResponse } from './api.types';

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

export interface UserProfileExtendedResponse extends ApiResponse {
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
  assignedGroup?: string;
}

export interface UserFormErrors {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  userType?: string;
  assignedProjects?: string;
  assignedGroup?: string;
}

export interface UserListParams {
  limit?: number;
  offset?: number;
  search?: string;
  user_type?: UserType;
  project_hash?: string;
  is_active?: boolean;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface AdminUserListResponse extends ApiResponse {
  users: User[];
  pagination: PaginationResponse;
}

export interface UserListResponse extends ApiResponse {
  users: User[];
  pagination: PaginationResponse;
  filters?: {
    user_type?: string | null;
    search?: string | null;
    is_active?: boolean | null;
  };
  user_access_level?: UserType;
} 