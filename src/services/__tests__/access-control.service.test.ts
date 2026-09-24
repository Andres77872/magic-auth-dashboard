/* eslint-disable @typescript-eslint/unbound-method -- mock method refs in expect() assertions are not invoked. */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../api.client';
import { globalRolesService } from '../global-roles.service';
import { permissionAssignmentsService } from '../permission-assignments.service';
import { userService } from '../user.service';
import { systemService } from '../system.service';
import type { ApiResponse } from '@/types/api.types';

vi.mock('../api.client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    postForm: vi.fn(),
    put: vi.fn(),
    putForm: vi.fn(),
    patchForm: vi.fn(),
    delete: vi.fn(),
  },
}));

const api = vi.mocked(apiClient);
/** The transport resolves with the raw JSON body; cast route-shaped payloads to its declared type. */
const raw = (payload: Record<string, unknown>): ApiResponse =>
  payload as unknown as ApiResponse;

beforeEach(() => vi.clearAllMocks());

describe('globalRolesService', () => {
  it('requests the maximum page and returns roles from the top-level key', async () => {
    api.get.mockResolvedValue(
      raw({
        success: true,
        roles: [{ role_hash: 'role-1' }],
        pagination: { total: 1 },
      })
    );
    await expect(globalRolesService.getRoles()).resolves.toEqual([
      { role_hash: 'role-1' },
    ]);
    expect(api.get).toHaveBeenCalledWith('/roles/roles', { limit: 100 });
  });

  it('returns null when a user has no global role', async () => {
    api.get.mockResolvedValue(
      raw({ success: true, user: { user_hash: 'usr-1' }, role: null })
    );
    await expect(globalRolesService.getUserRole('usr-1')).resolves.toBeNull();
    expect(api.get).toHaveBeenCalledWith('/roles/users/usr-1/role', undefined);
  });

  it('assigns a role with a form-encoded role_hash', async () => {
    api.putForm.mockResolvedValue(raw({ success: true, user: {}, role: {} }));
    await globalRolesService.assignRoleToUser('usr-1', 'role-2');
    expect(api.putForm).toHaveBeenCalledWith('/roles/users/usr-1/role', {
      role_hash: 'role-2',
    });
  });

  it('encodes path segments', async () => {
    api.get.mockResolvedValue(raw({ success: true, permissions: [] }));
    await globalRolesService.getGroupPermissions('grp/1');
    expect(api.get).toHaveBeenCalledWith(
      '/roles/permission-groups/grp%2F1/permissions',
      undefined
    );
  });

  it('reads cataloged roles from `cataloged_roles`', async () => {
    api.get.mockResolvedValue(
      raw({
        success: true,
        project: {},
        cataloged_roles: [{ role_hash: 'r' }],
        count: 1,
      })
    );
    await expect(
      globalRolesService.getProjectCatalogRoles('proj-1')
    ).resolves.toEqual([{ role_hash: 'r' }]);
  });

  it('rejects a role detail response without a role', async () => {
    api.get.mockResolvedValue(raw({ success: true }));
    await expect(globalRolesService.getRole('role-x')).rejects.toThrow(
      'Role not found.'
    );
  });
});

describe('permissionAssignmentsService (no success envelope)', () => {
  it('returns direct permission groups from `direct_permission_groups`', async () => {
    api.get.mockResolvedValue(
      raw({
        user: {},
        direct_permission_groups: [{ group_hash: 'g1', notes: 'temp' }],
        count: 1,
      })
    );
    await expect(
      permissionAssignmentsService.getUserDirectPermissionGroups('usr-1')
    ).resolves.toEqual([{ group_hash: 'g1', notes: 'temp' }]);
  });

  it('omits blank notes when assigning', async () => {
    api.postForm.mockResolvedValue(raw({ message: 'ok' }));
    await permissionAssignmentsService.assignPermissionGroupToUser(
      'usr-1',
      'g1',
      '   '
    );
    expect(api.postForm).toHaveBeenCalledWith(
      '/permissions/users/usr-1/permission-groups',
      {
        permission_group_hash: 'g1',
        notes: undefined,
      }
    );
  });

  it('returns permission names from `permissions`', async () => {
    api.get.mockResolvedValue(
      raw({ user: {}, permissions: ['users.read'], count: 1 })
    );
    await expect(
      permissionAssignmentsService.getMyPermissions()
    ).resolves.toEqual(['users.read']);
  });

  it('normalises permission sources and the summary', async () => {
    api.get.mockResolvedValue(
      raw({ user: {}, sources: { from_role: [{ source_type: 'role' }] } })
    );
    const result = await permissionAssignmentsService.getMyPermissionSources();
    expect(result.sources.from_role).toHaveLength(1);
    expect(result.sources.from_user_groups).toEqual([]);
    expect(result.summary.total_permission_groups).toBe(0);
  });

  it('reads the real keys for catalog and usage lookups', async () => {
    api.get
      .mockResolvedValueOnce(
        raw({ cataloged_permission_groups: [{ group_hash: 'a' }] })
      )
      .mockResolvedValueOnce(
        raw({ cataloged_in_projects: [{ project_hash: 'p' }] })
      )
      .mockResolvedValueOnce(
        raw({ users_with_direct_assignment: [{ user_hash: 'u' }] })
      );
    await expect(
      permissionAssignmentsService.getProjectCatalogPermissionGroups('p')
    ).resolves.toHaveLength(1);
    await expect(
      permissionAssignmentsService.getPermissionGroupProjectCatalog('a')
    ).resolves.toHaveLength(1);
    await expect(
      permissionAssignmentsService.getPermissionGroupUsers('a')
    ).resolves.toHaveLength(1);
  });

  it('sends bulk grants as a repeated form field', async () => {
    api.postForm.mockResolvedValue(
      raw({ results: [], success_count: 2, total_count: 2 })
    );
    const result =
      await permissionAssignmentsService.bulkAssignPermissionGroupsToUserGroup(
        'ug-1',
        ['a', 'b']
      );
    expect(api.postForm).toHaveBeenCalledWith(
      '/permissions/admin/user-groups/ug-1/permission-groups/bulk',
      {
        permission_group_hashes: ['a', 'b'],
      }
    );
    expect(result.success_count).toBe(2);
  });
});

describe('userService', () => {
  it('sends booleans as strings and drops empty filters when listing', async () => {
    api.get.mockResolvedValue(
      raw({ success: true, users: [], pagination: {} })
    );
    await userService.getUsers({
      limit: 25,
      offset: 0,
      search: '',
      include_inactive: false,
    });
    expect(api.get).toHaveBeenCalledWith('/users/list', {
      limit: 25,
      offset: 0,
      include_inactive: 'false',
    });
  });

  it('changes status through the query string with no body', async () => {
    api.put.mockResolvedValue(
      raw({ success: true, user_hash: 'usr-1', is_active: false })
    );
    await userService.setUserActive('usr-1', false);
    expect(api.put).toHaveBeenCalledWith(
      '/users/usr-1/status?is_active=false',
      undefined
    );
  });

  it('changes user type with a form field', async () => {
    api.patchForm.mockResolvedValue(raw({ success: true }));
    await userService.changeUserType('usr-1', 'admin');
    expect(api.patchForm).toHaveBeenCalledWith('/users/usr-1/type', {
      user_type: 'admin',
    });
  });

  it('confirms bulk deletion explicitly', async () => {
    api.postForm.mockResolvedValue(
      raw({ success: true, summary: { success_count: 1, error_count: 0 } })
    );
    await userService.bulkDeleteUsers(['usr-1']);
    expect(api.postForm).toHaveBeenCalledWith('/admin/users/bulk-delete', {
      user_hashes: ['usr-1'],
      confirm_deletion: true,
    });
  });

  it('maps the flat /users/profile response to a user', async () => {
    api.get.mockResolvedValue(
      raw({
        success: true,
        user_hash: 'usr-1',
        username: 'ana',
        user_type: 'admin',
        email: null,
        groups: [],
      })
    );
    const user = await userService.getMyProfile();
    expect(user).toMatchObject({
      user_hash: 'usr-1',
      username: 'ana',
      user_type: 'admin',
      email: '',
      projects: [],
    });
  });

  it('has no way to create consumers through the public registration route', () => {
    expect('createConsumerUser' in userService).toBe(false);
  });
});

describe('systemService', () => {
  it('returns the bare dashboard stats object', async () => {
    api.get.mockResolvedValue(
      raw({ totals: { users: 3 }, generated_at: 'now' })
    );
    await expect(systemService.getDashboardStats()).resolves.toMatchObject({
      totals: { users: 3 },
    });
  });

  it('rejects malformed dashboard stats instead of showing zeros', async () => {
    api.get.mockResolvedValue(raw({ success: true }));
    await expect(systemService.getDashboardStats()).rejects.toThrow(
      /expected format/
    );
  });

  it('surfaces the backend `statistics.error` for user statistics', async () => {
    api.get.mockResolvedValue(
      raw({ success: true, statistics: { error: 'boom' } })
    );
    await expect(systemService.getUserStatistics(30)).rejects.toThrow(
      /unavailable/
    );
    expect(api.get).toHaveBeenCalledWith('/admin/users/statistics', {
      days: 30,
    });
  });
});
