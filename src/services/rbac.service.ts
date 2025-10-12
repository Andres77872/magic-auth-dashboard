import { apiClient } from './api.client';
import type {
  Permission,
  Role,
  UserRoleAssignment,
  PermissionCheckResponse,
  UserPermissionsResponse,
  CreatePermissionRequest,
  CreateRoleRequest,
  UpdateRoleRequest,
  AssignRoleRequest,
  ProjectPermissionsResponse,
  BulkAssignmentRequest,
  BulkAssignmentResult,
  UserEffectivePermissions,
  EffectivePermission,
  PermissionMatrix,
  AssignmentHistory,
  ConflictResolution,
  RoleRecommendation,
  AssignmentValidationResult,
  UserSelectOption,
  PermissionConflict
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
    roleData: CreateRoleRequest
  ): Promise<ApiResponse<Role>> {
    return await apiClient.post<Role>(
      `/rbac/projects/${projectHash}/roles`,
      roleData
    );
  }

  async updateRole(
    projectHash: string,
    roleId: number,
    data: UpdateRoleRequest
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

  // RBAC Initialization
  async initializeRBAC(
    projectHash: string,
    createDefaultPermissions: boolean = true,
    createDefaultRoles: boolean = true
  ): Promise<ApiResponse<any>> {
    const params: Record<string, any> = {
      create_default_permissions: createDefaultPermissions,
      create_default_roles: createDefaultRoles
    };
    
    const queryString = new URLSearchParams(
      Object.entries(params).map(([k, v]) => [k, String(v)])
    ).toString();
    
    return await apiClient.post<any>(
      `/rbac/projects/${projectHash}/initialize?${queryString}`,
      {},
      false // Need auth
    );
  }

  // RBAC Audit Log
  async getRBACAudit(
    projectHash: string,
    params: PaginationParams & { action_type?: string } = {}
  ): Promise<ApiResponse<any[]>> {
    const cleanParams: Record<string, any> = {};
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && (typeof value !== 'string' || value !== '')) {
        cleanParams[key] = value;
      }
    });
    
    return await apiClient.get<any[]>(
      `/rbac/projects/${projectHash}/audit`,
      cleanParams
    );
  }

  // RBAC Summary
  async getRBACSummary(projectHash: string): Promise<any> {
    return await apiClient.get<any>(`/rbac/projects/${projectHash}/summary`);
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

  // ===== NEW MILESTONE 8.2 METHODS =====

  // Enhanced User-Role Assignment Operations
  async getUserRoles(
    userHash: string,
    projectHash: string
  ): Promise<ApiResponse<UserRoleAssignment[]>> {
    return await apiClient.get<UserRoleAssignment[]>(
      `/rbac/users/${userHash}/projects/${projectHash}/roles`
    );
  }

  async assignUserToRoleEnhanced(
    userHash: string,
    projectHash: string,
    roleId: number,
    reason?: string
  ): Promise<ApiResponse<UserRoleAssignment>> {
    return await apiClient.post<UserRoleAssignment>(
      `/rbac/users/${userHash}/projects/${projectHash}/roles`,
      { role_id: roleId, reason }
    );
  }

  // Bulk Assignment Operations
  async bulkAssignRolesEnhanced(
    projectHash: string,
    assignments: BulkAssignmentRequest
  ): Promise<ApiResponse<BulkAssignmentResult>> {
    return await apiClient.post<BulkAssignmentResult>(
      `/rbac/projects/${projectHash}/bulk-assign`,
      assignments
    );
  }

  async validateAssignments(
    projectHash: string,
    assignments: Array<{ user_hash: string; role_ids: number[] }>
  ): Promise<ApiResponse<AssignmentValidationResult>> {
    return await apiClient.post<AssignmentValidationResult>(
      `/rbac/assignments/validate`,
      { project_hash: projectHash, assignments }
    );
  }

  // Permission Matrix Operations
  async getPermissionMatrixData(
    projectHash: string
  ): Promise<ApiResponse<PermissionMatrix>> {
    return await apiClient.get<PermissionMatrix>(
      `/rbac/projects/${projectHash}/matrix`
    );
  }

  async getUserEffectivePermissionsDetailed(
    userHash: string,
    projectHash: string
  ): Promise<ApiResponse<UserEffectivePermissions>> {
    return await apiClient.get<UserEffectivePermissions>(
      `/rbac/users/${userHash}/projects/${projectHash}/permissions/detailed`
    );
  }

  // Conflict Detection and Resolution
  async detectPermissionConflicts(
    projectHash: string,
    userHash?: string
  ): Promise<ApiResponse<PermissionConflict[]>> {
    const endpoint = userHash 
      ? `/rbac/users/${userHash}/projects/${projectHash}/conflicts`
      : `/rbac/assignments/conflicts/${projectHash}`;
    return await apiClient.get<PermissionConflict[]>(endpoint);
  }

  async resolvePermissionConflict(
    projectHash: string,
    conflictId: string,
    resolution: ConflictResolution
  ): Promise<ApiResponse<ConflictResolution>> {
    return await apiClient.post<ConflictResolution>(
      `/rbac/projects/${projectHash}/conflicts/${conflictId}/resolve`,
      resolution
    );
  }

  // Role Recommendations
  async getRoleRecommendations(
    userHash: string,
    projectHash: string
  ): Promise<ApiResponse<RoleRecommendation>> {
    return await apiClient.get<RoleRecommendation>(
      `/rbac/assignments/recommendations/${userHash}`,
      { project_hash: projectHash }
    );
  }

  // Assignment History and Audit
  async getAssignmentHistory(
    projectHash: string,
    params: PaginationParams & {
      user_hash?: string;
      role_id?: number;
      action?: string;
      date_from?: string;
      date_to?: string;
    } = {}
  ): Promise<ApiResponse<AssignmentHistory[]>> {
    const cleanParams: Record<string, any> = { project_hash: projectHash };
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && (typeof value !== 'string' || value !== '')) {
        cleanParams[key] = value;
      }
    });
    
    return await apiClient.get<AssignmentHistory[]>(
      `/rbac/assignments/history`,
      cleanParams
    );
  }

  // User Selection Utilities
  async getSelectableUsers(
    projectHash: string,
    params: {
      search?: string;
      user_type?: string;
      exclude_assigned?: boolean;
      role_id?: number;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<ApiResponse<UserSelectOption[]>> {
    const cleanParams: Record<string, any> = { project_hash: projectHash };
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && (typeof value !== 'string' || value !== '')) {
        cleanParams[key] = value;
      }
    });
    
    return await apiClient.get<UserSelectOption[]>(
      `/rbac/users/selectable`,
      cleanParams
    );
  }

  // Assignment Testing and Simulation
  async simulateAssignment(
    userHash: string,
    projectHash: string,
    roleIds: number[]
  ): Promise<ApiResponse<{
    effective_permissions: EffectivePermission[];
    conflicts: PermissionConflict[];
    warnings: string[];
  }>> {
    return await apiClient.post<{
      effective_permissions: EffectivePermission[];
      conflicts: PermissionConflict[];
      warnings: string[];
    }>(
      `/rbac/assignments/simulate`,
      { 
        user_hash: userHash, 
        project_hash: projectHash, 
        role_ids: roleIds 
      }
    );
  }

  // Assignment Analytics
  async getAssignmentAnalytics(
    projectHash: string,
    params: {
      period_days?: number;
      group_by?: 'role' | 'user' | 'date';
    } = {}
  ): Promise<ApiResponse<{
    assignment_counts: Record<string, number>;
    role_popularity: Array<{ role_name: string; assignment_count: number }>;
    user_activity: Array<{ user_hash: string; username: string; role_changes: number }>;
    trends: Record<string, number[]>;
  }>> {
    const cleanParams: Record<string, any> = { project_hash: projectHash };
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        cleanParams[key] = value;
      }
    });
    
    return await apiClient.get<{
      assignment_counts: Record<string, number>;
      role_popularity: Array<{ role_name: string; assignment_count: number }>;
      user_activity: Array<{ user_hash: string; username: string; role_changes: number }>;
      trends: Record<string, number[]>;
    }>(
      `/rbac/assignments/analytics`,
      cleanParams
    );
  }

  // Export RBAC Configuration
  async exportRBACConfig(projectHash: string): Promise<ApiResponse<any>> {
    return await apiClient.get<any>(
      `/rbac/projects/${projectHash}/export`
    );
  }

  // Import RBAC Configuration
  async importRBACConfig(
    projectHash: string,
    config: any
  ): Promise<ApiResponse<any>> {
    return await apiClient.post<any>(
      `/rbac/projects/${projectHash}/import`,
      { config }
    );
  }
}

export const rbacService = new RBACService();
export default rbacService; 