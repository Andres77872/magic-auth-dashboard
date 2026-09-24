import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LogOut, ShieldX } from 'lucide-react';
import { useAuth } from '@/hooks';
import { Button } from '@/components/ui/button';
import { UserTypeBadge } from '@/components/common/UserTypeBadge';
import { ROUTES } from '@/utils/routes';

/**
 * Shown when a signed-in account may not open a page — consumers trying to
 * use the console, or admins opening a root-only area.
 */
export function UnauthorizedPage(): React.JSX.Element {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const isConsumer = user?.user_type === 'consumer';

  const signOut = async (): Promise<void> => {
    setSigningOut(true);
    try {
      await logout();
    } finally {
      void navigate(ROUTES.LOGIN, { replace: true });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center">
        <span className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-destructive-subtle text-destructive-subtle-foreground">
          <ShieldX className="h-6 w-6" aria-hidden="true" />
        </span>
        <h1 className="m-0 text-xl font-semibold text-foreground">
          You don&apos;t have access to this page
        </h1>
        <p className="m-0 mt-2 text-[13px] text-muted-foreground">
          {isConsumer
            ? 'This console is for root and admin accounts. Sign in to your project’s app instead.'
            : 'This area is limited to root accounts. Ask a root administrator if you need it.'}
        </p>
        {isAuthenticated && user && (
          <p className="m-0 mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            Signed in as{' '}
            <span className="font-medium text-foreground">{user.username}</span>
            <UserTypeBadge userType={user.user_type} />
          </p>
        )}
        <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
          {isAuthenticated && !isConsumer ? (
            <Button onClick={() => void navigate(ROUTES.HOME)}>
              <ArrowLeft aria-hidden="true" />
              Back to overview
            </Button>
          ) : (
            <Button onClick={() => void navigate(ROUTES.LOGIN)}>
              Go to sign in
            </Button>
          )}
          {isAuthenticated && (
            <Button
              variant="secondary"
              onClick={() => void signOut()}
              loading={signingOut}
            >
              <LogOut aria-hidden="true" />
              Sign out
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default UnauthorizedPage;
