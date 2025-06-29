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

// Import pages
import { LoginPage, UnauthorizedPage, DashboardOverview, ProfilePage } from '@/pages';
import { DashboardLayout } from '@/components/layout';

const SystemPage = () => (
  <div className="container" style={{ padding: 'var(--spacing-8)' }}>
    <h1>System Management</h1>
    <p>System management will be implemented in Phase 9</p>
    <p style={{ color: 'var(--color-success)', fontWeight: 'bold' }}>
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

              {/* Placeholder dashboard routes */}
              <Route
                path={ROUTES.USERS}
                element={
                  <AdminRoute>
                    <DashboardLayout>
                      <ComingSoon 
                        title="User Management"
                        description="Manage system users, permissions, and access controls"
                        feature="User management"
                      />
                    </DashboardLayout>
                  </AdminRoute>
                }
              />

              <Route
                path={ROUTES.PROJECTS}
                element={
                  <AdminRoute>
                    <DashboardLayout>
                      <ComingSoon 
                        title="Project Management"
                        description="Create and manage projects, assign users, and configure settings"
                        feature="Project management"
                      />
                    </DashboardLayout>
                  </AdminRoute>
                }
              />

              <Route
                path={ROUTES.GROUPS}
                element={
                  <AdminRoute>
                    <DashboardLayout>
                      <ComingSoon 
                        title="User Groups"
                        description="Organize users into groups and manage group permissions"
                        feature="User group management"
                      />
                    </DashboardLayout>
                  </AdminRoute>
                }
              />

              <Route
                path={ROUTES.PERMISSIONS}
                element={
                  <AdminRoute>
                    <DashboardLayout>
                      <ComingSoon 
                        title="Permission Management"
                        description="Configure roles, permissions, and access control policies"
                        feature="Permission and role management"
                      />
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
                  <div className="not-found" style={{ 
                    padding: 'var(--spacing-8)', 
                    textAlign: 'center',
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
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
