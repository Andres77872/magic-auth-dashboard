import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, useUserType } from '@/hooks';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { ROUTES } from '@/utils/routes';
import { getUserTypeBadgeClass } from '@/utils/userTypeStyles';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
} from '@/components/ui';
import { cn } from '@/lib/utils';

export function UserMenu(): React.JSX.Element {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { user, logout } = useAuth();
  const { getUserTypeLabel, userType } = useUserType();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate(ROUTES.LOGIN);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleLogoutConfirm = () => {
    setShowLogoutConfirm(false);
    handleLogout();
  };

  if (!user) {
    return <></>;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2 p-2 bg-transparent border-none rounded-md cursor-pointer transition-colors hover:bg-muted focus-visible:outline-[3px] focus-visible:outline-primary-500 focus-visible:outline-offset-2"
            aria-label="User menu"
          >
            <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center">
              <span className="text-white text-sm font-bold">
                {user.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-[280px]">
          {/* User info header */}
          <div className="p-4 border-b border-border bg-muted/50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary-500 flex items-center justify-center">
                <span className="text-white text-lg font-bold">
                  {user.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <div className="text-base font-semibold text-foreground mb-1">{user.username}</div>
                <div className="text-sm text-muted-foreground mb-1">{user.email}</div>
                <div 
                  className={cn(
                    'inline-block text-xs font-bold uppercase tracking-wide px-2 py-1 rounded-sm',
                    getUserTypeBadgeClass(userType || undefined)
                  )}
                >
                  {getUserTypeLabel()}
                </div>
              </div>
            </div>
          </div>

          {/* Menu items */}
          <div className="p-2">
            <DropdownMenuItem asChild>
              <Link to={ROUTES.PROFILE} className="flex items-center gap-3 cursor-pointer">
                <User className="h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem className="flex items-center gap-3 cursor-pointer">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem 
              className="flex items-center gap-3 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
              onClick={() => setShowLogoutConfirm(true)}
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Logout confirmation dialog */}
      <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Sign Out</DialogTitle>
            <DialogDescription>
              Are you sure you want to sign out of your account?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLogoutConfirm(false)}>
              Cancel
            </Button>
            <Button onClick={handleLogoutConfirm}>
              Sign Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default UserMenu; 