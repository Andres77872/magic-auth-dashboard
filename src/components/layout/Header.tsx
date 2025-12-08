/**
 * Header Component
 * 
 * Fixed top navigation bar containing:
 * - Mobile menu toggle (mobile only)
 * - Sidebar collapse toggle (desktop only)
 * - Brand logo and name
 * - User menu and notifications
 * 
 * Follows Design System header patterns
 * @see docs/DESIGN_SYSTEM/DASHBOARD_PATTERNS.md
 */
import React from 'react';
import { useAuth, useUserType } from '@/hooks';
import { UserMenu, NotificationBell } from '@/components/navigation';
import { PanelLeftClose, PanelLeft, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  sidebarCollapsed: boolean;
  mobileMenuOpen: boolean;
  onToggleSidebar: () => void;
  onToggleMobileMenu: () => void;
}

export function Header({
  sidebarCollapsed,
  mobileMenuOpen,
  onToggleSidebar,
  onToggleMobileMenu,
}: HeaderProps): React.JSX.Element {
  // User data
  const { user } = useAuth();
  const { getUserTypeLabel } = useUserType();

  return (
    <header 
      className="[grid-area:header] h-16 bg-card border-b border-border shadow-sm z-50 sticky top-0" 
      role="banner"
    >
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* Left section - Logo and navigation */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Mobile menu toggle - Visible only on mobile */}
          <button
            type="button"
            className={cn(
              'flex lg:hidden items-center justify-center w-10 h-10 rounded-lg',
              'bg-transparent border border-transparent cursor-pointer',
              'transition-all duration-200',
              'hover:bg-muted hover:border-border',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
              mobileMenuOpen && 'bg-muted border-border'
            )}
            onClick={onToggleMobileMenu}
            aria-label={mobileMenuOpen ? 'Close mobile menu' : 'Open mobile menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls="sidebar-navigation"
          >
            <div className="flex flex-col items-center justify-center gap-1.5 w-5 h-5">
              <span 
                className={cn(
                  'block w-5 h-0.5 bg-foreground rounded-full transition-all duration-300 origin-center',
                  mobileMenuOpen && 'rotate-45 translate-y-2'
                )} 
                aria-hidden="true" 
              />
              <span 
                className={cn(
                  'block w-5 h-0.5 bg-foreground rounded-full transition-all duration-300',
                  mobileMenuOpen && 'opacity-0 scale-0'
                )} 
                aria-hidden="true" 
              />
              <span 
                className={cn(
                  'block w-5 h-0.5 bg-foreground rounded-full transition-all duration-300 origin-center',
                  mobileMenuOpen && '-rotate-45 -translate-y-2'
                )} 
                aria-hidden="true" 
              />
            </div>
          </button>

          {/* Desktop sidebar toggle - Visible only on desktop */}
          <button
            type="button"
            className={cn(
              'hidden lg:flex items-center justify-center w-10 h-10 rounded-lg',
              'bg-transparent border border-transparent cursor-pointer',
              'transition-all duration-200',
              'hover:bg-muted hover:border-border',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
            )}
            onClick={onToggleSidebar}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!sidebarCollapsed}
            aria-controls="sidebar-navigation"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? (
              <PanelLeft size={20} className="text-muted-foreground" aria-hidden="true" />
            ) : (
              <PanelLeftClose size={20} className="text-muted-foreground" aria-hidden="true" />
            )}
          </button>

          {/* Logo and brand */}
          <div className="flex items-center gap-3 ml-1">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-primary/80 shadow-md">
              <Shield size={20} className="text-primary-foreground" aria-hidden="true" />
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-base font-bold text-foreground leading-tight tracking-tight">Magic Auth</span>
              <span className="text-[10px] text-muted-foreground leading-tight uppercase tracking-wider font-medium">Admin Dashboard</span>
            </div>
          </div>
        </div>

        {/* Center section - Global search (future implementation) */}
        <div className="flex-1 max-w-md mx-4 hidden md:block">
          {/* Global search will be added in future milestone */}
        </div>

        {/* Right section - Notifications and user menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* User info - Hidden on mobile */}
          <div className="hidden lg:flex flex-col items-end text-right mr-1" aria-hidden="true">
            <span className="text-sm font-medium text-foreground leading-tight">{user?.username}</span>
            <span className="text-[10px] text-muted-foreground leading-tight uppercase tracking-wide font-medium">{getUserTypeLabel()}</span>
          </div>
          <div className="h-8 w-px bg-border hidden lg:block" aria-hidden="true" />
          <NotificationBell />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}

export default Header; 