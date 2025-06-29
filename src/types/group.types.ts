import type { ApiResponse, PaginatedResponse } from './api.types';

export interface UserGroup {
  group_hash: string;
  group_name: string;
  description: string;
  member_count: number;
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

export interface GroupListResponse extends ApiResponse {
  user_groups: UserGroup[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    has_more: boolean;
  };
} 