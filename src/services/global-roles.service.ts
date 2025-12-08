import { apiClient } from './api.client';
import type { ApiResponse, PaginationParams } from '@/types/api.types';
import type {
  GlobalRole,
  GlobalPermissionGroup,
  GlobalPermission,
  GlobalRoleAssignment,
  CreateGlobalRoleRequest,
  UpdateGlobalRoleRequest,
  CreateGlobalPermissionGroupRequest,
  CreateGlobalPermissionRequest
} from '@/types/global-roles.types';

class GlobalRolesService {
  // ============================================
  // ROLE MANAGEMENT
  // ============================================
  
  /**
   * Create a new global role
   * POST /roles/roles
   */
  async createRole(roleData: CreateGlobalRoleRequest): Promise<ApiResponse<GlobalRole>> {
    return await apiClient.postForm<GlobalRole>('/roles/roles', roleData);
  }

  /**
   * List all global roles
   * GET /roles/roles
   */
  async getRoles(params: PaginationParams = {}): Promise<ApiResponse<GlobalRole[]>> {
    const cleanParams = this.cleanParams(params);
    return await apiClient.get<GlobalRole[]>('/roles/roles', cleanParams);
  }

  /**
   * Get specific role details
   * GET /roles/roles/{role_hash}
   */
  async getRole(roleHash: string): Promise<ApiResponse<GlobalRole>> {
    return await apiClient.get<GlobalRole>(`/roles/roles/${roleHash}`);
  }

  /**
   * Update role information
   * PUT /roles/roles/{role_hash}
   */
  async updateRole(
    roleHash: string, 
    data: UpdateGlobalRoleRequest
  ): Promise<ApiResponse<GlobalRole>> {
    return await apiClient.putForm<GlobalRole>(`/roles/roles/${roleHash}`, data);
  }

  /**
   * Delete a role
   * DELETE /roles/roles/{role_hash}
   */
  async deleteRole(roleHash: string): Promise<ApiResponse<void>> {
    return await apiClient.delete<void>(`/roles/roles/${roleHash}`);
  }

  // ============================================
  // PERMISSION GROUP MANAGEMENT
  // ============================================
  
  /**
   * Create permission group
   * POST /roles/permission-groups
   */
  async createPermissionGroup(
    groupData: CreateGlobalPermissionGroupRequest
  ): Promise<ApiResponse<GlobalPermissionGroup>> {
    return await apiClient.postForm<GlobalPermissionGroup>(
      '/roles/permission-groups', 
      groupData
    );
  }

  /**
   * List permission groups
   * GET /roles/permission-groups
   */
  async getPermissionGroups(
    params: { category?: string } & PaginationParams = {}
  ): Promise<ApiResponse<GlobalPermissionGroup[]>> {
    const cleanParams = this.cleanParams(params);
    return await apiClient.get<GlobalPermissionGroup[]>(
      '/roles/permission-groups', 
      cleanParams
    );
  }

  /**
   * Get permission group details
   * GET /roles/permission-groups/{group_hash}
   */
  async getPermissionGroup(groupHash: string): Promise<ApiResponse<GlobalPermissionGroup>> {
    return await apiClient.get<GlobalPermissionGroup>(
      `/roles/permission-groups/${groupHash}`
    );
  }

  /**
   * Update permission group
   * PUT /roles/permission-groups/{group_hash}
   */
  async updatePermissionGroup(
    groupHash: string,
    data: Partial<CreateGlobalPermissionGroupRequest>
  ): Promise<ApiResponse<GlobalPermissionGroup>> {
    return await apiClient.putForm<GlobalPermissionGroup>(
      `/roles/permission-groups/${groupHash}`,
      data
    );
  }

  /**
   * Delete permission group
   * DELETE /roles/permission-groups/{group_hash}
   */
  async deletePermissionGroup(groupHash: string): Promise<ApiResponse<void>> {
    return await apiClient.delete<void>(`/roles/permission-groups/${groupHash}`);
  }

  // ============================================
  // ROLE-PERMISSION GROUP ASSIGNMENTS
  // ============================================
  
  /**
   * Assign permission group to role
   * POST /roles/roles/{role_hash}/permission-groups/{group_hash}
   */
  async assignPermissionGroupToRole(
    roleHash: string,
    groupHash: string
  ): Promise<ApiResponse<void>> {
    return await apiClient.post<void>(
      `/roles/roles/${roleHash}/permission-groups/${groupHash}`
    );
  }

  /**
   * Get role's permission groups
   * GET /roles/roles/{role_hash}/permission-groups
   */
  async getRolePermissionGroups(
    roleHash: string
  ): Promise<ApiResponse<GlobalPermissionGroup[]>> {
    return await apiClient.get<GlobalPermissionGroup[]>(
      `/roles/roles/${roleHash}/permission-groups`
    );
  }

  /**
   * Remove permission group from role
   * DELETE /roles/roles/{role_hash}/permission-groups/{group_hash}
   */
  async removePermissionGroupFromRole(
    roleHash: string,
    groupHash: string
  ): Promise<ApiResponse<void>> {
    return await apiClient.delete<void>(
      `/roles/roles/${roleHash}/permission-groups/${groupHash}`
    );
  }

  // ============================================
  // PERMISSION MANAGEMENT
  // ============================================
  
  /**
   * Create permission
   * POST /roles/permissions
   */
  async createPermission(
    permissionData: CreateGlobalPermissionRequest
  ): Promise<ApiResponse<GlobalPermission>> {
    return await apiClient.postForm<GlobalPermission>('/roles/permissions', permissionData);
  }

  /**
   * List permissions
   * GET /roles/permissions
   */
  async getPermissions(
    params: { category?: string } & PaginationParams = {}
  ): Promise<ApiResponse<GlobalPermission[]>> {
    const cleanParams = this.cleanParams(params);
    return await apiClient.get<GlobalPermission[]>('/roles/permissions', cleanParams);
  }

  /**
   * Get permission details
   * GET /roles/permissions/{permission_hash}
   */
  async getPermission(permissionHash: string): Promise<ApiResponse<GlobalPermission>> {
    return await apiClient.get<GlobalPermission>(`/roles/permissions/${permissionHash}`);
  }

  /**
   * Assign permission to permission group
   * POST /roles/permission-groups/{group_hash}/permissions/{permission_hash}
   */
  async assignPermissionToGroup(
    groupHash: string,
    permissionHash: string
  ): Promise<ApiResponse<void>> {
    return await apiClient.post<void>(
      `/roles/permission-groups/${groupHash}/permissions/${permissionHash}`
    );
  }

  /**
   * Get permissions in group
   * GET /roles/permission-groups/{group_hash}/permissions
   */
  async getGroupPermissions(groupHash: string): Promise<ApiResponse<GlobalPermission[]>> {
    return await apiClient.get<GlobalPermission[]>(
      `/roles/permission-groups/${groupHash}/permissions`
    );
  }

  /**
   * Remove permission from permission group
   * DELETE /roles/permission-groups/{group_hash}/permissions/{permission_hash}
   */
  async removePermissionFromGroup(
    groupHash: string,
    permissionHash: string
  ): Promise<ApiResponse<void>> {
    return await apiClient.delete<void>(
      `/roles/permission-groups/${groupHash}/permissions/${permissionHash}`
    );
  }

  /**
   * Update permission
   * PUT /roles/permissions/{permission_hash}
   */
  async updatePermission(
    permissionHash: string,
    data: Partial<CreateGlobalPermissionRequest>
  ): Promise<ApiResponse<GlobalPermission>> {
    return await apiClient.putForm<GlobalPermission>(
      `/roles/permissions/${permissionHash}`,
      data
    );
  }

  /**
   * Delete permission
   * DELETE /roles/permissions/{permission_hash}
   */
  async deletePermission(permissionHash: string): Promise<ApiResponse<void>> {
    return await apiClient.delete<void>(`/roles/permissions/${permissionHash}`);
  }

  // ============================================
  // USER ROLE ASSIGNMENTS
  // ============================================
  
  /**
   * Assign role to user
   * PUT /roles/users/{user_hash}/role
   */
  async assignRoleToUser(
    userHash: string,
    roleHash: string
  ): Promise<ApiResponse<GlobalRoleAssignment>> {
    return await apiClient.putForm<GlobalRoleAssignment>(
      `/roles/users/${userHash}/role`,
      { role_hash: roleHash }
    );
  }

  /**
   * Get user's role
   * GET /roles/users/{user_hash}/role
   */
  async getUserRole(userHash: string): Promise<ApiResponse<GlobalRole>> {
    return await apiClient.get<GlobalRole>(`/roles/users/${userHash}/role`);
  }

  /**
   * Get current user's role
   * GET /roles/users/me/role
   */
  async getMyRole(): Promise<ApiResponse<GlobalRole>> {
    return await apiClient.get<GlobalRole>('/roles/users/me/role');
  }

  /**
   * Remove role from user
   * DELETE /roles/users/{user_hash}/role
   */
  async removeRoleFromUser(userHash: string): Promise<ApiResponse<void>> {
    return await apiClient.delete<void>(`/roles/users/${userHash}/role`);
  }

  // ============================================
  // PERMISSION CHECKING
  // ============================================
  
  /**
   * Get current user's permissions
   * GET /roles/users/me/permissions
   */
  async getMyPermissions(): Promise<ApiResponse<string[]>> {
    return await apiClient.get<string[]>('/permissions/users/me/permissions');
  }

  /**
   * Check specific permission
   * GET /roles/users/me/permissions/check/{permission_name}
   */
  async checkPermission(permissionName: string): Promise<ApiResponse<{
    has_permission: boolean;
    permission: string;
  }>> {
    return await apiClient.get<{
      has_permission: boolean;
      permission: string;
    }>(`/permissions/users/me/permissions/check/${permissionName}`);
  }

  // ============================================
  // PROJECT CATALOG (METADATA ONLY)
  // ============================================
  
  /**
   * Add role to project catalog
   * POST /roles/projects/{project_hash}/catalog/roles/{role_hash}
   */
  async addRoleToProjectCatalog(
    projectHash: string,
    roleHash: string,
    metadata?: { catalog_purpose?: string; notes?: string }
  ): Promise<ApiResponse<void>> {
    return await apiClient.postForm<void>(
      `/roles/projects/${projectHash}/catalog/roles/${roleHash}`,
      metadata || {}
    );
  }

  /**
   * Get project's cataloged roles
   * GET /roles/projects/{project_hash}/catalog/roles
   */
  async getProjectCatalogRoles(
    projectHash: string
  ): Promise<ApiResponse<GlobalRole[]>> {
    return await apiClient.get<GlobalRole[]>(
      `/roles/projects/${projectHash}/catalog/roles`
    );
  }

  /**
   * Remove role from project catalog
   * DELETE /roles/projects/{project_hash}/catalog/roles/{role_hash}
   */
  async removeRoleFromProjectCatalog(
    projectHash: string,
    roleHash: string
  ): Promise<ApiResponse<void>> {
    return await apiClient.delete<void>(
      `/roles/projects/${projectHash}/catalog/roles/${roleHash}`
    );
  }

  // ============================================
  // UTILITY METHODS
  // ============================================
  
  private cleanParams(params: Record<string, any>): Record<string, any> {
    const cleaned: Record<string, any> = {};
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        cleaned[key] = value;
      }
    });
    return cleaned;
  }
}

export const globalRolesService = new GlobalRolesService();
export default globalRolesService;
