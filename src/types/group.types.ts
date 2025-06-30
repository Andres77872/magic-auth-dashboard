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

export interface GroupDetailsResponse extends ApiResponse {
  user_group: UserGroup;
  members: any[];
  accessible_projects: any[];
  statistics: {
    total_members: number;
    total_projects: number;
  };
}

export interface GroupListResponse extends ApiResponse {
  user_groups: UserGroup[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    has_more: boolean;
  };
} 