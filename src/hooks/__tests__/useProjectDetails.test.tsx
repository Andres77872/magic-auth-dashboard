import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import {
  findAdminGroupCandidates,
  useProjectAdministrators,
  useProjectCatalog,
  useProjectDetails,
  useProjectGroupMembership,
  useProjectMembers,
} from '../useProjectDetails';
import type { ProjectDetailsData } from '@/types/project.types';
import type { UserGroup } from '@/types/group.types';

const mocks = vi.hoisted(() => ({
  project: {
    getProject: vi.fn(),
    getProjectMembers: vi.fn(),
    getProjectGroups: vi.fn(),
    getProjectActivity: vi.fn(),
  },
  group: {
    getGroupMembers: vi.fn(),
    addMemberToGroup: vi.fn(),
    removeMemberFromGroup: vi.fn(),
  },
  projectGroup: {
    assignProjectToGroup: vi.fn(),
    removeProjectFromGroup: vi.fn(),
    listProjectGroups: vi.fn(),
  },
  roles: {
    getProjectCatalogRoles: vi.fn(),
    addRoleToProjectCatalog: vi.fn(),
    removeRoleFromProjectCatalog: vi.fn(),
    getRoles: vi.fn(),
    getPermissionGroups: vi.fn(),
  },
  assignments: {
    getProjectCatalogPermissionGroups: vi.fn(),
    addPermissionGroupToProjectCatalog: vi.fn(),
    removePermissionGroupFromProjectCatalog: vi.fn(),
  },
}));

vi.mock('@/services/project.service', () => ({
  projectService: mocks.project,
}));
vi.mock('@/services/group.service', () => ({ groupService: mocks.group }));
vi.mock('@/services/project-group.service', () => ({
  projectGroupService: mocks.projectGroup,
}));
vi.mock('@/services/global-roles.service', () => ({
  globalRolesService: mocks.roles,
}));
vi.mock('@/services/permission-assignments.service', () => ({
  permissionAssignmentsService: mocks.assignments,
}));

function details(
  accessLevel: 'admin_access' | 'group_access'
): ProjectDetailsData {
  return {
    project: {
      project_hash: 'proj-1',
      project_name: 'CRM',
      project_description: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: null,
    },
    user_access: {
      permissions: [],
      access_level: accessLevel,
      user_groups: [],
    },
    project_groups: [
      { group_hash: 'PG-1', group_name: 'default_x', description: null },
    ],
  };
}

function userGroup(name: string): UserGroup {
  return {
    group_hash: `UG-${name}`,
    group_name: name,
    description: null,
    member_count: 1,
    created_at: null,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useProjectDetails', () => {
  it('exposes the project and lets root/assigned admins manage it', async () => {
    mocks.project.getProject.mockResolvedValue(details('admin_access'));

    const { result } = renderHook(() => useProjectDetails('proj-1'));

    await waitFor(() =>
      expect(result.current.project?.project_name).toBe('CRM')
    );
    expect(mocks.project.getProject).toHaveBeenCalledWith('proj-1');
    expect(result.current.canManage).toBe(true);
    expect(result.current.projectGroups).toHaveLength(1);
  });

  it('does not let group-access viewers manage the project', async () => {
    mocks.project.getProject.mockResolvedValue(details('group_access'));

    const { result } = renderHook(() => useProjectDetails('proj-1'));

    await waitFor(() => expect(result.current.project).not.toBeNull());
    expect(result.current.canManage).toBe(false);
  });

  it('does not request anything without a hash', () => {
    const { result } = renderHook(() => useProjectDetails(undefined));

    expect(result.current.isLoading).toBe(false);
    expect(mocks.project.getProject).not.toHaveBeenCalled();
  });
});

describe('useProjectMembers', () => {
  it('requests the page and user type it is given', async () => {
    mocks.project.getProjectMembers.mockResolvedValue({
      members: [],
      pagination: { limit: 25, offset: 50, total: 60, has_more: false },
    });

    const { result } = renderHook(() =>
      useProjectMembers('proj-1', {
        offset: 50,
        limit: 25,
        userType: 'consumer',
      })
    );

    await waitFor(() => expect(result.current.pagination?.total).toBe(60));
    expect(mocks.project.getProjectMembers).toHaveBeenCalledWith('proj-1', {
      offset: 50,
      limit: 25,
      user_type: 'consumer',
    });
  });
});

describe('findAdminGroupCandidates', () => {
  it('keeps only groups following the admin_ naming convention', () => {
    const groups = [
      userGroup('admin_abc'),
      userGroup('user_abc'),
      userGroup('Admin_Other'),
      userGroup('administrators'),
    ];

    expect(
      findAdminGroupCandidates(groups).map((group) => group.group_name)
    ).toEqual(['admin_abc', 'Admin_Other']);
  });
});

describe('useProjectAdministrators', () => {
  it('lists the admin group members and reloads them after adding one', async () => {
    mocks.group.getGroupMembers.mockResolvedValue({ members: [], total: 0 });
    mocks.group.addMemberToGroup.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useProjectAdministrators('UG-admin'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mocks.group.getGroupMembers).toHaveBeenCalledWith('UG-admin', {
      limit: 100,
      offset: 0,
    });

    await act(async () => {
      await result.current.addAdministrator('usr-9');
    });

    expect(mocks.group.addMemberToGroup).toHaveBeenCalledWith('UG-admin', {
      user_hash: 'usr-9',
    });
    expect(mocks.group.getGroupMembers).toHaveBeenCalledTimes(2);
    expect(result.current.pending).toBeNull();
  });

  it('rethrows a refused removal (api.auth only lets root change admin_ groups)', async () => {
    mocks.group.getGroupMembers.mockResolvedValue({ members: [], total: 0 });
    mocks.group.removeMemberFromGroup.mockRejectedValue(
      new Error('Only root users may change project admin groups')
    );

    const { result } = renderHook(() => useProjectAdministrators('UG-admin'));
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      await expect(result.current.removeAdministrator('usr-9')).rejects.toThrow(
        'Only root users'
      );
    });
    expect(result.current.pending).toBeNull();
  });

  it('stays idle without a group', () => {
    const { result } = renderHook(() => useProjectAdministrators(null));

    expect(result.current.isLoading).toBe(false);
    expect(mocks.group.getGroupMembers).not.toHaveBeenCalled();
  });
});

describe('useProjectGroupMembership', () => {
  it('reports per-group failures instead of stopping at the first one', async () => {
    mocks.projectGroup.assignProjectToGroup
      .mockResolvedValueOnce({ success: true })
      .mockRejectedValueOnce(new Error('Project group not found'));

    const { result } = renderHook(() => useProjectGroupMembership('proj-1'));
    let outcome:
      | Awaited<ReturnType<typeof result.current.addToProjectGroups>>
      | undefined;
    await act(async () => {
      outcome = await result.current.addToProjectGroups(['PG-a', 'PG-b']);
    });

    expect(mocks.projectGroup.assignProjectToGroup).toHaveBeenCalledWith(
      'PG-a',
      'proj-1'
    );
    expect(mocks.projectGroup.assignProjectToGroup).toHaveBeenCalledWith(
      'PG-b',
      'proj-1'
    );
    expect(outcome).toEqual({
      added: ['PG-a'],
      failed: [{ groupHash: 'PG-b', message: 'Project group not found' }],
    });
  });
});

describe('useProjectCatalog', () => {
  it('loads both catalogs and reloads after a change', async () => {
    mocks.roles.getProjectCatalogRoles.mockResolvedValue([]);
    mocks.assignments.getProjectCatalogPermissionGroups.mockResolvedValue([]);
    mocks.roles.addRoleToProjectCatalog.mockResolvedValue(undefined);

    const { result } = renderHook(() => useProjectCatalog('proj-1'));
    await waitFor(() =>
      expect(result.current.catalog).toEqual({
        roles: [],
        permissionGroups: [],
      })
    );

    await act(async () => {
      await result.current.addRole('role-1', { catalog_purpose: 'Editors' });
    });

    expect(mocks.roles.addRoleToProjectCatalog).toHaveBeenCalledWith(
      'proj-1',
      'role-1',
      { catalog_purpose: 'Editors' }
    );
    expect(mocks.roles.getProjectCatalogRoles).toHaveBeenCalledTimes(2);
    expect(
      mocks.assignments.getProjectCatalogPermissionGroups
    ).toHaveBeenCalledTimes(2);
  });
});
