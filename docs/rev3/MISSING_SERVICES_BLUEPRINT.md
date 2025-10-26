# Missing Services Implementation Blueprint - Rev3

**Analysis Date:** 2024-10-12  
**Purpose:** Detailed implementation plan for missing service files

---

## 🎯 Overview

This document provides implementation blueprints for the three critical missing service files identified in the API Implementation Status analysis.

---

## 1. Global Roles Service

**File:** `src/services/global-roles.service.ts`  
**Documentation:** `docs/api/global_roles.md`  
**Priority:** 🔴 CRITICAL

### Service Structure

```typescript
import { apiClient } from './api.client';
import type { ApiResponse, PaginationParams } from '@/types/api.types';
import type {
  GlobalRole,
  PermissionGroup,
  Permission,
  RoleAssignment,
  CreateRoleRequest,
  UpdateRoleRequest,
  CreatePermissionGroupRequest,
  CreatePermissionRequest
} from '@/types/global-roles.types';

class GlobalRolesService {
  // ============================================
  // ROLE MANAGEMENT
  // ============================================
  
  /**
   * Create a new global role
   * POST /roles/roles
   */
  async createRole(roleData: CreateRoleRequest): Promise<ApiResponse<GlobalRole>> {
    return await apiClient.post<GlobalRole>('/roles/roles', roleData);
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
    data: UpdateRoleRequest
  ): Promise<ApiResponse<GlobalRole>> {
    return await apiClient.put<GlobalRole>(`/roles/roles/${roleHash}`, data);
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
    groupData: CreatePermissionGroupRequest
  ): Promise<ApiResponse<PermissionGroup>> {
    return await apiClient.post<PermissionGroup>(
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
  ): Promise<ApiResponse<PermissionGroup[]>> {
    const cleanParams = this.cleanParams(params);
    return await apiClient.get<PermissionGroup[]>(
      '/roles/permission-groups', 
      cleanParams
    );
  }

  /**
   * Get permission group details
   * GET /roles/permission-groups/{group_hash}
   */
  async getPermissionGroup(groupHash: string): Promise<ApiResponse<PermissionGroup>> {
    return await apiClient.get<PermissionGroup>(
      `/roles/permission-groups/${groupHash}`
    );
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
  ): Promise<ApiResponse<PermissionGroup[]>> {
    return await apiClient.get<PermissionGroup[]>(
      `/roles/roles/${roleHash}/permission-groups`
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
    permissionData: CreatePermissionRequest
  ): Promise<ApiResponse<Permission>> {
    return await apiClient.post<Permission>('/roles/permissions', permissionData);
  }

  /**
   * List permissions
   * GET /roles/permissions
   */
  async getPermissions(
    params: { category?: string } & PaginationParams = {}
  ): Promise<ApiResponse<Permission[]>> {
    const cleanParams = this.cleanParams(params);
    return await apiClient.get<Permission[]>('/roles/permissions', cleanParams);
  }

  /**
   * Get permission details
   * GET /roles/permissions/{permission_hash}
   */
  async getPermission(permissionHash: string): Promise<ApiResponse<Permission>> {
    return await apiClient.get<Permission>(`/roles/permissions/${permissionHash}`);
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
  async getGroupPermissions(groupHash: string): Promise<ApiResponse<Permission[]>> {
    return await apiClient.get<Permission[]>(
      `/roles/permission-groups/${groupHash}/permissions`
    );
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
  ): Promise<ApiResponse<RoleAssignment>> {
    return await apiClient.put<RoleAssignment>(
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

  // ============================================
  // PERMISSION CHECKING
  // ============================================
  
  /**
   * Get current user's permissions
   * GET /roles/users/me/permissions
   */
  async getMyPermissions(): Promise<ApiResponse<string[]>> {
    return await apiClient.get<string[]>('/roles/users/me/permissions');
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
    }>(`/roles/users/me/permissions/check/${permissionName}`);
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
    return await apiClient.post<void>(
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
```

### Required Types File

**File:** `src/types/global-roles.types.ts`

```typescript
export interface GlobalRole {
  id: number;
  role_hash: string;
  role_name: string;
  role_display_name: string;
  role_description?: string;
  role_priority: number;
  is_system_role: boolean;
  created_at: string;
}

export interface PermissionGroup {
  id: number;
  group_hash: string;
  group_name: string;
  group_display_name: string;
  group_description?: string;
  group_category: string;
  created_at: string;
}

export interface Permission {
  id: number;
  permission_hash: string;
  permission_name: string;
  permission_display_name: string;
  permission_description?: string;
  permission_category: string;
  created_at: string;
}

export interface RoleAssignment {
  user_hash: string;
  username: string;
  role_hash: string;
  role_name: string;
  assigned_at: string;
}

export interface CreateRoleRequest {
  role_name: string;
  role_display_name: string;
  role_description?: string;
  role_priority?: number;
}

export interface UpdateRoleRequest {
  role_display_name?: string;
  role_description?: string;
  role_priority?: number;
}

export interface CreatePermissionGroupRequest {
  group_name: string;
  group_display_name: string;
  group_description?: string;
  group_category?: string;
}

export interface CreatePermissionRequest {
  permission_name: string;
  permission_display_name: string;
  permission_description?: string;
  permission_category?: string;
}
```

---

## 2. Permission Assignments Service

**File:** `src/services/permission-assignments.service.ts`  
**Documentation:** `docs/api/permission-assignments.md`  
**Priority:** 🔴 CRITICAL

### Service Structure

```typescript
import { apiClient } from './api.client';
import type { ApiResponse, PaginationParams } from '@/types/api.types';
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
```

### Required Types File

**File:** `src/types/permission-assignments.types.ts`

```typescript
export interface PermissionGroupAssignment {
  group_hash: string;
  group_name: string;
  permission_group_hash: string;
  permission_group_name: string;
  assigned_at: string;
  assigned_by: string;
}

export interface DirectPermissionAssignment {
  user_hash: string;
  username: string;
  permission_group_hash: string;
  permission_group_name: string;
  assigned_at: string;
  assigned_by: string;
  notes?: string;
}

export interface PermissionSource {
  source_type: 'role' | 'user_group' | 'direct';
  role_name?: string;
  user_group_name?: string;
  permission_group_name: string;
  permissions_count: number;
  notes?: string;
}

export interface CatalogEntry {
  project_hash: string;
  project_name: string;
  permission_group_hash: string;
  permission_group_name: string;
  catalog_purpose?: string;
  notes?: string;
  added_at: string;
  added_by: string;
}
```

---

## 3. Project Groups Service (Update Existing)

**File:** `src/services/project-group.service.ts` (UPDATE EXISTING)  
**Documentation:** `docs/api/admin.md` (Section: Project Group Management)  
**Priority:** 🔴 CRITICAL

### Service Structure

```typescript
import { apiClient } from './api.client';
import type { ApiResponse, PaginationParams } from '@/types/api.types';
import type {
  ProjectGroup,
  CreateProjectGroupRequest,
  UpdateProjectGroupRequest,
  ProjectGroupAssignment
} from '@/types/project-group.types';

class ProjectGroupService {
  /**
   * List all project permission groups
   * GET /admin/project-groups
   */
  async getProjectGroups(
    params: PaginationParams = {}
  ): Promise<ApiResponse<ProjectGroup[]>> {
    const cleanParams = this.cleanParams(params);
    return await apiClient.get<ProjectGroup[]>('/admin/project-groups', cleanParams);
  }

  /**
   * Get project group details
   * GET /admin/project-groups/{group_hash}
   */
  async getProjectGroup(groupHash: string): Promise<ApiResponse<ProjectGroup>> {
    return await apiClient.get<ProjectGroup>(`/admin/project-groups/${groupHash}`);
  }

  /**
   * Create new project group
   * POST /admin/project-groups
   */
  async createProjectGroup(
    groupData: CreateProjectGroupRequest
  ): Promise<ApiResponse<ProjectGroup>> {
    return await apiClient.post<ProjectGroup>('/admin/project-groups', groupData);
  }

  /**
   * Update project group
   * PUT /admin/project-groups/{group_hash}
   */
  async updateProjectGroup(
    groupHash: string,
    data: UpdateProjectGroupRequest
  ): Promise<ApiResponse<ProjectGroup>> {
    return await apiClient.put<ProjectGroup>(
      `/admin/project-groups/${groupHash}`,
      data
    );
  }

  /**
   * Delete project group
   * DELETE /admin/project-groups/{group_hash}
   */
  async deleteProjectGroup(groupHash: string): Promise<ApiResponse<void>> {
    return await apiClient.delete<void>(`/admin/project-groups/${groupHash}`);
  }

  /**
   * Assign project to project group
   * POST /admin/project-groups/{group_hash}/projects
   */
  async assignProjectToGroup(
    groupHash: string,
    projectHash: string
  ): Promise<ApiResponse<ProjectGroupAssignment>> {
    return await apiClient.post<ProjectGroupAssignment>(
      `/admin/project-groups/${groupHash}/projects`,
      { project_hash: projectHash }
    );
  }

  /**
   * Remove project from project group
   * DELETE /admin/project-groups/{group_hash}/projects/{project_hash}
   */
  async removeProjectFromGroup(
    groupHash: string,
    projectHash: string
  ): Promise<ApiResponse<void>> {
    return await apiClient.delete<void>(
      `/admin/project-groups/${groupHash}/projects/${projectHash}`
    );
  }

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

export const projectGroupService = new ProjectGroupService();
export default projectGroupService;
```

### Required Types File

**File:** `src/types/project-group.types.ts`

```typescript
export interface ProjectGroup {
  id: number;
  group_hash: string;
  group_name: string;
  description?: string;
  permissions: string[];
  project_count: number;
  created_at: string;
}

export interface CreateProjectGroupRequest {
  group_name: string;
  permissions?: string[];
  description?: string;
}

export interface UpdateProjectGroupRequest {
  group_name?: string;
  permissions?: string[];
  description?: string;
}

export interface ProjectGroupAssignment {
  project_hash: string;
  project_name: string;
  group_hash: string;
  group_name: string;
  assigned_at: string;
  assigned_by: string;
}
```

---

## 📝 Implementation Checklist

### For Each Service:

- [ ] Create service file with all methods
- [ ] Create corresponding types file
- [ ] Add JSDoc comments for all methods
- [ ] Implement error handling
- [ ] Add parameter cleaning utility
- [ ] Export service instance
- [ ] Update service index exports
- [ ] Create unit tests
- [ ] Create integration tests
- [ ] Update API documentation references

---

## 🧪 Testing Strategy

### Unit Tests Template

```typescript
import { describe, it, expect, vi } from 'vitest';
import { apiClient } from './api.client';
import { globalRolesService } from './global-roles.service';

vi.mock('./api.client');

describe('GlobalRolesService', () => {
  describe('createRole', () => {
    it('should create a role successfully', async () => {
      const mockRole = {
        role_hash: 'role_123',
        role_name: 'test_role',
        role_display_name: 'Test Role'
      };
      
      vi.mocked(apiClient.post).mockResolvedValue({
        success: true,
        data: mockRole
      });

      const result = await globalRolesService.createRole({
        role_name: 'test_role',
        role_display_name: 'Test Role'
      });

      expect(apiClient.post).toHaveBeenCalledWith(
        '/roles/roles',
        expect.any(Object)
      );
      expect(result.data).toEqual(mockRole);
    });
  });
});
```

---

**Document Version:** 1.0  
**Status:** Ready for Implementation
