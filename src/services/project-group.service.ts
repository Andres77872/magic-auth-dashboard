import { apiClient } from './api.client';
import type { ApiResponse, PaginationParams } from '@/types/api.types';

export interface ProjectGroup {
  group_hash: string;
  group_name: string;
  description: string;
  project_count: number;
  created_at: string;
  updated_at?: string;
}

export interface CreateProjectGroupRequest {
  group_name: string;
  description?: string;
}

export interface CreateProjectGroupResponse extends ApiResponse {
  project_group: ProjectGroup;
}

export interface ProjectGroupListResponse extends ApiResponse {
  project_groups: ProjectGroup[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    has_more: boolean;
  };
}

export interface AssignedProject {
  project_hash: string;
  project_name: string;
  project_description?: string;
}

export interface ProjectGroupDetailsResponse extends ApiResponse {
  project_group: ProjectGroup;
  assigned_projects: AssignedProject[];
  statistics: {
    total_projects: number;
  };
}

class ProjectGroupService {
  // List project groups
  async getProjectGroups(params: PaginationParams = {}): Promise<ProjectGroupListResponse> {
    const cleanParams: Record<string, any> = {};
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && (typeof value !== 'string' || value !== '')) {
        cleanParams[key] = value;
      }
    });
    
    const response = await apiClient.get<ProjectGroupListResponse>('/admin/project-groups', cleanParams);
    return response as ProjectGroupListResponse;
  }

  // Get project group details
  async getProjectGroup(groupHash: string): Promise<ProjectGroupDetailsResponse> {
    const response = await apiClient.get<ProjectGroupDetailsResponse>(`/admin/project-groups/${groupHash}`);
    return response as ProjectGroupDetailsResponse;
  }

  // Create new project group - uses form data per API spec
  async createProjectGroup(groupData: CreateProjectGroupRequest): Promise<CreateProjectGroupResponse> {
    const response = await apiClient.postForm<CreateProjectGroupResponse>('/admin/project-groups', groupData);
    return response as CreateProjectGroupResponse;
  }

  // Update project group - uses form data per API spec
  async updateProjectGroup(groupHash: string, data: Partial<CreateProjectGroupRequest>): Promise<CreateProjectGroupResponse> {
    const response = await apiClient.putForm<CreateProjectGroupResponse>(`/admin/project-groups/${groupHash}`, data);
    return response as CreateProjectGroupResponse;
  }

  // Delete project group
  async deleteProjectGroup(groupHash: string): Promise<ApiResponse<void>> {
    return await apiClient.delete<void>(`/admin/project-groups/${groupHash}`);
  }

  // Assign project to a project group - uses form data per API spec
  async assignProjectToGroup(
    groupHash: string,
    projectHash: string
  ): Promise<ApiResponse<void>> {
    return await apiClient.postForm<void>(
      `/admin/project-groups/${groupHash}/projects`,
      { project_hash: projectHash }
    );
  }

  // Remove project from a project group
  async removeProjectFromGroup(
    groupHash: string,
    projectHash: string
  ): Promise<ApiResponse<void>> {
    return await apiClient.delete<void>(
      `/admin/project-groups/${groupHash}/projects/${projectHash}`
    );
  }

  // Get projects assigned to a project group
  async getGroupProjects(
    groupHash: string,
    params: PaginationParams = {}
  ): Promise<ApiResponse<any[]>> {
    const cleanParams: Record<string, any> = {};
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && (typeof value !== 'string' || value !== '')) {
        cleanParams[key] = value;
      }
    });
    
    return await apiClient.get<any[]>(
      `/admin/project-groups/${groupHash}/projects`, 
      cleanParams
    );
  }
}

export const projectGroupService = new ProjectGroupService();
export default projectGroupService; 