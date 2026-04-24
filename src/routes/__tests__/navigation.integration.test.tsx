import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Navigate, useLocation, useParams, useSearchParams } from 'react-router-dom';
import React from 'react';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/hooks/useUserType', () => ({
  useUserType: vi.fn(),
}));

vi.mock('@/hooks/useSystemStats', () => ({
  useSystemStats: vi.fn(() => ({ stats: null, isLoading: true, error: null, refetch: vi.fn() })),
}));

vi.mock('@/hooks/useSystemHealth', () => ({
  useSystemHealth: vi.fn(() => ({ health: null, isLoading: true, error: null, refetch: vi.fn() })),
}));

vi.mock('@/components/layout/DashboardLayout', async () => {
  const { Outlet } = await import('react-router-dom');

  return {
    DashboardLayout: () => {
      return (
        <div data-testid="dashboard-layout">
          <div data-testid="layout-header">Header</div>
          <div data-testid="layout-sidebar">Sidebar</div>
          <main data-testid="layout-main">
            <Outlet />
          </main>
        </div>
      );
    },
  };
});

vi.mock('@/components/features/users/UserAvatar', () => ({
  UserAvatar: ({ username }: { username: string }) => (
    <div data-testid="user-avatar">{username}</div>
  ),
}));

vi.mock('@/components/common/CopyableId', () => ({
  CopyableId: ({ id }: { id: string }) => <span data-testid="copyable-id">{id}</span>,
}));

import { useAuth } from '@/hooks/useAuth';
import { useUserType } from '@/hooks/useUserType';
import { ROUTES } from '@/utils/routes';
import { UserType } from '@/types/auth.types';
import { DashboardOverview } from '@/pages/dashboard/DashboardOverview';
import { ProfilePage } from '@/pages/dashboard/ProfilePage';
import { SettingsPage } from '@/pages/dashboard/SettingsPage';
import { AdminRoute } from '@/components/guards/AdminRoute';
import { RootOnlyRoute } from '@/components/guards/RootOnlyRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

const mockUseAuth = vi.mocked(useAuth);
const mockUseUserType = vi.mocked(useUserType);

const mockAdminUser = {
  user_hash: 'admin-123',
  username: 'adminuser',
  email: 'admin@example.com',
  user_type: UserType.ADMIN,
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
};

const mockRootUser = {
  user_hash: 'root-123',
  username: 'rootuser',
  email: 'root@example.com',
  user_type: UserType.ROOT,
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
};

const mockConsumerUser = {
  user_hash: 'consumer-123',
  username: 'consumeruser',
  email: 'consumer@example.com',
  user_type: UserType.CONSUMER,
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
};

function LocationTracker(): React.JSX.Element {
  const location = useLocation();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const fullPath = `${location.pathname}${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
  return (
    <div>
      <div data-testid="location">{fullPath}</div>
      <div data-testid="pathname">{location.pathname}</div>
      <div data-testid="search">{searchParams.toString()}</div>
      {Object.keys(params).length > 0 && (
        <div data-testid="params">{JSON.stringify(params)}</div>
      )}
    </div>
  );
}

function setupAuthMocks(user: typeof mockAdminUser | typeof mockRootUser | typeof mockConsumerUser | null) {
  mockUseAuth.mockReturnValue({
    isAuthenticated: user !== null,
    isLoading: false,
    user: user,
    userType: user?.user_type || null,
    state: {
      isAuthenticated: user !== null,
      user: user,
      token: 'mock-token',
      currentProject: null,
      accessibleProjects: [],
      isLoading: false,
      error: null,
      effectivePermissions: [],
      permissionsLoading: false,
      sessionExpiresAt: null,
    },
    login: vi.fn(),
    platformLogin: vi.fn(),
    logout: vi.fn(),
    validateToken: vi.fn(),
    clearError: vi.fn(),
    hasPermission: vi.fn(() => true),
    canAccessRoute: vi.fn(() => true),
    loadUserPermissions: vi.fn(),
    effectivePermissions: [],
    permissionsLoading: false,
    sessionExpiresAt: null,
    refreshSession: vi.fn(),
    refreshRetryCount: 0,
    showSessionExpiryWarning: false,
    dismissSessionExpiryWarning: vi.fn(),
    currentProject: null,
  } as any);

  const isAdminOrHigher = user?.user_type === UserType.ADMIN || user?.user_type === UserType.ROOT;
  
  mockUseUserType.mockReturnValue({
    user: user,
    userType: user?.user_type || null,
    isRoot: user?.user_type === UserType.ROOT,
    isAdmin: user?.user_type === UserType.ADMIN,
    isConsumer: user?.user_type === UserType.CONSUMER,
    hasMinimumUserType: vi.fn(() => isAdminOrHigher),
    isAdminOrHigher: isAdminOrHigher,
    canAccessRoute: vi.fn(() => true),
    getUserTypeLabel: vi.fn(() => user?.user_type === UserType.ROOT ? 'System Administrator' : 'Project Administrator'),
    getUserTypeBadgeColor: vi.fn(() => 'var(--color-warning)'),
  } as any);
}

function TestFlatApp({ initialEntries: initialRoutes = ['/'] }: { initialEntries?: string[] }): React.JSX.Element {
  return (
    <MemoryRouter initialEntries={initialRoutes}>
      <Routes>
        <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
        <Route path="/unauthorized" element={<div data-testid="unauthorized-page">Unauthorized</div>} />
        <Route element={<AdminRoute><DashboardLayout /></AdminRoute>}>
          <Route path="/" element={<DashboardOverview />} />
          <Route path="users" element={<div data-testid="users-page">Users List</div>} />
          <Route path="users/:userHash" element={<div data-testid="user-profile-page">User Profile</div>} />
          <Route path="projects" element={<div data-testid="projects-page">Projects List</div>} />
          <Route path="projects/:projectHash" element={<div data-testid="project-details-page">Project Details</div>} />
          <Route path="groups" element={<div data-testid="groups-page">Groups List</div>} />
          <Route path="groups/:groupHash" element={<div data-testid="group-details-page">Group Details</div>} />
          <Route path="permissions" element={<div data-testid="permissions-page">Permissions</div>} />
          <Route path="roles" element={<div data-testid="roles-page">Roles</div>} />
          <Route path="audit" element={<div data-testid="audit-page">Audit Logs</div>} />
          <Route path="tokens" element={<div data-testid="tokens-page">API Tokens</div>} />
          <Route path="system" element={<RootOnlyRoute><div data-testid="system-page">System Page</div></RootOnlyRoute>} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="dashboard" element={<Navigate to="/" replace />} />
          <Route path="dashboard/overview" element={<Navigate to="/" replace />} />
          <Route path="dashboard/users" element={<Navigate to="/users" replace />} />
          <Route path="dashboard/users/profile/:userHash" element={<LegacyUserProfileRedirect />} />
          <Route path="dashboard/projects" element={<Navigate to="/projects" replace />} />
          <Route path="dashboard/projects/details/:projectHash" element={<LegacyProjectDetailsRedirect />} />
          <Route path="dashboard/groups" element={<Navigate to="/groups" replace />} />
          <Route path="dashboard/groups/:groupHash" element={<LegacyGroupDetailsRedirect />} />
          <Route path="dashboard/audit" element={<LegacyAuditRedirect />} />
          <Route path="dashboard/system" element={<Navigate to="/system" replace />} />
          <Route path="dashboard/profile" element={<Navigate to="/profile" replace />} />
          <Route path="dashboard/settings" element={<Navigate to="/settings" replace />} />
        </Route>
      </Routes>
      <LocationTracker />
    </MemoryRouter>
  );
}

function LegacyUserProfileRedirect(): React.JSX.Element {
  const { userHash } = useParams<{ userHash: string }>();
  const [searchParams] = useSearchParams();
  const target = userHash ? `/users/${userHash}` : '/users';
  const searchString = searchParams.toString();
  const to = searchString ? `${target}?${searchString}` : target;
  return <Navigate to={to} replace />;
}

function LegacyProjectDetailsRedirect(): React.JSX.Element {
  const { projectHash } = useParams<{ projectHash: string }>();
  const [searchParams] = useSearchParams();
  const target = projectHash ? `/projects/${projectHash}` : '/projects';
  const searchString = searchParams.toString();
  const to = searchString ? `${target}?${searchString}` : target;
  return <Navigate to={to} replace />;
}

function LegacyGroupDetailsRedirect(): React.JSX.Element {
  const { groupHash } = useParams<{ groupHash: string }>();
  const [searchParams] = useSearchParams();
  const target = groupHash ? `/groups/${groupHash}` : '/groups';
  const searchString = searchParams.toString();
  const to = searchString ? `${target}?${searchString}` : target;
  return <Navigate to={to} replace />;
}

function LegacyAuditRedirect(): React.JSX.Element {
  const [searchParams] = useSearchParams();
  const searchString = searchParams.toString();
  const to = searchString ? `/audit?${searchString}` : '/audit';
  return <Navigate to={to} replace />;
}

describe('Navigation Route Integration - Flat URL Model (Gate G1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('G1.1: Canonical landing at /', () => {
    it('renders DashboardOverview at root / for authenticated admin', async () => {
      setupAuthMocks(mockAdminUser);
      render(<TestFlatApp initialEntries={['/']} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('location')).toHaveTextContent('/');
      });
      
      expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /adminuser/i })).toBeInTheDocument();
      expect(screen.getByText(/Welcome back to the Magic Auth Admin Dashboard/i)).toBeInTheDocument();
    });

    it('renders DashboardOverview at root / for authenticated root', async () => {
      setupAuthMocks(mockRootUser);
      render(<TestFlatApp initialEntries={['/']} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('location')).toHaveTextContent('/');
      });
      
      expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /rootuser/i })).toBeInTheDocument();
      expect(screen.getByText(/Welcome back to the Magic Auth Admin Dashboard/i)).toBeInTheDocument();
    });
  });

  describe('G1.2: Flat top-level routes render correctly', () => {
    it('renders Users List at /users', async () => {
      setupAuthMocks(mockAdminUser);
      render(<TestFlatApp initialEntries={['/users']} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('location')).toHaveTextContent('/users');
      });
      
      expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
      expect(screen.getByTestId('users-page')).toBeInTheDocument();
    });

    it('renders Projects List at /projects', async () => {
      setupAuthMocks(mockAdminUser);
      render(<TestFlatApp initialEntries={['/projects']} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('location')).toHaveTextContent('/projects');
      });
      
      expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
      expect(screen.getByTestId('projects-page')).toBeInTheDocument();
    });

    it('renders Groups List at /groups', async () => {
      setupAuthMocks(mockAdminUser);
      render(<TestFlatApp initialEntries={['/groups']} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('location')).toHaveTextContent('/groups');
      });
      
      expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
      expect(screen.getByTestId('groups-page')).toBeInTheDocument();
    });

    it('renders Permissions at /permissions', async () => {
      setupAuthMocks(mockAdminUser);
      render(<TestFlatApp initialEntries={['/permissions']} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('location')).toHaveTextContent('/permissions');
      });
      
      expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
      expect(screen.getByTestId('permissions-page')).toBeInTheDocument();
    });

    it('renders Roles at /roles', async () => {
      setupAuthMocks(mockAdminUser);
      render(<TestFlatApp initialEntries={['/roles']} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('location')).toHaveTextContent('/roles');
      });
      
      expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
      expect(screen.getByTestId('roles-page')).toBeInTheDocument();
    });

    it('renders Audit at /audit', async () => {
      setupAuthMocks(mockAdminUser);
      render(<TestFlatApp initialEntries={['/audit']} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('location')).toHaveTextContent('/audit');
      });
      
      expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
      expect(screen.getByTestId('audit-page')).toBeInTheDocument();
    });

    it('renders Profile at /profile', async () => {
      setupAuthMocks(mockAdminUser);
      render(<TestFlatApp initialEntries={['/profile']} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('location')).toHaveTextContent('/profile');
      });
      
      expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Profile' })).toBeInTheDocument();
    });

    it('renders Settings at /settings', async () => {
      setupAuthMocks(mockAdminUser);
      render(<TestFlatApp initialEntries={['/settings']} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('location')).toHaveTextContent('/settings');
      });
      
      expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    });
  });

  describe('G1.3: Legacy dashboard redirects to flat URLs', () => {
    it('redirects /dashboard to /', async () => {
      setupAuthMocks(mockAdminUser);
      render(<TestFlatApp initialEntries={['/dashboard']} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('pathname')).toHaveTextContent('/');
      });
      
      expect(screen.getByTestId('dashboard-layout')).toBeInTheDocument();
      expect(screen.getByText(/Welcome back to the Magic Auth Admin Dashboard/i)).toBeInTheDocument();
    });

    it('redirects /dashboard/overview to /', async () => {
      setupAuthMocks(mockAdminUser);
      render(<TestFlatApp initialEntries={['/dashboard/overview']} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('pathname')).toHaveTextContent('/');
      });
      
      expect(screen.getByText(/Welcome back to the Magic Auth Admin Dashboard/i)).toBeInTheDocument();
    });

    it('redirects /dashboard/users to /users', async () => {
      setupAuthMocks(mockAdminUser);
      render(<TestFlatApp initialEntries={['/dashboard/users']} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('pathname')).toHaveTextContent('/users');
      });
      
      expect(screen.getByTestId('users-page')).toBeInTheDocument();
    });

    it('redirects /dashboard/projects to /projects', async () => {
      setupAuthMocks(mockAdminUser);
      render(<TestFlatApp initialEntries={['/dashboard/projects']} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('pathname')).toHaveTextContent('/projects');
      });
      
      expect(screen.getByTestId('projects-page')).toBeInTheDocument();
    });

    it('redirects /dashboard/groups to /groups', async () => {
      setupAuthMocks(mockAdminUser);
      render(<TestFlatApp initialEntries={['/dashboard/groups']} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('pathname')).toHaveTextContent('/groups');
      });
      
      expect(screen.getByTestId('groups-page')).toBeInTheDocument();
    });

    it('redirects /dashboard/audit to /audit', async () => {
      setupAuthMocks(mockAdminUser);
      render(<TestFlatApp initialEntries={['/dashboard/audit']} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('pathname')).toHaveTextContent('/audit');
      });
      
      expect(screen.getByTestId('audit-page')).toBeInTheDocument();
    });

    it('redirects /dashboard/profile to /profile', async () => {
      setupAuthMocks(mockAdminUser);
      render(<TestFlatApp initialEntries={['/dashboard/profile']} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('pathname')).toHaveTextContent('/profile');
      });
      
      expect(screen.getByRole('heading', { name: 'Profile' })).toBeInTheDocument();
    });

    it('redirects /dashboard/settings to /settings', async () => {
      setupAuthMocks(mockAdminUser);
      render(<TestFlatApp initialEntries={['/dashboard/settings']} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('pathname')).toHaveTextContent('/settings');
      });
      
      expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    });
  });

  describe('G1.4: Parameterized legacy redirects work correctly', () => {
    it('redirects /dashboard/users/profile/:userHash to /users/:userHash', async () => {
      setupAuthMocks(mockAdminUser);
      render(<TestFlatApp initialEntries={['/dashboard/users/profile/abc123']} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('pathname')).toHaveTextContent('/users/abc123');
      });
      
      expect(screen.getByTestId('user-profile-page')).toBeInTheDocument();
    });

    it('redirects /dashboard/projects/details/:projectHash to /projects/:projectHash', async () => {
      setupAuthMocks(mockAdminUser);
      render(<TestFlatApp initialEntries={['/dashboard/projects/details/proj456']} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('pathname')).toHaveTextContent('/projects/proj456');
      });
      
      expect(screen.getByTestId('project-details-page')).toBeInTheDocument();
    });

    it('redirects /dashboard/groups/:groupHash to /groups/:groupHash', async () => {
      setupAuthMocks(mockAdminUser);
      render(<TestFlatApp initialEntries={['/dashboard/groups/grp789']} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('pathname')).toHaveTextContent('/groups/grp789');
      });
      
      expect(screen.getByTestId('group-details-page')).toBeInTheDocument();
    });
  });

  describe('G1.5: Query param preservation on legacy redirects', () => {
    it('preserves query params on /dashboard/users/profile/:userHash redirect', async () => {
      setupAuthMocks(mockAdminUser);
      render(<TestFlatApp initialEntries={['/dashboard/users/profile/abc123?tab=activity']} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('pathname')).toHaveTextContent('/users/abc123');
      });
      
      expect(screen.getByTestId('search')).toHaveTextContent('tab=activity');
    });

    it('preserves query params on /dashboard/projects/details/:projectHash redirect', async () => {
      setupAuthMocks(mockAdminUser);
      render(<TestFlatApp initialEntries={['/dashboard/projects/details/proj456?view=members']} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('pathname')).toHaveTextContent('/projects/proj456');
      });
      
      expect(screen.getByTestId('search')).toHaveTextContent('view=members');
    });

    it('preserves query params on /dashboard/audit redirect', async () => {
      setupAuthMocks(mockAdminUser);
      render(<TestFlatApp initialEntries={['/dashboard/audit?tab=security']} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('pathname')).toHaveTextContent('/audit');
      });
      
      expect(screen.getByTestId('search')).toHaveTextContent('tab=security');
    });
  });

  describe('G1.6: Auth Guard Behavior', () => {
    it('redirects unauthenticated user to /login', async () => {
      setupAuthMocks(null);
      render(<TestFlatApp initialEntries={['/']} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('login-page')).toBeInTheDocument();
      });
    });

    it('redirects consumer user to /unauthorized (AdminRoute guard)', async () => {
      setupAuthMocks(mockConsumerUser);
      render(<TestFlatApp initialEntries={['/']} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('unauthorized-page')).toBeInTheDocument();
      });
    });

    it('redirects admin user to /unauthorized when accessing /system (RootOnlyRoute guard)', async () => {
      setupAuthMocks(mockAdminUser);
      render(<TestFlatApp initialEntries={['/system']} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('unauthorized-page')).toBeInTheDocument();
      });
    });

    it('allows root user to access /system', async () => {
      setupAuthMocks(mockRootUser);
      render(<TestFlatApp initialEntries={['/system']} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('system-page')).toBeInTheDocument();
      });
    });
  });

  describe('G1.7: Route Constants Alignment', () => {
    it('ROUTES.HOME equals /', () => {
      expect(ROUTES.HOME).toBe('/');
    });

    it('ROUTES.USERS equals /users', () => {
      expect(ROUTES.USERS).toBe('/users');
    });

    it('ROUTES.USER equals /users (base path for detail)', () => {
      expect(ROUTES.USER).toBe('/users');
    });

    it('ROUTES.PROJECTS equals /projects', () => {
      expect(ROUTES.PROJECTS).toBe('/projects');
    });

    it('ROUTES.PROJECT equals /projects (base path for detail)', () => {
      expect(ROUTES.PROJECT).toBe('/projects');
    });

    it('ROUTES.GROUPS equals /groups', () => {
      expect(ROUTES.GROUPS).toBe('/groups');
    });

    it('ROUTES.PERMISSIONS equals /permissions', () => {
      expect(ROUTES.PERMISSIONS).toBe('/permissions');
    });

    it('ROUTES.ROLES equals /roles', () => {
      expect(ROUTES.ROLES).toBe('/roles');
    });

    it('ROUTES.AUDIT equals /audit', () => {
      expect(ROUTES.AUDIT).toBe('/audit');
    });

    it('ROUTES.TOKENS equals /tokens', () => {
      expect(ROUTES.TOKENS).toBe('/tokens');
    });

    it('ROUTES.SYSTEM equals /system', () => {
      expect(ROUTES.SYSTEM).toBe('/system');
    });

    it('ROUTES.PROFILE equals /profile', () => {
      expect(ROUTES.PROFILE).toBe('/profile');
    });

    it('ROUTES.SETTINGS equals /settings', () => {
      expect(ROUTES.SETTINGS).toBe('/settings');
    });

    it('ROUTES.LOGIN equals /login', () => {
      expect(ROUTES.LOGIN).toBe('/login');
    });

    it('ROUTES.UNAUTHORIZED equals /unauthorized', () => {
      expect(ROUTES.UNAUTHORIZED).toBe('/unauthorized');
    });
  });
});
