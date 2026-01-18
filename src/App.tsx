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

// Import pages
import { LandingPage, UnauthorizedPage, DashboardOverview, ProfilePage, UserListPage, ProjectListPage, ProjectDetailsPage } from '@/pages';
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
import { AuditLogMonitorPage } from '@/components/features/audit';
import { DashboardLayout } from '@/components/layout';

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

function App(): React.JSX.Element {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <ToastContainer />
            <div className="min-h-screen bg-background text-foreground">
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
              {/* Redirect to unified Groups page with project-groups tab */}
              <Route
                path={ROUTES.PROJECT_GROUPS}
                element={<Navigate to={`${ROUTES.GROUPS}?tab=project-groups`} replace />}
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
              
              <Route
                path={`${ROUTES.PROJECT_GROUPS}/:groupHash`}
                element={
                  <AdminRoute>
                    <DashboardLayout>
                      <ProjectGroupDetailsPage />
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

              {/* Audit Log Monitor */}
              <Route
                path={ROUTES.AUDIT}
                element={
                  <AdminRoute>
                    <DashboardLayout>
                      <AuditLogMonitorPage />
                    </DashboardLayout>
                  </AdminRoute>
                }
              />

              {/* ROOT-only system routes */}
              <Route
                path={ROUTES.SYSTEM}
                element={
                  <RootOnlyRoute>
                    <DashboardLayout>
                      <SystemPage />
                    </DashboardLayout>
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
                  <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
                    <h1 className="mb-4 text-4xl font-bold text-foreground">Page Not Found</h1>
                    <p className="text-muted-foreground">The page you're looking for doesn't exist.</p>
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
