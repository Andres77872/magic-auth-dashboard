import React from 'react';
import { useAuth, useUserType } from '@/hooks';
import { UserMenu, NotificationBell } from '@/components/navigation';
import { MenuIcon } from '@/components/icons';

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
  const { user } = useAuth();
  const { getUserTypeLabel } = useUserType();

  return (
    <header className="dashboard-header" role="banner">
      <div className="header-content">
        {/* Left section - Logo and navigation */}
        <div className="header-left">
          {/* Mobile menu toggle */}
          <button
            type="button"
            className="mobile-menu-toggle mobile-only"
            onClick={onToggleMobileMenu}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            <span className={`hamburger-line ${mobileMenuOpen ? 'active' : ''}`}></span>
            <span className={`hamburger-line ${mobileMenuOpen ? 'active' : ''}`}></span>
            <span className={`hamburger-line ${mobileMenuOpen ? 'active' : ''}`}></span>
          </button>

          {/* Desktop sidebar toggle */}
          <button
            type="button"
            className="sidebar-toggle desktop-only"
            onClick={onToggleSidebar}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <MenuIcon size="medium" />
          </button>

          {/* Logo and brand */}
          <div className="header-brand">
            <div className="brand-logo">
              <svg 
                width="32" 
                height="32" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="9" cy="9" r="2"/>
                <path d="M21 15.5c-.5-1-1.5-2-3-2s-2.5 1-3 2"/>
                <path d="M9 17l3-3 3 3"/>
              </svg>
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

        {/* Right section - User menu */}
        <div className="header-right">
          <div className="user-info tablet-and-up">
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