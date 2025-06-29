# Milestone 2.2: Route Protection System

## Overview
**Duration**: Day 3-4  
**Goal**: Implement comprehensive route protection with user type-based access control and permission verification

**Dependencies**: ✅ Milestone 2.1 completed (Authentication Context)

## 📋 Tasks Checklist

### Step 1: Base Route Guard Components
- [ ] Create ProtectedRoute base component
- [ ] Implement route authentication checking
- [ ] Add loading states during auth verification
- [ ] Handle redirect logic for unauthenticated users

### Step 2: User Type-Specific Guards
- [ ] Create RootOnlyRoute for ROOT users
- [ ] Implement AdminRoute for ADMIN and ROOT users
- [ ] Add PublicRoute for unauthenticated users
- [ ] Create PermissionRoute for granular permissions

### Step 3: Unauthorized Access Handling
- [ ] Create UnauthorizedPage component
- [ ] Implement proper error messaging
- [ ] Add navigation back to accessible routes
- [ ] Handle different unauthorized scenarios

### Step 4: Route Integration with React Router
- [ ] Set up main App routing structure
- [ ] Integrate route guards with React Router v7
- [ ] Add route transition handling
- [ ] Implement redirect preservation

---

## 🔧 Detailed Implementation Steps

### Step 1: Base Protected Route Component

Create `src/components/guards/ProtectedRoute.tsx`:

```typescript
import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/utils/routes';
import { LoadingSpinner } from '@/components/common';

interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
  requireAuth?: boolean;
}

export function ProtectedRoute({
  children,
  redirectTo = ROUTES.LOGIN,
  requireAuth = true,
}: ProtectedRouteProps): JSX.Element {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="route-loading">
        <LoadingSpinner size="large" message="Verifying authentication..." />
      </div>
    );
  }

  // Check authentication requirement
  if (requireAuth && !isAuthenticated) {
    // Preserve the attempted URL for redirect after login
    return (
      <Navigate
        to={redirectTo}
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  // Redirect authenticated users away from public routes
  if (!requireAuth && isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
```

### Step 2: User Type-Specific Route Guards

Create `src/components/guards/RootOnlyRoute.tsx`:

```typescript
import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, useUserType } from '@/hooks';
import { ROUTES } from '@/utils/routes';
import { UserType } from '@/types/auth.types';
import { ProtectedRoute } from './ProtectedRoute';

interface RootOnlyRouteProps {
  children: ReactNode;
}

export function RootOnlyRoute({ children }: RootOnlyRouteProps): JSX.Element {
  const { isAuthenticated } = useAuth();
  const { userType } = useUserType();

  return (
    <ProtectedRoute>
      {isAuthenticated && userType !== UserType.ROOT ? (
        <Navigate to={ROUTES.UNAUTHORIZED} replace />
      ) : (
        <>{children}</>
      )}
    </ProtectedRoute>
  );
}

export default RootOnlyRoute;
```

Create `src/components/guards/AdminRoute.tsx`:

```typescript
import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, useUserType } from '@/hooks';
import { ROUTES } from '@/utils/routes';
import { UserType } from '@/types/auth.types';
import { ProtectedRoute } from './ProtectedRoute';

interface AdminRouteProps {
  children: ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps): JSX.Element {
  const { isAuthenticated } = useAuth();
  const { userType, isAdminOrHigher } = useUserType();

  return (
    <ProtectedRoute>
      {isAuthenticated && !isAdminOrHigher ? (
        <Navigate to={ROUTES.UNAUTHORIZED} replace />
      ) : (
        <>{children}</>
      )}
    </ProtectedRoute>
  );
}

export default AdminRoute;
```

Create `src/components/guards/PermissionRoute.tsx`:

```typescript
import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, usePermissions } from '@/hooks';
import { ROUTES } from '@/utils/routes';
import { ProtectedRoute } from './ProtectedRoute';

interface PermissionRouteProps {
  children: ReactNode;
  permission: string;
  fallbackRoute?: string;
}

export function PermissionRoute({
  children,
  permission,
  fallbackRoute = ROUTES.UNAUTHORIZED,
}: PermissionRouteProps): JSX.Element {
  const { isAuthenticated } = useAuth();
  const { hasPermission } = usePermissions();

  return (
    <ProtectedRoute>
      {isAuthenticated && !hasPermission(permission) ? (
        <Navigate to={fallbackRoute} replace />
      ) : (
        <>{children}</>
      )}
    </ProtectedRoute>
  );
}

export default PermissionRoute;
```

Create `src/components/guards/PublicRoute.tsx`:

```typescript
import React, { ReactNode } from 'react';
import { ProtectedRoute } from './ProtectedRoute';

interface PublicRouteProps {
  children: ReactNode;
  redirectAuthenticated?: boolean;
}

export function PublicRoute({
  children,
  redirectAuthenticated = true,
}: PublicRouteProps): JSX.Element {
  return (
    <ProtectedRoute requireAuth={false}>
      {children}
    </ProtectedRoute>
  );
}

export default PublicRoute;
```

### Step 3: Route Guard Index File

Create `src/components/guards/index.ts`:

```typescript
export { default as ProtectedRoute } from './ProtectedRoute';
export { default as RootOnlyRoute } from './RootOnlyRoute';
export { default as AdminRoute } from './AdminRoute';
export { default as PermissionRoute } from './PermissionRoute';
export { default as PublicRoute } from './PublicRoute';
```

### Step 4: Unauthorized Access Page

Create `src/pages/auth/UnauthorizedPage.tsx`:

```typescript
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, useUserType } from '@/hooks';
import { ROUTES } from '@/utils/routes';

export function UnauthorizedPage(): JSX.Element {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  const { userType, getUserTypeLabel } = useUserType();

  const handleGoBack = (): void => {
    navigate(-1);
  };

  const handleGoHome = (): void => {
    if (isAuthenticated) {
      navigate(ROUTES.DASHBOARD);
    } else {
      navigate(ROUTES.LOGIN);
    }
  };

  const handleLogout = async (): Promise<void> => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  return (
    <div className="unauthorized-page">
      <div className="unauthorized-container">
        <div className="unauthorized-content">
          <div className="unauthorized-icon">
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="error-icon"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="m15 9-6 6" />
              <path d="m9 9 6 6" />
            </svg>
          </div>

          <h1 className="unauthorized-title">Access Denied</h1>
          
          <p className="unauthorized-message">
            You don't have permission to access this resource.
          </p>

          {isAuthenticated && (
            <div className="user-info">
              <p className="current-user">
                Logged in as: <strong>{userType}</strong> ({getUserTypeLabel()})
              </p>
            </div>
          )}

          <div className="unauthorized-actions">
            <button
              onClick={handleGoBack}
              className="btn btn-secondary"
              type="button"
            >
              Go Back
            </button>

            <button
              onClick={handleGoHome}
              className="btn btn-primary"
              type="button"
            >
              {isAuthenticated ? 'Go to Dashboard' : 'Go to Login'}
            </button>

            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="btn btn-outline"
                type="button"
              >
                Logout
              </button>
            )}
          </div>

          <div className="help-section">
            <h3>Need Access?</h3>
            <p>
              If you believe you should have access to this resource, please contact your administrator.
            </p>
            <ul className="access-requirements">
              <li>ROOT users have access to all system features</li>
              <li>ADMIN users can manage projects and users</li>
              <li>Regular users have limited dashboard access</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UnauthorizedPage;
```

### Step 5: Loading Spinner Component

Create `src/components/common/LoadingSpinner.tsx`:

```typescript
import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
  className?: string;
}

export function LoadingSpinner({
  size = 'medium',
  message,
  className = '',
}: LoadingSpinnerProps): JSX.Element {
  const sizeClass = `spinner-${size}`;

  return (
    <div className={`loading-spinner ${className}`}>
      <div className={`spinner ${sizeClass}`}>
        <div className="spinner-circle"></div>
      </div>
      {message && (
        <p className="spinner-message">{message}</p>
      )}
    </div>
  );
}

export default LoadingSpinner;
```

### Step 6: CSS Styles for Route Guards and Components

Create `src/styles/components/route-guards.css`:

```css
/* Route Guards Styles */
.route-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: var(--color-gray-50);
}

/* Loading Spinner */
.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-4);
}

.spinner {
  display: inline-block;
  position: relative;
}

.spinner-circle {
  display: inline-block;
  border-radius: 50%;
  border: 2px solid var(--color-gray-200);
  border-top-color: var(--color-primary-500);
  animation: spin 1s linear infinite;
}

/* Spinner sizes */
.spinner-small .spinner-circle {
  width: 20px;
  height: 20px;
}

.spinner-medium .spinner-circle {
  width: 32px;
  height: 32px;
}

.spinner-large .spinner-circle {
  width: 48px;
  height: 48px;
}

.spinner-message {
  margin: 0;
  color: var(--color-gray-600);
  font-size: var(--font-size-sm);
  text-align: center;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
```

Create `src/styles/pages/unauthorized.css`:

```css
/* Unauthorized Page Styles */
.unauthorized-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--color-gray-50);
  padding: var(--spacing-4);
}

.unauthorized-container {
  max-width: 600px;
  width: 100%;
}

.unauthorized-content {
  background: white;
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-lg);
  padding: var(--spacing-12);
  text-align: center;
}

.unauthorized-icon {
  margin-bottom: var(--spacing-6);
}

.error-icon {
  color: var(--color-error);
  width: 64px;
  height: 64px;
}

.unauthorized-title {
  color: var(--color-gray-900);
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--spacing-4);
}

.unauthorized-message {
  color: var(--color-gray-600);
  font-size: var(--font-size-lg);
  margin-bottom: var(--spacing-8);
  line-height: var(--line-height-relaxed);
}

.user-info {
  background-color: var(--color-gray-100);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-4);
  margin-bottom: var(--spacing-8);
}

.current-user {
  margin: 0;
  color: var(--color-gray-700);
  font-size: var(--font-size-sm);
}

.unauthorized-actions {
  display: flex;
  gap: var(--spacing-3);
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: var(--spacing-8);
}

.help-section {
  border-top: 1px solid var(--color-gray-200);
  padding-top: var(--spacing-6);
  text-align: left;
}

.help-section h3 {
  color: var(--color-gray-900);
  font-size: var(--font-size-lg);
  margin-bottom: var(--spacing-3);
}

.help-section p {
  color: var(--color-gray-600);
  margin-bottom: var(--spacing-4);
}

.access-requirements {
  color: var(--color-gray-600);
  padding-left: var(--spacing-5);
}

.access-requirements li {
  margin-bottom: var(--spacing-2);
}

/* Button styles (if not already defined) */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2) var(--spacing-4);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  text-decoration: none;
  transition: all var(--transition-fast);
  border: var(--border-width-1) solid transparent;
  cursor: pointer;
}

.btn-primary {
  background-color: var(--color-primary-500);
  color: white;
}

.btn-primary:hover {
  background-color: var(--color-primary-600);
}

.btn-secondary {
  background-color: var(--color-gray-500);
  color: white;
}

.btn-secondary:hover {
  background-color: var(--color-gray-600);
}

.btn-outline {
  background-color: transparent;
  color: var(--color-gray-700);
  border-color: var(--color-gray-300);
}

.btn-outline:hover {
  background-color: var(--color-gray-100);
}

/* Responsive design */
@media (max-width: 640px) {
  .unauthorized-content {
    padding: var(--spacing-8);
  }

  .unauthorized-actions {
    flex-direction: column;
    align-items: center;
  }

  .btn {
    width: 100%;
    max-width: 200px;
  }
}
```

### Step 7: Main App Routing Structure

Update `src/App.tsx`:

```typescript
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

// Import pages (these will be created in next milestone)
import LoginPage from '@/pages/auth/LoginPage';
import UnauthorizedPage from '@/pages/auth/UnauthorizedPage';

// Placeholder components for future milestones
const DashboardPage = () => <div>Dashboard (Phase 3)</div>;
const SystemPage = () => <div>System Management (Phase 9)</div>;

function App(): JSX.Element {
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
```

---

## 🧪 Testing & Verification

### Step 1: Route Protection Testing

Create a test component to verify route protection:

```typescript
// src/test-route-protection.tsx (temporary)
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useUserType } from '@/hooks';
import { ROUTES } from '@/utils/routes';

export function RouteProtectionTest(): JSX.Element {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  const { userType, getUserTypeLabel } = useUserType();

  const testRoutes = [
    { path: ROUTES.DASHBOARD, label: 'Dashboard (Admin+)' },
    { path: ROUTES.SYSTEM, label: 'System (ROOT only)' },
    { path: ROUTES.UNAUTHORIZED, label: 'Unauthorized Page' },
  ];

  return (
    <div className="route-test">
      <h2>Route Protection Test</h2>
      
      <div className="auth-status">
        <p>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
        <p>User Type: {getUserTypeLabel()}</p>
      </div>

      <div className="test-actions">
        {testRoutes.map(({ path, label }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className="btn btn-secondary"
          >
            Test {label}
          </button>
        ))}
        
        {isAuthenticated && (
          <button onClick={logout} className="btn btn-outline">
            Logout
          </button>
        )}
      </div>
    </div>
  );
}
```

### Step 2: Manual Testing Scenarios

**Test Scenario 1: Unauthenticated User**
- [ ] Visit `/dashboard` → Should redirect to `/login`
- [ ] Visit `/system` → Should redirect to `/login`
- [ ] Visit `/login` → Should show login page
- [ ] Visit `/unauthorized` → Should show unauthorized page

**Test Scenario 2: ADMIN User**
- [ ] Login as ADMIN user
- [ ] Visit `/dashboard` → Should show dashboard
- [ ] Visit `/system` → Should redirect to `/unauthorized`
- [ ] Visit `/login` → Should redirect to `/dashboard`

**Test Scenario 3: ROOT User**
- [ ] Login as ROOT user
- [ ] Visit `/dashboard` → Should show dashboard
- [ ] Visit `/system` → Should show system page
- [ ] All routes accessible

**Test Scenario 4: Route State Preservation**
- [ ] While logged out, visit `/dashboard`
- [ ] Should redirect to login with state preservation
- [ ] After login, should redirect back to `/dashboard`

---

## 📁 Files Created/Modified

### New Files
- `src/components/guards/ProtectedRoute.tsx` - Base route protection
- `src/components/guards/RootOnlyRoute.tsx` - ROOT user only routes
- `src/components/guards/AdminRoute.tsx` - ADMIN/ROOT routes
- `src/components/guards/PermissionRoute.tsx` - Permission-based routes
- `src/components/guards/PublicRoute.tsx` - Public route wrapper
- `src/components/guards/index.ts` - Guard exports
- `src/pages/auth/UnauthorizedPage.tsx` - Access denied page
- `src/pages/auth/index.ts` - Auth page exports
- `src/pages/index.ts` - Page exports
- `src/components/common/LoadingSpinner.tsx` - Loading component
- `src/styles/components/route-guards.css` - Guard styles
- `src/styles/pages/unauthorized.css` - Unauthorized page styles

### Modified Files
- `src/App.tsx` - Added routing structure with guards
- `src/components/common/index.ts` - Added LoadingSpinner export

---

## ✅ Completion Criteria

- [ ] All route guard components work correctly
- [ ] User type-based access control functions properly
- [ ] Unauthenticated users are redirected to login
- [ ] Unauthorized access shows appropriate error page
- [ ] Loading states display during auth verification
- [ ] Route state preservation works for redirects
- [ ] TypeScript compilation passes without errors
- [ ] All route guards integrate with React Router v7

---

## 🎉 MILESTONE COMPLETION

**Status**: Ready for implementation  
**Next Step**: [Milestone 2.3: Login Page Implementation](../2.3-login-page/README.md)

### Key Deliverables
- ✅ Comprehensive route protection system
- ✅ User type-based access control
- ✅ Unauthorized access handling
- ✅ Loading states and error boundaries
- ✅ React Router v7 integration

The route protection system is now ready to secure the entire dashboard with proper access controls and user experience considerations. 