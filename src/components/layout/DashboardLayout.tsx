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

  // Loading state - full screen spinner
  if (isLoading) {
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
      className="dashboard-layout" 
      data-sidebar-collapsed={sidebarCollapsed}
    >
      {/* Skip to content link - WCAG 2.2 keyboard navigation */}
      <a 
        href="#main-content" 
        className="skip-to-content"
        aria-label="Skip to main content"
      >
        Skip to main content
      </a>

      {/* Mobile menu overlay backdrop */}
      {mobileMenuOpen && (
        <div 
          className="mobile-overlay" 
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
        className="main-content"
        role="main"
        aria-label="Main content"
        id="main-content"
      >
        {/* Breadcrumb navigation */}
        <div className="content-header">
          <Breadcrumbs />
        </div>

        {/* Page content container */}
        <div className="content-container">
          {children || <Outlet />}
        </div>
      </main>

      {/* Footer - Copyright and links */}
      <Footer />
    </div>
  );
}

export default DashboardLayout; 