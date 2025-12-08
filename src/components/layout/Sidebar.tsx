/**
 * Sidebar Component
 * 
 * Grid-based navigation sidebar containing:
 * - Navigation menu with role-based items
 * - Collapsible on desktop
 * - Slide-in drawer on mobile
 * - Sticky footer with version and environment info
 * 
 * Follows Design System sidebar patterns
 * @see docs/DESIGN_SYSTEM/DASHBOARD_PATTERNS.md
 */
import React from 'react';
import type { UserType } from '@/types/auth.types';
import { NavigationMenu } from '@/components/navigation';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  collapsed: boolean;
  mobileMenuOpen: boolean;
  userType: UserType | null;
}

export function Sidebar({
  collapsed,
  mobileMenuOpen,
  userType,
}: SidebarProps): React.JSX.Element {
  return (
    <>
      {/* Desktop Sidebar - CSS Grid item */}
      <aside 
        id="sidebar-navigation"
        className={cn(
          '[grid-area:sidebar] hidden lg:flex flex-col',
          'bg-card border-r border-border',
          'overflow-hidden',
          'sticky top-16 h-[calc(100vh-4rem)]'
        )}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Scrollable navigation area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-4">
          <NavigationMenu 
            userType={userType}
            collapsed={collapsed}
          />
        </div>

        {/* Sidebar footer */}
        <div 
          className={cn(
            'shrink-0 border-t border-border bg-muted/30',
            collapsed ? 'p-2' : 'p-4'
          )}
        >
          {collapsed ? (
            <div className="flex items-center justify-center">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 flex items-center justify-center">
                <Sparkles size={14} className="text-emerald-600" />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-primary/5 border border-primary/10">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-medium text-foreground">
                  {userType?.toUpperCase() || 'USER'} Access
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono">v1.0.0</span>
                  <span className="text-border">•</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-medium uppercase tracking-wider">
                    Prod
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Sidebar - Fixed overlay */}
      <aside 
        className={cn(
          'fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 z-50',
          'bg-card border-r border-border shadow-2xl',
          'flex flex-col lg:hidden',
          'transition-transform duration-300 ease-in-out',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        role="navigation"
        aria-label="Mobile navigation"
        aria-hidden={!mobileMenuOpen}
      >
        {/* Scrollable navigation area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-4">
          <NavigationMenu 
            userType={userType}
            collapsed={false}
          />
        </div>

        {/* Sidebar footer */}
        <div className="shrink-0 border-t border-border bg-muted/30 p-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-primary/5 border border-primary/10">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-foreground">
                {userType?.toUpperCase() || 'USER'} Access
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1">
              <div className="flex items-center gap-1.5">
                <span className="font-mono">v1.0.0</span>
                <span className="text-border">•</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-medium uppercase tracking-wider">
                  Prod
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar; 