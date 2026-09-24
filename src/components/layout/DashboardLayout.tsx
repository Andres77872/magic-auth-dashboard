/**
 * Authenticated app shell: 240px sidebar, 56px top bar and a scrolling content
 * well. Child routes render into <Outlet />. Owns the mobile drawer state and
 * the global ⌘K / Ctrl+K command palette shortcut. Pages are lazy-loaded and
 * isolated: a page that fails to load or crashes keeps the shell usable.
 */
import React, { Suspense, useCallback, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth, useUserType } from '@/hooks';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { ErrorBoundary, LoadingSpinner } from '@/components/common';
import { CommandPalette } from '@/components/navigation';
import { BreadcrumbLabelProvider } from '@/contexts';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

function focusMenuToggle(): void {
  document
    .querySelector<HTMLButtonElement>('[aria-controls="mobile-navigation"]')
    ?.focus();
}

export function DashboardLayout(): React.JSX.Element {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  const { isAuthenticated, isLoading, user } = useAuth();
  const { userType } = useUserType();
  const location = useLocation();

  // Close the drawer on navigation and when the viewport becomes desktop-wide.
  const [lastPath, setLastPath] = useState(location.pathname);
  if (location.pathname !== lastPath) {
    setLastPath(location.pathname);
    if (mobileMenuOpen) setMobileMenuOpen(false);
  }
  if (isDesktop && mobileMenuOpen) setMobileMenuOpen(false);

  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  // Escape closes the drawer and hands focus back to its toggle.
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
        focusMenuToggle();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  // ⌘K / Ctrl+K opens global search from anywhere in the console.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Only block on the spinner when there is no user yet (avoids a flash on revalidation).
  if (isLoading && !user) {
    return (
      <LoadingSpinner
        size="lg"
        variant="primary"
        message="Loading console…"
        fullScreen
      />
    );
  }

  // Route guards handle the redirect.
  if (!isAuthenticated) {
    return <></>;
  }

  return (
    <BreadcrumbLabelProvider>
      <div className="grid h-screen grid-cols-1 overflow-hidden lg:grid-cols-[240px_minmax(0,1fr)]">
        <a
          href="#main-content"
          className="pointer-events-none fixed left-4 top-2 z-tooltip -translate-y-[200%] rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground opacity-0 transition-all focus:pointer-events-auto focus:translate-y-0 focus:opacity-100"
        >
          Skip to main content
        </a>

        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={closeMobileMenu}
            aria-hidden="true"
          />
        )}

        <Sidebar
          mobileMenuOpen={mobileMenuOpen}
          isDesktop={isDesktop}
          userType={userType}
          onNavigate={closeMobileMenu}
        />

        <div className="flex h-screen min-w-0 flex-col overflow-hidden">
          <Header
            mobileMenuOpen={mobileMenuOpen}
            onToggleMobileMenu={() => setMobileMenuOpen((open) => !open)}
            onOpenSearch={() => setPaletteOpen(true)}
          />

          <main
            id="main-content"
            tabIndex={-1}
            className="flex-1 overflow-y-auto overflow-x-hidden bg-background focus:outline-none"
          >
            <div className="mx-auto w-full max-w-[1400px] px-4 pb-12 pt-6 sm:px-6 lg:px-8">
              <ErrorBoundary
                key={location.pathname}
                title="This page couldn't be displayed"
                message="Try again, or reload the console if the problem persists."
              >
                <Suspense
                  fallback={
                    <LoadingSpinner
                      size="md"
                      aria-label="Loading page"
                      className="min-h-[40vh]"
                    />
                  }
                >
                  <Outlet />
                </Suspense>
              </ErrorBoundary>
            </div>
          </main>
        </div>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </BreadcrumbLabelProvider>
  );
}

export default DashboardLayout;
