import { apiClient } from './api.client';
import type { Role, ProjectRolesResponse } from '@/types/rbac.types';
import type { ApiResponse, PaginationParams } from '@/types/api.types';

export interface RoleListParams extends PaginationParams {
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface CreateRoleData {
  group_name: string; // API expects group_name
  description: string;
  priority?: number;
  permission_ids?: number[];
}

export interface RoleUpdateData {
  group_name?: string; // API expects group_name
  description?: string;
  priority?: number;
  permission_ids?: number[];
  is_active?: boolean;
}

class RoleService {
  async getRoles(
    projectHash: string,
    params: RoleListParams = {}
  ): Promise<ProjectRolesResponse> {
    // Filter out undefined values from params
    const cleanParams: Record<string, any> = {};
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && (typeof value !== 'string' || value !== '')) {
        cleanParams[key] = value;
      }
    });
    
    const response = await apiClient.get<ProjectRolesResponse>(
      `/rbac/projects/${projectHash}/roles`,
      cleanParams
    );
    return response as ProjectRolesResponse;
  }

  async createRole(
    projectHash: string,
    roleData: CreateRoleData
  ): Promise<ApiResponse<Role>> {
    return await apiClient.post<Role>(
      `/rbac/projects/${projectHash}/roles`,
      roleData
    );
  }

  async updateRole(
    projectHash: string,
    roleId: number,
    data: RoleUpdateData
  ): Promise<ApiResponse<Role>> {
    return await apiClient.put<Role>(
      `/rbac/projects/${projectHash}/roles/${roleId}`,
      data
    );
  }

  async deleteRole(
    projectHash: string,
    roleId: number
  ): Promise<ApiResponse<void>> {
    return await apiClient.delete<void>(
      `/rbac/projects/${projectHash}/roles/${roleId}`
    );
  }

  async cloneRole(
    projectHash: string,
    roleId: number,
    newName: string
  ): Promise<ApiResponse<Role>> {
    return await apiClient.post<Role>(
      `/rbac/projects/${projectHash}/roles/${roleId}/clone`,
      { group_name: newName }
    );
  }

  async getRoleUsage(
    projectHash: string,
    roleId: number
  ): Promise<ApiResponse<{ user_count: number; users: any[] }>> {
    return await apiClient.get<{ user_count: number; users: any[] }>(
      `/rbac/projects/${projectHash}/roles/${roleId}/usage`
    );
  }
}

export const roleService = new RoleService();
export default roleService; 