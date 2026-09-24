/* eslint-disable @typescript-eslint/unbound-method -- mock method refs in expect() assertions are not invoked. */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { groupService, runGroupBatch } from '../group.service';
import { projectGroupService } from '../project-group.service';
import { apiClient } from '../api.client';
import type { ApiResponse } from '@/types/api.types';

vi.mock('../api.client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    postForm: vi.fn(),
    putForm: vi.fn(),
    delete: vi.fn(),
  },
}));

const api = vi.mocked(apiClient);

/** The transport resolves with the raw JSON body; tests hand it route-shaped payloads. */
function body(payload: Record<string, unknown>): ApiResponse {
  return { success: true, message: 'ok', ...payload };
}

beforeEach(() => vi.clearAllMocks());

describe('groupService (user groups)', () => {
  it('lists groups with server search/sort params and keeps the backend total as is', async () => {
    api.get.mockResolvedValue(
      body({
        success: true,
        user_groups: [
          {
            group_hash: 'UG-1',
            group_name: 'ops',
            description: null,
            member_count: 2,
            created_at: null,
          },
        ],
        pagination: { limit: 25, offset: 50, total: 80, has_more: null },
      })
    );

    const page = await groupService.listGroups({
      limit: 25,
      offset: 50,
      search: '  ops ',
      sort_by: 'created_at',
      sort_order: 'desc',
    });

    expect(api.get).toHaveBeenCalledWith('/admin/user-groups', {
      limit: 25,
      offset: 50,
      search: 'ops',
      sort_by: 'created_at',
      sort_order: 'desc',
    });
    expect(page.total).toBe(80);
    expect(page.groups.map((g) => g.group_hash)).toEqual(['UG-1']);
  });

  it('rejects a list response without user_groups instead of showing an empty list', async () => {
    api.get.mockResolvedValue(
      body({
        success: true,
        pagination: { limit: 25, offset: 0 },
      })
    );
    await expect(groupService.listGroups()).rejects.toThrow(
      /Unexpected response/
    );
  });

  it('pages through every group in chunks of 1000', async () => {
    const page = (count: number, offset: number): ApiResponse =>
      body({
        success: true,
        user_groups: Array.from({ length: count }, (_, i) => ({
          group_hash: `UG-${offset + i}`,
          group_name: `g${offset + i}`,
          description: null,
          member_count: 0,
          created_at: null,
        })),
        pagination: { limit: 1000, offset, total: 1001 },
      });
    api.get
      .mockResolvedValueOnce(page(1000, 0))
      .mockResolvedValueOnce(page(1, 1000));

    const all = await groupService.listAllGroups();

    expect(all).toHaveLength(1001);
    expect(api.get).toHaveBeenNthCalledWith(2, '/admin/user-groups', {
      limit: 1000,
      offset: 1000,
      sort_by: 'group_name',
    });
  });

  it('normalises group details and uses statistics for the member count', async () => {
    api.get.mockResolvedValue(
      body({
        success: true,
        user_group: {
          group_hash: 'UG-1',
          group_name: 'ops',
          description: 'Ops',
          created_at: '2026-01-01T00:00:00',
        },
        members: [],
        accessible_projects: [{ project_hash: 'proj-1', project_name: 'One' }],
        accessible_project_groups: [{}, {}],
        statistics: {
          total_members: 7,
          total_projects: 1,
          total_project_groups: 2,
          total_derived_projects: 0,
        },
      })
    );

    const details = await groupService.getGroup('UG/1');

    expect(api.get).toHaveBeenCalledWith(
      '/admin/user-groups/UG%2F1',
      undefined
    );
    expect(details.group.member_count).toBe(7);
    expect(details.statistics).toEqual({
      total_members: 7,
      total_projects: 1,
      total_project_groups: 2,
    });
    expect(details.reachableProjects).toEqual([
      { project_hash: 'proj-1', project_name: 'One' },
    ]);
  });

  it('sends only non-empty fields when updating (empty means "keep" on the backend)', async () => {
    api.putForm.mockResolvedValue(
      body({
        success: true,
        user_group: {
          group_hash: 'UG-1',
          group_name: 'ops-2',
          description: 'Old',
        },
      })
    );

    await groupService.updateGroup('UG-1', {
      group_name: ' ops-2 ',
      description: '   ',
    });

    expect(api.putForm).toHaveBeenCalledWith('/admin/user-groups/UG-1', {
      group_name: 'ops-2',
      description: undefined,
    });
  });

  it('caps the member page size at 100 and requires a numeric total', async () => {
    api.get.mockResolvedValue(
      body({
        success: true,
        members: [
          {
            user_hash: 'usr-1',
            username: 'ana',
            email: null,
            user_type: 'consumer',
            is_active: true,
            joined_at: null,
          },
        ],
        pagination: { limit: 100, offset: 0, total: 1, has_more: false },
      })
    );

    const page = await groupService.getGroupMembers('UG-1', {
      limit: 500,
      offset: 0,
    });

    expect(api.get).toHaveBeenCalledWith('/admin/user-groups/UG-1/members', {
      limit: 100,
      offset: 0,
    });
    expect(page).toEqual({ members: expect.any(Array) as unknown, total: 1 });
  });

  it('adds one member with Form data and removes with DELETE', async () => {
    api.postForm.mockResolvedValue(
      body({
        success: true,
        message: 'ok',
        assignment: {
          user: { user_hash: 'usr-1', username: 'ana' },
          group: { group_hash: 'UG-1', group_name: 'ops' },
          assigned_by: 'root',
        },
      })
    );
    api.delete.mockResolvedValue(body({ success: true }));

    const res = await groupService.addMemberToGroup('UG-1', {
      user_hash: 'usr-1',
    });
    await groupService.removeMemberFromGroup('UG-1', 'usr-1');

    expect(api.postForm).toHaveBeenCalledWith(
      '/admin/user-groups/UG-1/members',
      { user_hash: 'usr-1' }
    );
    expect(res.assignment.user.username).toBe('ana');
    expect(api.delete).toHaveBeenCalledWith(
      '/admin/user-groups/UG-1/members/usr-1'
    );
  });

  it('reports bulk failures honestly even though the route answers success: true', async () => {
    api.post.mockResolvedValue(
      body({
        success: true,
        summary: { total_requested: 3, success_count: 1, error_count: 2 },
        results: [
          {
            user_hash: 'usr-1',
            username: 'ana',
            status: 'success',
            message: 'Added',
          },
          {
            user_hash: 'usr-2',
            username: 'bo',
            status: 'error',
            message: 'Assignment failed',
          },
        ],
        errors: ['User not found: usr-3'],
      })
    );

    const result = await groupService.bulkAddMembers('UG-1', [
      'usr-1',
      'usr-2',
      'usr-3',
    ]);

    expect(api.post).toHaveBeenCalledWith(
      '/admin/user-groups/UG-1/members/bulk',
      {
        user_hashes: ['usr-1', 'usr-2', 'usr-3'],
      }
    );
    expect(result).toEqual({
      requested: 3,
      succeeded: 1,
      failed: 2,
      failures: [
        { user_hash: 'usr-2', username: 'bo', message: 'Assignment failed' },
        {
          user_hash: 'usr-3',
          username: null,
          message: 'User not found: usr-3',
        },
      ],
    });
  });

  it('refuses bulk requests outside 1–100 users without calling the API', async () => {
    await expect(groupService.bulkAddMembers('UG-1', [])).rejects.toThrow(
      /between 1 and 100/
    );
    await expect(
      groupService.bulkAddMembers(
        'UG-1',
        Array.from({ length: 101 }, (_, i) => `usr-${i}`)
      )
    ).rejects.toThrow(/between 1 and 100/);
    expect(api.post).not.toHaveBeenCalled();
  });

  it('grants and revokes project groups with the documented encodings', async () => {
    api.postForm.mockResolvedValue(body({ success: true }));
    api.delete.mockResolvedValue(body({ success: true }));

    await groupService.grantProjectGroupAccess('UG-1', 'PG-1');
    await groupService.revokeProjectGroupAccess('UG-1', 'PG-1');

    expect(api.postForm).toHaveBeenCalledWith(
      '/admin/user-groups/UG-1/project-groups',
      {
        project_group_hash: 'PG-1',
      }
    );
    expect(api.delete).toHaveBeenCalledWith(
      '/admin/user-groups/UG-1/project-groups/PG-1'
    );
  });
});

describe('runGroupBatch', () => {
  it('attempts every item and collects failures with their messages', async () => {
    const action = vi.fn((id: string) =>
      id === 'b' ? Promise.reject(new Error('nope')) : Promise.resolve()
    );

    const result = await runGroupBatch(['a', 'b', 'c'], action);

    expect(action).toHaveBeenCalledTimes(3);
    expect(result).toEqual({
      succeeded: ['a', 'c'],
      failures: [{ id: 'b', message: 'nope' }],
    });
  });
});

describe('projectGroupService', () => {
  it('lists project groups and trusts the search-aware total', async () => {
    api.get.mockResolvedValue(
      body({
        success: true,
        project_groups: [
          {
            group_hash: 'PG-1',
            group_name: 'default_1',
            description: null,
            project_count: 1,
            created_at: null,
          },
        ],
        pagination: { limit: 25, offset: 0, total: 1, has_more: false },
      })
    );

    const page = await projectGroupService.listProjectGroups({
      search: 'default',
    });

    expect(api.get).toHaveBeenCalledWith('/admin/project-groups', {
      search: 'default',
    });
    expect(page).toEqual({
      projectGroups: expect.any(Array) as unknown,
      total: 1,
    });
  });

  it('reads projects from the group details (there is no /projects sub-route)', async () => {
    api.get.mockResolvedValue(
      body({
        success: true,
        project_group: {
          group_hash: 'PG-1',
          group_name: 'apps',
          description: null,
          project_count: 1,
          created_at: null,
        },
        assigned_projects: [
          {
            project_hash: 'proj-1',
            project_name: 'One',
            project_description: null,
          },
        ],
        statistics: { total_projects: 1 },
      })
    );

    const details = await projectGroupService.getProjectGroup('PG-1');

    expect(api.get).toHaveBeenCalledTimes(1);
    expect(api.get).toHaveBeenCalledWith(
      '/admin/project-groups/PG-1',
      undefined
    );
    expect(details.projects).toHaveLength(1);
  });

  it('surfaces a failing update instead of pretending it saved', async () => {
    api.putForm.mockRejectedValue(new Error('Internal server error'));
    await expect(
      projectGroupService.updateProjectGroup('PG-1', { group_name: 'x' })
    ).rejects.toThrow('Internal server error');
  });

  it('aggregates user groups granted a project group and counts groups it could not check', async () => {
    vi.spyOn(groupService, 'listAllGroups').mockResolvedValue([
      {
        group_hash: 'UG-1',
        group_name: 'a',
        description: null,
        member_count: 1,
        created_at: null,
      },
      {
        group_hash: 'UG-2',
        group_name: 'b',
        description: null,
        member_count: 2,
        created_at: null,
      },
      {
        group_hash: 'UG-3',
        group_name: 'c',
        description: null,
        member_count: 3,
        created_at: null,
      },
    ]);
    vi.spyOn(groupService, 'listProjectGroupGrants').mockImplementation(
      (hash: string) => {
        if (hash === 'UG-2') return Promise.reject(new Error('boom'));
        return Promise.resolve(
          hash === 'UG-1'
            ? [
                {
                  group_hash: 'PG-1',
                  group_name: 'apps',
                  group_description: null,
                  created_at: null,
                  is_active: true,
                  granted_at: '2026-02-01T00:00:00',
                },
              ]
            : []
        );
      }
    );

    const result =
      await projectGroupService.getUserGroupsForProjectGroup('PG-1');

    expect(result.uncheckedCount).toBe(1);
    expect(result.userGroups).toEqual([
      expect.objectContaining({
        group_hash: 'UG-1',
        granted_at: '2026-02-01T00:00:00',
      }),
    ]);
  });
});
