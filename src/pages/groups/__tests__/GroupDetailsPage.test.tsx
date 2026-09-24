/* eslint-disable @typescript-eslint/unbound-method -- mock method refs in expect() assertions are not invoked. */
import '@/components/features/groups/__tests__/setup-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { groupService } from '@/services/group.service';
import { permissionAssignmentsService } from '@/services/permission-assignments.service';
import type { UserGroupDetails } from '@/types/group.types';
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

function details(name = 'support'): UserGroupDetails {
  return {
    group: {
      group_hash: 'UG-1',
      group_name: name,
      description: 'Support engineers',
      member_count: 2,
      created_at: '2026-01-02T00:00:00',
    },
    statistics: {
      total_members: 2,
      total_projects: 5,
      total_project_groups: 1,
    },
    reachableProjects: [],
  };
}

beforeEach(() => {
  vi.restoreAllMocks();
  toast.showToast.mockReset();
  auth.isRoot = true;
  vi.spyOn(groupService, 'getGroup').mockResolvedValue(details());
  vi.spyOn(groupService, 'getGroupMembers').mockResolvedValue({
    members: [
      {
        user_hash: 'usr-1',
        username: 'ana',
        email: 'ana@example.com',
        user_type: 'admin',
        is_active: true,
        joined_at: '2026-02-01T00:00:00Z',
      },
      {
        user_hash: 'usr-2',
        username: 'bo',
        email: null,
        user_type: 'consumer',
        is_active: true,
        joined_at: null,
      },
    ],
    total: 2,
  });
  vi.spyOn(groupService, 'listProjectGroupGrants').mockResolvedValue([
    {
      group_hash: 'PG-1',
      group_name: 'default_abc',
      group_description: 'Default project group for abc',
      created_at: null,
      is_active: true,
      granted_at: '2026-01-05T00:00:00',
    },
  ]);
  vi.spyOn(
    permissionAssignmentsService,
    'getUserGroupPermissionGroups'
  ).mockResolvedValue([
    {
      id: 'pg-internal',
      group_hash: 'GPG-1',
      group_name: 'billing_read',
      group_display_name: 'Billing read',
      group_category: 'billing',
      assigned_at: null,
    },
  ]);
});

describe('GroupDetailsPage', () => {
  it('shows the header, summary counts and sentence-case section tabs', async () => {
    renderGroupRoutes('/groups/UG-1');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'support' })
    ).toBeInTheDocument();
    expect(screen.getByText('Support engineers')).toBeInTheDocument();
    const summary = screen.getByRole('region', { name: 'Summary' });
    expect(within(summary).getByText('5')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Members/ })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(
      screen.getByRole('tab', { name: /Project groups/ })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('tab', { name: /Permission groups/ })
    ).toBeInTheDocument();
  });

  it('lists members with shared user-type badges and a relationship explanation', async () => {
    renderGroupRoutes('/groups/UG-1');

    expect(await screen.findByText('ana')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
    expect(screen.getByText('Consumer')).toBeInTheDocument();
    expect(
      screen.getByText(
        /Members can sign in to every project this group reaches/
      )
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add members' })).toBeEnabled();
    expect(groupService.getGroupMembers).toHaveBeenCalledWith('UG-1', {
      limit: 25,
      offset: 0,
    });
  });

  it('removes a member only after confirmation and refreshes the counts', async () => {
    const remove = vi
      .spyOn(groupService, 'removeMemberFromGroup')
      .mockResolvedValue(undefined);
    renderGroupRoutes('/groups/UG-1');

    fireEvent.click(
      await screen.findByRole('button', { name: 'Remove ana from support' })
    );
    const dialog = await screen.findByRole('dialog');
    expect(remove).not.toHaveBeenCalled();
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Remove member' })
    );

    await waitFor(() => expect(remove).toHaveBeenCalledWith('UG-1', 'usr-1'));
    expect(toast.showToast).toHaveBeenCalledWith(
      'Removed ana from support.',
      'success'
    );
    await waitFor(() => expect(groupService.getGroup).toHaveBeenCalledTimes(2));
  });

  it('keeps the tab in the URL and shows project-group grants without project counts', async () => {
    renderGroupRoutes('/groups/UG-1');
    fireEvent.click(await screen.findByRole('tab', { name: /Project groups/ }));

    await waitFor(() =>
      expect(currentLocation()).toBe('/groups/UG-1?tab=project-groups')
    );
    expect(await screen.findByText('default_abc')).toBeInTheDocument();
    expect(
      screen.getByText(
        /Members of this group can sign in to every project in these project groups/
      )
    ).toBeInTheDocument();
    expect(screen.queryByText(/undefined/)).not.toBeInTheDocument();
  });

  it('explains that permission-group assignments do not change access tokens', async () => {
    renderGroupRoutes('/groups/UG-1?tab=permissions');

    expect(await screen.findByText('Billing read')).toBeInTheDocument();
    expect(
      screen.getByText(
        /Access tokens only carry the permissions of each user’s global role/
      )
    ).toBeInTheDocument();
  });

  it('lets admins view but not change admin_ groups', async () => {
    auth.isRoot = false;
    vi.spyOn(groupService, 'getGroup').mockResolvedValue(details('admin_abc'));
    renderGroupRoutes('/groups/UG-1');

    expect(
      await screen.findByText(/Only root users can change/)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit' })).toBeDisabled();
    expect(
      await screen.findByRole('button', { name: 'Add members' })
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Remove ana from admin_abc' })
    ).toBeDisabled();
  });

  it('requires typing the name to delete a group that has members', async () => {
    const del = vi
      .spyOn(groupService, 'deleteGroup')
      .mockResolvedValue(undefined);
    vi.spyOn(groupService, 'listGroups').mockResolvedValue({
      groups: [],
      total: 0,
    });
    renderGroupRoutes('/groups/UG-1');

    fireEvent.keyDown(
      await screen.findByRole('button', { name: 'More actions' }),
      { key: 'Enter' }
    );
    fireEvent.click(
      await screen.findByRole('menuitem', { name: 'Delete user group' })
    );

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/has 2 members/)).toBeInTheDocument();
    const confirm = within(dialog).getByRole('button', {
      name: 'Delete user group',
    });
    expect(confirm).toBeDisabled();

    fireEvent.change(within(dialog).getByLabelText(/to confirm/), {
      target: { value: 'support' },
    });
    fireEvent.click(confirm);

    await waitFor(() => expect(del).toHaveBeenCalledWith('UG-1'));
    await waitFor(() =>
      expect(currentLocation()).toBe('/groups?tab=user-groups')
    );
  });

  it('shows the backend error with a retry when the group cannot be loaded', async () => {
    vi.spyOn(groupService, 'getGroup').mockRejectedValue(
      new Error('User group not found')
    );
    renderGroupRoutes('/groups/UG-404');

    expect(
      await screen.findByText("This user group couldn't be loaded")
    ).toBeInTheDocument();
    expect(screen.getByText('User group not found')).toBeInTheDocument();
  });
});
