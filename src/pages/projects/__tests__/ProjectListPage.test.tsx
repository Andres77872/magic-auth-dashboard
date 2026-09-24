import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { ProjectListPage } from '../ProjectListPage';
import type { UseProjectsReturn } from '@/hooks/useProjects';
import type { ProjectSummary } from '@/types/project.types';

const mocks = vi.hoisted(() => ({
  useProjects: vi.fn(),
  isRoot: true,
}));

vi.mock('@/hooks/useProjects', () => ({
  useProjects: mocks.useProjects,
  useProjectMutations: () => ({
    pending: null,
    createProject: vi.fn(),
    updateProject: vi.fn(),
    deleteProject: vi.fn(),
  }),
}));
vi.mock('@/hooks/useUserType', () => ({
  useUserType: () => ({ isRoot: mocks.isRoot }),
}));
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

const crm: ProjectSummary = {
  project_hash: 'proj-crm',
  project_name: 'CRM',
  project_description: 'Sales pipeline',
  access_level: 'admin_access',
  access_through: 'admin_access',
};

function listState(
  overrides: Partial<UseProjectsReturn> = {}
): UseProjectsReturn {
  return {
    projects: [crm],
    offset: 0,
    total: 1,
    truncated: false,
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

function renderPage(entry = '/projects'): void {
  render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/projects" element={<ProjectListPage />} />
        <Route
          path="/projects/:projectHash"
          element={<div data-testid="details" />}
        />
      </Routes>
      <LocationProbe />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.isRoot = true;
  mocks.useProjects.mockReturnValue(listState());
});

describe('ProjectListPage', () => {
  it('lists projects with their access level and offers creation to root', () => {
    renderPage();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Projects' })
    ).toBeInTheDocument();
    expect(screen.getByText('1 project')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'CRM' })).toHaveAttribute(
      'href',
      '/projects/proj-crm'
    );
    expect(screen.getByText('Sales pipeline')).toBeInTheDocument();
    expect(screen.getByText('Admin access')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /create project/i })
    ).toBeInTheDocument();
  });

  it('hides creation from admins and says who creates projects', () => {
    mocks.isRoot = false;
    renderPage();

    expect(
      screen.queryByRole('button', { name: /create project/i })
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(
        /1 project you administer · New projects are created by root users/
      )
    ).toBeInTheDocument();
  });

  it('reads page, size, search and sort from the URL', () => {
    renderPage('/projects?q=crm&page=3&limit=50&sort=access_level:desc');

    expect(mocks.useProjects).toHaveBeenCalledWith({
      search: 'crm',
      offset: 100,
      limit: 50,
      sortBy: 'access_level',
      sortOrder: 'desc',
    });
  });

  it('debounces the search into the URL and resets the page', async () => {
    renderPage('/projects?page=2');

    fireEvent.change(
      screen.getByPlaceholderText('Search by name or description'),
      { target: { value: 'billing' } }
    );

    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent(
        '/projects?q=billing'
      )
    );
  });

  it('opens a project when its row is clicked', async () => {
    renderPage();

    fireEvent.click(screen.getByText('Sales pipeline'));

    await waitFor(() =>
      expect(screen.getByTestId('details')).toBeInTheDocument()
    );
  });

  it('says when the API window may hide projects', () => {
    mocks.useProjects.mockReturnValue(
      listState({ total: 500, truncated: true })
    );
    renderPage();

    expect(screen.getByText(/showing the first 500/)).toBeInTheDocument();
    expect(
      screen.getByText(/at most 500 projects per request/)
    ).toBeInTheDocument();
  });

  it('shows a retryable error when nothing could be loaded', () => {
    const refetch = vi.fn().mockResolvedValue(undefined);
    mocks.useProjects.mockReturnValue(
      listState({ projects: [], total: 0, error: 'Network error', refetch })
    );
    renderPage();

    expect(
      screen.getByText('Projects could not be loaded')
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(refetch).toHaveBeenCalled();
  });

  it('explains the empty state to admins without assignments', () => {
    mocks.isRoot = false;
    mocks.useProjects.mockReturnValue(listState({ projects: [], total: 0 }));
    renderPage();

    expect(screen.getByText('No projects assigned')).toBeInTheDocument();
    expect(
      screen.getByText(/adding you to its admin group/)
    ).toBeInTheDocument();
  });
});
