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
  group_name: string; // API uses group_name instead of role_name
  priority: number;
  description: string;
  created_at: string;
  is_active: boolean;
  permissions?: Permission[]; // Optional since it might not always be included
}

// For API compatibility, we can also create a role name getter
export interface RoleDisplayData extends Role {
  role_name: string; // For backward compatibility in components
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

export interface ProjectRolesResponse extends ApiResponse {
  project: {
    project_hash: string;
    project_name: string;
    project_description: string | null;
    created_at: string | null;
  };
  roles: Role[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    has_more: boolean | null;
  };
}

// New types for Milestone 8.2: User-Role Assignment & Permission Matrix

export interface UserRoleAssignmentRequest {
  user_hash: string;
  role_id: number;
  reason?: string;
}

export interface BulkAssignmentRequest {
  assignments: UserRoleAssignmentRequest[];
  dry_run?: boolean;
}

export interface BulkAssignmentResult {
  success_count: number;
  error_count: number;
  errors: Array<{
    user_hash: string;
    role_id: number;
    error: string;
  }>;
  assignments: UserRoleAssignment[];
}

export interface EffectivePermission {
  permission_name: string;
  category: string;
  granted_through: 'direct' | 'role' | 'group';
  source_name: string;
  source_id: string;
}

export interface UserEffectivePermissions {
  user_hash: string;
  username: string;
  permissions: EffectivePermission[];
  roles: Array<{
    role_id: number;
    role_name: string;
    assigned_at: string;
    permissions: Permission[];
  }>;
  conflicts: PermissionConflict[];
}

export interface PermissionConflict {
  permission_name: string;
  conflicting_sources: Array<{
    source_type: 'role' | 'group';
    source_name: string;
    grants: boolean;
  }>;
  resolution: 'allow' | 'deny' | 'requires_manual_review';
  severity: 'low' | 'medium' | 'high';
}

export interface PermissionMatrix {
  users: Array<{
    user_hash: string;
    username: string;
    email: string;
  }>;
  permissions: Permission[];
  matrix: Record<string, Record<string, {
    has_permission: boolean;
    source: 'direct' | 'role' | 'group';
    source_name: string;
  }>>;
}

export interface AssignmentTemplate {
  id: string;
  name: string;
  description: string;
  role_ids: number[];
  target_criteria: {
    user_type?: string;
    department?: string;
    custom_filters?: Record<string, any>;
  };
}

export interface AssignmentHistory {
  id: number;
  user_hash: string;
  username: string;
  project_hash: string;
  action: 'assigned' | 'removed' | 'modified';
  role_id: number;
  role_name: string;
  reason?: string;
  performed_by: string;
  performed_at: string;
  details: Record<string, any>;
}

export interface ConflictResolution {
  conflict_id: string;
  permission_name: string;
  resolution_type: 'auto_allow' | 'auto_deny' | 'manual_review';
  applied_at?: string;
  applied_by?: string;
  notes?: string;
}

export interface RoleRecommendation {
  user_hash: string;
  recommended_roles: Array<{
    role_id: number;
    role_name: string;
    confidence_score: number;
    reasoning: string[];
  }>;
  similar_users: Array<{
    user_hash: string;
    username: string;
    similarity_score: number;
    common_roles: string[];
  }>;
}

export interface AssignmentValidationResult {
  is_valid: boolean;
  conflicts: PermissionConflict[];
  warnings: string[];
  recommendations: string[];
}

export interface UserSelectOption {
  user_hash: string;
  username: string;
  email: string;
  user_type: string;
  current_roles: string[];
  department?: string;
  last_active?: string;
} 