import React from 'react';
import type { ReactNode } from 'react';
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
}: PermissionRouteProps): React.JSX.Element {
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