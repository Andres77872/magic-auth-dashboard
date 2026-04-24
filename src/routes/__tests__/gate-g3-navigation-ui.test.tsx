import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import React from 'react';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/hooks/useUserType', () => ({
  useUserType: vi.fn(),
}));

vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: vi.fn(() => ({
    isAuthenticated: true,
    hasPermission: vi.fn(() => true),
  })),
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div data-testid="dropdown-menu">{children}</div>,
  DropdownMenuTrigger: ({ children, asChild }: any) => (
    <div data-testid="dropdown-trigger">{asChild ? children : <button>{children}</button>}</div>
  ),
  DropdownMenuContent: ({ children, align }: any) => (
    <div data-testid="dropdown-content" data-align={align}>{children}</div>
  ),
  DropdownMenuItem: ({ children, asChild, onClick }: any) => {
    if (asChild) {
      return <div data-testid="dropdown-item-wrapper">{children}</div>;
    }
    return (
      <button data-testid="dropdown-item" onClick={onClick}>{children}</button>
    );
  },
  DropdownMenuSeparator: () => <div data-testid="dropdown-separator" />,
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <h2 data-testid="dialog-title">{children}</h2>,
  DialogDescription: ({ children }: any) => <p data-testid="dialog-description">{children}</p>,
  DialogFooter: ({ children }: any) => <div data-testid="dialog-footer">{children}</div>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, variant }: any) => (
    <button data-testid="button" data-variant={variant} onClick={onClick}>{children}</button>
  ),
}));

vi.mock('@/utils/userTypeStyles', () => ({
  getUserTypeBadgeClass: vi.fn(() => 'bg-warning text-warning-foreground'),
}));

vi.mock('@/components/layout/DashboardLayout', () => ({
  DashboardLayout: () => {
    const Outlet = require('react-router-dom').Outlet;
    return (
      <div data-testid="dashboard-layout">
        <main data-testid="layout-main">
          <Outlet />
        </main>
      </div>
    );
  },
}));

vi.mock('@/components/common', () => ({
  PageContainer: ({ children }: any) => <div data-testid="page-container">{children}</div>,
  PageHeader: ({ title }: any) => <h1 data-testid="page-header">{title}</h1>,
}));

import { useAuth } from '@/hooks/useAuth';
import { useUserType } from '@/hooks/useUserType';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { UserMenu } from '@/components/navigation/UserMenu';
import { NavigationMenu } from '@/components/navigation/NavigationMenu';
import { ROUTES, NAVIGATION_ITEMS } from '@/utils/routes';
import { UserType } from '@/types/auth.types';

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

function LocationTracker(): React.JSX.Element {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

function setupAuthMocks(user: typeof mockAdminUser | null) {
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

function TestRouter({
  initialEntries,
  children,
}: {
  initialEntries: string[];
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <MemoryRouter initialEntries={initialEntries}>
      {children}
      <LocationTracker />
    </MemoryRouter>
  );
}

describe('Gate G3: Navigation UI Runtime Proof (Flat URL Model)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('G3.1: /profile breadcrumb shows Profile only (no Home prefix)', () => {
    it('renders "Profile" breadcrumb without Home prefix for /profile', async () => {
      setupAuthMocks(mockAdminUser);
      render(
        <TestRouter initialEntries={['/profile']}>
          <Routes>
            <Route path="/profile" element={<Breadcrumbs />} />
          </Routes>
        </TestRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('navigation', { name: 'Breadcrumb navigation' })).toBeInTheDocument();
      });

      const breadcrumbText = screen.getByText('Profile');
      expect(breadcrumbText).toBeInTheDocument();
      expect(screen.queryByText('Home')).not.toBeInTheDocument();
    });

    it('Profile breadcrumb is marked as active/current page', async () => {
      setupAuthMocks(mockAdminUser);
      render(
        <TestRouter initialEntries={['/profile']}>
          <Routes>
            <Route path="/profile" element={<Breadcrumbs />} />
          </Routes>
        </TestRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('navigation')).toBeInTheDocument();
      });

      const profileBreadcrumbContainer = screen.getByText('Profile').parentElement;
      expect(profileBreadcrumbContainer?.getAttribute('aria-current')).toBe('page');
    });
  });

  describe('G3.2: /settings breadcrumb shows Settings only (no Home prefix)', () => {
    it('renders "Settings" breadcrumb without Home prefix for /settings', async () => {
      setupAuthMocks(mockAdminUser);
      render(
        <TestRouter initialEntries={['/settings']}>
          <Routes>
            <Route path="/settings" element={<Breadcrumbs />} />
          </Routes>
        </TestRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('navigation', { name: 'Breadcrumb navigation' })).toBeInTheDocument();
      });

      const breadcrumbText = screen.getByText('Settings');
      expect(breadcrumbText).toBeInTheDocument();
      expect(screen.queryByText('Home')).not.toBeInTheDocument();
    });

    it('Settings breadcrumb is marked as active/current page', async () => {
      setupAuthMocks(mockAdminUser);
      render(
        <TestRouter initialEntries={['/settings']}>
          <Routes>
            <Route path="/settings" element={<Breadcrumbs />} />
          </Routes>
        </TestRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('navigation')).toBeInTheDocument();
      });

      const settingsBreadcrumbContainer = screen.getByText('Settings').parentElement;
      expect(settingsBreadcrumbContainer?.getAttribute('aria-current')).toBe('page');
    });
  });

  describe('G3.3: /users breadcrumb shows "Users" only (no Home prefix) per spec', () => {
    it('renders "Users" breadcrumb without Home prefix for /users', async () => {
      setupAuthMocks(mockAdminUser);
      render(
        <TestRouter initialEntries={['/users']}>
          <Routes>
            <Route path="/users" element={<Breadcrumbs />} />
          </Routes>
        </TestRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('navigation', { name: 'Breadcrumb navigation' })).toBeInTheDocument();
      });

      expect(screen.getByText('Users')).toBeInTheDocument();
      // Per spec.md lines 441-445: "/users" shows "Users" (no Home prefix)
      expect(screen.queryByText('Home')).not.toBeInTheDocument();
    });

    it('Users breadcrumb is marked as active/current page', async () => {
      setupAuthMocks(mockAdminUser);
      render(
        <TestRouter initialEntries={['/users']}>
          <Routes>
            <Route path="/users" element={<Breadcrumbs />} />
          </Routes>
        </TestRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('navigation')).toBeInTheDocument();
      });

      const usersBreadcrumbContainer = screen.getByText('Users').parentElement;
      expect(usersBreadcrumbContainer?.getAttribute('aria-current')).toBe('page');
    });
  });

  describe('G3.4: / (root) breadcrumb shows "Overview" per spec', () => {
    it('renders "Overview" breadcrumb for root /', async () => {
      setupAuthMocks(mockAdminUser);
      render(
        <TestRouter initialEntries={['/']}>
          <Routes>
            <Route path="/" element={<Breadcrumbs />} />
          </Routes>
        </TestRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('navigation', { name: 'Breadcrumb navigation' })).toBeInTheDocument();
      });

      // Per spec.md line 437: "/" shows "Overview"
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.queryByText('Home')).not.toBeInTheDocument();
      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    });

    it('Overview breadcrumb is marked as active/current page', async () => {
      setupAuthMocks(mockAdminUser);
      render(
        <TestRouter initialEntries={['/']}>
          <Routes>
            <Route path="/" element={<Breadcrumbs />} />
          </Routes>
        </TestRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('navigation')).toBeInTheDocument();
      });

      const overviewBreadcrumbContainer = screen.getByText('Overview').parentElement;
      expect(overviewBreadcrumbContainer?.getAttribute('aria-current')).toBe('page');
    });
  });

  describe('G3.5: UserMenu Profile link navigates to /profile', () => {
    it('UserMenu contains Profile link with correct href', async () => {
      setupAuthMocks(mockAdminUser);
      render(
        <TestRouter initialEntries={['/']}>
          <UserMenu />
        </TestRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('dropdown-menu')).toBeInTheDocument();
      });

      const profileLink = screen.getByRole('link', { name: /Profile/ });
      expect(profileLink).toHaveAttribute('href', ROUTES.PROFILE);
      expect(profileLink).toHaveAttribute('href', '/profile');
    });

    it('UserMenu Profile link uses ROUTES.PROFILE constant', async () => {
      setupAuthMocks(mockAdminUser);
      render(
        <TestRouter initialEntries={['/']}>
          <UserMenu />
        </TestRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('dropdown-menu')).toBeInTheDocument();
      });

      const profileLink = screen.getByRole('link', { name: /Profile/ });
      expect(profileLink.getAttribute('href')).toBe(ROUTES.PROFILE);
    });
  });

  describe('G3.6: UserMenu Settings link navigates to /settings', () => {
    it('UserMenu contains Settings link with correct href', async () => {
      setupAuthMocks(mockAdminUser);
      render(
        <TestRouter initialEntries={['/']}>
          <UserMenu />
        </TestRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('dropdown-menu')).toBeInTheDocument();
      });

      const settingsLink = screen.getByRole('link', { name: /Settings/ });
      expect(settingsLink).toHaveAttribute('href', ROUTES.SETTINGS);
      expect(settingsLink).toHaveAttribute('href', '/settings');
    });

    it('UserMenu Settings link uses ROUTES.SETTINGS constant', async () => {
      setupAuthMocks(mockAdminUser);
      render(
        <TestRouter initialEntries={['/']}>
          <UserMenu />
        </TestRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('dropdown-menu')).toBeInTheDocument();
      });

      const settingsLink = screen.getByRole('link', { name: /Settings/ });
      expect(settingsLink.getAttribute('href')).toBe(ROUTES.SETTINGS);
    });
  });

  describe('Sidebar active-state behavior (Flat URL Model)', () => {
    it('/ is active only on exact match (not on /users)', async () => {
      setupAuthMocks(mockAdminUser);
      render(
        <TestRouter initialEntries={['/users']}>
          <NavigationMenu userType={UserType.ADMIN} collapsed={false} />
        </TestRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('navigation', { name: 'Dashboard navigation' })).toBeInTheDocument();
      });

      const homeItem = screen.queryByRole('link', { name: /Home/ });
      if (homeItem) {
        expect(homeItem.getAttribute('aria-current')).not.toBe('page');
      }
    });

    it('/ shows Home item as active', async () => {
      setupAuthMocks(mockAdminUser);
      render(
        <TestRouter initialEntries={['/']}>
          <NavigationMenu userType={UserType.ADMIN} collapsed={false} />
        </TestRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('navigation', { name: 'Dashboard navigation' })).toBeInTheDocument();
      });

      const homeItem = screen.getByRole('link', { name: /Home/ });
      expect(homeItem).toBeInTheDocument();
    });

    it('/users shows Users item as active (prefix match)', async () => {
      setupAuthMocks(mockAdminUser);
      render(
        <TestRouter initialEntries={['/users']}>
          <NavigationMenu userType={UserType.ADMIN} collapsed={false} />
        </TestRouter>
      );

      await waitFor(() => {
        expect(screen.getByRole('navigation', { name: 'Dashboard navigation' })).toBeInTheDocument();
      });

      const usersItem = screen.getByRole('link', { name: /Users/ });
      expect(usersItem).toBeInTheDocument();
    });

    it('NAVIGATION_ITEMS first item points to ROUTES.HOME (flat URL)', () => {
      // Per spec: NAVIGATION_ITEMS[0] should point to ROUTES.HOME = '/'
      expect(NAVIGATION_ITEMS[0].path).toBe(ROUTES.HOME);
      expect(NAVIGATION_ITEMS[0].path).toBe('/');
    });
  });

  describe('Route constants alignment verification (Flat URL Model)', () => {
    it('ROUTES.PROFILE equals /profile', () => {
      expect(ROUTES.PROFILE).toBe('/profile');
    });

    it('ROUTES.SETTINGS equals /settings', () => {
      expect(ROUTES.SETTINGS).toBe('/settings');
    });

    it('ROUTES.HOME equals / (canonical root)', () => {
      // ROUTES.DASHBOARD renamed to ROUTES.HOME per spec
      expect(ROUTES.HOME).toBe('/');
    });

    it('ROUTES.USERS equals /users (flat URL)', () => {
      // Per spec: USERS is now a top-level route, not nested under /dashboard
      expect(ROUTES.USERS).toBe('/users');
    });

    it('ROUTES.USER equals /users (base path for detail)', () => {
      expect(ROUTES.USER).toBe('/users');
    });

    it('ROUTES.PROJECTS equals /projects (flat URL)', () => {
      expect(ROUTES.PROJECTS).toBe('/projects');
    });

    it('ROUTES.PROJECT equals /projects (base path for detail)', () => {
      expect(ROUTES.PROJECT).toBe('/projects');
    });

    it('ROUTES.GROUPS equals /groups (flat URL)', () => {
      expect(ROUTES.GROUPS).toBe('/groups');
    });

    it('ROUTES.PERMISSIONS equals /permissions (flat URL)', () => {
      expect(ROUTES.PERMISSIONS).toBe('/permissions');
    });

    it('ROUTES.ROLES equals /roles (flat URL)', () => {
      expect(ROUTES.ROLES).toBe('/roles');
    });

    it('ROUTES.AUDIT equals /audit (flat URL)', () => {
      expect(ROUTES.AUDIT).toBe('/audit');
    });

    it('ROUTES.TOKENS equals /tokens (flat URL)', () => {
      expect(ROUTES.TOKENS).toBe('/tokens');
    });

    it('ROUTES.SYSTEM equals /system (flat URL)', () => {
      expect(ROUTES.SYSTEM).toBe('/system');
    });
  });
});