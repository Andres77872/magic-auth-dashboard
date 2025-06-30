import { apiClient } from './api.client';
import type { Permission, CreatePermissionRequest, ProjectPermissionsResponse } from '@/types/rbac.types';
import type { ApiResponse, PaginationParams } from '@/types/api.types';

export interface PermissionListParams extends PaginationParams {
  category?: string;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PermissionUpdateData {
  permission_name?: string;
  category?: string;
  description?: string;
}

class PermissionService {
  async getPermissions(
    projectHash: string,
    params: PermissionListParams = {}
  ): Promise<ProjectPermissionsResponse> {
    // Filter out undefined values from params
    const cleanParams: Record<string, any> = {};
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && (typeof value !== 'string' || value !== '')) {
        cleanParams[key] = value;
      }
    });
    
    const response = await apiClient.get<ProjectPermissionsResponse>(
      `/rbac/projects/${projectHash}/permissions`,
      cleanParams
    );
    return response as ProjectPermissionsResponse;
  }

  async createPermission(
    projectHash: string,
    permissionData: CreatePermissionRequest
  ): Promise<ApiResponse<Permission>> {
    return await apiClient.post<Permission>(
      `/rbac/projects/${projectHash}/permissions`,
      permissionData
    );
  }

  async updatePermission(
    projectHash: string,
    permissionId: number,
    data: PermissionUpdateData
  ): Promise<ApiResponse<Permission>> {
    return await apiClient.put<Permission>(
      `/rbac/projects/${projectHash}/permissions/${permissionId}`,
      data
    );
  }

  async deletePermission(
    projectHash: string,
    permissionId: number
  ): Promise<ApiResponse<void>> {
    return await apiClient.delete<void>(
      `/rbac/projects/${projectHash}/permissions/${permissionId}`
    );
  }

  async getPermissionsByCategory(
    projectHash: string,
    category: string
  ): Promise<ApiResponse<Permission[]>> {
    return await apiClient.get<Permission[]>(
      `/rbac/projects/${projectHash}/permissions`,
      { category }
    );
  }

  async getPermissionCategories(
    projectHash: string
  ): Promise<ApiResponse<string[]>> {
    return await apiClient.get<string[]>(
      `/rbac/projects/${projectHash}/permissions/categories`
    );
  }

  async getPermissionUsage(
    projectHash: string,
    permissionId: number
  ): Promise<ApiResponse<{ role_count: number; roles: any[] }>> {
    return await apiClient.get<{ role_count: number; roles: any[] }>(
      `/rbac/projects/${projectHash}/permissions/${permissionId}/usage`
    );
  }
}

export const permissionService = new PermissionService();
export default permissionService; 