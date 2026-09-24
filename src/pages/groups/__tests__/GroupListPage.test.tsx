/* eslint-disable @typescript-eslint/unbound-method -- mock method refs in expect() assertions are not invoked. */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { groupService } from '@/services/group.service';
import { projectGroupService } from '@/services/project-group.service';
import type { ProjectGroup, UserGroup } from '@/types/group.types';
import { currentLocation, renderGroupRoutes } from './render';

const auth = vi.hoisted(() => ({ isRoot: true }));
const toast = vi.hoisted(() => ({ showToast: vi.fn() }));

vi.mock('@/hooks/useUserType', () => ({
  useUserType: () => ({ isRoot: auth.isRoot }),
}));
vi.mock('@/hooks/useToast', () => ({
  useToast: () => toast,
  default: () => toast,
}));

const userGroups: UserGroup[] = [
  {
    group_hash: 'UG-1',
    group_name: 'admin_abc',
    description: 'Project administrators',
    member_count: 2,
    created_at: '2026-01-02T00:00:00',
  },
  {
    group_hash: 'UG-2',
    group_name: 'support',
    description: null,
    member_count: 0,
    created_at: '2026-01-03T00:00:00',
  },
];

const projectGroups: ProjectGroup[] = [
  {
    group_hash: 'PG-1',
    group_name: 'default_abc',
    description: 'Default project group for abc',
    project_count: 1,
    created_at: null,
  },
  {
    group_hash: 'PG-2',
    group_name: 'mobile',
    description: 'Phone apps',
    project_count: 4,
    created_at: null,
  },
];

beforeEach(() => {
  vi.restoreAllMocks();
  toast.showToast.mockReset();
  auth.isRoot = true;
  vi.spyOn(groupService, 'listGroups').mockResolvedValue({
    groups: userGroups,
    total: 2,
  });
  vi.spyOn(projectGroupService, 'listProjectGroups').mockResolvedValue({
    projectGroups,
    total: 2,
  });
});

describe('GroupListPage — user groups (default tab)', () => {
  it('reads like its own page: title, subtitle count and one primary action', async () => {
    renderGroupRoutes('/groups');

    expect(
      screen.getByRole('heading', { level: 1, name: 'User groups' })
    ).toBeInTheDocument();
    expect(await screen.findByText('admin_abc')).toBeInTheDocument();
    expect(screen.getByText(/^2 groups ·/)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Create user group' })
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Access Control Architecture/)
    ).not.toBeInTheDocument();
    expect(projectGroupService.listProjectGroups).not.toHaveBeenCalled();
  });

  it('marks auto-created project groups quietly and shows member counts', async () => {
    renderGroupRoutes('/groups?tab=user-groups');

    const row = (await screen.findByText('admin_abc')).closest('tr');
    expect(row).not.toBeNull();
    expect(
      within(row as HTMLElement).getByText('Project default')
    ).toBeInTheDocument();
    expect(within(row as HTMLElement).getByText('2')).toBeInTheDocument();
    const other = screen.getByText('support').closest('tr');
    expect(
      within(other as HTMLElement).queryByText('Project default')
    ).not.toBeInTheDocument();
  });

  it('flags admin_ groups as root-only for admins', async () => {
    auth.isRoot = false;
    renderGroupRoutes('/groups');

    const row = (await screen.findByText('admin_abc')).closest('tr');
    expect(within(row as HTMLElement).getByText('Admin group')).toHaveAttribute(
      'title',
      'Only root users can change this group'
    );
    expect(
      within(
        screen.getByText('support').closest('tr') as HTMLElement
      ).queryByText('Admin group')
    ).toBeNull();
  });

  it('searches on the server and drops the total, which the backend does not filter', async () => {
    renderGroupRoutes('/groups');
    await screen.findByText('admin_abc');
    expect(
      screen.getByText('Showing 1–2 of 2 user groups')
    ).toBeInTheDocument();

    fireEvent.change(
      screen.getByRole('searchbox', { name: 'Search user groups by name' }),
      {
        target: { value: 'adm' },
      }
    );

    await waitFor(() =>
      expect(groupService.listGroups).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: 'adm', offset: 0 })
      )
    );
    await waitFor(() =>
      expect(screen.getByText('Showing 1–2 user groups')).toBeInTheDocument()
    );
    expect(screen.queryByText(/^2 groups ·/)).not.toBeInTheDocument();
  });

  it('creates a user group and opens it', async () => {
    const create = vi.spyOn(groupService, 'createUserGroup').mockResolvedValue({
      group_hash: 'UG-9',
      group_name: 'ops',
      description: null,
      member_count: null,
      created_at: null,
    });
    vi.spyOn(groupService, 'getGroup').mockReturnValue(
      new Promise(() => undefined)
    );
    renderGroupRoutes('/groups');

    fireEvent.click(screen.getByRole('button', { name: 'Create user group' }));
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'ops' },
    });
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Create user group',
      })
    );

    await waitFor(() => expect(currentLocation()).toBe('/groups/UG-9'));
    expect(create).toHaveBeenCalledWith({ group_name: 'ops', description: '' });
    expect(toast.showToast).toHaveBeenCalledWith(
      'Created user group ops.',
      'success'
    );
  });

  it('shows an actionable error when the list fails', async () => {
    vi.spyOn(groupService, 'listGroups').mockRejectedValue(
      new Error('Admin or manage_users permission required')
    );
    renderGroupRoutes('/groups');

    expect(
      await screen.findByText("User groups couldn't be loaded")
    ).toBeInTheDocument();
    expect(
      screen.getByText('Admin or manage_users permission required')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Try Again/i })
    ).toBeInTheDocument();
  });
});

describe('GroupListPage — project groups tab', () => {
  it('switches title, subtitle and primary action', async () => {
    renderGroupRoutes('/groups?tab=project-groups');

    expect(
      screen.getByRole('heading', { level: 1, name: 'Project groups' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Create project group' })
    ).toBeInTheDocument();
    expect(await screen.findByText('mobile')).toBeInTheDocument();
    expect(groupService.listGroups).not.toHaveBeenCalled();

    const defaultRow = screen.getByText('default_abc').closest('tr');
    expect(
      within(defaultRow as HTMLElement).getByText('Project default')
    ).toBeInTheDocument();
    expect(
      within(screen.getByText('mobile').closest('tr') as HTMLElement).getByText(
        '4'
      )
    ).toBeInTheDocument();
  });

  it('keeps the total while searching because the project-group count respects search', async () => {
    renderGroupRoutes('/groups?tab=project-groups');
    await screen.findByText('mobile');

    fireEvent.change(
      screen.getByRole('searchbox', { name: 'Search project groups by name' }),
      {
        target: { value: 'mob' },
      }
    );

    await waitFor(() =>
      expect(projectGroupService.listProjectGroups).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: 'mob' })
      )
    );
    expect(
      screen.getByText('Showing 1–2 of 2 project groups')
    ).toBeInTheDocument();
  });

  it('falls back to user groups for an unknown tab value', async () => {
    renderGroupRoutes('/groups?tab=nope');
    expect(
      screen.getByRole('heading', { level: 1, name: 'User groups' })
    ).toBeInTheDocument();
    await screen.findByText('support');
  });
});

describe('ProjectGroupCreatePage (legacy /groups/project-groups/create)', () => {
  it('opens the create dialog over the list and returns to the list when dismissed', async () => {
    renderGroupRoutes('/groups/project-groups/create');

    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByRole('heading', { name: 'Create project group' })
    ).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    await waitFor(() =>
      expect(currentLocation()).toBe('/groups?tab=project-groups')
    );
    expect(
      screen.getByRole('heading', { level: 1, name: 'Project groups' })
    ).toBeInTheDocument();
  });

  it('opens the new project group after creating it', async () => {
    vi.spyOn(projectGroupService, 'createProjectGroup').mockResolvedValue({
      group_hash: 'PG-9',
      group_name: 'web',
      description: null,
      project_count: 0,
      created_at: null,
    });
    vi.spyOn(projectGroupService, 'getProjectGroup').mockReturnValue(
      new Promise(() => undefined)
    );
    vi.spyOn(
      projectGroupService,
      'getUserGroupsForProjectGroup'
    ).mockReturnValue(new Promise(() => undefined));
    renderGroupRoutes('/groups/project-groups/create');

    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByLabelText('Name'), {
      target: { value: 'web' },
    });
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Create project group' })
    );

    await waitFor(() =>
      expect(currentLocation()).toBe('/groups/project-groups/PG-9')
    );
  });
});
