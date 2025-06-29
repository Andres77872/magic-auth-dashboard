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