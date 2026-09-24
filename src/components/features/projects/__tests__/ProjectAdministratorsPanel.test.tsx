import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProjectAdministratorsPanel } from '../ProjectAdministratorsPanel';
import type { GroupMember, UserGroup } from '@/types/group.types';

const mocks = vi.hoisted(() => ({
  useProjectUserGroups: vi.fn(),
  useProjectAdministrators: vi.fn(),
  addAdministrator: vi.fn(),
  removeAdministrator: vi.fn(),
  searchUsers: vi.fn(),
  showToast: vi.fn(),
}));

vi.mock('@/hooks/useProjectDetails', async () => {
  const actual = await vi.importActual<
    typeof import('@/hooks/useProjectDetails')
  >('@/hooks/useProjectDetails');
  return {
    findAdminGroupCandidates: actual.findAdminGroupCandidates,
    useProjectUserGroups: mocks.useProjectUserGroups,
    useProjectAdministrators: mocks.useProjectAdministrators,
  };
});
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ showToast: mocks.showToast }),
}));
vi.mock('@/services/user.service', () => ({
  userService: { searchUsers: mocks.searchUsers },
}));

function group(name: string): UserGroup {
  return {
    group_hash: `UG-${name}`,
    group_name: name,
    description: null,
    member_count: 1,
    created_at: null,
  };
}

function member(overrides: Partial<GroupMember>): GroupMember {
  return {
    user_hash: 'usr-admin',
    username: 'alice',
    email: 'alice@example.com',
    user_type: 'admin',
    is_active: true,
    joined_at: '2026-03-01T00:00:00Z',
    ...overrides,
  };
}

function userGroupsState(
  userGroups: UserGroup[]
): ReturnType<typeof mocks.useProjectUserGroups> {
  return {
    userGroups,
    total: userGroups.length,
    isLoading: false,
    isRefreshing: false,
    error: null,
    refetch: vi.fn(),
  };
}

function renderPanel(canEdit: boolean): void {
  render(
    <MemoryRouter>
      <ProjectAdministratorsPanel projectHash="proj-1" canEdit={canEdit} />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.useProjectUserGroups.mockReturnValue(
    userGroupsState([group('user_p1'), group('admin_p1')])
  );
  mocks.useProjectAdministrators.mockReturnValue({
    members: [
      member({}),
      member({ user_hash: 'usr-c', username: 'carl', user_type: 'consumer' }),
    ],
    total: 2,
    pending: null,
    addAdministrator: mocks.addAdministrator,
    removeAdministrator: mocks.removeAdministrator,
    isLoading: false,
    isRefreshing: false,
    error: null,
    refetch: vi.fn(),
  });
});

describe('ProjectAdministratorsPanel', () => {
  it('lists the admin_ group members and flags members who get no admin scope', () => {
    renderPanel(false);

    expect(mocks.useProjectAdministrators).toHaveBeenCalledWith('UG-admin_p1');
    expect(
      screen.getByText('admin_p1', { selector: 'span' })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'alice' })).toHaveAttribute(
      'href',
      '/users/usr-admin'
    );
    expect(screen.getByText(/Not an admin user/)).toBeInTheDocument();
  });

  it('hides changes from non-root operators', () => {
    renderPanel(false);

    expect(
      screen.queryByRole('button', { name: /add administrator/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /remove alice/i })
    ).not.toBeInTheDocument();
  });

  it('lets the operator choose when several admin_ groups reach the project', () => {
    mocks.useProjectUserGroups.mockReturnValue(
      userGroupsState([group('admin_p1'), group('admin_other')])
    );
    renderPanel(true);

    const select = screen.getByLabelText('Admin group');
    fireEvent.change(select, { target: { value: 'UG-admin_other' } });

    expect(mocks.useProjectAdministrators).toHaveBeenLastCalledWith(
      'UG-admin_other'
    );
    expect(
      screen.getByText(/Only the one created with this project/)
    ).toBeInTheDocument();
  });

  it('says so when no admin group reaches the project', () => {
    mocks.useProjectUserGroups.mockReturnValue(
      userGroupsState([group('user_p1')])
    );
    renderPanel(true);

    expect(
      screen.getByText('No admin group reaches this project')
    ).toBeInTheDocument();
    expect(mocks.useProjectAdministrators).not.toHaveBeenCalled();
  });

  it('adds an admin user found by searching admin accounts only (root)', async () => {
    mocks.searchUsers.mockResolvedValue({
      users: [
        {
          user_hash: 'usr-admin',
          username: 'alice',
          email: 'a@x.io',
          user_type: 'admin',
        },
        {
          user_hash: 'usr-bob',
          username: 'bob',
          email: 'b@x.io',
          user_type: 'admin',
        },
      ],
    });
    mocks.addAdministrator.mockResolvedValue(undefined);
    renderPanel(true);

    fireEvent.click(screen.getByRole('button', { name: /add administrator/i }));
    fireEvent.change(screen.getByLabelText('Search admin users'), {
      target: { value: 'bo' },
    });

    const bob = await screen.findByRole('button', { name: /bob/ });
    expect(mocks.searchUsers).toHaveBeenCalledWith({
      q: 'bo',
      user_type_filter: 'admin',
      limit: 20,
    });
    // Existing administrators are not offered again.
    expect(
      screen.queryByRole('button', { name: /a@x\.io/ })
    ).not.toBeInTheDocument();

    fireEvent.click(bob);
    fireEvent.click(
      screen
        .getAllByRole('button', { name: 'Add administrator' })
        .at(-1) as HTMLElement
    );

    await waitFor(() =>
      expect(mocks.addAdministrator).toHaveBeenCalledWith('usr-bob')
    );
    expect(mocks.showToast).toHaveBeenCalledWith(
      'bob is now an administrator of this project.',
      'success'
    );
  });

  it('removes an administrator after confirmation (root)', async () => {
    mocks.removeAdministrator.mockResolvedValue(undefined);
    renderPanel(true);

    fireEvent.click(
      screen.getByRole('button', { name: 'Remove alice from administrators' })
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Remove' }));

    await waitFor(() =>
      expect(mocks.removeAdministrator).toHaveBeenCalledWith('usr-admin')
    );
  });
});
