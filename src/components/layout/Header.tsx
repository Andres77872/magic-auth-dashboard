/**
 * Header (Top bar)
 *
 * Meridian top bar (56px), spans the main content column:
 * - Mobile menu toggle (mobile only)
 * - Breadcrumb trail
 * - Notifications
 *
 * Brand, theme toggle, and the user menu live in the sidebar.
 */
import React from 'react';
import { NotificationBell } from '@/components/navigation';
import { Breadcrumbs } from './Breadcrumbs';
import { cn } from '@/lib/utils';

interface HeaderProps {
  mobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
}

export function Header({
  mobileMenuOpen,
  onToggleMobileMenu,
}: HeaderProps): React.JSX.Element {
  return (
    <header
      className="z-30 flex h-14 shrink-0 items-center gap-3.5 border-b border-border bg-background px-4 lg:px-5"
      role="banner"
    >
      {/* Mobile menu toggle */}
      <button
        type="button"
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors lg:hidden',
          'hover:bg-accent hover:text-foreground',
          mobileMenuOpen && 'bg-accent text-foreground'
        )}
        onClick={onToggleMobileMenu}
        aria-label={mobileMenuOpen ? 'Close mobile menu' : 'Open mobile menu'}
        aria-expanded={mobileMenuOpen}
        aria-controls="sidebar-navigation"
      >
        <div className="flex h-5 w-5 flex-col items-center justify-center gap-1.5">
          <span
            className={cn(
              'block h-0.5 w-5 origin-center rounded-full bg-current transition-all duration-300',
              mobileMenuOpen && 'translate-y-2 rotate-45'
            )}
            aria-hidden="true"
          />
          <span
            className={cn(
              'block h-0.5 w-5 rounded-full bg-current transition-all duration-300',
              mobileMenuOpen && 'scale-0 opacity-0'
            )}
            aria-hidden="true"
          />
          <span
            className={cn(
              'block h-0.5 w-5 origin-center rounded-full bg-current transition-all duration-300',
              mobileMenuOpen && '-translate-y-2 -rotate-45'
            )}
            aria-hidden="true"
          />
        </div>
      </button>

      {/* Breadcrumb trail */}
      <Breadcrumbs />

      {/* Actions */}
      <div className="ml-auto flex items-center gap-1">
        <NotificationBell />
      </div>
    </header>
  );
}

export default Header;
