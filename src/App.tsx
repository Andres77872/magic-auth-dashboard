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
import { LandingPage, UnauthorizedPage, DashboardOverview, ProfilePage, UserListPage, ProjectListPage, ProjectDetailsPage, SettingsPage, EmailTemplatesPage, EmailTemplateEditorPage, PatreonPage, SystemPage, BillingGroupsPage, BillingGroupDetailsPage } from '@/pages';
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

        {/* Billing — groups, catalog, per-account Stripe credentials (admin; creds root-gated) */}
        <Route path="billing" element={<BillingGroupsPage />} />
        <Route path="billing/:groupHash" element={<BillingGroupDetailsPage />} />
        
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

        {/* ROOT-only Email Templates editor */}
        <Route path="email-templates" element={<RootOnlyRoute><EmailTemplatesPage /></RootOnlyRoute>} />
        <Route path="email-templates/:templateCode" element={<RootOnlyRoute><EmailTemplateEditorPage /></RootOnlyRoute>} />

        {/* ROOT-only Patreon operations */}
        <Route path="system/patreon" element={<RootOnlyRoute><PatreonPage /></RootOnlyRoute>} />
        
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
        <Route path="dashboard/system/patreon" element={<Navigate to={ROUTES.PATREON} replace />} />
        
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
