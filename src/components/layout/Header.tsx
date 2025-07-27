import React, { useState, useEffect } from 'react';
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
  const { user } = useAuth();
  const { getUserTypeLabel } = useUserType();
  const [isScrolled, setIsScrolled] = useState(false);

  // Add scroll effect to header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header 
      className={`dashboard-header ${isScrolled ? 'scrolled' : ''}`} 
      role="banner"
    >
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
              <LogoIcon size="medium" />
            </div>
            <div className="brand-text">
              <span className="brand-name">Magic Auth</span>
              <span className="brand-subtitle">Admin Dashboard</span>
            </div>
          </div>
        </div>

        {/* Center section - Global search (future implementation) */}
        <div className="header-center">
          <div className="search-placeholder">
            {/* Global search will be added in future milestone */}
          </div>
        </div>

        {/* Right section - User menu */}
        <div className="header-right">
          <div className="user-info tablet-and-up">
            <span className="user-name">{user?.username || 'Guest User'}</span>
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