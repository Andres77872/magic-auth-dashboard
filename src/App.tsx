import React from 'react';
import { BrowserRouter, Route, Routes, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { AuthProvider, ToastProvider, ThemeProvider } from '@/contexts';
import { useAuth } from '@/hooks';
import { ErrorBoundary, ToastContainer } from '@/components/common';
import {
  RootOnlyRoute,
  AdminRoute,
  PublicRoute,
} from '@/components/guards';
import { ROUTES } from '@/utils/routes';
import { SessionExpiryWarningModal } from '@/components/features/settings/SessionExpiryWarningModal';
import './styles/globals.css';

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

function LegacyProjectGroupEditRedirect(): React.JSX.Element {
  const { groupHash } = useParams<{ groupHash: string }>();
  const [searchParams] = useSearchParams();
  const target = groupHash ? `/groups/project-groups/edit/${groupHash}` : '/groups/project-groups';
  const searchString = searchParams.toString();
  const to = searchString ? `${target}?${searchString}` : target;
  return <Navigate to={to} replace />;
}

function LegacyProjectGroupDetailsRedirect(): React.JSX.Element {
  const { groupHash } = useParams<{ groupHash: string }>();
  const [searchParams] = useSearchParams();
  const target = groupHash ? `/groups/project-groups/${groupHash}` : '/groups/project-groups';
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

function LegacyTokensRedirect(): React.JSX.Element {
  const [searchParams] = useSearchParams();
  const searchString = searchParams.toString();
  const to = searchString ? `/tokens?${searchString}` : '/tokens';
  return <Navigate to={to} replace />;
}

function LegacyPermissionsRedirect(): React.JSX.Element {
  const [searchParams] = useSearchParams();
  const searchString = searchParams.toString();
  const to = searchString ? `/permissions?${searchString}` : '/permissions';
  return <Navigate to={to} replace />;
}

function LegacyRolesRedirect(): React.JSX.Element {
  const [searchParams] = useSearchParams();
  const searchString = searchParams.toString();
  const to = searchString ? `/roles?${searchString}` : '/roles';
  return <Navigate to={to} replace />;
}

function LegacyGroupsRedirect(): React.JSX.Element {
  const [searchParams] = useSearchParams();
  const searchString = searchParams.toString();
  const to = searchString ? `/groups?${searchString}` : '/groups';
  return <Navigate to={to} replace />;
}

function LegacyUsersRedirect(): React.JSX.Element {
  const [searchParams] = useSearchParams();
  const searchString = searchParams.toString();
  const to = searchString ? `/users?${searchString}` : '/users';
  return <Navigate to={to} replace />;
}

function LegacyProjectsRedirect(): React.JSX.Element {
  const [searchParams] = useSearchParams();
  const searchString = searchParams.toString();
  const to = searchString ? `/projects?${searchString}` : '/projects';
  return <Navigate to={to} replace />;
}

// Import pages
import { LandingPage, UnauthorizedPage, DashboardOverview, ProfilePage, UserListPage, ProjectListPage, ProjectDetailsPage, SettingsPage } from '@/pages';
import { UserProfilePage } from '@/pages/users/UserProfilePage';
import {
  GroupListPage,
  GroupDetailsPage,
  ProjectGroupCreatePage,
  ProjectGroupEditPage,
  ProjectGroupDetailsPage
} from '@/pages/groups';
import {
  PermissionManagementPage,
  GlobalRolesPage,
  RoleManagementPage
} from '@/pages/permissions';
import { TokenManagementPage } from '@/pages/tokens';
import { AuditLogMonitorPage } from '@/components/features/audit';
import { DashboardLayout } from '@/components/layout';

// SystemPage placeholder (ROOT-only)
const SystemPage = () => (
  <div className="space-y-6">
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-destructive"><path d="M12 6V2H8"/><path d="m8 18-4 4V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2Z"/><path d="M2 12h2"/><path d="M9 11v2"/><path d="M15 11v2"/></svg>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">System Management</h1>
        <p className="text-sm text-muted-foreground">ROOT-level system configuration and administration</p>
      </div>
    </div>

    <div className="rounded-xl border border-success/30 bg-success/5 p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="h-8 w-8 rounded-full bg-success/10 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-success"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
        </div>
        <div>
          <h3 className="font-semibold text-foreground">ROOT Access Verified</h3>
          <p className="text-sm text-muted-foreground">You have full system administrator privileges</p>
        </div>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div className="rounded-xl border border-border bg-card p-6 space-y-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        </div>
        <h3 className="font-semibold text-foreground">Admin Management</h3>
        <p className="text-sm text-muted-foreground">Create and manage admin users and their project assignments</p>
        <span className="inline-block text-xs text-muted-foreground bg-muted px-2 py-1 rounded">Coming Soon</span>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-3">
        <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-warning"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
        </div>
        <h3 className="font-semibold text-foreground">System Settings</h3>
        <p className="text-sm text-muted-foreground">Configure system-wide settings and preferences</p>
        <span className="inline-block text-xs text-muted-foreground bg-muted px-2 py-1 rounded">Coming Soon</span>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-3">
        <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-info"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/></svg>
        </div>
        <h3 className="font-semibold text-foreground">Cache Management</h3>
        <p className="text-sm text-muted-foreground">View cache statistics and clear system caches</p>
        <span className="inline-block text-xs text-muted-foreground bg-muted px-2 py-1 rounded">Coming Soon</span>
      </div>
    </div>
  </div>
);

function AppRoutes(): React.JSX.Element {
  return (
    <Routes>
      {/* Public routes */}
      <Route
        path={ROUTES.LOGIN}
        element={
          <PublicRoute>
            <LandingPage />
          </PublicRoute>
        }
      />

      {/* Unauthorized access page */}
      <Route
        path={ROUTES.UNAUTHORIZED}
        element={<UnauthorizedPage />}
      />

      {/* Protected routes with shared layout */}
      {/* Parent route: AdminRoute wraps DashboardLayout */}
      {/* Child routes render into <Outlet /> without layout wrappers */}
      <Route element={<AdminRoute><DashboardLayout /></AdminRoute>}>
        {/* CANONICAL FLAT ROUTES */}
        
        {/* Landing / Home */}
        <Route path="/" element={<DashboardOverview />} />
        
        {/* User Management */}
        <Route path="users" element={<UserListPage />} />
        <Route path="users/:userHash" element={<UserProfilePage />} />
        
        {/* Project Management */}
        <Route path="projects" element={<ProjectListPage />} />
        <Route path="projects/:projectHash" element={<ProjectDetailsPage />} />
        
        {/* Group Management */}
        <Route path="groups" element={<GroupListPage />} />
        <Route path="groups/:groupHash" element={<GroupDetailsPage />} />
        
        {/* Project Group Management */}
        {/* Redirect list to groups page with project-groups tab */}
        <Route path="groups/project-groups" element={<Navigate to="/groups?tab=project-groups" replace />} />
        <Route path="groups/project-groups/create" element={<ProjectGroupCreatePage />} />
        <Route path="groups/project-groups/edit/:groupHash" element={<ProjectGroupEditPage />} />
        <Route path="groups/project-groups/:groupHash" element={<ProjectGroupDetailsPage />} />
        
        {/* Permission Management */}
        <Route path="permissions" element={<PermissionManagementPage />} />
        <Route path="permissions/global-roles" element={<GlobalRolesPage />} />
        
        {/* Role Management */}
        <Route path="roles" element={<RoleManagementPage />} />
        
        {/* API Token Management */}
        <Route path="tokens" element={<TokenManagementPage />} />
        
        {/* Audit Log Monitor */}
        <Route path="audit" element={<AuditLogMonitorPage />} />
        
        {/* ROOT-only System route */}
        {/* RootOnlyRoute guard inside child route element */}
        <Route path="system" element={<RootOnlyRoute><SystemPage /></RootOnlyRoute>} />
        
        {/* Personal Routes */}
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings" element={<SettingsPage />} />

        {/* LEGACY REDIRECTS - preserve bookmarks and history */}
        
        {/* Dashboard root redirects to home */}
        <Route path="dashboard" element={<Navigate to="/" replace />} />
        <Route path="dashboard/overview" element={<Navigate to="/" replace />} />
        
        {/* User Management redirects */}
        <Route path="dashboard/users" element={<LegacyUsersRedirect />} />
        <Route path="dashboard/users/profile/:userHash" element={<LegacyUserProfileRedirect />} />
        
        {/* Project Management redirects */}
        <Route path="dashboard/projects" element={<LegacyProjectsRedirect />} />
        <Route path="dashboard/projects/details/:projectHash" element={<LegacyProjectDetailsRedirect />} />
        
        {/* Group Management redirects */}
        <Route path="dashboard/groups" element={<LegacyGroupsRedirect />} />
        <Route path="dashboard/groups/:groupHash" element={<LegacyGroupDetailsRedirect />} />
        
        {/* Project Group redirects */}
        <Route path="dashboard/groups/project-groups" element={<Navigate to="/groups?tab=project-groups" replace />} />
        <Route path="dashboard/groups/project-groups/create" element={<Navigate to="/groups/project-groups/create" replace />} />
        <Route path="dashboard/groups/project-groups/edit/:groupHash" element={<LegacyProjectGroupEditRedirect />} />
        <Route path="dashboard/groups/project-groups/:groupHash" element={<LegacyProjectGroupDetailsRedirect />} />
        
        {/* Permission Management redirects */}
        <Route path="dashboard/permissions/management" element={<LegacyPermissionsRedirect />} />
        <Route path="dashboard/permissions/global-roles" element={<Navigate to="/permissions/global-roles" replace />} />
        <Route path="dashboard/permissions/role-management" element={<LegacyRolesRedirect />} />
        
        {/* Token Management redirect */}
        <Route path="dashboard/tokens" element={<LegacyTokensRedirect />} />
        
        {/* Audit redirect */}
        <Route path="dashboard/audit" element={<LegacyAuditRedirect />} />
        
        {/* System redirect */}
        <Route path="dashboard/system" element={<Navigate to="/system" replace />} />
        
        {/* Personal routes redirects */}
        <Route path="dashboard/profile" element={<Navigate to="/profile" replace />} />
        <Route path="dashboard/settings" element={<Navigate to="/settings" replace />} />
      </Route>

      {/* Default redirect - unauthenticated users go to login */}
      <Route path="/" element={<Navigate to={ROUTES.LOGIN} replace />} />

      {/* Legacy login route redirect */}
      <Route path="/login" element={<Navigate to={ROUTES.LOGIN} replace />} />

      {/* Catch-all route */}
      <Route
        path="*"
        element={
          <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
            <h1 className="mb-4 text-4xl font-bold text-foreground">Page Not Found</h1>
            <p className="text-muted-foreground">The page you're looking for doesn't exist.</p>
          </div>
        }
      />
    </Routes>
  );
}

function AppContent(): React.JSX.Element {
  const { showSessionExpiryWarning, dismissSessionExpiryWarning, logout } = useAuth();

  const handleReLogin = (): void => {
    void logout();
    window.location.href = ROUTES.LOGIN;
  };

  return (
    <>
      <div className="min-h-screen bg-background text-foreground">
        <AppRoutes />
      </div>
      <SessionExpiryWarningModal
        isOpen={showSessionExpiryWarning}
        onClose={dismissSessionExpiryWarning}
        onReLogin={handleReLogin}
      />
    </>
  );
}

function App(): React.JSX.Element {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <BrowserRouter>
          <AuthProvider>
            <ToastProvider>
              <ToastContainer />
              <AppContent />
            </ToastProvider>
          </AuthProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;