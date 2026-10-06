import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
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

const LandingPage = lazyPage(() => import('@/pages/landing'), 'LandingPage');

const AssistantPanel = lazy(
  () => import('@/components/features/assistant/AssistantPanel')
);

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

/** Public pages render outside the shell, so they bring their own Suspense boundary. */
function PublicLazyPage({
  page: Page,
}: {
  page: React.ComponentType;
}): React.JSX.Element {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <Page />
    </Suspense>
  );
}

/**
 * The console shell. Signed-out visitors to `/` see the public overview page
 * instead of being sent to sign in; every other console URL (and `/` once
 * signed in) goes through AdminRoute.
 */
function ConsoleEntry(): React.JSX.Element {
  const { isAuthenticated, isLoading } = useAuth();
  const { pathname } = useLocation();

  if (!isLoading && !isAuthenticated && pathname === ROUTES.HOME) {
    return <PublicLazyPage page={LandingPage} />;
  }

  return (
    <AdminRoute>
      <DashboardLayout />
    </AdminRoute>
  );
}

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
      {/* The public overview stays reachable while signed in. */}
      <Route
        path={ROUTES.ABOUT}
        element={<PublicLazyPage page={LandingPage} />}
      />

      {/* Everything below requires a root or admin session and renders inside the app shell. */}
      <Route element={<ConsoleEntry />}>
        <Route path="/" element={<DashboardOverview />} />

        {/* Access management */}
        <Route path="users" element={<UserListPage />} />
        <Route path="users/:userHash" element={<UserProfilePage />} />
        <Route path="groups" element={<GroupListPage />} />
        <Route path="groups/:groupHash" element={<GroupDetailsPage />} />
        <Route path="groups/project-groups" element={<NotFoundPage />} />
        <Route path="groups/project-groups/create" element={<NotFoundPage />} />
        <Route
          path="groups/project-groups/:groupHash"
          element={<ProjectGroupDetailsPage />}
        />
        <Route path="projects" element={<ProjectListPage />} />
        <Route path="projects/:projectHash" element={<ProjectDetailsPage />} />
        <Route path="permissions" element={<PermissionManagementPage />} />

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

        {/* Unknown console URLs render inside the shell; signed-out visitors are sent to sign in. */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

function AppContent(): React.JSX.Element {
  const {
    showSessionExpiryWarning,
    dismissSessionExpiryWarning,
    logout,
    userType,
    isAuthenticated,
  } = useAuth();

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
      {isAuthenticated && userType === 'root' && (
        <ErrorBoundary
          fallback={
            <div
              role="alert"
              className="fixed bottom-4 right-4 z-40 rounded border border-destructive bg-card p-3 text-sm"
            >
              The assistant could not load. Refresh to retry.
            </div>
          }
        >
          <Suspense fallback={null}>
            <AssistantPanel />
          </Suspense>
        </ErrorBoundary>
      )}
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
