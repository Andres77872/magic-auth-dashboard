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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();
  const { userType } = useUserType();
  const location = useLocation();

  // Handle responsive sidebar behavior
  useEffect(() => {
    const handleResize = () => {
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

  if (!isAuthenticated) {
    return <></>; // Route guards will handle redirect
  }

  return (
    <div className="dashboard-layout" data-sidebar-collapsed={sidebarCollapsed}>
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div 
          className={`mobile-overlay ${mobileMenuOpen ? 'show' : ''}`}
          onClick={handleOverlayClick}
          aria-hidden="true"
        />
      )}

      {/* Header */}
      <Header
        sidebarCollapsed={sidebarCollapsed}
        mobileMenuOpen={mobileMenuOpen}
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
      />

      {/* Sidebar */}
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
        {/* Breadcrumbs */}
        <div className="content-header">
          <Breadcrumbs />
        </div>

        {/* Page content */}
        <div className="content-container">
          {children || <Outlet />}
        </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Skip to content link for accessibility */}
      <a 
        href="#main-content" 
        className="skip-to-content"
        onFocus={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        onBlur={(e) => e.currentTarget.style.transform = 'translateY(-100%)'}
      >
        Skip to main content
      </a>
    </div>
  );
}

export default DashboardLayout; 