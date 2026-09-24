import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronsUpDown, LogOut, Settings, User } from 'lucide-react';
import { useAuth, useToast } from '@/hooks';
import { ROUTES } from '@/utils/routes';
import {
  Avatar,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui';
import { UserTypeBadge } from '@/components/common/UserTypeBadge';
import { getUserTypeLabel } from '@/utils/component-utils';

export function UserMenu(): React.JSX.Element | null {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  if (!user) return null;

  // Session validation does not return an email, so fall back to the role.
  const secondaryLine =
    user.email || `${getUserTypeLabel(user.user_type)} account`;

  const handleSignOut = async (): Promise<void> => {
    try {
      // Finish the server-side logout before leaving so the request isn't aborted.
      await logout();
      void navigate(ROUTES.LOGIN, { replace: true });
    } catch {
      showToast('Sign-out did not complete. Try again.', 'error');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-accent"
          aria-label={`Account menu for ${user.username}`}
        >
          <Avatar name={user.username} size="md" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-medium text-foreground">
              {user.username}
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              {secondaryLine}
            </span>
          </span>
          <ChevronsUpDown
            className="h-4 w-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent side="top" align="start" className="w-[228px]">
        <div className="flex items-center gap-3 px-2 pb-2 pt-1.5">
          <Avatar name={user.username} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-semibold text-foreground">
              {user.username}
            </div>
            <UserTypeBadge userType={user.user_type} className="mt-1" />
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to={ROUTES.PROFILE} className="cursor-pointer">
            <User className="h-4 w-4" aria-hidden="true" />
            <span>Your profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to={ROUTES.SETTINGS} className="cursor-pointer">
            <Settings className="h-4 w-4" aria-hidden="true" />
            <span>Session settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          destructive
          className="cursor-pointer"
          onSelect={() => {
            void handleSignOut();
          }}
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default UserMenu;
