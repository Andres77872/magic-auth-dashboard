import { apiClient } from './api.client';
import type { ApiResponse } from '@/types/api.types';
import { API_CONFIG, STORAGE_KEYS } from '@/utils/constants';
import type {
  PermissionGroupAssignment,
  DirectPermissionAssignment,
  PermissionSource,
  CatalogEntry,
  UserGroupPermissionGroupsResponse,
  UserDirectPermissionGroupsResponse
} from '@/types/permission-assignments.types';

class PermissionAssignmentsService {
  // ============================================
  // USER GROUP PERMISSION ASSIGNMENTS (PRIMARY)
  // ============================================
  
  /**
   * Assign permission group to user group
   * POST /permissions/admin/user-groups/{group_hash}/permission-groups
   */
  async assignPermissionGroupToUserGroup(
    groupHash: string,
    permissionGroupHash: string
  ): Promise<ApiResponse<PermissionGroupAssignment>> {
    return await apiClient.postForm<PermissionGroupAssignment>(
      `/permissions/admin/user-groups/${groupHash}/permission-groups`,
      { permission_group_hash: permissionGroupHash }
    );
  }

  /**
   * Remove permission group from user group
   * DELETE /permissions/admin/user-groups/{group_hash}/permission-groups/{pg_hash}
   */
  async removePermissionGroupFromUserGroup(
    groupHash: string,
    permissionGroupHash: string
  ): Promise<ApiResponse<void>> {
    return await apiClient.delete<void>(
      `/permissions/admin/user-groups/${groupHash}/permission-groups/${permissionGroupHash}`
    );
  }

  /**
   * Get user group's permission groups
   * GET /permissions/admin/user-groups/{group_hash}/permission-groups
   */
  async getUserGroupPermissionGroups(
    groupHash: string
  ): Promise<ApiResponse<UserGroupPermissionGroupsResponse>> {
    return await apiClient.get<UserGroupPermissionGroupsResponse>(
      `/permissions/admin/user-groups/${groupHash}/permission-groups`
    );
  }

  /**
   * Bulk assign permission groups to user group
   * POST /permissions/admin/user-groups/{group_hash}/permission-groups/bulk
   * Uses form data with repeated permission_group_hashes parameters
   */
  async bulkAssignPermissionGroupsToUserGroup(
    groupHash: string,
    permissionGroupHashes: string[]
  ): Promise<ApiResponse<{
    success_count: number;
    total_count: number;
    results: Array<{ permission_group_hash: string; permission_group_name?: string; success: boolean }>;
  }>> {
    // Build form data with repeated parameters
    const formData = new URLSearchParams();
    permissionGroupHashes.forEach(hash => {
      formData.append('permission_group_hashes', hash);
    });
    
    // Use custom fetch since apiClient doesn't support repeated params
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const response = await fetch(
      `${API_CONFIG.BASE_URL}/permissions/admin/user-groups/${groupHash}/permission-groups/bulk`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${token}`
        },
        body: formData
      }
    );
    
    const data = await response.json();
    return data;
  }

  // ============================================
  // DIRECT USER PERMISSIONS (SECONDARY)
  // ============================================
  
  /**
   * Assign permission group directly to user
   * POST /permissions/users/{user_hash}/permission-groups
   */
  async assignPermissionGroupToUser(
    userHash: string,
    permissionGroupHash: string,
    notes?: string
  ): Promise<ApiResponse<DirectPermissionAssignment>> {
    const data: Record<string, string> = { permission_group_hash: permissionGroupHash };
    if (notes) {
      data.notes = notes;
    }
    return await apiClient.postForm<DirectPermissionAssignment>(
      `/permissions/users/${userHash}/permission-groups`,
      data
    );
  }

  /**
   * Remove permission group from user
   * DELETE /permissions/users/{user_hash}/permission-groups/{pg_hash}
   */
  async removePermissionGroupFromUser(
    userHash: string,
    permissionGroupHash: string
  ): Promise<ApiResponse<void>> {
    return await apiClient.delete<void>(
      `/permissions/users/${userHash}/permission-groups/${permissionGroupHash}`
    );
  }

  /**
   * Get user's direct permission groups
   * GET /permissions/users/{user_hash}/permission-groups
   */
  async getUserDirectPermissionGroups(
    userHash: string
  ): Promise<ApiResponse<UserDirectPermissionGroupsResponse>> {
    return await apiClient.get<UserDirectPermissionGroupsResponse>(
      `/permissions/users/${userHash}/permission-groups`
    );
  }

  // ============================================
  // CURRENT USER PERMISSION QUERIES
  // ============================================
  
  /**
   * Get current user's all permissions
   * GET /permissions/users/me/permissions
   */
  async getMyPermissions(): Promise<ApiResponse<string[]>> {
    return await apiClient.get<string[]>('/permissions/users/me/permissions');
  }

  /**
   * Check if current user has specific permission
   * GET /permissions/users/me/permissions/check/{permission_name}
   */
  async checkMyPermission(permissionName: string): Promise<ApiResponse<{
    has_permission: boolean;
    permission: string;
  }>> {
    return await apiClient.get<{
      has_permission: boolean;
      permission: string;
    }>(`/permissions/users/me/permissions/check/${permissionName}`);
  }

  /**
   * Get current user's permission groups
   * GET /permissions/users/me/permission-groups
   */
  async getMyPermissionGroups(): Promise<ApiResponse<UserDirectPermissionGroupsResponse>> {
    return await apiClient.get<UserDirectPermissionGroupsResponse>(
      '/permissions/users/me/permission-groups'
    );
  }

  /**
   * Get current user's permission sources
   * GET /permissions/users/me/permission-sources
   */
  async getMyPermissionSources(): Promise<ApiResponse<{
    from_role: PermissionSource[];
    from_user_groups: PermissionSource[];
    from_direct_assignment: PermissionSource[];
  }>> {
    return await apiClient.get<{
      from_role: PermissionSource[];
      from_user_groups: PermissionSource[];
      from_direct_assignment: PermissionSource[];
    }>('/permissions/users/me/permission-sources');
  }

  // ============================================
  // PROJECT CATALOG (METADATA ONLY)
  // ============================================
  
  /**
   * Add permission group to project catalog
   * POST /permissions/projects/{project_hash}/permission-group-catalog/{pg_hash}
   */
  async addPermissionGroupToProjectCatalog(
    projectHash: string,
    permissionGroupHash: string,
    metadata?: { catalog_purpose?: string; notes?: string }
  ): Promise<ApiResponse<CatalogEntry>> {
    return await apiClient.postForm<CatalogEntry>(
      `/permissions/projects/${projectHash}/permission-group-catalog/${permissionGroupHash}`,
      metadata || {}
    );
  }

  /**
   * Remove permission group from project catalog
   * DELETE /permissions/projects/{project_hash}/permission-group-catalog/{pg_hash}
   */
  async removePermissionGroupFromProjectCatalog(
    projectHash: string,
    permissionGroupHash: string
  ): Promise<ApiResponse<void>> {
    return await apiClient.delete<void>(
      `/permissions/projects/${projectHash}/permission-group-catalog/${permissionGroupHash}`
    );
  }

  /**
   * Get project's cataloged permission groups
   * GET /permissions/projects/{project_hash}/permission-group-catalog
   */
  async getProjectCatalogPermissionGroups(
    projectHash: string
  ): Promise<ApiResponse<CatalogEntry[]>> {
    return await apiClient.get<CatalogEntry[]>(
      `/permissions/projects/${projectHash}/permission-group-catalog`
    );
  }

  /**
   * Get projects that catalog a permission group
   * GET /permissions/permissions/groups/{pg_hash}/project-catalog
   */
  async getPermissionGroupProjectCatalog(
    permissionGroupHash: string
  ): Promise<ApiResponse<CatalogEntry[]>> {
    return await apiClient.get<CatalogEntry[]>(
      `/permissions/permissions/groups/${permissionGroupHash}/project-catalog`
    );
  }

  // ============================================
  // USAGE ANALYTICS
  // ============================================
  
  /**
   * Get user groups with permission group
   * GET /permissions/permissions/groups/{pg_hash}/user-groups
   */
  async getPermissionGroupUserGroups(
    permissionGroupHash: string
  ): Promise<ApiResponse<any[]>> {
    return await apiClient.get<any[]>(
      `/permissions/permissions/groups/${permissionGroupHash}/user-groups`
    );
  }

  /**
   * Get users with direct permission group
   * GET /permissions/permissions/groups/{pg_hash}/users
   */
  async getPermissionGroupUsers(
    permissionGroupHash: string
  ): Promise<ApiResponse<any[]>> {
    return await apiClient.get<any[]>(
      `/permissions/permissions/groups/${permissionGroupHash}/users`
    );
  }
}

export const permissionAssignmentsService = new PermissionAssignmentsService();
export default permissionAssignmentsService;
