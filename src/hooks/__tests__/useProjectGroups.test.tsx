import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import {
  useProjectCandidates,
  useProjectGroupDetails,
  useProjectGroupMutations,
  useProjectGroups,
} from '../useProjectGroups';
import { projectGroupService } from '@/services/project-group.service';
import { projectService } from '@/services/project.service';
import type { ProjectGroup } from '@/types/group.types';
import type { ProjectListResponse } from '@/types/project.types';

const pg: ProjectGroup = {
  group_hash: 'PG-1',
  group_name: 'default_abc',
  description: 'Default project group for abc',
  project_count: 1,
  created_at: '2026-01-01T00:00:00',
};

beforeEach(() => vi.restoreAllMocks());

describe('useProjectGroups', () => {
  it('keeps the total while searching because the backend count respects search', async () => {
    const list = vi
      .spyOn(projectGroupService, 'listProjectGroups')
      .mockResolvedValue({ projectGroups: [pg], total: 1 });
    const { result } = renderHook(() => useProjectGroups());
    await waitFor(() => expect(result.current.projectGroups).toEqual([pg]));

    act(() => result.current.setSearchInput('default'));

    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: 'default', offset: 0 })
      )
    );
    expect(result.current.total).toBe(1);
  });
});

describe('useProjectGroupDetails', () => {
  it('loads the group with its projects', async () => {
    vi.spyOn(projectGroupService, 'getProjectGroup').mockResolvedValue({
      projectGroup: pg,
      projects: [
        {
          project_hash: 'proj-1',
          project_name: 'One',
          project_description: null,
        },
      ],
    });
    const { result } = renderHook(() => useProjectGroupDetails('PG-1'));
    await waitFor(() =>
      expect(result.current.details?.projects).toHaveLength(1)
    );
  });
});

describe('useProjectGroupMutations', () => {
  it('adds several projects one request at a time and reports which failed', async () => {
    const assign = vi
      .spyOn(projectGroupService, 'assignProjectToGroup')
      .mockImplementation((_group: string, project: string) =>
        project === 'proj-2'
          ? Promise.reject(new Error('Target project not found'))
          : Promise.resolve({ success: true })
      );
    const { result } = renderHook(() => useProjectGroupMutations());

    const outcome = await result.current.addProjects('PG-1', [
      'proj-1',
      'proj-2',
    ]);

    expect(assign).toHaveBeenCalledTimes(2);
    expect(outcome).toEqual({
      succeeded: ['proj-1'],
      failures: [{ id: 'proj-2', message: 'Target project not found' }],
    });
  });
});

describe('useProjectCandidates', () => {
  it('searches visible projects on the server and only while enabled', async () => {
    const response: ProjectListResponse = {
      success: true,
      projects: [
        {
          project_hash: 'proj-1',
          project_name: 'One',
          project_description: null,
          access_level: 'admin_access',
          access_through: 'admin_access',
        },
      ],
      pagination: { limit: 500, offset: 0, total: 1, has_more: false },
      user_access_level: 'admin',
    };
    const get = vi
      .spyOn(projectService, 'getProjects')
      .mockResolvedValue(response);

    const { result, rerender } = renderHook(
      ({ enabled }) => useProjectCandidates('on', enabled),
      {
        initialProps: { enabled: false },
      }
    );
    expect(get).not.toHaveBeenCalled();

    rerender({ enabled: true });
    await waitFor(() => expect(result.current.projects).toHaveLength(1));
    expect(get).toHaveBeenCalledWith({ limit: 500, search: 'on' });
    expect(result.current.projects[0]).toEqual({
      project_hash: 'proj-1',
      project_name: 'One',
      project_description: null,
    });
  });
});
