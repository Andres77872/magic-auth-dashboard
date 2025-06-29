import React from 'react';
import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, useUserType } from '@/hooks';
import { ROUTES } from '@/utils/routes';
import { ProtectedRoute } from './ProtectedRoute';

interface AdminRouteProps {
  children: ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps): React.JSX.Element {
  const { isAuthenticated } = useAuth();
  const { isAdminOrHigher } = useUserType();

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