import React from 'react';
import type { ReactNode } from 'react';
import { ProtectedRoute } from './ProtectedRoute';

interface PublicRouteProps {
  children: ReactNode;
}

export function PublicRoute({
  children,
}: PublicRouteProps): React.JSX.Element {
  return (
    <ProtectedRoute requireAuth={false}>
      {children}
    </ProtectedRoute>
  );
}

export default PublicRoute; 