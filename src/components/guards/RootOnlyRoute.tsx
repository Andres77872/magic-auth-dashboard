import React from 'react';
import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, useUserType } from '@/hooks';
import { ROUTES } from '@/utils/routes';
import { UserType } from '@/types/auth.types';
import { ProtectedRoute } from './ProtectedRoute';

interface RootOnlyRouteProps {
  children: ReactNode;
}

export function RootOnlyRoute({ children }: RootOnlyRouteProps): React.JSX.Element {
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