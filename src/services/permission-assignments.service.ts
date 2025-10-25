import { apiClient } from './api.client';
import type { ApiResponse } from '@/types/api.types';
import type {
  PermissionGroupAssignment,
  DirectPermissionAssignment,
  PermissionSource,
  CatalogEntry
} from '@/types/permission-assignments.types';

class PermissionAssignmentsService {
  // ============================================
  // USER GROUP PERMISSION ASSIGNMENTS (PRIMARY)
  // ============================================
  
  /**
   * Assign permission group to user group
   * POST /v1/admin/user-groups/{group_hash}/permission-groups
   */
  async assignPermissionGroupToUserGroup(
    groupHash: string,
    permissionGroupHash: string
  ): Promise<ApiResponse<PermissionGroupAssignment>> {
    return await apiClient.post<PermissionGroupAssignment>(
      `/v1/admin/user-groups/${groupHash}/permission-groups`,
      { permission_group_hash: permissionGroupHash }
    );
  }

  /**
   * Remove permission group from user group
   * DELETE /v1/admin/user-groups/{group_hash}/permission-groups/{pg_hash}
   */
  async removePermissionGroupFromUserGroup(
    groupHash: string,
    permissionGroupHash: string
  ): Promise<ApiResponse<void>> {
    return await apiClient.delete<void>(
      `/v1/admin/user-groups/${groupHash}/permission-groups/${permissionGroupHash}`
    );
  }

  /**
   * Get user group's permission groups
   * GET /v1/admin/user-groups/{group_hash}/permission-groups
   */
  async getUserGroupPermissionGroups(
    groupHash: string
  ): Promise<ApiResponse<PermissionGroupAssignment[]>> {
    return await apiClient.get<PermissionGroupAssignment[]>(
      `/v1/admin/user-groups/${groupHash}/permission-groups`
    );
  }

  /**
   * Bulk assign permission groups to user group
   * POST /v1/admin/user-groups/{group_hash}/permission-groups/bulk
   */
  async bulkAssignPermissionGroupsToUserGroup(
    groupHash: string,
    permissionGroupHashes: string[]
  ): Promise<ApiResponse<{
    success_count: number;
    results: Array<{ permission_group_hash: string; success: boolean }>;
  }>> {
    return await apiClient.post<{
      success_count: number;
      results: Array<{ permission_group_hash: string; success: boolean }>;
    }>(
      `/v1/admin/user-groups/${groupHash}/permission-groups/bulk`,
      permissionGroupHashes
    );
  }

  // ============================================
  // DIRECT USER PERMISSIONS (SECONDARY)
  // ============================================
  
  /**
   * Assign permission group directly to user
   * POST /v1/users/{user_hash}/permission-groups
   */
  async assignPermissionGroupToUser(
    userHash: string,
    permissionGroupHash: string,
    notes?: string
  ): Promise<ApiResponse<DirectPermissionAssignment>> {
    return await apiClient.post<DirectPermissionAssignment>(
      `/v1/users/${userHash}/permission-groups`,
      { permission_group_hash: permissionGroupHash, notes }
    );
  }

  /**
   * Remove permission group from user
   * DELETE /v1/users/{user_hash}/permission-groups/{pg_hash}
   */
  async removePermissionGroupFromUser(
    userHash: string,
    permissionGroupHash: string
  ): Promise<ApiResponse<void>> {
    return await apiClient.delete<void>(
      `/v1/users/${userHash}/permission-groups/${permissionGroupHash}`
    );
  }

  /**
   * Get user's direct permission groups
   * GET /v1/users/{user_hash}/permission-groups
   */
  async getUserDirectPermissionGroups(
    userHash: string
  ): Promise<ApiResponse<DirectPermissionAssignment[]>> {
    return await apiClient.get<DirectPermissionAssignment[]>(
      `/v1/users/${userHash}/permission-groups`
    );
  }

  // ============================================
  // CURRENT USER PERMISSION QUERIES
  // ============================================
  
  /**
   * Get current user's all permissions
   * GET /v1/users/me/permissions
   */
  async getMyPermissions(): Promise<ApiResponse<string[]>> {
    return await apiClient.get<string[]>('/v1/users/me/permissions');
  }

  /**
   * Check if current user has specific permission
   * GET /v1/users/me/permissions/check/{permission_name}
   */
  async checkMyPermission(permissionName: string): Promise<ApiResponse<{
    has_permission: boolean;
    permission: string;
  }>> {
    return await apiClient.get<{
      has_permission: boolean;
      permission: string;
    }>(`/v1/users/me/permissions/check/${permissionName}`);
  }

  /**
   * Get current user's permission groups
   * GET /v1/users/me/permission-groups
   */
  async getMyPermissionGroups(): Promise<ApiResponse<DirectPermissionAssignment[]>> {
    return await apiClient.get<DirectPermissionAssignment[]>(
      '/v1/users/me/permission-groups'
    );
  }

  /**
   * Get current user's permission sources
   * GET /v1/users/me/permission-sources
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
    }>('/v1/users/me/permission-sources');
  }

  // ============================================
  // PROJECT CATALOG (METADATA ONLY)
  // ============================================
  
  /**
   * Add permission group to project catalog
   * POST /v1/projects/{project_hash}/permission-group-catalog/{pg_hash}
   */
  async addPermissionGroupToProjectCatalog(
    projectHash: string,
    permissionGroupHash: string,
    metadata?: { catalog_purpose?: string; notes?: string }
  ): Promise<ApiResponse<CatalogEntry>> {
    return await apiClient.post<CatalogEntry>(
      `/v1/projects/${projectHash}/permission-group-catalog/${permissionGroupHash}`,
      metadata || {}
    );
  }

  /**
   * Remove permission group from project catalog
   * DELETE /v1/projects/{project_hash}/permission-group-catalog/{pg_hash}
   */
  async removePermissionGroupFromProjectCatalog(
    projectHash: string,
    permissionGroupHash: string
  ): Promise<ApiResponse<void>> {
    return await apiClient.delete<void>(
      `/v1/projects/${projectHash}/permission-group-catalog/${permissionGroupHash}`
    );
  }

  /**
   * Get project's cataloged permission groups
   * GET /v1/projects/{project_hash}/permission-group-catalog
   */
  async getProjectCatalogPermissionGroups(
    projectHash: string
  ): Promise<ApiResponse<CatalogEntry[]>> {
    return await apiClient.get<CatalogEntry[]>(
      `/v1/projects/${projectHash}/permission-group-catalog`
    );
  }

  /**
   * Get projects that catalog a permission group
   * GET /v1/permissions/groups/{pg_hash}/project-catalog
   */
  async getPermissionGroupProjectCatalog(
    permissionGroupHash: string
  ): Promise<ApiResponse<CatalogEntry[]>> {
    return await apiClient.get<CatalogEntry[]>(
      `/v1/permissions/groups/${permissionGroupHash}/project-catalog`
    );
  }

  // ============================================
  // USAGE ANALYTICS
  // ============================================
  
  /**
   * Get user groups with permission group
   * GET /v1/permissions/groups/{pg_hash}/user-groups
   */
  async getPermissionGroupUserGroups(
    permissionGroupHash: string
  ): Promise<ApiResponse<any[]>> {
    return await apiClient.get<any[]>(
      `/v1/permissions/groups/${permissionGroupHash}/user-groups`
    );
  }

  /**
   * Get users with direct permission group
   * GET /v1/permissions/groups/{pg_hash}/users
   */
  async getPermissionGroupUsers(
    permissionGroupHash: string
  ): Promise<ApiResponse<any[]>> {
    return await apiClient.get<any[]>(
      `/v1/permissions/groups/${permissionGroupHash}/users`
    );
  }
}

export const permissionAssignmentsService = new PermissionAssignmentsService();
export default permissionAssignmentsService;
