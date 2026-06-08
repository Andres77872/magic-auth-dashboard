/**
 * Sidebar Component
 *
 * Meridian fixed app shell sidebar (240px, no collapse):
 * - Brand (Magic Auth mark + wordmark)
 * - Role-based navigation menu
 * - Footer: theme toggle + user menu
 * - Slide-in drawer on mobile (same content)
 */
import React from 'react';
import { Link } from 'react-router-dom';
import type { UserType } from '@/types/auth.types';
import { NavigationMenu, UserMenu } from '@/components/navigation';
import { useTheme } from '@/contexts';
import { Moon, Shield, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  mobileMenuOpen: boolean;
  userType: UserType | null;
}

function SidebarInner({ userType }: { userType: UserType | null }): React.JSX.Element {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <>
      {/* Brand */}
      <Link
        to="/"
        className="flex h-14 shrink-0 items-center gap-2.5 border-b border-border px-4 no-underline"
        aria-label="Magic Auth home"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Shield size={16} aria-hidden="true" />
        </span>
        <span className="text-[15px] font-semibold tracking-[-0.01em] text-foreground">
          Magic Auth
        </span>
      </Link>

      {/* Navigation */}
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2.5 py-2">
        <NavigationMenu userType={userType} />
      </div>

      {/* Footer: theme toggle + user */}
      <div className="shrink-0 border-t border-border p-2.5">
        <button
          type="button"
          onClick={toggleTheme}
          className="mb-1 flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label={
            resolvedTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'
          }
        >
          {resolvedTheme === 'dark' ? (
            <Sun size={17} aria-hidden="true" />
          ) : (
            <Moon size={17} aria-hidden="true" />
          )}
          <span>{resolvedTheme === 'dark' ? 'Light theme' : 'Dark theme'}</span>
        </button>
        <UserMenu />
      </div>
    </>
  );
}

export function Sidebar({ mobileMenuOpen, userType }: SidebarProps): React.JSX.Element {
  return (
    <>
      {/* Desktop sidebar — fixed 240px column */}
      <aside
        id="sidebar-navigation"
        className="hidden h-screen flex-col overflow-hidden border-r border-border bg-card lg:flex"
        role="navigation"
        aria-label="Main navigation"
      >
        <SidebarInner userType={userType} />
      </aside>

      {/* Mobile sidebar — fixed slide-in drawer */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 flex h-screen w-60 flex-col border-r border-border bg-card shadow-2xl transition-transform duration-300 ease-in-out lg:hidden',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        role="navigation"
        aria-label="Mobile navigation"
        aria-hidden={!mobileMenuOpen}
      >
        <SidebarInner userType={userType} />
      </aside>
    </>
  );
}

export default Sidebar;
