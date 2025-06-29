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

  return (
    <nav className="navigation-menu" role="navigation" aria-label="Dashboard navigation">
      <ul className="nav-list">
        {filteredItems.map((item) => (
          <NavigationItem
            key={item.id}
            item={item}
            isActive={location.pathname.startsWith(item.path)}
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