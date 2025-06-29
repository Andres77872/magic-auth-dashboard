import { apiClient } from './api.client';
import type {
  ProjectDetails,
  CreateProjectRequest,
  CreateProjectResponse,
  ProjectListParams,
  ProjectListResponse
} from '@/types/project.types';
import type { ApiResponse, PaginationParams } from '@/types/api.types';

class ProjectService {
  // List projects
  async getProjects(params: ProjectListParams = {}): Promise<ProjectListResponse> {
    const response = await apiClient.get<ProjectListResponse>('/projects', params as any);
    return response as ProjectListResponse;
  }

  // Get project details
  async getProject(projectHash: string): Promise<ApiResponse<ProjectDetails>> {
    return await apiClient.get<ProjectDetails>(`/projects/${projectHash}`);
  }

  // Create new project
  async createProject(projectData: CreateProjectRequest): Promise<CreateProjectResponse> {
    const response = await apiClient.post<CreateProjectResponse>('/projects', projectData);
    return response as CreateProjectResponse;
  }

  // Update project
  async updateProject(projectHash: string, data: Partial<CreateProjectRequest>): Promise<CreateProjectResponse> {
    const response = await apiClient.put<CreateProjectResponse>(`/projects/${projectHash}`, data);
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
  ): Promise<ApiResponse<any[]>> {
    return await apiClient.get<any[]>(`/projects/${projectHash}/members`, params as any);
  }

  // Add member to project
  async addProjectMember(
    projectHash: string, 
    userHash: string
  ): Promise<ApiResponse<void>> {
    return await apiClient.post<void>(`/projects/${projectHash}/members`, { user_hash: userHash });
  }

  // Remove member from project
  async removeProjectMember(
    projectHash: string, 
    userHash: string
  ): Promise<ApiResponse<void>> {
    return await apiClient.delete<void>(`/projects/${projectHash}/members/${userHash}`);
  }

  // Get project activity
  async getProjectActivity(
    projectHash: string,
    params: PaginationParams = {}
  ): Promise<ApiResponse<any[]>> {
    return await apiClient.get<any[]>(`/projects/${projectHash}/activity`, params as any);
  }

  // Get project statistics
  async getProjectStats(projectHash: string): Promise<ApiResponse<any>> {
    return await apiClient.get<any>(`/projects/${projectHash}/stats`);
  }

  // Transfer project ownership
  async transferOwnership(
    projectHash: string, 
    newOwnerHash: string
  ): Promise<ApiResponse<void>> {
    return await apiClient.patch<void>(`/projects/${projectHash}/owner`, { 
      new_owner_hash: newOwnerHash 
    });
  }

  // Archive/Unarchive project
  async toggleProjectArchive(
    projectHash: string, 
    archived: boolean
  ): Promise<ApiResponse<ProjectDetails>> {
    return await apiClient.patch<ProjectDetails>(`/projects/${projectHash}/archive`, { archived });
  }
}

export const projectService = new ProjectService();
export default projectService; 