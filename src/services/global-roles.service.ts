import {
  CATALOG_PAGE_SIZE,
  deleteJson,
  getJson,
  postFormJson,
  postJson,
  putFormJson,
  seg,
} from './request';
import type {
  CatalogMetadata,
  CatalogedRole,
  CreateGlobalPermissionGroupRequest,
  CreateGlobalPermissionRequest,
  CreateGlobalRoleRequest,
  GlobalPermission,
  GlobalPermissionGroup,
  GlobalPermissionGroupDetails,
  GlobalRole,
  GlobalRoleAssignment,
  GlobalRoleDetails,
  UpdateGlobalPermissionGroupRequest,
  UpdateGlobalPermissionRequest,
  UpdateGlobalRoleRequest,
} from '@/types/global-roles.types';

interface ListParams {
  category?: string;
  limit?: number;
  offset?: number;
}

/**
 * Global roles, permission groups and permissions (`/roles/*`, all Form
 * encoded). Methods return the payload itself, not the envelope.
 *
 * List endpoints cap `limit` at 100 and report `pagination.total` as the page
 * length, so catalogue calls request the maximum page size.
 */
class GlobalRolesService {
  // Roles ---------------------------------------------------------------

  async getRoles(params: ListParams = {}): Promise<GlobalRole[]> {
    const res = await getJson<{ roles?: GlobalRole[] }>('/roles/roles', {
      limit: params.limit ?? CATALOG_PAGE_SIZE,
      offset: params.offset,
    });
    return res.roles ?? [];
  }

  async getRole(roleHash: string): Promise<GlobalRoleDetails> {
    const res = await getJson<Partial<GlobalRoleDetails>>(
      `/roles/roles/${seg(roleHash)}`
    );
    if (!res.role) throw new Error('Role not found.');
    return { role: res.role, permission_groups: res.permission_groups ?? [] };
  }

  async createRole(data: CreateGlobalRoleRequest): Promise<GlobalRole> {
    const res = await postFormJson<{ role: GlobalRole }>('/roles/roles', data);
    return res.role;
  }

  async updateRole(
    roleHash: string,
    data: UpdateGlobalRoleRequest
  ): Promise<GlobalRole> {
    const res = await putFormJson<{ role: GlobalRole }>(
      `/roles/roles/${seg(roleHash)}`,
      data
    );
    return res.role;
  }

  async deleteRole(roleHash: string): Promise<void> {
    await deleteJson(`/roles/roles/${seg(roleHash)}`);
  }

  async getRolePermissionGroups(
    roleHash: string
  ): Promise<GlobalPermissionGroup[]> {
    const res = await getJson<{ permission_groups?: GlobalPermissionGroup[] }>(
      `/roles/roles/${seg(roleHash)}/permission-groups`
    );
    return res.permission_groups ?? [];
  }

  async assignPermissionGroupToRole(
    roleHash: string,
    groupHash: string
  ): Promise<void> {
    await postJson(
      `/roles/roles/${seg(roleHash)}/permission-groups/${seg(groupHash)}`
    );
  }

  async removePermissionGroupFromRole(
    roleHash: string,
    groupHash: string
  ): Promise<void> {
    await deleteJson(
      `/roles/roles/${seg(roleHash)}/permission-groups/${seg(groupHash)}`
    );
  }

  // Permission groups ---------------------------------------------------

  async getPermissionGroups(
    params: ListParams = {}
  ): Promise<GlobalPermissionGroup[]> {
    const res = await getJson<{ permission_groups?: GlobalPermissionGroup[] }>(
      '/roles/permission-groups',
      {
        category: params.category,
        limit: params.limit ?? CATALOG_PAGE_SIZE,
        offset: params.offset,
      }
    );
    return res.permission_groups ?? [];
  }

  async getPermissionGroup(
    groupHash: string
  ): Promise<GlobalPermissionGroupDetails> {
    const res = await getJson<Partial<GlobalPermissionGroupDetails>>(
      `/roles/permission-groups/${seg(groupHash)}`
    );
    if (!res.permission_group) throw new Error('Permission group not found.');
    return {
      permission_group: res.permission_group,
      permissions: res.permissions ?? [],
    };
  }

  async createPermissionGroup(
    data: CreateGlobalPermissionGroupRequest
  ): Promise<GlobalPermissionGroup> {
    const res = await postFormJson<{ permission_group: GlobalPermissionGroup }>(
      '/roles/permission-groups',
      data
    );
    return res.permission_group;
  }

  async updatePermissionGroup(
    groupHash: string,
    data: UpdateGlobalPermissionGroupRequest
  ): Promise<GlobalPermissionGroup> {
    const res = await putFormJson<{ permission_group: GlobalPermissionGroup }>(
      `/roles/permission-groups/${seg(groupHash)}`,
      data
    );
    return res.permission_group;
  }

  async deletePermissionGroup(groupHash: string): Promise<void> {
    await deleteJson(`/roles/permission-groups/${seg(groupHash)}`);
  }

  async getGroupPermissions(groupHash: string): Promise<GlobalPermission[]> {
    const res = await getJson<{ permissions?: GlobalPermission[] }>(
      `/roles/permission-groups/${seg(groupHash)}/permissions`
    );
    return res.permissions ?? [];
  }

  async assignPermissionToGroup(
    groupHash: string,
    permissionHash: string
  ): Promise<void> {
    await postJson(
      `/roles/permission-groups/${seg(groupHash)}/permissions/${seg(permissionHash)}`
    );
  }

  async removePermissionFromGroup(
    groupHash: string,
    permissionHash: string
  ): Promise<void> {
    await deleteJson(
      `/roles/permission-groups/${seg(groupHash)}/permissions/${seg(permissionHash)}`
    );
  }

  // Permissions ---------------------------------------------------------

  async getPermissions(params: ListParams = {}): Promise<GlobalPermission[]> {
    const res = await getJson<{ permissions?: GlobalPermission[] }>(
      '/roles/permissions',
      {
        category: params.category,
        limit: params.limit ?? CATALOG_PAGE_SIZE,
        offset: params.offset,
      }
    );
    return res.permissions ?? [];
  }

  async createPermission(
    data: CreateGlobalPermissionRequest
  ): Promise<GlobalPermission> {
    const res = await postFormJson<{ permission: GlobalPermission }>(
      '/roles/permissions',
      data
    );
    return res.permission;
  }

  async updatePermission(
    permissionHash: string,
    data: UpdateGlobalPermissionRequest
  ): Promise<GlobalPermission> {
    const res = await putFormJson<{ permission: GlobalPermission }>(
      `/roles/permissions/${seg(permissionHash)}`,
      data
    );
    return res.permission;
  }

  async deletePermission(permissionHash: string): Promise<void> {
    await deleteJson(`/roles/permissions/${seg(permissionHash)}`);
  }

  // User role assignment --------------------------------------------------

  /** The user's global role, or `null` when none is assigned. */
  async getUserRole(userHash: string): Promise<GlobalRole | null> {
    const res = await getJson<{ role?: GlobalRole | null }>(
      `/roles/users/${seg(userHash)}/role`
    );
    return res.role ?? null;
  }

  async getMyRole(): Promise<GlobalRole | null> {
    const res = await getJson<{ role?: GlobalRole | null }>(
      '/roles/users/me/role'
    );
    return res.role ?? null;
  }

  async assignRoleToUser(
    userHash: string,
    roleHash: string
  ): Promise<GlobalRoleAssignment> {
    return await putFormJson<GlobalRoleAssignment>(
      `/roles/users/${seg(userHash)}/role`,
      { role_hash: roleHash }
    );
  }

  async removeRoleFromUser(userHash: string): Promise<void> {
    await deleteJson(`/roles/users/${seg(userHash)}/role`);
  }

  // Project catalog (UI suggestions only, never used for authorization) ----

  async getProjectCatalogRoles(projectHash: string): Promise<CatalogedRole[]> {
    const res = await getJson<{ cataloged_roles?: CatalogedRole[] }>(
      `/roles/projects/${seg(projectHash)}/catalog/roles`
    );
    return res.cataloged_roles ?? [];
  }

  async addRoleToProjectCatalog(
    projectHash: string,
    roleHash: string,
    metadata: CatalogMetadata = {}
  ): Promise<void> {
    await postFormJson(
      `/roles/projects/${seg(projectHash)}/catalog/roles/${seg(roleHash)}`,
      metadata
    );
  }

  async removeRoleFromProjectCatalog(
    projectHash: string,
    roleHash: string
  ): Promise<void> {
    await deleteJson(
      `/roles/projects/${seg(projectHash)}/catalog/roles/${seg(roleHash)}`
    );
  }
}

export const globalRolesService = new GlobalRolesService();
export default globalRolesService;
