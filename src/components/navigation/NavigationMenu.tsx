import React from 'react';
import { useLocation } from 'react-router-dom';
import type { UserType } from '@/types/auth.types';
import { NAVIGATION_ITEMS } from '@/utils/routes';
import { NavigationItem } from './NavigationItem';
import { usePermissions } from '@/hooks';
import { cn } from '@/lib/utils';

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

  // Check if navigation item is active - supports both exact and prefix matching
  const isItemActive = (itemPath: string) => {
    const currentPath = location.pathname;
    
    // Exact match for root path only (e.g., '/' for Home)
    if (itemPath === '/') {
      return currentPath === '/';
    }
    
    // Prefix match for all other routes (e.g., '/users' matches '/users' and '/users/:hash')
    return currentPath === itemPath || currentPath.startsWith(`${itemPath}/`);
  };

  return (
    <nav 
      className={cn(
        'flex flex-col py-2',
        collapsed ? 'px-2' : 'px-3'
      )} 
      role="navigation" 
      aria-label="Dashboard navigation"
    >
      {/* Navigation section label */}
      {!collapsed && (
        <div className="px-3 mb-2">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Main Menu
          </span>
        </div>
      )}

      {/* Navigation items */}
      <ul className="list-none m-0 p-0 space-y-1">
        {filteredItems.map((item) => (
          <NavigationItem
            key={item.id}
            item={item}
            isActive={isItemActive(item.path)}
            collapsed={collapsed}
          />
        ))}
      </ul>
    </nav>
  );
}

export default NavigationMenu; 