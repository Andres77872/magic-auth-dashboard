/**
 * Sidebar (240px): brand, role-filtered navigation, theme switch and account
 * menu. Static column on desktop; an off-canvas drawer below `lg` that is
 * `inert` while closed so keyboard and screen-reader users can't reach it.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { Monitor, Moon, ShieldCheck, Sun } from 'lucide-react';
import type { UserType } from '@/types/auth.types';
import { NavigationMenu, UserMenu } from '@/components/navigation';
import { useTheme, type Theme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

interface SidebarProps {
  mobileMenuOpen: boolean;
  isDesktop: boolean;
  userType: UserType | null;
  onNavigate: () => void;
}

const THEME_OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

function ThemeSwitch(): React.JSX.Element {
  const { theme, setTheme } = useTheme();
  return (
    <div
      role="radiogroup"
      aria-label="Color theme"
      className="flex items-center gap-0.5 rounded-md border border-border bg-secondary p-[3px]"
    >
      {THEME_OPTIONS.map(({ value, label, icon: Icon }) => {
        const selected = theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={`${label} theme`}
            title={`${label} theme`}
            onClick={() => setTheme(value)}
            className={cn(
              'flex h-6 flex-1 items-center justify-center rounded-[4px] transition-colors',
              selected
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon size={14} aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}

export function Sidebar({
  mobileMenuOpen,
  isDesktop,
  userType,
  onNavigate,
}: SidebarProps): React.JSX.Element {
  const hiddenOnMobile = !isDesktop && !mobileMenuOpen;

  return (
    <aside
      id="mobile-navigation"
      aria-label="Main navigation"
      inert={hiddenOnMobile}
      className={cn(
        'fixed inset-y-0 left-0 z-50 flex h-screen w-60 flex-col border-r border-border bg-card transition-transform duration-200 ease-out',
        'lg:static lg:z-auto lg:translate-x-0 lg:transition-none',
        mobileMenuOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full'
      )}
    >
      <Link
        to="/"
        onClick={onNavigate}
        className="flex h-14 shrink-0 items-center gap-2.5 border-b border-border px-4 no-underline"
        aria-label="Magic Auth overview"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <ShieldCheck size={16} aria-hidden="true" />
        </span>
        <span className="flex flex-col leading-tight">
          <span className="text-[14px] font-semibold tracking-[-0.01em] text-foreground">
            Magic Auth
          </span>
          <span className="text-[11px] text-muted-foreground">
            Admin console
          </span>
        </span>
      </Link>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2.5 py-4">
        <NavigationMenu userType={userType} onNavigate={onNavigate} />
      </div>

      <div className="shrink-0 space-y-2 border-t border-border p-2.5">
        <ThemeSwitch />
        <UserMenu />
      </div>
    </aside>
  );
}

export default Sidebar;
