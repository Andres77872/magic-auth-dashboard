import { apiClient } from './api.client';
import type {
  ProjectDetails,
  CreateProjectRequest,
  CreateProjectResponse,
  ProjectListParams,
  ProjectListResponse,
  ProjectDetailsResponse,
  ProjectMembersResponse,
  ProjectGroupsResponse
} from '@/types/project.types';
import type { ApiResponse, PaginationParams } from '@/types/api.types';

class ProjectService {
  // List projects
  async getProjects(params: ProjectListParams = {}): Promise<ProjectListResponse> {
    // Filter out undefined values from params
    const cleanParams: Record<string, any> = {};
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && (typeof value !== 'string' || value !== '')) {
        cleanParams[key] = value;
      }
    });
    
    const response = await apiClient.get<ProjectListResponse>('/projects', cleanParams);
    return response as ProjectListResponse;
  }

  // Get project details
  async getProject(projectHash: string): Promise<ProjectDetailsResponse> {
    const response = await apiClient.get<any>(`/projects/${projectHash}`);
    return response as ProjectDetailsResponse;
  }

  // Create new project - uses form data per API spec
  async createProject(projectData: CreateProjectRequest): Promise<CreateProjectResponse> {
    const response = await apiClient.postForm<CreateProjectResponse>('/projects', projectData);
    return response as CreateProjectResponse;
  }

  // Update project - uses form data per API spec
  async updateProject(projectHash: string, data: Partial<CreateProjectRequest>): Promise<CreateProjectResponse> {
    const response = await apiClient.putForm<CreateProjectResponse>(`/projects/${projectHash}`, data);
    return response as CreateProjectResponse;
  }

  // Delete project
  async deleteProject(projectHash: string): Promise<ApiResponse<void>> {
    return await apiClient.delete<void>(`/projects/${projectHash}`);
  }

  // Get project members
  async getProjectMembers(
    projectHash: string, 
    params: PaginationParams = {}
  ): Promise<ProjectMembersResponse> {
    // Filter out undefined values from params
    const cleanParams: Record<string, any> = {};
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && (typeof value !== 'string' || value !== '')) {
        cleanParams[key] = value;
      }
    });
    
    const response = await apiClient.get<ProjectMembersResponse>(`/projects/${projectHash}/members`, cleanParams);
    return response as ProjectMembersResponse;
  }

  // NOTE: Users gain project access through the Groups-of-Groups architecture:
  // User -> User Group -> Project Group -> Project
  // Access is managed via:
  // 1. POST /admin/project-groups/{hash}/projects - Add project to project group
  // 2. POST /admin/user-groups/{hash}/project-groups - Grant user group access to project group
  // Individual user membership is read-only - manage via group assignments.

  // Get project activity
  async getProjectActivity(
    projectHash: string,
    params: PaginationParams = {}
  ): Promise<ApiResponse<any[]>> {
    // Filter out undefined values from params
    const cleanParams: Record<string, any> = {};
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && (typeof value !== 'string' || value !== '')) {
        cleanParams[key] = value;
      }
    });
    
    return await apiClient.get<any[]>(`/projects/${projectHash}/activity`, cleanParams);
  }

  // Get project statistics
  async getProjectStats(projectHash: string): Promise<ApiResponse<any>> {
    return await apiClient.get<any>(`/projects/${projectHash}/stats`);
  }

  // Transfer project ownership - uses PUT per API spec
  async transferOwnership(
    projectHash: string, 
    newOwnerHash: string
  ): Promise<ApiResponse<void>> {
    return await apiClient.putForm<void>(`/projects/${projectHash}/owner`, { 
      new_owner_hash: newOwnerHash 
    });
  }

  // Archive/Unarchive project - uses POST per API spec
  async toggleProjectArchive(
    projectHash: string, 
    archived: boolean
  ): Promise<ApiResponse<ProjectDetails>> {
    return await apiClient.postForm<ProjectDetails>(`/projects/${projectHash}/archive`, { archived });
  }

  // Get user groups with access to project (via project groups)
  // GET /projects/{hash}/groups
  async getProjectGroups(
    projectHash: string, 
    params: PaginationParams = {}
  ): Promise<ProjectGroupsResponse> {
    // Filter out undefined values from params
    const cleanParams: Record<string, any> = {};
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && (typeof value !== 'string' || value !== '')) {
        cleanParams[key] = value;
      }
    });
    
    const response = await apiClient.get<ProjectGroupsResponse>(`/projects/${projectHash}/groups`, cleanParams);
    return response as ProjectGroupsResponse;
  }
}

export const projectService = new ProjectService();
export default projectService; 