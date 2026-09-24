import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProjectOverviewTab } from '../ProjectOverviewTab';
import type { ProjectInfo, ProjectUserAccess } from '@/types/project.types';

const mocks = vi.hoisted(() => ({
  useProjectActivity: vi.fn(),
}));

vi.mock('@/hooks/useProjectDetails', () => ({
  useProjectActivity: mocks.useProjectActivity,
}));
vi.mock('../ProjectAdministratorsPanel', () => ({
  ProjectAdministratorsPanel: ({ canEdit }: { canEdit: boolean }) => (
    <div data-testid="administrators" data-can-edit={String(canEdit)} />
  ),
}));
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

const project: ProjectInfo = {
  project_hash: 'proj-1',
  project_name: 'CRM',
  project_description: null,
  created_at: '2026-01-05T10:00:00Z',
  updated_at: null,
};
const adminAccess: ProjectUserAccess = {
  permissions: ['admin'],
  access_level: 'admin_access',
  user_groups: [],
};

function renderTab(
  props: Partial<React.ComponentProps<typeof ProjectOverviewTab>> = {}
): void {
  render(
    <MemoryRouter>
      <ProjectOverviewTab
        project={project}
        userAccess={adminAccess}
        projectGroups={[
          {
            group_hash: 'PG-1',
            group_name: 'default_p1',
            description: 'Default project group',
          },
        ]}
        canManage
        isRoot
        {...props}
      />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.useProjectActivity.mockReturnValue({
    activities: [
      {
        id: '1',
        activityType: 'user_login',
        activityName: null,
        details: { message: 'Password sign-in' },
        createdAt: '2026-09-20T10:00:00Z',
        actor: { username: 'ana', userHash: 'usr-ana' },
        target: null,
        userGroupName: null,
      },
    ],
    total: 12,
    days: 30,
    isLoading: false,
    isRefreshing: false,
    error: null,
    refetch: vi.fn(),
  });
});

describe('ProjectOverviewTab', () => {
  it('shows facts, project groups and recent activity without derived statistics', () => {
    renderTab();

    expect(screen.getByText('Project hash')).toBeInTheDocument();
    expect(
      screen.getByText('Root users administer every project.')
    ).toBeInTheDocument();
    // The API never fills updated_at, so the row is omitted rather than faked.
    expect(screen.queryByText('Last updated')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'default_p1' })).toHaveAttribute(
      'href',
      '/groups/project-groups/PG-1'
    );
    expect(
      screen.getByText('12 events in the last 30 days')
    ).toBeInTheDocument();
    expect(screen.getByText('Signed in')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'ana' })).toHaveAttribute(
      'href',
      '/users/usr-ana'
    );
    expect(screen.getByText('Password sign-in')).toBeInTheDocument();
    expect(mocks.useProjectActivity).toHaveBeenCalledWith('proj-1', {
      limit: 8,
      days: 30,
    });
  });

  it('shows administrators to managers and lets only root edit them', () => {
    renderTab({ isRoot: false });

    expect(screen.getByTestId('administrators')).toHaveAttribute(
      'data-can-edit',
      'false'
    );
  });

  it('explains limited access to group-access viewers and hides administrators', () => {
    renderTab({
      canManage: false,
      isRoot: false,
      userAccess: {
        permissions: [],
        access_level: 'group_access',
        user_groups: [],
      },
    });

    expect(screen.getByText(/don't administer it/)).toBeInTheDocument();
    expect(screen.queryByTestId('administrators')).not.toBeInTheDocument();
  });

  it('explains an empty project-group list', () => {
    renderTab({ projectGroups: [] });

    expect(screen.getByText('Not in any project group')).toBeInTheDocument();
  });
});
