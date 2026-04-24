import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation, useSearchParams } from 'react-router-dom';
import React from 'react';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/hooks/useUserType', () => ({
  useUserType: vi.fn(),
}));

vi.mock('@/hooks/useToast', () => ({
  useToast: vi.fn(() => ({
    showToast: vi.fn(),
  })),
}));

vi.mock('@/hooks', () => ({
  useGroupDetails: vi.fn(() => ({
    group: { group_hash: 'test-group-123', group_name: 'Test Group', description: 'Test', member_count: 5, created_at: '2024-01-01' },
    statistics: { total_members: 5, total_projects: 2 },
    isLoading: false,
    error: null,
    updateGroup: vi.fn(),
  })),
  useGroupMemberActions: vi.fn(() => ({
    bulkAddMembers: vi.fn(),
    removeMember: vi.fn(),
  })),
  useUsersByGroup: vi.fn(() => ({
    users: [],
    refetch: vi.fn(),
    error: null,
  })),
  useGlobalRoles: vi.fn(() => ({
    roles: [],
    permissionGroups: [],
    loadingRoles: false,
    loadingGroups: false,
    createRole: vi.fn(),
    updateRole: vi.fn(),
    deleteRole: vi.fn(),
    assignRoleToUser: vi.fn(),
    assignPermissionGroupToRole: vi.fn(),
    refreshRoles: vi.fn(),
    currentRole: null,
  })),
  useUsers: vi.fn(() => ({
    users: [],
    fetchUsers: vi.fn(),
  })),
  useActivityLogs: vi.fn(() => ({
    logs: [],
    pagination: { total: 0, page: 1, pageSize: 10 },
    isLoading: false,
    error: null,
  })),
  useToast: vi.fn(() => ({
    showToast: vi.fn(),
  })),
}));

vi.mock('@/contexts/PermissionManagementContext', () => ({
  usePermissionManagement: vi.fn(() => ({
    permissions: [],
    permissionGroups: [],
    permissionsLoading: false,
    permissionGroupsLoading: false,
    refreshPermissions: vi.fn(),
    refreshPermissionGroups: vi.fn(),
    categories: [],
  })),
}));

vi.mock('@/components/common', () => ({
  PageContainer: ({ children }: any) => <div data-testid="page-container">{children}</div>,
  PageHeader: ({ title }: any) => <h1 data-testid="page-header">{title}</h1>,
  Card: ({ children }: any) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
  CardHeader: ({ children }: any) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: any) => <h3 data-testid="card-title">{children}</h3>,
  Badge: ({ children }: any) => <span data-testid="badge">{children}</span>,
  Button: ({ children, onClick, leftIcon }: any) => (
    <button data-testid="button" onClick={onClick}>
      {leftIcon}{children}
    </button>
  ),
  LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>,
  StatsGrid: () => <div data-testid="stats-grid">Stats</div>,
  ConfirmDialog: () => null,
  DataView: ({ data, renderCard }: any) => (
    <div data-testid="data-view">
      {data?.map((item: any, i: number) => renderCard?.(item, i))}
    </div>
  ),
  CopyableId: ({ id }: any) => <span data-testid="copyable-id">{id}</span>,
  TabNavigation: ({ tabs, activeTab, onChange, children }: any) => (
    <div data-testid="tab-navigation" data-active-tab={activeTab}>
      <div role="tablist">
        {tabs.map((tab: any) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            data-tab-id={tab.id}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div data-testid="tab-content">{children}</div>
    </div>
  ),
  StatCardProps: {},
}));

vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, value }: any) => (
    <div data-testid="radix-tabs" data-active-tab={value}>
      <div data-testid="tabs-list" role="tablist">
        {React.Children.toArray(children).filter((c: any) => c?.props?.['data-testid'] === 'radix-tabs-list' || c?.type?.name === 'TabsList')}
      </div>
      <div data-testid="active-tab-content" data-tab-value={value}>
        {React.Children.toArray(children)
          .filter((c: any) => c?.props?.value === value)
          .map((c: any) => c?.props?.children)}
      </div>
    </div>
  ),
  TabsList: ({ children }: any) => <div data-testid="radix-tabs-list">{children}</div>,
  TabsTrigger: ({ value, children }: any) => (
    <button data-testid={`tab-trigger-${value}`} role="tab" data-value={value}>{children}</button>
  ),
  TabsContent: ({ value, children }: any) => (
    <div data-testid={`tabs-content-${value}`} data-content-value={value}>{children}</div>
  ),
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <h2 data-testid="dialog-title">{children}</h2>,
  DialogDescription: ({ children }: any) => <p data-testid="dialog-description">{children}</p>,
  DialogFooter: ({ children }: any) => <div data-testid="dialog-footer">{children}</div>,
}));

vi.mock('@/components/features/groups/GroupMembersTable', () => ({
  GroupMembersTable: () => <div data-testid="group-members-table">Members Table</div>,
}));

vi.mock('@/components/features/groups/GroupPermissionsTab', () => ({
  GroupPermissionsTab: ({ groupHash }: any) => <div data-testid="group-permissions-tab" data-group-hash={groupHash}>Permissions Tab</div>,
}));

vi.mock('@/components/features/groups/GroupProjectGroupsTab', () => ({
  GroupProjectGroupsTab: ({ groupHash }: any) => <div data-testid="group-project-groups-tab" data-group-hash={groupHash}>Project Groups Tab</div>,
}));

vi.mock('@/components/features/audit/ActivityLogTab', () => ({
  ActivityLogTab: () => <div data-testid="activity-log-tab">Activity Log</div>,
}));

vi.mock('@/components/features/audit/SecurityEventsTab', () => ({
  SecurityEventsTab: () => <div data-testid="security-events-tab">Security Events</div>,
}));

vi.mock('@/components/features/audit/AuditStatisticsTab', () => ({
  AuditStatisticsTab: () => <div data-testid="audit-statistics-tab">Statistics</div>,
}));

vi.mock('@/components/features/audit/ActivityExport', () => ({
  ActivityExport: () => <div data-testid="activity-export">Export</div>,
}));

vi.mock('@/components/features/permissions', () => ({
  RoleAssignmentModal: () => null,
  PermissionModal: () => null,
  PermissionGroupModal: () => null,
  RoleModal: () => null,
  RoleCard: () => null,
  PermissionGroupCard: () => null,
  ManageGroupPermissionsModal: () => null,
  ManageRolePermissionGroupsModal: () => null,
  RoleForm: () => <div data-testid="role-form">Role Form</div>,
}));

vi.mock('@/components/features/permissions/permissions/PermissionList', () => ({
  PermissionList: () => <div data-testid="permission-list">Permissions</div>,
}));

vi.mock('@/components/features/permissions/permission-groups/PermissionGroupList', () => ({
  PermissionGroupList: () => <div data-testid="permission-group-list">Groups</div>,
}));

vi.mock('@/components/features/permissions/roles/RoleList', () => ({
  RoleList: () => <div data-testid="role-list">Roles</div>,
}));

vi.mock('@/components/features/permissions/PermissionsDashboardStats', () => ({
  PermissionsDashboardStats: () => <div data-testid="permissions-stats">Stats</div>,
}));

vi.mock('@/components/features/permissions/MyPermissionsTabContent', () => ({
  MyPermissionsTabContent: () => <div data-testid="my-permissions-tab">My Permissions</div>,
}));

vi.mock('@/components/features/permissions/shared/DetailPanel', () => ({
  DetailPanel: ({ isOpen, children }: any) => isOpen ? <div data-testid="detail-panel">{children}</div> : null,
}));

vi.mock('@/components/features/permissions/permissions/PermissionDetail', () => ({
  PermissionDetail: () => <div data-testid="permission-detail">Detail</div>,
}));

vi.mock('@/components/features/permissions/permission-groups/PermissionGroupDetail', () => ({
  PermissionGroupDetail: () => <div data-testid="permission-group-detail">Detail</div>,
}));

vi.mock('@/components/features/permissions/roles/RoleDetail', () => ({
  RoleDetail: () => <div data-testid="role-detail">Detail</div>,
}));

vi.mock('@/pages/permissions/tabs/AssignmentsTab', () => ({
  AssignmentsTab: () => <div data-testid="assignments-tab">Assignments</div>,
}));

vi.mock('@/pages/permissions/tabs/AnalyticsTab', () => ({
  AnalyticsTab: () => <div data-testid="analytics-tab">Analytics</div>,
}));

vi.mock('@/components/features/permissions/catalog/ProjectCatalogTab', () => ({
  ProjectCatalogTab: () => <div data-testid="catalog-tab">Catalog</div>,
}));

vi.mock('@/components/features/groups/BulkMemberAssignmentModal', () => ({
  BulkMemberAssignmentModal: () => null,
}));

vi.mock('@/components/features/groups/GroupFormModal', () => ({
  GroupFormModal: () => null,
}));

vi.mock('@/services', () => ({
  globalRolesService: {
    getRoles: vi.fn(async () => ({ success: true, roles: [] })),
    getPermissionGroups: vi.fn(async () => ({ success: true, permission_groups: [] })),
    getPermissions: vi.fn(async () => ({ success: true, permissions: [] })),
    getMyPermissions: vi.fn(async () => ({ success: true, permissions: [] })),
    getMyRole: vi.fn(async () => ({ success: true, role: null })),
    deletePermission: vi.fn(),
    deletePermissionGroup: vi.fn(),
    deleteRole: vi.fn(),
    createPermission: vi.fn(),
    updatePermission: vi.fn(),
    createPermissionGroup: vi.fn(),
    updatePermissionGroup: vi.fn(),
    createRole: vi.fn(),
    updateRole: vi.fn(),
  },
}));

import { useAuth } from '@/hooks/useAuth';
import { useUserType } from '@/hooks/useUserType';
import { GroupDetailsPage } from '@/pages/groups/GroupDetailsPage';
import { RoleManagementPage } from '@/pages/permissions/RoleManagementPage';
import { PermissionsDashboard } from '@/components/features/permissions/PermissionsDashboard';
import { AuditLogMonitorPage } from '@/components/features/audit/AuditLogMonitorPage';
import { UserType, type User } from '@/types/auth.types';

const mockUseAuth = vi.mocked(useAuth);
const mockUseUserType = vi.mocked(useUserType);

const mockAdminUser: User = {
  user_hash: 'admin-123',
  username: 'adminuser',
  email: 'admin@example.com',
  user_type: UserType.ADMIN,
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
};

const mockRootUser: User = {
  user_hash: 'root-123',
  username: 'rootuser',
  email: 'root@example.com',
  user_type: UserType.ROOT,
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
};

function LocationTracker(): React.JSX.Element {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('tab');
  return (
    <div data-testid="location">
      {location.pathname}
      {tab ? `?tab=${tab}` : ''}
    </div>
  );
}

function setupAuthMocks(user: User | null) {
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

describe('Phase 2: Tab URL Behavior - Gate G2 Runtime Proof', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('G2.1: GroupDetailsPage ?tab= behavior (Flat URL model)', () => {
    it('activates Permissions tab when URL has ?tab=permissions', async () => {
      setupAuthMocks(mockAdminUser);
      render(
        <TestRouter initialEntries={['/groups/test-group-123?tab=permissions']}>
          <Routes>
            <Route path="/groups/:groupHash" element={<GroupDetailsPage />} />
          </Routes>
        </TestRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('tab-navigation')).toBeInTheDocument();
      });

      expect(screen.getByTestId('tab-navigation')).toHaveAttribute('data-active-tab', 'permissions');
      expect(screen.getByRole('tab', { name: 'Permission Groups' })).toHaveAttribute('aria-selected', 'true');
    });

    it('activates Members tab (default) when URL has no ?tab= param', async () => {
      setupAuthMocks(mockAdminUser);
      render(
        <TestRouter initialEntries={['/groups/test-group-123']}>
          <Routes>
            <Route path="/groups/:groupHash" element={<GroupDetailsPage />} />
          </Routes>
        </TestRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('tab-navigation')).toBeInTheDocument();
      });

      expect(screen.getByTestId('tab-navigation')).toHaveAttribute('data-active-tab', 'members');
      expect(screen.getByRole('tab', { name: 'Members' })).toHaveAttribute('aria-selected', 'true');
    });

    it('falls back to Members tab (default) when URL has invalid ?tab= value', async () => {
      setupAuthMocks(mockAdminUser);
      render(
        <TestRouter initialEntries={['/groups/test-group-123?tab=invalid-tab']}>
          <Routes>
            <Route path="/groups/:groupHash" element={<GroupDetailsPage />} />
          </Routes>
        </TestRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('tab-navigation')).toBeInTheDocument();
      });

      expect(screen.getByTestId('tab-navigation')).toHaveAttribute('data-active-tab', 'members');
      expect(screen.getByRole('tab', { name: 'Members' })).toHaveAttribute('aria-selected', 'true');
    });

    it('updates URL when tab is clicked', async () => {
      setupAuthMocks(mockAdminUser);
      render(
        <TestRouter initialEntries={['/groups/test-group-123']}>
          <Routes>
            <Route path="/groups/:groupHash" element={<GroupDetailsPage />} />
          </Routes>
        </TestRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('tab-navigation')).toBeInTheDocument();
      });

      const projectGroupsTab = screen.getByRole('tab', { name: 'Project Groups' });
      fireEvent.click(projectGroupsTab);

      await waitFor(() => {
        expect(screen.getByTestId('location')).toHaveTextContent('?tab=project-groups');
      });
    });
  });

  describe('G2.2: RoleManagementPage ?tab= behavior (Flat URL model - /roles)', () => {
    it('activates Assignments tab when URL has ?tab=assignments', async () => {
      setupAuthMocks(mockAdminUser);
      render(
        <TestRouter initialEntries={['/roles?tab=assignments']}>
          <Routes>
            <Route path="/roles" element={<RoleManagementPage />} />
          </Routes>
        </TestRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('tab-navigation')).toBeInTheDocument();
      });

      expect(screen.getByTestId('tab-navigation')).toHaveAttribute('data-active-tab', 'assignments');
      expect(screen.getByRole('tab', { name: 'Assignments' })).toHaveAttribute('aria-selected', 'true');
    });

    it('activates Roles tab (default) when URL has no ?tab= param', async () => {
      setupAuthMocks(mockAdminUser);
      render(
        <TestRouter initialEntries={['/roles']}>
          <Routes>
            <Route path="/roles" element={<RoleManagementPage />} />
          </Routes>
        </TestRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('tab-navigation')).toBeInTheDocument();
      });

      expect(screen.getByTestId('tab-navigation')).toHaveAttribute('data-active-tab', 'roles');
      expect(screen.getByRole('tab', { name: 'Roles' })).toHaveAttribute('aria-selected', 'true');
    });

    it('falls back to Roles tab (default) when URL has invalid ?tab= value', async () => {
      setupAuthMocks(mockAdminUser);
      render(
        <TestRouter initialEntries={['/roles?tab=nonexistent']}>
          <Routes>
            <Route path="/roles" element={<RoleManagementPage />} />
          </Routes>
        </TestRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('tab-navigation')).toBeInTheDocument();
      });

      expect(screen.getByTestId('tab-navigation')).toHaveAttribute('data-active-tab', 'roles');
      expect(screen.getByRole('tab', { name: 'Roles' })).toHaveAttribute('aria-selected', 'true');
    });

    it('updates URL when tab is clicked', async () => {
      setupAuthMocks(mockAdminUser);
      render(
        <TestRouter initialEntries={['/roles']}>
          <Routes>
            <Route path="/roles" element={<RoleManagementPage />} />
          </Routes>
        </TestRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('tab-navigation')).toBeInTheDocument();
      });

      const groupsTab = screen.getByRole('tab', { name: 'Permission Groups' });
      fireEvent.click(groupsTab);

      await waitFor(() => {
        expect(screen.getByTestId('location')).toHaveTextContent('?tab=groups');
      });
    });
  });

  describe('G2.3: PermissionsDashboard ?tab= behavior (Flat URL model - /permissions)', () => {
    it('activates Analytics tab when URL has ?tab=analytics', async () => {
      setupAuthMocks(mockAdminUser);
      render(
        <TestRouter initialEntries={['/permissions?tab=analytics']}>
          <Routes>
            <Route path="/permissions" element={<PermissionsDashboard />} />
          </Routes>
        </TestRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('radix-tabs')).toBeInTheDocument();
      });

      expect(screen.getByTestId('radix-tabs')).toHaveAttribute('data-active-tab', 'analytics');
    });

    it('activates Permissions tab (default) when URL has no ?tab= param', async () => {
      setupAuthMocks(mockAdminUser);
      render(
        <TestRouter initialEntries={['/permissions']}>
          <Routes>
            <Route path="/permissions" element={<PermissionsDashboard />} />
          </Routes>
        </TestRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('radix-tabs')).toBeInTheDocument();
      });

      expect(screen.getByTestId('radix-tabs')).toHaveAttribute('data-active-tab', 'permissions');
    });

    it('supports all 7 VALID_TABS: permissions, groups, roles, assignments, analytics, catalog, my-permissions', async () => {
      const validTabs = ['permissions', 'groups', 'roles', 'assignments', 'analytics', 'catalog', 'my-permissions'];

      for (const tab of validTabs) {
        vi.clearAllMocks();
        setupAuthMocks(mockAdminUser);

        const { unmount } = render(
          <TestRouter initialEntries={[`/permissions?tab=${tab}`]}>
            <Routes>
              <Route path="/permissions" element={<PermissionsDashboard />} />
            </Routes>
          </TestRouter>
        );

        await waitFor(() => {
          expect(screen.getByTestId('radix-tabs')).toBeInTheDocument();
        });

        expect(screen.getByTestId('radix-tabs')).toHaveAttribute('data-active-tab', tab);
        unmount();
      }
    });

    it('falls back to Permissions tab (default) when URL has invalid ?tab= value', async () => {
      setupAuthMocks(mockAdminUser);
      render(
        <TestRouter initialEntries={['/permissions?tab=bogus-tab']}>
          <Routes>
            <Route path="/permissions" element={<PermissionsDashboard />} />
          </Routes>
        </TestRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('radix-tabs')).toBeInTheDocument();
      });

      expect(screen.getByTestId('radix-tabs')).toHaveAttribute('data-active-tab', 'permissions');
    });
  });

  describe('G2.4: AuditLogMonitorPage ?tab= behavior (Flat URL model - /audit)', () => {
    it('activates Security tab for root user when URL has ?tab=security', async () => {
      setupAuthMocks(mockRootUser);
      render(
        <TestRouter initialEntries={['/audit?tab=security']}>
          <Routes>
            <Route path="/audit" element={<AuditLogMonitorPage />} />
          </Routes>
        </TestRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('radix-tabs')).toBeInTheDocument();
      });

      expect(screen.getByTestId('radix-tabs')).toHaveAttribute('data-active-tab', 'security');
    });

    it('activates Statistics tab for root user when URL has ?tab=statistics', async () => {
      setupAuthMocks(mockRootUser);
      render(
        <TestRouter initialEntries={['/audit?tab=statistics']}>
          <Routes>
            <Route path="/audit" element={<AuditLogMonitorPage />} />
          </Routes>
        </TestRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('radix-tabs')).toBeInTheDocument();
      });

      expect(screen.getByTestId('radix-tabs')).toHaveAttribute('data-active-tab', 'statistics');
    });

    it('falls back to Activity tab for non-root user when URL has ?tab=security (role restriction)', async () => {
      setupAuthMocks(mockAdminUser);
      render(
        <TestRouter initialEntries={['/audit?tab=security']}>
          <Routes>
            <Route path="/audit" element={<AuditLogMonitorPage />} />
          </Routes>
        </TestRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('radix-tabs')).toBeInTheDocument();
      });

      expect(screen.getByTestId('radix-tabs')).toHaveAttribute('data-active-tab', 'activity');
    });

    it('falls back to Activity tab for non-root user when URL has ?tab=statistics (role restriction)', async () => {
      setupAuthMocks(mockAdminUser);
      render(
        <TestRouter initialEntries={['/audit?tab=statistics']}>
          <Routes>
            <Route path="/audit" element={<AuditLogMonitorPage />} />
          </Routes>
        </TestRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('radix-tabs')).toBeInTheDocument();
      });

      expect(screen.getByTestId('radix-tabs')).toHaveAttribute('data-active-tab', 'activity');
    });

    it('activates Activity tab (default) when URL has no ?tab= param', async () => {
      setupAuthMocks(mockAdminUser);
      render(
        <TestRouter initialEntries={['/audit']}>
          <Routes>
            <Route path="/audit" element={<AuditLogMonitorPage />} />
          </Routes>
        </TestRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('radix-tabs')).toBeInTheDocument();
      });

      expect(screen.getByTestId('radix-tabs')).toHaveAttribute('data-active-tab', 'activity');
    });

    it('falls back to Activity tab (default) when URL has invalid ?tab= value', async () => {
      setupAuthMocks(mockRootUser);
      render(
        <TestRouter initialEntries={['/audit?tab=invalid-tab-name']}>
          <Routes>
            <Route path="/audit" element={<AuditLogMonitorPage />} />
          </Routes>
        </TestRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('radix-tabs')).toBeInTheDocument();
      });

      expect(screen.getByTestId('radix-tabs')).toHaveAttribute('data-active-tab', 'activity');
    });
  });

  describe('G2.5: URL shareability/back-forward semantics (Flat URL model)', () => {
    it('URL with ?tab= is shareable - renders correct tab on fresh navigation', async () => {
      setupAuthMocks(mockAdminUser);
      render(
        <TestRouter initialEntries={['/groups/test-group-123?tab=permissions']}>
          <Routes>
            <Route path="/groups/:groupHash" element={<GroupDetailsPage />} />
          </Routes>
        </TestRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('tab-navigation')).toBeInTheDocument();
      });

      expect(screen.getByTestId('location')).toHaveTextContent('?tab=permissions');
      expect(screen.getByTestId('tab-navigation')).toHaveAttribute('data-active-tab', 'permissions');
      expect(screen.getByRole('tab', { name: 'Permission Groups' })).toHaveAttribute('aria-selected', 'true');
    });

    it('back navigation restores previous tab state (URL-based)', async () => {
      setupAuthMocks(mockAdminUser);

      render(
        <MemoryRouter initialEntries={['/groups/test-group-123', '/groups/test-group-123?tab=permissions']} initialIndex={0}>
          <Routes>
            <Route path="/groups/:groupHash" element={<GroupDetailsPage />} />
          </Routes>
          <LocationTracker />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('tab-navigation')).toBeInTheDocument();
      });

      expect(screen.getByTestId('location')).not.toHaveTextContent('?tab=');
      expect(screen.getByTestId('tab-navigation')).toHaveAttribute('data-active-tab', 'members');
      expect(screen.getByRole('tab', { name: 'Members' })).toHaveAttribute('aria-selected', 'true');
    });

    it('forward navigation restores tab state from URL', async () => {
      setupAuthMocks(mockAdminUser);

      render(
        <MemoryRouter initialEntries={['/groups/test-group-123', '/groups/test-group-123?tab=permissions']} initialIndex={1}>
          <Routes>
            <Route path="/groups/:groupHash" element={<GroupDetailsPage />} />
          </Routes>
          <LocationTracker />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('tab-navigation')).toBeInTheDocument();
      });

      expect(screen.getByTestId('location')).toHaveTextContent('?tab=permissions');
      expect(screen.getByTestId('tab-navigation')).toHaveAttribute('data-active-tab', 'permissions');
      expect(screen.getByRole('tab', { name: 'Permission Groups' })).toHaveAttribute('aria-selected', 'true');
    });
  });
});
