import React from 'react';
import { useLocation } from 'react-router-dom';
import type { UserType } from '@/types/auth.types';
import { NAVIGATION_ITEMS } from '@/utils/routes';
import { NavigationItem } from './NavigationItem';
import { usePermissions } from '@/hooks';

interface NavigationMenuProps {
  userType: UserType | null;
  collapsed: boolean;
}

export function NavigationMenu({ userType, collapsed }: NavigationMenuProps): React.JSX.Element {
  const location = useLocation();
  const { isAuthenticated } = usePermissions();

  // Filter navigation items based on user permissions
  const getFilteredNavigationItems = () => {
    if (!userType || !isAuthenticated) {
      return [];
    }

    return NAVIGATION_ITEMS.filter(item => 
      item.allowedUserTypes.includes(userType)
    );
  };

  const filteredItems = getFilteredNavigationItems();

  // Check if navigation item is active with exact matching only
  // This prevents parent routes from matching child routes
  const isItemActive = (itemPath: string) => {
    const currentPath = location.pathname;
    
    // Only exact match - no substring matching
    // This ensures /dashboard/permissions doesn't match /dashboard/permissions/role-management
    return currentPath === itemPath;
  };

  return (
    <nav className="navigation-menu" role="navigation" aria-label="Dashboard navigation">
      <ul className="nav-list">
        {filteredItems.map((item) => (
          <NavigationItem
            key={item.id}
            item={item}
            isActive={isItemActive(item.path)}
            collapsed={collapsed}
          />
        ))}
      </ul>
      
      {/* Navigation footer */}
      <div className="navigation-footer">
        {!collapsed && (
          <div className="nav-footer-content">
            <div className="user-type-indicator">
              <span className="access-level">Access Level: {userType?.toUpperCase()}</span>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default NavigationMenu; 