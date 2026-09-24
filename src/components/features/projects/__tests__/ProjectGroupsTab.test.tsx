import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProjectGroupsTab } from '../ProjectGroupsTab';
import type { ProjectGroupInfo } from '@/types/project.types';
import type { ProjectGroup, UserGroup } from '@/types/group.types';

const mocks = vi.hoisted(() => ({
  useProjectUserGroups: vi.fn(),
  useProjectGroupOptions: vi.fn(),
  addToProjectGroups: vi.fn(),
  removeFromProjectGroup: vi.fn(),
  refetchUserGroups: vi.fn(),
  showToast: vi.fn(),
}));

vi.mock('@/hooks/useProjectDetails', () => ({
  useProjectUserGroups: mocks.useProjectUserGroups,
  useProjectGroupOptions: mocks.useProjectGroupOptions,
  useProjectGroupMembership: () => ({
    pending: null,
    addToProjectGroups: mocks.addToProjectGroups,
    removeFromProjectGroup: mocks.removeFromProjectGroup,
  }),
}));
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ showToast: mocks.showToast }),
}));

const defaultGroup: ProjectGroupInfo = {
  group_hash: 'PG-1',
  group_name: 'default_p1',
  description: 'Default project group',
};

function userGroup(name: string, memberCount: number): UserGroup {
  return {
    group_hash: `UG-${name}`,
    group_name: name,
    description: null,
    member_count: memberCount,
    created_at: null,
  };
}

const otherProjectGroup: ProjectGroup = {
  group_hash: 'PG-2',
  group_name: 'Partner apps',
  description: null,
  project_count: 3,
  created_at: null,
};

function renderTab(
  projectGroups: ProjectGroupInfo[] = [defaultGroup],
  onChange = vi.fn().mockResolvedValue(undefined)
): void {
  render(
    <MemoryRouter>
      <ProjectGroupsTab
        projectHash="proj-1"
        projectName="CRM"
        projectGroups={projectGroups}
        onProjectGroupsChange={onChange}
      />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.refetchUserGroups.mockResolvedValue(undefined);
  mocks.useProjectUserGroups.mockReturnValue({
    userGroups: [userGroup('admin_p1', 1), userGroup('marketing', 0)],
    total: 2,
    isLoading: false,
    isRefreshing: false,
    error: null,
    refetch: mocks.refetchUserGroups,
  });
  mocks.useProjectGroupOptions.mockReturnValue({
    projectGroups: [
      { ...otherProjectGroup, group_hash: 'PG-1', group_name: 'default_p1' },
      otherProjectGroup,
    ],
    isLoading: false,
    isRefreshing: false,
    error: null,
    refetch: vi.fn(),
  });
});

describe('ProjectGroupsTab', () => {
  it('explains the access chain and lists user groups with access', () => {
    renderTab();

    expect(screen.getByText('In a project group')).toBeInTheDocument();
    expect(
      screen.getByText('2 user groups can reach the project.')
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'marketing' })).toHaveAttribute(
      'href',
      '/groups/UG-marketing'
    );
    expect(screen.getByText('Admin group')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'default_p1' })).toHaveAttribute(
      'href',
      '/groups/project-groups/PG-1'
    );
  });

  it('warns before removing the project from its default project group, then refreshes', async () => {
    const onChange = vi.fn().mockResolvedValue(undefined);
    mocks.removeFromProjectGroup.mockResolvedValue(undefined);
    renderTab([defaultGroup], onChange);

    fireEvent.click(
      screen.getByRole('button', { name: 'Remove from default_p1' })
    );
    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByText(/administrators would lose admin scope/)
    ).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Remove' }));

    await waitFor(() =>
      expect(mocks.removeFromProjectGroup).toHaveBeenCalledWith('PG-1')
    );
    await waitFor(() => expect(onChange).toHaveBeenCalled());
    expect(mocks.refetchUserGroups).toHaveBeenCalled();
    expect(mocks.showToast).toHaveBeenCalledWith(
      'Removed from default_p1.',
      'success'
    );
  });

  it('adds the project to project groups it is not in yet', async () => {
    const onChange = vi.fn().mockResolvedValue(undefined);
    mocks.addToProjectGroups.mockResolvedValue({ added: ['PG-2'], failed: [] });
    renderTab([defaultGroup], onChange);

    fireEvent.click(
      screen.getByRole('button', { name: 'Add to project group' })
    );
    const dialog = await screen.findByRole('dialog');
    // The project's current groups are not offered.
    expect(within(dialog).queryByText('default_p1')).not.toBeInTheDocument();
    fireEvent.click(within(dialog).getByLabelText(/Partner apps/));
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Add to group' })
    );

    await waitFor(() =>
      expect(mocks.addToProjectGroups).toHaveBeenCalledWith(['PG-2'])
    );
    await waitFor(() => expect(onChange).toHaveBeenCalled());
    expect(mocks.showToast).toHaveBeenCalledWith(
      'Added to 1 project group.',
      'success'
    );
  });

  it('keeps going when user groups fail to load, marking those steps unknown', () => {
    mocks.useProjectUserGroups.mockReturnValue({
      userGroups: [],
      total: 0,
      isLoading: false,
      isRefreshing: false,
      error: 'Admin permission required to list project groups',
      refetch: mocks.refetchUserGroups,
    });
    renderTab();

    expect(
      screen.getAllByText('User groups with access could not be loaded.')
    ).toHaveLength(2);
    expect(
      screen.getByText(/Admin permission required to list project groups/)
    ).toBeInTheDocument();
  });
});
