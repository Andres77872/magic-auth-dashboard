/**
 * Header Component
 * 
 * Top navigation bar containing:
 * - Mobile menu toggle (mobile only)
 * - Sidebar collapse toggle (desktop only)
 * - Brand logo and name
 * - User menu and notifications
 * 
 * Follows Design System header patterns
 * @see docs/DESIGN_SYSTEM/DASHBOARD_PATTERNS.md
 */
import React from 'react';
import { useAuth, useUserType } from '@/hooks';
import { UserMenu, NotificationBell } from '@/components/navigation';
import { MenuIcon, LogoIcon } from '@/components/icons';

interface HeaderProps {
  sidebarCollapsed: boolean;
  mobileMenuOpen: boolean;
  onToggleSidebar: () => void;
  onToggleMobileMenu: () => void;
}

export function Header({
  sidebarCollapsed,
  mobileMenuOpen,
  onToggleSidebar,
  onToggleMobileMenu,
}: HeaderProps): React.JSX.Element {
  // User data
  const { user } = useAuth();
  const { getUserTypeLabel } = useUserType();

  return (
    <header className="dashboard-header" role="banner">
      <div className="header-content">
        {/* Left section - Logo and navigation */}
        <div className="header-left">
          {/* Mobile menu toggle - Visible only on mobile */}
          <button
            type="button"
            className="mobile-menu-toggle mobile-only"
            onClick={onToggleMobileMenu}
            aria-label={mobileMenuOpen ? 'Close mobile menu' : 'Open mobile menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls="sidebar-navigation"
          >
            <span className={`hamburger-line ${mobileMenuOpen ? 'active' : ''}`} aria-hidden="true"></span>
            <span className={`hamburger-line ${mobileMenuOpen ? 'active' : ''}`} aria-hidden="true"></span>
            <span className={`hamburger-line ${mobileMenuOpen ? 'active' : ''}`} aria-hidden="true"></span>
          </button>

          {/* Desktop sidebar toggle - Visible only on desktop */}
          <button
            type="button"
            className="sidebar-toggle desktop-only"
            onClick={onToggleSidebar}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!sidebarCollapsed}
            aria-controls="sidebar-navigation"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <MenuIcon size="md" aria-hidden="true" />
          </button>

          {/* Logo and brand */}
          <div className="header-brand">
            <div className="brand-logo" aria-hidden="true">
              <LogoIcon size={32} />
            </div>
            <div className="brand-text">
              <span className="brand-name">Magic Auth</span>
              <span className="brand-subtitle">Admin Dashboard</span>
            </div>
          </div>
        </div>

        {/* Center section - Global search (future implementation) */}
        <div className="header-center">
          {/* Global search will be added in future milestone */}
        </div>

        {/* Right section - Notifications and user menu */}
        <div className="header-right">
          {/* User info - Hidden on mobile */}
          <div className="user-info tablet-and-up" aria-hidden="true">
            <span className="user-name">{user?.username}</span>
            <span className="user-type">{getUserTypeLabel()}</span>
          </div>
          <NotificationBell />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}

export default Header; 