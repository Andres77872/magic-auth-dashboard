/**
 * DashboardLayout Component
 *
 * Meridian fixed app shell:
 * - 240px fixed sidebar (left, full height) + 56px top bar + scrolling content well
 * - Mobile-first: sidebar becomes a slide-in drawer
 * - WCAG 2.2 AA: skip-to-content link, keyboard-dismissable drawer
 *
 * Layout route for nested routing — child routes render into <Outlet />.
 */
import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth, useUserType } from '@/hooks';
import { LoadingSpinner } from '@/components/common';
import { BreadcrumbLabelProvider } from '@/contexts';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export function DashboardLayout(): React.JSX.Element {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { isAuthenticated, isLoading, user } = useAuth();
  const { userType } = useUserType();
  const location = useLocation();

  // Close mobile menu when entering desktop viewport
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setMobileMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Close mobile menu on Escape for keyboard users
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileMenuOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  // Only show loading spinner if we don't have user data (prevents blink on cached auth)
  if (isLoading && !user) {
    return (
      <LoadingSpinner
        size="lg"
        variant="primary"
        message="Loading dashboard…"
        fullScreen
      />
    );
  }

  // Auth check — route guards handle redirects
  if (!isAuthenticated) {
    return <></>;
  }

  return (
    <BreadcrumbLabelProvider>
    <div className="grid h-screen grid-cols-1 overflow-hidden lg:grid-cols-[240px_1fr]">
      {/* Skip to content link — WCAG 2.2 keyboard navigation */}
      <a
        href="#main-content"
        className="fixed left-4 top-2 z-tooltip -translate-y-[200%] rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground opacity-0 transition-all pointer-events-none focus:translate-y-0 focus:opacity-100 focus:pointer-events-auto"
        aria-label="Skip to main content"
      >
        Skip to main content
      </a>

      {/* Mobile menu overlay backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
          role="presentation"
        />
      )}

      {/* Sidebar — fixed left column / mobile drawer */}
      <Sidebar mobileMenuOpen={mobileMenuOpen} userType={userType} />

      {/* Main column: top bar + scrolling content well */}
      <div className="flex h-screen min-w-0 flex-col overflow-hidden">
        <Header
          mobileMenuOpen={mobileMenuOpen}
          onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        />

        <main
          className="flex-1 overflow-y-auto overflow-x-hidden bg-background"
          role="main"
          aria-label="Main content"
          id="main-content"
        >
          <div className="mx-auto w-full max-w-[1180px] px-5 py-6 sm:px-7">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
    </BreadcrumbLabelProvider>
  );
}

export default DashboardLayout;
