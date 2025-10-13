import React from 'react';
import type { ReactNode } from 'react';
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
}: ProtectedRouteProps): React.JSX.Element {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // Only show loading if we don't have user data yet
  // This eliminates blink when we have cached auth state
  if (isLoading && !user) {
    return (
      <div className="route-loading">
        <LoadingSpinner 
          size="lg" 
          variant="primary"
          message="Verifying authentication..." 
          fullScreen 
        />
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