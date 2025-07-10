import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts';
import { ErrorBoundary, ComingSoon } from '@/components/common';
import {
  RootOnlyRoute,
  AdminRoute,
  PublicRoute,
} from '@/components/guards';
import { ROUTES } from '@/utils/routes';
import './styles/globals.css';
import './styles/components/route-guards.css';
import './styles/pages/unauthorized.css';
import './styles/pages/login.css';
import './styles/pages/user-list.css';
import './styles/components/user-management.css';

// Import pages
import { LoginPage, UnauthorizedPage, DashboardOverview, ProfilePage, UserListPage, ProjectListPage, ProjectCreatePage, ProjectEditPage, ProjectDetailsPage } from '@/pages';
import { UserCreatePage } from '@/pages/users/UserCreatePage';
import { UserEditPage } from '@/pages/users/UserEditPage';
import { UserProfilePage } from '@/pages/users/UserProfilePage';
import { 
  GroupListPage, 
  GroupCreatePage, 
  GroupEditPage, 
  GroupDetailsPage,
  ProjectGroupsPage,
  ProjectGroupCreatePage,
  ProjectGroupEditPage
} from '@/pages/groups';
import {
  PermissionsOverviewPage,
  RolesPage,
  PermissionsPage,
  AuditPage
} from '@/pages/permissions';
import AssignmentsPage from '@/pages/permissions/AssignmentsPage';
import { DashboardLayout } from '@/components/layout';

const SystemPage = () => (
  <div className="container system-page">
    <h1>System Management</h1>
    <p>System management will be implemented in Phase 9</p>
    <p className="system-success-message">
      ✅ ROOT access successfully verified!
    </p>
  </div>
);

function App(): React.JSX.Element {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <div className="app">
            <Routes>
              {/* Public routes */}
              <Route
                path={ROUTES.LOGIN}
                element={
                  <PublicRoute>
                    <LoginPage />
                  </PublicRoute>
                }
              />

              {/* Unauthorized access page */}
              <Route
                path={ROUTES.UNAUTHORIZED}
                element={<UnauthorizedPage />}
              />

              {/* Protected dashboard routes */}
              <Route
                path={ROUTES.DASHBOARD}
                element={
                  <AdminRoute>
                    <DashboardLayout>
                      <DashboardOverview />
                    </DashboardLayout>
                  </AdminRoute>
                }
              />

              {/* Dashboard overview (same component, different route) */}
              <Route
                path={ROUTES.OVERVIEW}
                element={
                  <AdminRoute>
                    <DashboardLayout>
                      <DashboardOverview />
                    </DashboardLayout>
                  </AdminRoute>
                }
              />

              {/* Profile route */}
              <Route
                path={ROUTES.PROFILE}
                element={
                  <AdminRoute>
                    <DashboardLayout>
                      <ProfilePage />
                    </DashboardLayout>
                  </AdminRoute>
                }
              />

              {/* User Management */}
              <Route
                path={ROUTES.USERS}
                element={
                  <AdminRoute>
                    <DashboardLayout>
                      <UserListPage />
                    </DashboardLayout>
                  </AdminRoute>
                }
              />
              
              <Route
                path={ROUTES.USERS_CREATE}
                element={
                  <AdminRoute>
                    <DashboardLayout>
                      <UserCreatePage />
                    </DashboardLayout>
                  </AdminRoute>
                }
              />
              
              <Route
                path={`${ROUTES.USERS_EDIT}/:userHash`}
                element={
                  <AdminRoute>
                    <DashboardLayout>
                      <UserEditPage />
                    </DashboardLayout>
                  </AdminRoute>
                }
              />
              
              <Route
                path={`${ROUTES.USERS_PROFILE}/:userHash`}
                element={
                  <AdminRoute>
                    <DashboardLayout>
                      <UserProfilePage />
                    </DashboardLayout>
                  </AdminRoute>
                }
              />

              <Route
                path={ROUTES.PROJECTS}
                element={
                  <AdminRoute>
                    <DashboardLayout>
                      <ProjectListPage />
                    </DashboardLayout>
                  </AdminRoute>
                }
              />
              
              <Route
                path={ROUTES.PROJECTS_CREATE}
                element={
                  <AdminRoute>
                    <DashboardLayout>
                      <ProjectCreatePage />
                    </DashboardLayout>
                  </AdminRoute>
                }
              />
              
              <Route
                path={`${ROUTES.PROJECTS_EDIT}/:projectHash`}
                element={
                  <AdminRoute>
                    <DashboardLayout>
                      <ProjectEditPage />
                    </DashboardLayout>
                  </AdminRoute>
                }
              />
              
              <Route
                path={`${ROUTES.PROJECTS_DETAILS}/:projectHash`}
                element={
                  <AdminRoute>
                    <DashboardLayout>
                      <ProjectDetailsPage />
                    </DashboardLayout>
                  </AdminRoute>
                }
              />

              {/* Group Management */}
              <Route
                path={ROUTES.GROUPS}
                element={
                  <AdminRoute>
                    <DashboardLayout>
                      <GroupListPage />
                    </DashboardLayout>
                  </AdminRoute>
                }
              />
              
              <Route
                path={ROUTES.GROUPS_CREATE}
                element={
                  <AdminRoute>
                    <DashboardLayout>
                      <GroupCreatePage />
                    </DashboardLayout>
                  </AdminRoute>
                }
              />
              
              <Route
                path={`${ROUTES.GROUPS_EDIT}/:groupHash`}
                element={
                  <AdminRoute>
                    <DashboardLayout>
                      <GroupEditPage />
                    </DashboardLayout>
                  </AdminRoute>
                }
              />
              
              <Route
                path={`${ROUTES.GROUPS}/:groupHash`}
                element={
                  <AdminRoute>
                    <DashboardLayout>
                      <GroupDetailsPage />
                    </DashboardLayout>
                  </AdminRoute>
                }
              />

              {/* Project Group Management */}
              <Route
                path={ROUTES.PROJECT_GROUPS}
                element={
                  <AdminRoute>
                    <DashboardLayout>
                      <ProjectGroupsPage />
                    </DashboardLayout>
                  </AdminRoute>
                }
              />
              
              <Route
                path={ROUTES.PROJECT_GROUPS_CREATE}
                element={
                  <AdminRoute>
                    <DashboardLayout>
                      <ProjectGroupCreatePage />
                    </DashboardLayout>
                  </AdminRoute>
                }
              />
              
              <Route
                path={`${ROUTES.PROJECT_GROUPS_EDIT}/:groupHash`}
                element={
                  <AdminRoute>
                    <DashboardLayout>
                      <ProjectGroupEditPage />
                    </DashboardLayout>
                  </AdminRoute>
                }
              />

              {/* Permission Management Routes */}
              <Route
                path={ROUTES.PERMISSIONS}
                element={
                  <AdminRoute>
                    <DashboardLayout>
                      <PermissionsOverviewPage />
                    </DashboardLayout>
                  </AdminRoute>
                }
              />
              
              <Route
                path={ROUTES.PERMISSIONS_ROLES}
                element={
                  <AdminRoute>
                    <DashboardLayout>
                      <RolesPage />
                    </DashboardLayout>
                  </AdminRoute>
                }
              />
              
              <Route
                path={ROUTES.PERMISSIONS_LIST}
                element={
                  <AdminRoute>
                    <DashboardLayout>
                      <PermissionsPage />
                    </DashboardLayout>
                  </AdminRoute>
                }
              />
              
              <Route
                path="/dashboard/permissions/audit"
                element={
                  <AdminRoute>
                    <DashboardLayout>
                      <AuditPage />
                    </DashboardLayout>
                  </AdminRoute>
                }
              />
              
              <Route
                path={`${ROUTES.PERMISSIONS_ASSIGNMENTS}/:projectHash?`}
                element={
                  <AdminRoute>
                    <DashboardLayout>
                      <AssignmentsPage />
                    </DashboardLayout>
                  </AdminRoute>
                }
              />

              {/* ROOT-only system routes */}
              <Route
                path={ROUTES.SYSTEM}
                element={
                  <RootOnlyRoute>
                    <SystemPage />
                  </RootOnlyRoute>
                }
              />

              {/* Default redirects */}
              <Route path="/" element={<Navigate to={ROUTES.LOGIN} replace />} />
              
              {/* Catch-all route */}
              <Route
                path="*"
                element={
                  <div className="not-found">
                    <h1>Page Not Found</h1>
                    <p>The page you're looking for doesn't exist.</p>
                  </div>
                }
              />
            </Routes>
          </div>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
