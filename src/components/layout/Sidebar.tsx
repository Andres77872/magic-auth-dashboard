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
      className={`dashboard-sidebar ${collapsed ? 'collapsed' : ''} ${mobileMenuOpen ? 'mobile-open' : ''}`}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="sidebar-content">
        {/* Navigation menu */}
        <NavigationMenu 
          userType={userType}
          collapsed={collapsed}
        />

        {/* Sidebar footer */}
        <div className="sidebar-footer">
          {!collapsed && (
            <>
              <div className="sidebar-branding">
                <span className="version">v1.0.0</span>
                <span className="environment">Production</span>
              </div>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}

export default Sidebar; 