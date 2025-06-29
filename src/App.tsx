import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts';
import { ErrorBoundary } from '@/components/common';
import {
  ProtectedRoute,
  RootOnlyRoute,
  AdminRoute,
  PublicRoute,
} from '@/components/guards';
import { ROUTES } from '@/utils/routes';
import './styles/globals.css';
import './styles/components/route-guards.css';
import './styles/pages/unauthorized.css';

// Import pages
import { LoginPage, UnauthorizedPage } from '@/pages/auth';

// Placeholder components for future milestones
const DashboardPage = () => (
  <div className="container" style={{ padding: 'var(--spacing-8)' }}>
    <h1>Dashboard</h1>
    <p>Dashboard implementation will be added in Phase 3</p>
    <div style={{ 
      background: 'var(--color-gray-100)', 
      padding: 'var(--spacing-6)',
      borderRadius: 'var(--border-radius-lg)',
      marginTop: 'var(--spacing-6)'
    }}>
      <h2 style={{ color: 'var(--color-gray-800)', marginBottom: 'var(--spacing-4)' }}>
        ✅ Milestone 2.2 Complete - Route Protection System
      </h2>
      <ul style={{ color: 'var(--color-gray-700)', lineHeight: 'var(--line-height-relaxed)' }}>
        <li>✅ Base ProtectedRoute component with auth checking</li>
        <li>✅ User type-specific route guards (ROOT, ADMIN, PUBLIC)</li>
        <li>✅ Permission-based route protection</li>
        <li>✅ Unauthorized access handling</li>
        <li>✅ Loading states during auth verification</li>
        <li>✅ Route state preservation for redirects</li>
      </ul>
    </div>
  </div>
);

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
                    <DashboardPage />
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
