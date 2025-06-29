import React from 'react';
import type { ReactNode } from 'react';
import { ProtectedRoute } from './ProtectedRoute';

interface PublicRouteProps {
  children: ReactNode;
  redirectAuthenticated?: boolean;
}

export function PublicRoute({
  children,
  redirectAuthenticated = true,
}: PublicRouteProps): React.JSX.Element {
  return (
    <ProtectedRoute requireAuth={false}>
      {children}
    </ProtectedRoute>
  );
}

export default PublicRoute; 