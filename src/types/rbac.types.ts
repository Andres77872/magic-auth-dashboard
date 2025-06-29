import type { ApiResponse } from './api.types';

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

export interface CreatePermissionRequest {
  permission_name: string;
  category: string;
  description: string;
}

export interface CreatePermissionResponse extends ApiResponse {
  permission: Permission;
}

export interface AssignRoleRequest {
  role_id: number;
}

export interface AssignRoleResponse extends ApiResponse {
  assignment: UserRoleAssignment;
}

export interface UserPermissions {
  user: {
    user_hash: string;
    username: string;
  };
  project: {
    project_hash: string;
    project_name: string;
  };
  effective_permissions: Array<{
    permission_name: string;
    category: string;
    granted_through: string;
  }>;
  summary: {
    total_permissions: number;
    roles_count: number;
    access_level: string;
  };
}

export interface UserPermissionsResponse extends ApiResponse {
  user: {
    user_hash: string;
    username: string;
  };
  project: {
    project_hash: string;
    project_name: string;
  };
  effective_permissions: Array<{
    permission_name: string;
    category: string;
    granted_through: string;
  }>;
  summary: {
    total_permissions: number;
    roles_count: number;
    access_level: string;
  };
}

export interface PermissionCheck {
  permission_name: string;
  has_permission: boolean;
  granted_through: string;
  checked_at: string;
}

export interface PermissionCheckResponse extends ApiResponse {
  user: {
    user_hash: string;
    username: string;
  };
  project: {
    project_hash: string;
    project_name: string;
  };
  permission_check: PermissionCheck;
}

export interface ProjectPermissionsResponse extends ApiResponse {
  project: {
    project_hash: string;
    project_name: string;
  };
  permissions: Permission[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    has_more: boolean;
  };
} 