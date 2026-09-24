import { deleteJson, getJson, postFormJson, seg } from './request';
import type {
  AssignedPermissionGroup,
  BulkPermissionGroupAssignResult,
  CatalogedPermissionGroup,
  PermissionGroupCatalogProject,
  PermissionGroupDirectUser,
  PermissionGroupUserGroup,
  PermissionSources,
} from '@/types/permission-assignments.types';
import type { CatalogMetadata } from '@/types/global-roles.types';

/**
 * Permission-group assignments (`/permissions/*`). These routes return bare
 * objects with no `success` key, so a resolved promise means success and
 * failures arrive as thrown errors from the transport.
 */
class PermissionAssignmentsService {
  // User groups ---------------------------------------------------------

  async getUserGroupPermissionGroups(
    groupHash: string
  ): Promise<AssignedPermissionGroup[]> {
    const res = await getJson<{
      permission_groups?: AssignedPermissionGroup[];
    }>(`/permissions/admin/user-groups/${seg(groupHash)}/permission-groups`);
    return res.permission_groups ?? [];
  }

  async assignPermissionGroupToUserGroup(
    groupHash: string,
    permissionGroupHash: string
  ): Promise<void> {
    await postFormJson(
      `/permissions/admin/user-groups/${seg(groupHash)}/permission-groups`,
      {
        permission_group_hash: permissionGroupHash,
      }
    );
  }

  async removePermissionGroupFromUserGroup(
    groupHash: string,
    permissionGroupHash: string
  ): Promise<void> {
    await deleteJson(
      `/permissions/admin/user-groups/${seg(groupHash)}/permission-groups/${seg(permissionGroupHash)}`
    );
  }

  /** Form field `permission_group_hashes` is repeated once per hash. */
  async bulkAssignPermissionGroupsToUserGroup(
    groupHash: string,
    permissionGroupHashes: string[]
  ): Promise<BulkPermissionGroupAssignResult> {
    const res = await postFormJson<Partial<BulkPermissionGroupAssignResult>>(
      `/permissions/admin/user-groups/${seg(groupHash)}/permission-groups/bulk`,
      { permission_group_hashes: permissionGroupHashes }
    );
    return {
      results: res.results ?? [],
      success_count: res.success_count ?? 0,
      total_count: res.total_count ?? permissionGroupHashes.length,
    };
  }

  // Direct user assignments -------------------------------------------------

  async getUserDirectPermissionGroups(
    userHash: string
  ): Promise<AssignedPermissionGroup[]> {
    const res = await getJson<{
      direct_permission_groups?: AssignedPermissionGroup[];
    }>(`/permissions/users/${seg(userHash)}/permission-groups`);
    return res.direct_permission_groups ?? [];
  }

  async assignPermissionGroupToUser(
    userHash: string,
    permissionGroupHash: string,
    notes?: string
  ): Promise<void> {
    await postFormJson(
      `/permissions/users/${seg(userHash)}/permission-groups`,
      {
        permission_group_hash: permissionGroupHash,
        notes: notes?.trim() || undefined,
      }
    );
  }

  async removePermissionGroupFromUser(
    userHash: string,
    permissionGroupHash: string
  ): Promise<void> {
    await deleteJson(
      `/permissions/users/${seg(userHash)}/permission-groups/${seg(permissionGroupHash)}`
    );
  }

  // Current user ------------------------------------------------------------

  async getMyPermissionGroups(): Promise<AssignedPermissionGroup[]> {
    const res = await getJson<{
      direct_permission_groups?: AssignedPermissionGroup[];
    }>('/permissions/users/me/permission-groups');
    return res.direct_permission_groups ?? [];
  }

  /** Permission names from every source (role, user groups, direct). */
  async getMyPermissions(): Promise<string[]> {
    const res = await getJson<{ permissions?: string[] }>(
      '/permissions/users/me/permissions'
    );
    return Array.isArray(res.permissions) ? res.permissions : [];
  }

  async checkMyPermission(permissionName: string): Promise<boolean> {
    const res = await getJson<{ has_permission?: boolean }>(
      `/permissions/users/me/permissions/check/${seg(permissionName)}`
    );
    return res.has_permission === true;
  }

  async getMyPermissionSources(): Promise<PermissionSources> {
    const res = await getJson<Partial<PermissionSources>>(
      '/permissions/users/me/permission-sources'
    );
    return {
      sources: {
        from_role: res.sources?.from_role ?? [],
        from_user_groups: res.sources?.from_user_groups ?? [],
        from_direct_assignment: res.sources?.from_direct_assignment ?? [],
      },
      summary: res.summary ?? {
        role_count: 0,
        user_group_count: 0,
        direct_count: 0,
        total_permission_groups: 0,
      },
    };
  }

  // Project catalog (UI suggestions only) --------------------------------

  async getProjectCatalogPermissionGroups(
    projectHash: string
  ): Promise<CatalogedPermissionGroup[]> {
    const res = await getJson<{
      cataloged_permission_groups?: CatalogedPermissionGroup[];
    }>(`/permissions/projects/${seg(projectHash)}/permission-group-catalog`);
    return res.cataloged_permission_groups ?? [];
  }

  async addPermissionGroupToProjectCatalog(
    projectHash: string,
    permissionGroupHash: string,
    metadata: CatalogMetadata = {}
  ): Promise<void> {
    await postFormJson(
      `/permissions/projects/${seg(projectHash)}/permission-group-catalog/${seg(permissionGroupHash)}`,
      metadata
    );
  }

  async removePermissionGroupFromProjectCatalog(
    projectHash: string,
    permissionGroupHash: string
  ): Promise<void> {
    await deleteJson(
      `/permissions/projects/${seg(projectHash)}/permission-group-catalog/${seg(permissionGroupHash)}`
    );
  }

  // Permission-group usage ------------------------------------------------

  async getPermissionGroupProjectCatalog(
    permissionGroupHash: string
  ): Promise<PermissionGroupCatalogProject[]> {
    const res = await getJson<{
      cataloged_in_projects?: PermissionGroupCatalogProject[];
    }>(
      `/permissions/permissions/groups/${seg(permissionGroupHash)}/project-catalog`
    );
    return res.cataloged_in_projects ?? [];
  }

  async getPermissionGroupUserGroups(
    permissionGroupHash: string
  ): Promise<PermissionGroupUserGroup[]> {
    const res = await getJson<{ user_groups?: PermissionGroupUserGroup[] }>(
      `/permissions/permissions/groups/${seg(permissionGroupHash)}/user-groups`
    );
    return res.user_groups ?? [];
  }

  async getPermissionGroupUsers(
    permissionGroupHash: string
  ): Promise<PermissionGroupDirectUser[]> {
    const res = await getJson<{
      users_with_direct_assignment?: PermissionGroupDirectUser[];
    }>(`/permissions/permissions/groups/${seg(permissionGroupHash)}/users`);
    return res.users_with_direct_assignment ?? [];
  }
}

export const permissionAssignmentsService = new PermissionAssignmentsService();
export default permissionAssignmentsService;
