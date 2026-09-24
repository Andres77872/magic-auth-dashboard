/* eslint-disable @typescript-eslint/unbound-method -- mock method refs in expect() assertions are not invoked. */
import '@/components/features/groups/__tests__/setup-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { projectGroupService } from '@/services/project-group.service';
import { groupService } from '@/services/group.service';
import type {
  ProjectGroupDetails,
  UserGroupWithAccess,
} from '@/types/group.types';
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

const details: ProjectGroupDetails = {
  projectGroup: {
    group_hash: 'PG-1',
    group_name: 'mobile',
    description: 'Phone apps',
    project_count: 2,
    created_at: '2026-01-02T00:00:00',
  },
  projects: [
    {
      project_hash: 'proj-1',
      project_name: 'iOS app',
      project_description: 'Swift',
    },
    {
      project_hash: 'proj-2',
      project_name: 'Android app',
      project_description: null,
    },
  ],
};

const adminGroup: UserGroupWithAccess = {
  group_hash: 'UG-1',
  group_name: 'admin_abc',
  description: 'Project administrators',
  member_count: 1,
  created_at: null,
  granted_at: '2026-01-03T00:00:00',
};
const supportGroup: UserGroupWithAccess = {
  group_hash: 'UG-2',
  group_name: 'support',
  description: null,
  member_count: 4,
  created_at: null,
  granted_at: null,
};

beforeEach(() => {
  vi.restoreAllMocks();
  toast.showToast.mockReset();
  auth.isRoot = true;
  vi.spyOn(projectGroupService, 'getProjectGroup').mockResolvedValue(details);
  vi.spyOn(
    projectGroupService,
    'getUserGroupsForProjectGroup'
  ).mockResolvedValue({
    userGroups: [adminGroup, supportGroup],
    uncheckedCount: 0,
  });
});

describe('ProjectGroupDetailsPage', () => {
  it('lists the projects from the group details and explains the relationship', async () => {
    renderGroupRoutes('/groups/project-groups/PG-1');

    expect(
      await screen.findByRole('heading', { level: 1, name: 'mobile' })
    ).toBeInTheDocument();
    expect(screen.getByText('iOS app')).toBeInTheDocument();
    expect(screen.getByText('Android app')).toBeInTheDocument();
    expect(
      screen.getByText(
        /Members of every user group granted this project group can sign in to these projects/
      )
    ).toBeInTheDocument();
    expect(projectGroupService.getProjectGroup).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(
        screen.getByRole('tab', { name: /User groups/ })
      ).toHaveTextContent('2')
    );
  });

  it('removes a project after confirmation and reloads the group', async () => {
    const remove = vi
      .spyOn(projectGroupService, 'removeProjectFromGroup')
      .mockResolvedValue({ success: true });
    renderGroupRoutes('/groups/project-groups/PG-1');

    fireEvent.click(
      await screen.findByRole('button', { name: 'Remove iOS app from mobile' })
    );
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Remove project' })
    );

    await waitFor(() => expect(remove).toHaveBeenCalledWith('PG-1', 'proj-1'));
    await waitFor(() =>
      expect(projectGroupService.getProjectGroup).toHaveBeenCalledTimes(2)
    );
  });

  it('shows the user groups with access and blocks admin_ changes for non-root operators', async () => {
    auth.isRoot = false;
    renderGroupRoutes('/groups/project-groups/PG-1?tab=user-groups');

    expect(await screen.findByText('support')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Revoke mobile from admin_abc' })
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Revoke mobile from support' })
    ).toBeEnabled();
  });

  it('revokes a user group grant from the project group side', async () => {
    const revoke = vi
      .spyOn(groupService, 'revokeProjectGroupAccess')
      .mockResolvedValue(undefined);
    renderGroupRoutes('/groups/project-groups/PG-1?tab=user-groups');

    fireEvent.click(
      await screen.findByRole('button', { name: 'Revoke mobile from support' })
    );
    fireEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', {
        name: 'Revoke access',
      })
    );

    await waitFor(() => expect(revoke).toHaveBeenCalledWith('UG-2', 'PG-1'));
    expect(toast.showToast).toHaveBeenCalledWith(
      'Revoked mobile from support.',
      'success'
    );
  });

  it('warns when some user groups could not be checked', async () => {
    vi.spyOn(
      projectGroupService,
      'getUserGroupsForProjectGroup'
    ).mockResolvedValue({
      userGroups: [supportGroup],
      uncheckedCount: 3,
    });
    renderGroupRoutes('/groups/project-groups/PG-1?tab=user-groups');

    expect(
      await screen.findByText(/3 user groups couldn’t be checked/)
    ).toBeInTheDocument();
  });
});

describe('ProjectGroupEditPage (legacy /groups/project-groups/edit/:hash)', () => {
  it('opens the edit dialog on the details page and surfaces a failing update', async () => {
    const update = vi
      .spyOn(projectGroupService, 'updateProjectGroup')
      .mockRejectedValue(new Error('Update failed'));
    renderGroupRoutes('/groups/project-groups/edit/PG-1');

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByLabelText('Name')).toHaveValue('mobile');
    fireEvent.change(within(dialog).getByLabelText('Name'), {
      target: { value: 'mobile-apps' },
    });
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Save changes' })
    );

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'Update failed'
    );
    expect(update).toHaveBeenCalledWith('PG-1', {
      group_name: 'mobile-apps',
      description: 'Phone apps',
    });
    expect(currentLocation()).toBe('/groups/project-groups/edit/PG-1');
  });

  it('returns to the details URL when the dialog is closed', async () => {
    renderGroupRoutes('/groups/project-groups/edit/PG-1');

    fireEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', {
        name: 'Cancel',
      })
    );

    await waitFor(() =>
      expect(currentLocation()).toBe('/groups/project-groups/PG-1')
    );
  });
});
