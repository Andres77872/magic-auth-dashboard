/**
 * Top bar (56px) over the content column: mobile menu toggle, breadcrumb
 * trail, global search (⌘K / Ctrl+K) and a link to the API reference.
 */
import React from 'react';
import { BookOpen, Menu, Search, X } from 'lucide-react';
import { Breadcrumbs } from './Breadcrumbs';
import { API_CONFIG } from '@/utils/constants';
import { cn } from '@/lib/utils';

interface HeaderProps {
  mobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
  onOpenSearch: () => void;
}

const isMac =
  typeof navigator !== 'undefined' &&
  /Mac|iPhone|iPad/.test(navigator.platform);

export function Header({
  mobileMenuOpen,
  onToggleMobileMenu,
  onOpenSearch,
}: HeaderProps): React.JSX.Element {
  return (
    <header
      className="z-30 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-md lg:px-6"
      role="banner"
    >
      <button
        type="button"
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:hidden',
          mobileMenuOpen && 'bg-accent text-foreground'
        )}
        onClick={onToggleMobileMenu}
        aria-label={mobileMenuOpen ? 'Close navigation' : 'Open navigation'}
        aria-expanded={mobileMenuOpen}
        aria-controls="mobile-navigation"
      >
        {mobileMenuOpen ? (
          <X size={18} aria-hidden="true" />
        ) : (
          <Menu size={18} aria-hidden="true" />
        )}
      </button>

      <div className="min-w-0 flex-1">
        <Breadcrumbs />
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onOpenSearch}
          className="flex h-8 items-center gap-2 rounded-md border border-input bg-card px-2.5 text-[13px] text-muted-foreground transition-colors hover:border-ring/60 hover:text-foreground sm:w-60"
          aria-label="Search pages, users, projects and groups"
          aria-keyshortcuts={isMac ? 'Meta+K' : 'Control+K'}
        >
          <Search size={15} aria-hidden="true" />
          <span className="hidden flex-1 text-left sm:inline">Search…</span>
          <kbd className="hidden rounded border border-border bg-secondary px-1.5 font-mono text-[10px] leading-4 sm:inline">
            {isMac ? '⌘K' : 'Ctrl K'}
          </kbd>
        </button>
        <a
          href={`${API_CONFIG.BASE_URL}/docs`}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:flex"
          aria-label="API reference (opens in a new tab)"
          title="API reference"
        >
          <BookOpen size={17} aria-hidden="true" />
        </a>
      </div>
    </header>
  );
}

export default Header;
