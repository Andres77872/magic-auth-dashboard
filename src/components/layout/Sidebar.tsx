/**
 * Sidebar Component
 * 
 * Main navigation sidebar containing:
 * - Navigation menu with role-based items
 * - Collapsible on desktop
 * - Slide-in drawer on mobile
 * - Version and environment info
 * 
 * Follows Design System sidebar patterns
 * @see docs/DESIGN_SYSTEM/DASHBOARD_PATTERNS.md
 */
import React from 'react';
import type { UserType } from '@/types/auth.types';
import { NavigationMenu } from '@/components/navigation';

interface SidebarProps {
  collapsed: boolean;
  mobileMenuOpen: boolean;
  userType: UserType | null;
}

export function Sidebar({
  collapsed,
  mobileMenuOpen,
  userType,
}: SidebarProps): React.JSX.Element {
  return (
    <aside 
      id="sidebar-navigation"
      className={`dashboard-sidebar ${collapsed ? 'collapsed' : ''} ${mobileMenuOpen ? 'mobile-open' : ''}`}
      role="navigation"
      aria-label="Main navigation"
      aria-hidden={!mobileMenuOpen && collapsed ? 'true' : 'false'}
    >
      <div className="sidebar-content">
        {/* Navigation menu with role-based items */}
        <NavigationMenu 
          userType={userType}
          collapsed={collapsed}
        />

        {/* Sidebar footer - Version info */}
        <div className="sidebar-footer">
          {!collapsed && (
            <div className="sidebar-branding">
              <span className="version">v1.0.0</span>
              <span className="environment">Production</span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

export default Sidebar; 