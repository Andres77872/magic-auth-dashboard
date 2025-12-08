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
  globalRoleHash?: string;
}

export interface UserFormErrors {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  userType?: string;
  assignedProjects?: string;
  assignedGroup?: string;
  globalRoleHash?: string;
}

export interface UserListParams {
  limit?: number;
  offset?: number;
  search?: string;
  user_type_filter?: UserType;
  group_filter?: string;
  project_filter?: string;
  include_inactive?: boolean;
  include_group_info?: boolean;
  include_project_access?: boolean;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface UserSearchParams {
  q: string;
  limit?: number;
  user_type_filter?: UserType;
}

export interface UserSearchResponse extends ApiResponse {
  users: User[];
  search_term: string;
  total_results: number;
  filters: {
    user_type_filter: string | null;
    limit: number;
  };
}

export interface UpdateUserStatusResponse extends ApiResponse {
  user_hash: string;
  is_active: boolean;
}

export interface ResetPasswordResponse extends ApiResponse {
  user: {
    user_hash: string;
    username: string;
    email: string;
  };
  reset_data: {
    temporary_password: string;
    expires_at: string;
    must_change_on_login: boolean;
  };
  instructions: string;
}

export interface DeleteUserResponse extends ApiResponse {
  user_hash: string;
  username: string;
  deleted_at: string;
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

// Admin project assignment types
export interface AdminAssignedProject {
  project_id: string;
  project_hash: string;
  project_name: string;
  project_description?: string;
  assigned_at?: string;
  assigned_by?: string;
}

export interface AdminProjectsResponse extends ApiResponse {
  user_hash: string;
  assigned_projects: AdminAssignedProject[];
} 