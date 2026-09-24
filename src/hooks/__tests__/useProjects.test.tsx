import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useProjectMutations, useProjects } from '../useProjects';
import type {
  ProjectListResponse,
  ProjectSummary,
} from '@/types/project.types';

const mockService = vi.hoisted(() => ({
  getProjects: vi.fn(),
  createProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
}));

vi.mock('@/services/project.service', () => ({
  PROJECT_LIST_MAX_LIMIT: 500,
  projectService: mockService,
}));

function project(
  name: string,
  overrides: Partial<ProjectSummary> = {}
): ProjectSummary {
  return {
    project_hash: `proj-${name.toLowerCase()}`,
    project_name: name,
    project_description: null,
    access_level: 'admin_access',
    access_through: 'admin_access',
    ...overrides,
  };
}

function listResponse(
  projects: ProjectSummary[],
  pagination: Partial<ProjectListResponse['pagination']> = {}
): ProjectListResponse {
  return {
    success: true,
    projects,
    // Root callers get total = page length and has_more = false.
    pagination: {
      limit: 500,
      offset: 0,
      total: projects.length,
      has_more: false,
      ...pagination,
    },
    user_access_level: 'admin',
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useProjects', () => {
  it('loads one window of up to 500 projects and never forwards the page offset', async () => {
    mockService.getProjects.mockResolvedValue(
      listResponse([project('Bravo'), project('alpha'), project('Charlie')])
    );

    const { result } = renderHook(() =>
      useProjects({ search: '  crm ', offset: 25, limit: 25 })
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(mockService.getProjects).toHaveBeenCalledWith({
      limit: 500,
      offset: 0,
      search: 'crm',
    });
  });

  it('sorts by name case-insensitively and pages in the browser', async () => {
    mockService.getProjects.mockResolvedValue(
      listResponse([
        project('Charlie'),
        project('alpha'),
        project('Bravo'),
        project('delta'),
      ])
    );

    const { result, rerender } = renderHook(
      (props: { offset: number }) =>
        useProjects({ offset: props.offset, limit: 2 }),
      {
        initialProps: { offset: 0 },
      }
    );

    await waitFor(() => expect(result.current.total).toBe(4));
    expect(result.current.projects.map((p) => p.project_name)).toEqual([
      'alpha',
      'Bravo',
    ]);

    rerender({ offset: 2 });
    expect(result.current.projects.map((p) => p.project_name)).toEqual([
      'Charlie',
      'delta',
    ]);
    // One request serves every page.
    expect(mockService.getProjects).toHaveBeenCalledTimes(1);
  });

  it('sorts by access level (descending here), breaking ties by ascending name', async () => {
    mockService.getProjects.mockResolvedValue(
      listResponse([
        project('Zeta', { access_level: 'admin_access' }),
        project('Alpha', { access_level: 'group_access' }),
        project('Beta', { access_level: 'admin_access' }),
      ])
    );

    const { result } = renderHook(() =>
      useProjects({ sortBy: 'access_level', sortOrder: 'desc' })
    );

    await waitFor(() => expect(result.current.total).toBe(3));
    expect(result.current.projects.map((p) => p.project_name)).toEqual([
      'Alpha',
      'Beta',
      'Zeta',
    ]);
  });

  it('clamps an offset past the end to the last page', async () => {
    mockService.getProjects.mockResolvedValue(
      listResponse([project('A'), project('B'), project('C')])
    );

    const { result } = renderHook(() => useProjects({ offset: 50, limit: 2 }));

    await waitFor(() => expect(result.current.total).toBe(3));
    expect(result.current.offset).toBe(2);
    expect(result.current.projects.map((p) => p.project_name)).toEqual(['C']);
  });

  it('flags a full 500-row window as possibly truncated (root pagination never reports more)', async () => {
    const many = Array.from({ length: 500 }, (_, index) =>
      project(`P${index}`)
    );
    mockService.getProjects.mockResolvedValue(listResponse(many));

    const { result } = renderHook(() => useProjects());

    await waitFor(() => expect(result.current.total).toBe(500));
    expect(result.current.truncated).toBe(true);
  });

  it('trusts has_more for admin callers', async () => {
    mockService.getProjects.mockResolvedValue(
      listResponse([project('A')], { total: 900, has_more: true })
    );

    const { result } = renderHook(() => useProjects());

    await waitFor(() => expect(result.current.total).toBe(1));
    expect(result.current.truncated).toBe(true);
  });

  it('is not truncated for a short, complete list', async () => {
    mockService.getProjects.mockResolvedValue(
      listResponse([project('A'), project('B')])
    );

    const { result } = renderHook(() => useProjects());

    await waitFor(() => expect(result.current.total).toBe(2));
    expect(result.current.truncated).toBe(false);
  });

  it('surfaces API errors', async () => {
    mockService.getProjects.mockRejectedValue(new Error('Session expired'));

    const { result } = renderHook(() => useProjects());

    await waitFor(() => expect(result.current.error).toBe('Session expired'));
    expect(result.current.projects).toEqual([]);
  });
});

describe('useProjectMutations', () => {
  it('tracks the pending mutation and resolves with the API result', async () => {
    let resolveDelete: (value: {
      deleted_project: null;
      warning: string;
    }) => void = () => undefined;
    mockService.deleteProject.mockReturnValue(
      new Promise((resolve) => {
        resolveDelete = resolve;
      })
    );

    const { result } = renderHook(() => useProjectMutations());
    let pendingPromise: Promise<unknown> = Promise.resolve();
    act(() => {
      pendingPromise = result.current.deleteProject('proj-a');
    });
    expect(result.current.pending).toBe('delete');

    await act(async () => {
      resolveDelete({ deleted_project: null, warning: 'Access revoked' });
      await pendingPromise;
    });
    expect(result.current.pending).toBeNull();
    expect(mockService.deleteProject).toHaveBeenCalledWith('proj-a');
  });

  it('rethrows failures and clears the pending state', async () => {
    mockService.updateProject.mockRejectedValue(
      new Error('Admin permission required')
    );
    const { result } = renderHook(() => useProjectMutations());

    await act(async () => {
      await expect(
        result.current.updateProject('proj-a', { project_name: 'New' })
      ).rejects.toThrow('Admin permission required');
    });
    expect(result.current.pending).toBeNull();
  });
});
