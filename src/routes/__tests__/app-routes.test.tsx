import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Outlet, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserType } from '@/types/auth.types';

// Routing is under test, not page content: every page is a labelled stub.
const stub = (name: string) => () => <div data-testid="page">{name}</div>;

// Console pages are lazy-loaded per area barrel, so each barrel is stubbed.
vi.mock('@/pages/auth', () => ({
  LoginPage: stub('login'),
  UnauthorizedPage: stub('unauthorized'),
}));
vi.mock('@/pages/landing', () => ({ LandingPage: stub('landing') }));
vi.mock('@/pages/dashboard', () => ({
  DashboardOverview: stub('overview'),
  ProfilePage: stub('profile'),
  SettingsPage: stub('settings'),
}));
vi.mock('@/pages/users', () => ({
  UserListPage: stub('users'),
  UserProfilePage: stub('user'),
}));
vi.mock('@/pages/projects', () => ({
  ProjectDetailsPage: stub('project'),
  ProjectListPage: stub('projects'),
}));
vi.mock('@/pages/billing', () => ({
  BillingGroupDetailsPage: stub('billing-group'),
  BillingGroupsPage: stub('billing'),
}));
vi.mock('@/pages/oauth', () => ({
  OAuthConnectionDetailsPage: stub('oauth-connection'),
  OAuthConnectionsPage: stub('oauth'),
}));
vi.mock('@/pages/system', () => ({
  EmailTemplateEditorPage: stub('email-template'),
  EmailTemplatesPage: stub('email-templates'),
  PatreonPage: stub('patreon'),
  SystemPage: stub('system'),
}));
vi.mock('@/pages/groups', () => ({
  GroupDetailsPage: stub('user-group'),
  GroupListPage: stub('groups'),
  ProjectGroupDetailsPage: stub('project-group'),
}));
vi.mock('@/pages/permissions', () => ({
  PermissionManagementPage: stub('permissions'),
}));
vi.mock('@/pages/tokens', () => ({ TokenManagementPage: stub('tokens') }));
vi.mock('@/pages/NotFoundPage', () => ({ NotFoundPage: stub('not-found') }));
vi.mock('@/components/features/audit', () => ({
  AuditLogMonitorPage: stub('audit'),
}));
vi.mock('@/components/layout', () => ({
  DashboardLayout: () => (
    <div data-testid="shell">
      <React.Suspense fallback={null}>
        <Outlet />
      </React.Suspense>
    </div>
  ),
}));

const authState = {
  isAuthenticated: true,
  isLoading: false,
  userType: UserType.ADMIN as UserType | null,
};

const mockUseAuth = (): Record<string, unknown> => ({
  isAuthenticated: authState.isAuthenticated,
  isLoading: authState.isLoading,
  user: authState.userType
    ? { user_hash: 'usr-1', username: 'op', user_type: authState.userType }
    : null,
  userType: authState.userType,
});
const mockUseUserType = (): Record<string, unknown> => ({
  userType: authState.userType,
  isRoot: authState.userType === UserType.ROOT,
  isAdminOrHigher:
    authState.userType === UserType.ROOT ||
    authState.userType === UserType.ADMIN,
});

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
  default: () => mockUseAuth(),
}));
vi.mock('@/hooks/useUserType', () => ({
  useUserType: () => mockUseUserType(),
  default: () => mockUseUserType(),
}));
vi.mock('@/hooks', async () => {
  const actual = await vi.importActual<typeof import('@/hooks')>('@/hooks');
  return {
    ...actual,
    useAuth: () => mockUseAuth(),
    useUserType: () => mockUseUserType(),
  };
});

// Imported after the mocks so it picks up the stubs.
const { AppRoutes } = await import('@/App');

function Location(): React.JSX.Element {
  const location = useLocation();
  return (
    <div data-testid="location">{`${location.pathname}${location.search}`}</div>
  );
}

function renderAt(path: string): void {
  render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
      <Location />
    </MemoryRouter>
  );
}

const page = async (): Promise<string | null> =>
  (await screen.findByTestId('page')).textContent;
const location = (): string | null =>
  screen.getByTestId('location').textContent;

describe('AppRoutes', () => {
  beforeEach(() => {
    authState.isAuthenticated = true;
    authState.isLoading = false;
    authState.userType = UserType.ADMIN;
  });

  it.each([
    ['/', 'overview'],
    ['/users', 'users'],
    ['/users/usr-abc', 'user'],
    ['/groups', 'groups'],
    ['/groups/ug-1', 'user-group'],
    ['/groups/project-groups/pg-1', 'project-group'],
    ['/projects', 'projects'],
    ['/projects/proj-1', 'project'],
    ['/permissions', 'permissions'],
    ['/tokens', 'tokens'],
    ['/audit', 'audit'],
    ['/billing', 'billing'],
    ['/oauth/conn-1', 'oauth-connection'],
    ['/profile', 'profile'],
    ['/settings', 'settings'],
  ])('renders %s inside the shell', async (path, expected) => {
    renderAt(path);
    expect(screen.getByTestId('shell')).toBeInTheDocument();
    expect(await page()).toBe(expected);
  });

  it('renders unknown console paths as a not-found page inside the shell', async () => {
    renderAt('/nope/really');
    expect(screen.getByTestId('shell')).toBeInTheDocument();
    expect(await page()).toBe('not-found');
  });

  it.each([
    '/dashboard',
    '/dashboard/users/profile/usr-9',
    '/dashboard/audit?tab=security&days=7',
    '/roles',
    '/roles?tab=groups',
    '/permissions/global-roles',
    '/groups/project-groups',
    '/groups/project-groups/create',
    '/groups/project-groups/edit/pg-1',
  ])('does not expose retired console flow %s', async (path) => {
    renderAt(path);
    expect(await page()).toBe('not-found');
    expect(location()).toBe(path);
  });

  describe('public overview', () => {
    beforeEach(() => {
      authState.isAuthenticated = false;
      authState.userType = null;
    });

    it('shows signed-out visitors the overview at / instead of redirecting', async () => {
      renderAt('/');
      expect(await page()).toBe('landing');
      expect(location()).toBe('/');
      expect(screen.queryByTestId('shell')).not.toBeInTheDocument();
    });

    it('waits for session validation before choosing between overview and console', () => {
      authState.isLoading = true;
      renderAt('/');
      expect(screen.queryByTestId('page')).not.toBeInTheDocument();
      expect(location()).toBe('/');
    });

    it('keeps /about reachable while signed in, outside the shell', async () => {
      authState.isAuthenticated = true;
      authState.userType = UserType.ADMIN;
      renderAt('/about');
      expect(await page()).toBe('landing');
      expect(screen.queryByTestId('shell')).not.toBeInTheDocument();
    });

    it('serves /about to signed-out visitors too', async () => {
      renderAt('/about');
      expect(await page()).toBe('landing');
    });
  });

  describe('guards', () => {
    it('sends signed-out visitors on console URLs to sign in', () => {
      authState.isAuthenticated = false;
      authState.userType = null;
      renderAt('/users');
      expect(location()).toBe('/login');
    });

    it('keeps admins out of root-only areas', () => {
      renderAt('/system');
      expect(location()).toBe('/unauthorized');
    });

    it('lets root open root-only areas', async () => {
      authState.userType = UserType.ROOT;
      renderAt('/system/patreon');
      expect(await page()).toBe('patreon');
    });

    it('turns consumers away from the console', () => {
      authState.userType = UserType.CONSUMER;
      renderAt('/');
      expect(location()).toBe('/unauthorized');
    });
  });
});
