import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useUserType } from '@/hooks';
import { ROUTES } from '@/utils/routes';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { XCircle, ArrowLeft, Home, LogOut } from 'lucide-react';

export function UnauthorizedPage(): React.JSX.Element {
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
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-lg">
        <CardContent className="p-8 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <XCircle size={32} />
          </div>

          <h1 className="mb-2 text-2xl font-bold text-foreground">Access Denied</h1>

          <p className="mb-6 text-muted-foreground">
            You don't have permission to access this resource.
          </p>

          {isAuthenticated && (
            <div className="mb-6">
              <p className="text-sm text-muted-foreground">
                Logged in as:{' '}
                <Badge variant="secondary" className="ml-1">
                  {userType}
                </Badge>{' '}
                <span className="text-xs">({getUserTypeLabel()})</span>
              </p>
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button onClick={handleGoBack} variant="secondary" size="md">
              <ArrowLeft size={16} />
              Go Back
            </Button>

            <Button onClick={handleGoHome} variant="primary" size="md">
              <Home size={16} />
              {isAuthenticated ? 'Go to Dashboard' : 'Go to Login'}
            </Button>

            {isAuthenticated && (
              <Button onClick={() => void handleLogout()} variant="outline" size="md">
                <LogOut size={16} />
                Logout
              </Button>
            )}
          </div>

          <div className="mt-8 rounded-lg border border-border bg-muted/50 p-4 text-left">
            <h3 className="mb-2 font-semibold text-foreground">Need Access?</h3>
            <p className="mb-3 text-sm text-muted-foreground">
              If you believe you should have access to this resource, please contact your administrator.
            </p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                ROOT users have access to all system features
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                ADMIN users can manage projects and users
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                Regular users have limited dashboard access
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default UnauthorizedPage; 