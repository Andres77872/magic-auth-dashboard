/**
 * Contract tests for `projectService` against api.auth `src/routes/projects.py`:
 * paths, encodings, query parameters and response normalisation.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { projectService } from '@/services/project.service';

const apiClient = vi.hoisted(() => ({
  get: vi.fn(),
  postForm: vi.fn(),
  putForm: vi.fn(),
  patchForm: vi.fn(),
  delete: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
}));

vi.mock('@/services/api.client', () => ({ apiClient }));

const pagination = { limit: 25, offset: 0, total: 1, has_more: false };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('projectService.getProjects', () => {
  it('requests the API maximum by default and drops empty search', async () => {
    apiClient.get.mockResolvedValue({
      success: true,
      projects: [],
      pagination,
      user_access_level: 'admin',
    });

    await projectService.getProjects({ search: '   ' });

    expect(apiClient.get).toHaveBeenCalledWith('/projects', { limit: 500 });
  });

  it('trims search and keeps an explicit limit and offset of 0', async () => {
    apiClient.get.mockResolvedValue({
      success: true,
      projects: [],
      pagination,
      user_access_level: 'admin',
    });

    await projectService.getProjects({ limit: 20, offset: 0, search: ' crm ' });

    expect(apiClient.get).toHaveBeenCalledWith('/projects', {
      limit: 20,
      offset: 0,
      search: 'crm',
    });
  });
});

describe('projectService.getProject', () => {
  it('encodes the hash and drops the unreliable statistics block', async () => {
    apiClient.get.mockResolvedValue({
      success: true,
      project: {
        project_hash: 'p/1',
        project_name: 'CRM',
        project_description: null,
        created_at: null,
        updated_at: null,
      },
      user_access: {
        permissions: ['admin'],
        access_level: 'admin_access',
        user_groups: ['admin_1'],
      },
      statistics: { total_users: 'garbage' },
      project_groups: [
        { group_hash: 'PG-1', group_name: 'default_1', description: null },
      ],
    });

    const result = await projectService.getProject('p/1');

    expect(apiClient.get).toHaveBeenCalledWith('/projects/p%2F1', undefined);
    expect(result).toEqual({
      project: {
        project_hash: 'p/1',
        project_name: 'CRM',
        project_description: null,
        created_at: null,
        updated_at: null,
      },
      user_access: {
        permissions: ['admin'],
        access_level: 'admin_access',
        user_groups: ['admin_1'],
      },
      project_groups: [
        { group_hash: 'PG-1', group_name: 'default_1', description: null },
      ],
    });
    expect(result).not.toHaveProperty('statistics');
  });

  it('rejects a response without the project or access block', async () => {
    apiClient.get.mockResolvedValue({ success: true, project: null });

    await expect(projectService.getProject('p1')).rejects.toThrow('incomplete');
  });
});

describe('projectService writes', () => {
  const info = {
    project_hash: 'p1',
    project_name: 'CRM',
    project_description: null,
    created_at: null,
    updated_at: null,
  };

  it('creates with form fields and omits an empty description', async () => {
    apiClient.postForm.mockResolvedValue({ success: true, project: info });

    await expect(
      projectService.createProject({
        project_name: ' CRM ',
        project_description: '  ',
      })
    ).resolves.toEqual(info);
    expect(apiClient.postForm).toHaveBeenCalledWith('/projects', {
      project_name: 'CRM',
      project_description: undefined,
    });
  });

  it('updates with form fields; empty values are omitted so the API keeps them', async () => {
    apiClient.putForm.mockResolvedValue({ success: true, project: info });

    await projectService.updateProject('p1', {
      project_name: 'CRM 2',
      project_description: '',
    });

    expect(apiClient.putForm).toHaveBeenCalledWith('/projects/p1', {
      project_name: 'CRM 2',
      project_description: undefined,
    });
  });

  it('returns the deletion warning', async () => {
    apiClient.delete.mockResolvedValue({
      success: true,
      deleted_project: info,
      warning: 'All user group access to this project has been revoked',
    });

    await expect(projectService.deleteProject('p1')).resolves.toEqual({
      deleted_project: info,
      warning: 'All user group access to this project has been revoked',
    });
    expect(apiClient.delete).toHaveBeenCalledWith('/projects/p1');
  });
});

describe('projectService reads', () => {
  it('passes the member user_type filter and page', async () => {
    apiClient.get.mockResolvedValue({
      success: true,
      members: [],
      pagination,
      statistics: { admin_users: 3 },
    });

    const page = await projectService.getProjectMembers('p1', {
      limit: 25,
      offset: 25,
      user_type: 'admin',
    });

    expect(apiClient.get).toHaveBeenCalledWith('/projects/p1/members', {
      limit: 25,
      offset: 25,
      user_type: 'admin',
    });
    // Per-type statistics only cover the current page, so they are not exposed.
    expect(page).toEqual({ members: [], pagination });
  });

  it('fails loudly when a paginated route has no pagination', async () => {
    apiClient.get.mockResolvedValue({ success: true, user_groups: [] });

    await expect(projectService.getProjectGroups('p1')).rejects.toThrow(
      'pagination'
    );
  });

  it('maps activity rows without internal ids or network details', async () => {
    apiClient.get.mockResolvedValue({
      success: true,
      activities: [
        {
          id: 42,
          user_id: 'internal-user',
          project_id: 'internal-project',
          activity_type: 'user_login',
          details: '{"message":"ok"}',
          ip_address: '10.0.0.1',
          user_agent: 'curl',
          created_at: '2026-09-01T10:00:00',
          username: 'ana',
          user_hash: 'usr-ana',
          target_username: null,
          target_user_hash: null,
          user_group_name: null,
          activity_name: 'User Login',
        },
      ],
      pagination: { limit: 8, offset: 0, total: 12, has_more: true },
      filters: { activity_type: null, days: 30 },
    });

    const page = await projectService.getProjectActivity('p1', {
      limit: 8,
      days: 30,
    });

    expect(apiClient.get).toHaveBeenCalledWith('/projects/p1/activity', {
      limit: 8,
      days: 30,
    });
    expect(page.days).toBe(30);
    expect(page.pagination.total).toBe(12);
    expect(page.activities).toEqual([
      {
        id: '42',
        activityType: 'user_login',
        activityName: 'User Login',
        details: '{"message":"ok"}',
        createdAt: '2026-09-01T10:00:00',
        actor: { username: 'ana', userHash: 'usr-ana' },
        target: null,
        userGroupName: null,
      },
    ]);
  });
});
