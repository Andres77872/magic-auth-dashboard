import { apiClient } from './api.client';
import type {
  Permission,
  Role,
  UserRoleAssignment,
  PermissionCheckResponse,
  UserPermissionsResponse,
  CreatePermissionRequest,
  AssignRoleRequest,
  ProjectPermissionsResponse
} from '@/types/rbac.types';
import type { ApiResponse, PaginationParams } from '@/types/api.types';

class RBACService {
  // Permission Management
  async getPermissions(
    projectHash: string,
    params: PaginationParams = {}
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
    data: Partial<CreatePermissionRequest>
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

  // Role Management
  async getRoles(
    projectHash: string,
    params: PaginationParams = {}
  ): Promise<ApiResponse<Role[]>> {
    // Filter out undefined values from params
    const cleanParams: Record<string, any> = {};
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && (typeof value !== 'string' || value !== '')) {
        cleanParams[key] = value;
      }
    });
    
    return await apiClient.get<Role[]>(
      `/rbac/projects/${projectHash}/roles`,
      cleanParams
    );
  }

  async createRole(
    projectHash: string,
    roleData: { role_name: string; description: string; permission_ids: number[] }
  ): Promise<ApiResponse<Role>> {
    return await apiClient.post<Role>(
      `/rbac/projects/${projectHash}/roles`,
      roleData
    );
  }

  async updateRole(
    projectHash: string,
    roleId: number,
    data: { role_name?: string; description?: string; permission_ids?: number[] }
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

  // Role Assignments
  async assignUserToRole(
    userHash: string,
    projectHash: string,
    roleData: AssignRoleRequest
  ): Promise<ApiResponse<UserRoleAssignment>> {
    return await apiClient.post<UserRoleAssignment>(
      `/rbac/users/${userHash}/projects/${projectHash}/roles`,
      roleData
    );
  }

  async removeUserFromRole(
    userHash: string,
    projectHash: string,
    roleId: number
  ): Promise<ApiResponse<void>> {
    return await apiClient.delete<void>(
      `/rbac/users/${userHash}/projects/${projectHash}/roles/${roleId}`
    );
  }

  // Permission Checking
  async getUserEffectivePermissions(
    userHash: string,
    projectHash: string
  ): Promise<UserPermissionsResponse> {
    const response = await apiClient.get<UserPermissionsResponse>(
      `/rbac/users/${userHash}/projects/${projectHash}/permissions`
    );
    return response as UserPermissionsResponse;
  }

  async checkUserPermission(
    userHash: string,
    projectHash: string,
    permissionName: string
  ): Promise<PermissionCheckResponse> {
    const response = await apiClient.get<PermissionCheckResponse>(
      `/rbac/users/${userHash}/projects/${projectHash}/check/${permissionName}`
    );
    return response as PermissionCheckResponse;
  }

  // Bulk Operations
  async bulkAssignRoles(
    projectHash: string,
    assignments: Array<{ user_hash: string; role_ids: number[] }>
  ): Promise<ApiResponse<{ success_count: number; errors: any[] }>> {
    return await apiClient.post<{ success_count: number; errors: any[] }>(
      `/rbac/projects/${projectHash}/bulk-assign`,
      { assignments }
    );
  }

  // Permission Matrix
  async getPermissionMatrix(projectHash: string): Promise<ApiResponse<any>> {
    return await apiClient.get<any>(`/rbac/projects/${projectHash}/matrix`);
  }

  // User Role History
  async getUserRoleHistory(
    userHash: string,
    projectHash: string
  ): Promise<ApiResponse<UserRoleAssignment[]>> {
    return await apiClient.get<UserRoleAssignment[]>(
      `/rbac/users/${userHash}/projects/${projectHash}/history`
    );
  }
}

export const rbacService = new RBACService();
export default rbacService; 