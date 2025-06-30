import type { ApiResponse, PaginatedResponse } from './api.types';

export interface ProjectDetails {
  project_hash: string;
  project_name: string;
  project_description: string;
  created_at: string;
  updated_at?: string;
  member_count?: number;
  group_count?: number;
  admin_user?: string;
  is_active?: boolean;
  access_level?: string;
  access_through?: string;
}

export interface ProjectStatistics {
  total_users: number;
  active_sessions: number;
  total_groups: number;
  group_distribution: Record<string, any>;
}

export interface UserAccess {
  permissions: string[];
  access_level: string;
  user_groups: any[];
}

export interface ProjectDetailsResponse extends ApiResponse {
  project: {
    project_hash: string;
    project_name: string;
    project_description: string;
    created_at: string;
    updated_at?: string;
  };
  user_access: UserAccess;
  statistics: ProjectStatistics;
}

export interface CreateProjectRequest {
  project_name: string;
  project_description: string;
}

export interface CreateProjectResponse extends ApiResponse {
  project: {
    project_hash: string;
    project_name: string;
    project_description: string;
    created_at: string;
  };
}

export interface ProjectFormData {
  project_name: string;
  project_description: string;
}

export interface ProjectFormErrors {
  project_name?: string;
  project_description?: string;
}

export interface ProjectListParams {
  limit?: number;
  offset?: number;
  search?: string;
}

export interface ProjectListResponse extends PaginatedResponse<ProjectDetails> {
  projects: ProjectDetails[];
  user_access_level: string;
}

// Project Member interfaces
export interface ProjectMember {
  user_hash: string;
  username: string;
  email: string;
  user_type: string;
  is_active: number;
  permissions: string[];
  groups: any[];
  access_level: string;
  joined_at?: string | null;
  granted_by?: string | null;
  created_at: string;
}

export interface ProjectMembersResponse extends ApiResponse {
  project: {
    project_hash: string;
    project_name: string;
    project_description: string;
    created_at: string | null;
  };
  members: ProjectMember[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    has_more: boolean;
  };
  statistics: {
    total_members: number;
    root_users: number;
    admin_users: number;
    consumer_users: number;
    active_members: number;
  };
} 