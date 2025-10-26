import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, ToastProvider } from '@/contexts';
import { ErrorBoundary, ToastContainer } from '@/components/common';
import {
  RootOnlyRoute,
  AdminRoute,
  PublicRoute,
} from '@/components/guards';
import { ROUTES } from '@/utils/routes';
import './styles/globals.css';
import './styles/pages/landing.css';

// Import pages
import { LandingPage, UnauthorizedPage, DashboardOverview, ProfilePage, UserListPage, ProjectListPage, ProjectDetailsPage } from '@/pages';
import { UserProfilePage } from '@/pages/users/UserProfilePage';
import { 
  GroupListPage, 
  GroupDetailsPage,
  ProjectGroupsPage,
  ProjectGroupCreatePage,
  ProjectGroupEditPage
} from '@/pages/groups';
import {
  PermissionManagementPage,
  GlobalRolesPage,
  RoleManagementPage
} from '@/pages/permissions';
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
          <ToastProvider>
            <ToastContainer />
            <div className="app">
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
              
              {/* User Profile - Keep for detailed view */}
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

              {/* Permission Management (UNIFIED) */}
              <Route
                path={ROUTES.PERMISSION_MANAGEMENT}
                element={
                  <AdminRoute>
                    <DashboardLayout>
                      <PermissionManagementPage />
                    </DashboardLayout>
                  </AdminRoute>
                }
              />

              {/* Global Roles Management (NEW) */}
              <Route
                path={ROUTES.GLOBAL_ROLES}
                element={
                  <AdminRoute>
                    <DashboardLayout>
                      <GlobalRolesPage />
                    </DashboardLayout>
                  </AdminRoute>
                }
              />
              
              <Route
                path={ROUTES.ROLE_MANAGEMENT}
                element={
                  <AdminRoute>
                    <DashboardLayout>
                      <RoleManagementPage />
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
              
              {/* Legacy login route redirect */}
              <Route path="/login" element={<Navigate to={ROUTES.LOGIN} replace />} />
              
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
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
