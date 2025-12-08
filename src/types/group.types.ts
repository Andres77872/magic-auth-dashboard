import type { ApiResponse } from './api.types';

export interface UserGroup {
  group_hash: string;
  group_name: string;
  description: string;
  member_count: number | null;
  created_at: string;
  updated_at?: string;
}

export interface CreateGroupRequest {
  group_name: string;
  description: string;
}

export interface CreateGroupResponse extends ApiResponse {
  user_group: UserGroup;
}

export interface AssignUserToGroupRequest {
  user_hash: string;
}

export interface AssignUserToGroupResponse extends ApiResponse {
  assignment: {
    user_hash: string;
    group_hash: string;
    assigned_at: string;
  };
}

export interface GroupFormData {
  group_name: string;
  description: string;
}

export interface GroupFormErrors {
  group_name?: string;
  description?: string;
}

export interface GroupListParams {
  limit?: number;
  offset?: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface GroupMember {
  user_hash: string;
  username: string;
  email: string;
  user_type?: string;
  is_active?: boolean;
  joined_at?: string;
}

export interface ProjectGroupAccess {
  group_hash: string;
  group_name: string;
  project_count: number;
}

export interface GroupDetailsResponse extends ApiResponse {
  user_group: UserGroup;
  members: GroupMember[];
  accessible_projects: any[];
  accessible_project_groups: ProjectGroupAccess[];
  statistics: {
    total_members: number;
    total_projects: number;
    total_project_groups: number;
    total_derived_projects: number;
  };
}

export interface GroupListResponse extends ApiResponse {
  user_groups: UserGroup[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    has_more?: boolean;
  };
}

// User's groups response
export interface UserGroupsResponse extends ApiResponse {
  user: {
    user_hash: string;
    username: string;
    email: string;
    user_type: string;
  };
  groups: Array<{
    group_hash: string;
    group_name: string;
    description: string;
    joined_at: string;
  }>;
  statistics: {
    total_groups: number;
  };
}

// Project group types
export interface ProjectGroup {
  group_hash: string;
  group_name: string;
  description: string;
  project_count: number;
  created_at: string;
}

export interface ProjectGroupListResponse extends ApiResponse {
  project_groups: ProjectGroup[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

export interface ProjectGroupDetailsResponse extends ApiResponse {
  project_group: ProjectGroup;
  assigned_projects: Array<{
    project_hash: string;
    project_name: string;
    project_description?: string;
  }>;
  statistics: {
    total_projects: number;
  };
} 