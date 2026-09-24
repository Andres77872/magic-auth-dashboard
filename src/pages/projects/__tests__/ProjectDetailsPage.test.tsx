import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { ProjectDetailsPage } from '../ProjectDetailsPage';
import type { UseProjectDetailsReturn } from '@/hooks/useProjectDetails';

const mocks = vi.hoisted(() => ({
  useProjectDetails: vi.fn(),
  isRoot: true,
  setBreadcrumb: vi.fn(),
  deleteProject: vi.fn(),
  showToast: vi.fn(),
}));

vi.mock('@/hooks/useProjectDetails', () => ({
  useProjectDetails: mocks.useProjectDetails,
}));
vi.mock('@/hooks/useUserType', () => ({
  useUserType: () => ({ isRoot: mocks.isRoot }),
}));
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ showToast: mocks.showToast }),
}));
vi.mock('@/hooks/useProjects', () => ({
  useProjectMutations: () => ({
    pending: null,
    createProject: vi.fn(),
    updateProject: vi.fn(),
    deleteProject: mocks.deleteProject,
  }),
}));
vi.mock('@/contexts', () => ({ useSetBreadcrumbLabel: mocks.setBreadcrumb }));

// Tab bodies have their own tests; stub them to observe which one renders.
vi.mock('@/components/features/projects/ProjectOverviewTab', () => ({
  ProjectOverviewTab: () => <div data-testid="tab-overview" />,
}));
vi.mock('@/components/features/projects/ProjectMembersTab', () => ({
  ProjectMembersTab: () => <div data-testid="tab-members" />,
}));
vi.mock('@/components/features/projects/ProjectGroupsTab', () => ({
  ProjectGroupsTab: () => <div data-testid="tab-groups" />,
}));
vi.mock('@/components/features/projects/ProjectCatalogPanel', () => ({
  ProjectCatalogPanel: () => <div data-testid="tab-catalog" />,
}));
vi.mock('@/components/features/projects/ProjectSettingsTab', () => ({
  ProjectSettingsTab: () => <div data-testid="tab-settings" />,
}));
vi.mock('@/components/features/oauth', () => ({
  ProjectSignInTab: () => <div data-testid="tab-sign-in" />,
}));

function detailsState(
  overrides: Partial<UseProjectDetailsReturn> = {}
): UseProjectDetailsReturn {
  const project = {
    project_hash: 'proj-1',
    project_name: 'CRM',
    project_description: 'Sales pipeline',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: null,
  };
  const userAccess = {
    permissions: [],
    access_level: 'admin_access' as const,
    user_groups: [],
  };
  return {
    details: { project, user_access: userAccess, project_groups: [] },
    project,
    userAccess,
    projectGroups: [],
    canManage: true,
    isLoading: false,
    isRefreshing: false,
    error: null,
    refetch: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function LocationProbe(): React.JSX.Element {
  const location = useLocation();
  return (
    <div data-testid="location">{`${location.pathname}${location.search}`}</div>
  );
}

function renderPage(entry = '/projects/proj-1'): void {
  render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/projects" element={<div data-testid="projects-list" />} />
        <Route path="/projects/:projectHash" element={<ProjectDetailsPage />} />
      </Routes>
      <LocationProbe />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.isRoot = true;
  mocks.useProjectDetails.mockReturnValue(detailsState());
});

describe('ProjectDetailsPage', () => {
  it('shows the project header and publishes the breadcrumb label', () => {
    renderPage();

    expect(
      screen.getByRole('heading', { level: 1, name: 'CRM' })
    ).toBeInTheDocument();
    expect(screen.getByText('Sales pipeline')).toBeInTheDocument();
    expect(screen.getByText('Admin access')).toBeInTheDocument();
    expect(mocks.setBreadcrumb).toHaveBeenCalledWith('CRM');
    expect(mocks.useProjectDetails).toHaveBeenCalledWith('proj-1');
    expect(screen.getByTestId('tab-overview')).toBeInTheDocument();
  });

  it('writes the selected tab to the URL and keeps other parameters', async () => {
    renderPage('/projects/proj-1?from=search');

    fireEvent.click(screen.getByRole('tab', { name: 'Members' }));

    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent(
        '/projects/proj-1?from=search&tab=members'
      )
    );
    expect(screen.getByTestId('tab-members')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Members' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
  });

  it('opens the catalog for the legacy ?tab=permissions link', () => {
    renderPage('/projects/proj-1?tab=permissions');

    expect(screen.getByTestId('tab-catalog')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Catalog' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
  });

  it('falls back to the overview for an unknown tab', () => {
    renderPage('/projects/proj-1?tab=nope');

    expect(screen.getByTestId('tab-overview')).toBeInTheDocument();
  });

  it('limits group-access viewers to the overview and catalog', () => {
    mocks.useProjectDetails.mockReturnValue(
      detailsState({
        canManage: false,
        userAccess: {
          permissions: [],
          access_level: 'group_access',
          user_groups: [],
        },
      })
    );
    renderPage('/projects/proj-1?tab=members');

    expect(screen.getByTestId('tab-overview')).toBeInTheDocument();
    for (const name of ['Members', 'Groups', 'Sign-in', 'Settings']) {
      expect(screen.getByRole('tab', { name })).toBeDisabled();
    }
    expect(screen.getByRole('tab', { name: 'Catalog' })).toBeEnabled();
    expect(
      screen.queryByRole('button', { name: 'Edit' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Delete' })
    ).not.toBeInTheDocument();
    expect(screen.getByText('Group access')).toBeInTheDocument();
  });

  it('shows a retryable error when the project cannot be loaded', () => {
    const refetch = vi.fn().mockResolvedValue(undefined);
    mocks.useProjectDetails.mockReturnValue(
      detailsState({
        details: null,
        project: null,
        userAccess: null,
        error: 'Access denied to this project',
        refetch,
      })
    );
    renderPage();

    expect(
      screen.getByText('Access denied to this project')
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(refetch).toHaveBeenCalled();
  });

  it('deletes only after the project name is typed, then returns to the list', async () => {
    mocks.deleteProject.mockResolvedValue({
      deleted_project: null,
      warning: null,
    });
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    const confirm = await screen.findByRole('button', {
      name: 'Delete project',
    });
    expect(confirm).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/to confirm/i), {
      target: { value: 'CRM' },
    });
    expect(confirm).toBeEnabled();
    fireEvent.click(confirm);

    await waitFor(() =>
      expect(screen.getByTestId('projects-list')).toBeInTheDocument()
    );
    expect(mocks.deleteProject).toHaveBeenCalledWith('proj-1');
    expect(mocks.showToast).toHaveBeenCalledWith('Project deleted.', 'success');
  });
});
