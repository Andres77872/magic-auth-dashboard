/**
 * DashboardLayout Component
 * 
 * Main application layout following Design System patterns:
 * - CSS Grid-based responsive layout
 * - Mobile-first design with collapsible sidebar
 * - WCAG 2.2 AA accessibility compliance
 * - Skip-to-content link for keyboard navigation
 * 
 * @see docs/DESIGN_SYSTEM/DASHBOARD_PATTERNS.md
 */
import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth, useUserType } from '@/hooks';
import { LoadingSpinner } from '@/components/common';
import { cn } from '@/lib/utils';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { Breadcrumbs } from './Breadcrumbs';

interface DashboardLayoutProps {
  children?: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps): React.JSX.Element {
  // State management
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Hooks
  const { isAuthenticated, isLoading } = useAuth();
  const { userType } = useUserType();
  const location = useLocation();

  // Handle responsive behavior - close mobile menu on desktop resize
  useEffect(() => {
    const handleResize = () => {
      // Close mobile menu when entering desktop viewport
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Handle mobile menu overlay clicks
  const handleOverlayClick = () => {
    setMobileMenuOpen(false);
  };

  // Only show loading spinner if we don't have user data
  // This prevents blink when we have cached auth state
  const { user } = useAuth();
  if (isLoading && !user) {
    return (
      <LoadingSpinner 
        size="lg" 
        variant="primary"
        message="Loading dashboard..." 
        fullScreen 
      />
    );
  }

  // Auth check - route guards handle redirects
  if (!isAuthenticated) {
    return <></>;
  }

  return (
    <div 
      className={cn(
        'grid min-h-screen transition-[grid-template-columns] duration-200',
        'grid-rows-[4rem_1fr_3rem]',
        'grid-cols-1 lg:grid-cols-[16rem_1fr]',
        sidebarCollapsed && 'lg:grid-cols-[4rem_1fr]',
        '[grid-template-areas:"header""main""footer"] lg:[grid-template-areas:"header_header""sidebar_main""footer_footer"]'
      )}
    >
      {/* Skip to content link - WCAG 2.2 keyboard navigation */}
      <a 
        href="#main-content" 
        className="fixed top-2 left-4 z-[600] bg-primary-600 text-white px-4 py-2 rounded-md font-medium opacity-0 -translate-y-[200%] transition-all pointer-events-none focus:opacity-100 focus:translate-y-0 focus:pointer-events-auto"
        aria-label="Skip to main content"
      >
        Skip to main content
      </a>

      {/* Mobile menu overlay backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={handleOverlayClick}
          aria-hidden="true"
          role="presentation"
        />
      )}

      {/* Header - Contains logo, navigation toggle, and user menu */}
      <Header
        sidebarCollapsed={sidebarCollapsed}
        mobileMenuOpen={mobileMenuOpen}
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
      />

      {/* Sidebar - Main navigation menu */}
      <Sidebar
        collapsed={sidebarCollapsed}
        mobileMenuOpen={mobileMenuOpen}
        userType={userType}
      />

      {/* Main content area */}
      <main 
        className="[grid-area:main] bg-muted/50 overflow-y-auto overflow-x-hidden flex flex-col min-h-0 relative isolate"
        role="main"
        aria-label="Main content"
        id="main-content"
      >
        {/* Breadcrumb navigation */}
        <div className="bg-card border-b border-border px-4 py-3 lg:px-6 shrink-0 relative z-[5] min-h-[48px] flex items-center">
          <Breadcrumbs />
        </div>

        {/* Page content container */}
        <div className="flex-1 p-4 lg:p-6 flex flex-col min-w-0 max-w-[1400px] mx-auto w-full">
          {children || <Outlet />}
        </div>
      </main>

      {/* Footer - Copyright and links */}
      <Footer />
    </div>
  );
}

export default DashboardLayout; 