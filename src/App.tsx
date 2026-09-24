import React, { lazy } from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { AuthProvider, ThemeProvider, ToastProvider } from '@/contexts';
import { useAuth } from '@/hooks';
import { ErrorBoundary, ToastContainer } from '@/components/common';
import { AdminRoute, PublicRoute, RootOnlyRoute } from '@/components/guards';
import { DashboardLayout } from '@/components/layout';
import { SessionExpiryWarningModal } from '@/components/features/settings/SessionExpiryWarningModal';
import { LoginPage, UnauthorizedPage } from '@/pages/auth';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { ROUTES } from '@/utils/routes';

/**
 * Console pages are split per area: each chunk loads on first visit, so sign-in
 * and the shell stay light. The layout renders the Suspense fallback.
 */
function lazyPage<K extends string, M extends Record<K, React.ComponentType>>(
  load: () => Promise<M>,
  name: K
): React.LazyExoticComponent<React.ComponentType> {
  return lazy(() => load().then((module) => ({ default: module[name] })));
}

const DashboardOverview = lazyPage(
  () => import('@/pages/dashboard'),
  'DashboardOverview'
);
const ProfilePage = lazyPage(() => import('@/pages/dashboard'), 'ProfilePage');
const SettingsPage = lazyPage(
  () => import('@/pages/dashboard'),
  'SettingsPage'
);
const UserListPage = lazyPage(() => import('@/pages/users'), 'UserListPage');
const UserProfilePage = lazyPage(
  () => import('@/pages/users'),
  'UserProfilePage'
);
const GroupListPage = lazyPage(() => import('@/pages/groups'), 'GroupListPage');
const GroupDetailsPage = lazyPage(
  () => import('@/pages/groups'),
  'GroupDetailsPage'
);
const ProjectGroupCreatePage = lazyPage(
  () => import('@/pages/groups'),
  'ProjectGroupCreatePage'
);
const ProjectGroupEditPage = lazyPage(
  () => import('@/pages/groups'),
  'ProjectGroupEditPage'
);
const ProjectGroupDetailsPage = lazyPage(
  () => import('@/pages/groups'),
  'ProjectGroupDetailsPage'
);
const ProjectListPage = lazyPage(
  () => import('@/pages/projects'),
  'ProjectListPage'
);
const ProjectDetailsPage = lazyPage(
  () => import('@/pages/projects'),
  'ProjectDetailsPage'
);
const PermissionManagementPage = lazyPage(
  () => import('@/pages/permissions'),
  'PermissionManagementPage'
);
const TokenManagementPage = lazyPage(
  () => import('@/pages/tokens'),
  'TokenManagementPage'
);
const AuditLogMonitorPage = lazyPage(
  () => import('@/components/features/audit'),
  'AuditLogMonitorPage'
);
const BillingGroupsPage = lazyPage(
  () => import('@/pages/billing'),
  'BillingGroupsPage'
);
const BillingGroupDetailsPage = lazyPage(
  () => import('@/pages/billing'),
  'BillingGroupDetailsPage'
);
const OAuthConnectionsPage = lazyPage(
  () => import('@/pages/oauth'),
  'OAuthConnectionsPage'
);
const OAuthConnectionDetailsPage = lazyPage(
  () => import('@/pages/oauth'),
  'OAuthConnectionDetailsPage'
);
const SystemPage = lazyPage(() => import('@/pages/system'), 'SystemPage');
const PatreonPage = lazyPage(() => import('@/pages/system'), 'PatreonPage');
const EmailTemplatesPage = lazyPage(
  () => import('@/pages/system'),
  'EmailTemplatesPage'
);
const EmailTemplateEditorPage = lazyPage(
  () => import('@/pages/system'),
  'EmailTemplateEditorPage'
);

/**
 * Redirect an old `/dashboard/...` URL to its canonical flat route, keeping the
 * query string. `to` may reference route params as `:name`.
 */
function LegacyRedirect({ to }: { to: string }): React.JSX.Element {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const target = to.replace(/:(\w+)/g, (_match, name: string) =>
    encodeURIComponent(params[name] ?? '')
  );
  const query = searchParams.toString();
  return (
    <Navigate
      to={
        query ? `${target}${target.includes('?') ? '&' : '?'}${query}` : target
      }
      replace
    />
  );
}

/** `/roles?tab=groups|assignments` → the matching Roles & permissions tab. */
function LegacyRolesPageRedirect(): React.JSX.Element {
  const [searchParams] = useSearchParams();
  const legacyTab = searchParams.get('tab');
  const tab =
    legacyTab === 'groups'
      ? 'permission-groups'
      : legacyTab === 'assignments'
        ? 'assignments'
        : 'roles';
  return <Navigate to={`${ROUTES.PERMISSIONS}?tab=${tab}`} replace />;
}

const LEGACY_REDIRECTS: Array<[path: string, to: string]> = [
  ['dashboard', '/'],
  ['dashboard/overview', '/'],
  ['dashboard/users', ROUTES.USERS],
  ['dashboard/users/profile/:userHash', '/users/:userHash'],
  ['dashboard/projects', ROUTES.PROJECTS],
  ['dashboard/projects/details/:projectHash', '/projects/:projectHash'],
  ['dashboard/groups', ROUTES.GROUPS],
  ['dashboard/groups/project-groups', '/groups?tab=project-groups'],
  ['dashboard/groups/project-groups/create', ROUTES.PROJECT_GROUPS_CREATE],
  [
    'dashboard/groups/project-groups/edit/:groupHash',
    '/groups/project-groups/edit/:groupHash',
  ],
  [
    'dashboard/groups/project-groups/:groupHash',
    '/groups/project-groups/:groupHash',
  ],
  ['dashboard/groups/:groupHash', '/groups/:groupHash'],
  ['dashboard/permissions/management', ROUTES.PERMISSIONS],
  ['dashboard/permissions/global-roles', '/permissions?tab=roles'],
  ['dashboard/permissions/role-management', ROUTES.ROLES],
  ['dashboard/tokens', ROUTES.TOKENS],
  ['dashboard/audit', ROUTES.AUDIT],
  ['dashboard/system', ROUTES.SYSTEM],
  ['dashboard/system/patreon', ROUTES.PATREON],
  ['dashboard/profile', ROUTES.PROFILE],
  ['dashboard/settings', ROUTES.SETTINGS],
];

export function AppRoutes(): React.JSX.Element {
  return (
    <Routes>
      <Route
        path={ROUTES.LOGIN}
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route path={ROUTES.UNAUTHORIZED} element={<UnauthorizedPage />} />

      {/* Everything below requires a root or admin session and renders inside the app shell. */}
      <Route
        element={
          <AdminRoute>
            <DashboardLayout />
          </AdminRoute>
        }
      >
        <Route path="/" element={<DashboardOverview />} />

        {/* Access management */}
        <Route path="users" element={<UserListPage />} />
        <Route path="users/:userHash" element={<UserProfilePage />} />
        <Route path="groups" element={<GroupListPage />} />
        <Route path="groups/:groupHash" element={<GroupDetailsPage />} />
        <Route
          path="groups/project-groups"
          element={<Navigate to="/groups?tab=project-groups" replace />}
        />
        <Route
          path="groups/project-groups/create"
          element={<ProjectGroupCreatePage />}
        />
        <Route
          path="groups/project-groups/edit/:groupHash"
          element={<ProjectGroupEditPage />}
        />
        <Route
          path="groups/project-groups/:groupHash"
          element={<ProjectGroupDetailsPage />}
        />
        <Route path="projects" element={<ProjectListPage />} />
        <Route path="projects/:projectHash" element={<ProjectDetailsPage />} />
        <Route path="permissions" element={<PermissionManagementPage />} />
        <Route
          path="permissions/global-roles"
          element={<Navigate to="/permissions?tab=roles" replace />}
        />
        <Route path="roles" element={<LegacyRolesPageRedirect />} />

        {/* Operations */}
        <Route path="tokens" element={<TokenManagementPage />} />
        <Route path="audit" element={<AuditLogMonitorPage />} />
        <Route path="billing" element={<BillingGroupsPage />} />
        <Route
          path="billing/:groupHash"
          element={<BillingGroupDetailsPage />}
        />
        <Route path="oauth" element={<OAuthConnectionsPage />} />
        <Route
          path="oauth/:connectionHash"
          element={<OAuthConnectionDetailsPage />}
        />

        {/* Root only (the API enforces this too) */}
        <Route
          path="system"
          element={
            <RootOnlyRoute>
              <SystemPage />
            </RootOnlyRoute>
          }
        />
        <Route
          path="system/patreon"
          element={
            <RootOnlyRoute>
              <PatreonPage />
            </RootOnlyRoute>
          }
        />
        <Route
          path="email-templates"
          element={
            <RootOnlyRoute>
              <EmailTemplatesPage />
            </RootOnlyRoute>
          }
        />
        <Route
          path="email-templates/:templateCode"
          element={
            <RootOnlyRoute>
              <EmailTemplateEditorPage />
            </RootOnlyRoute>
          }
        />

        {/* Personal */}
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings" element={<SettingsPage />} />

        {/* Old /dashboard/... bookmarks */}
        {LEGACY_REDIRECTS.map(([path, to]) => (
          <Route key={path} path={path} element={<LegacyRedirect to={to} />} />
        ))}

        {/* Unknown console URLs render inside the shell; signed-out visitors are sent to sign in. */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

function AppContent(): React.JSX.Element {
  const { showSessionExpiryWarning, dismissSessionExpiryWarning, logout } =
    useAuth();

  const handleReLogin = (): void => {
    // Await server-side logout before navigating away, otherwise the hard
    // redirect aborts the in-flight /auth/logout request and the session lives on.
    void logout().finally(() => {
      window.location.href = ROUTES.LOGIN;
    });
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
