import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { NavItem } from '@/utils/routes';
import { 
  DashboardIcon, 
  UserIcon, 
  ProjectIcon, 
  GroupIcon, 
  SecurityIcon, 
  SettingsIcon, 
  ChevronIcon 
} from '@/components/icons';

interface NavigationItemProps {
  item: NavItem;
  isActive: boolean;
  collapsed: boolean;
  level?: number;
}

export function NavigationItem({
  item,
  isActive,
  collapsed,
  level = 0,
}: NavigationItemProps): React.JSX.Element {
  const [showTooltip, setShowTooltip] = useState(false);
  const hasChildren = item.children && item.children.length > 0;

  // Get icon component based on icon name
  const getIcon = (iconName: string) => {
    const icons: Record<string, React.ReactElement> = {
      dashboard: <DashboardIcon size="medium" />,
      users: <UserIcon size="medium" />,
      folder: <ProjectIcon size="medium" />,
      'users-group': <GroupIcon size="medium" />,
      shield: <SecurityIcon size="medium" />,
      settings: <SettingsIcon size="medium" />,
    };

    return icons[iconName] || <DashboardIcon size="medium" />;
  };

  return (
    <li className={`nav-item ${isActive ? 'active' : ''} ${hasChildren ? 'has-children' : ''}`}>
      {/* Tooltip for collapsed sidebar */}
      {collapsed && showTooltip && (
        <div className="nav-tooltip" role="tooltip">
          {item.label}
        </div>
      )}

      <Link
        to={item.path}
        className="nav-link"
        onMouseEnter={() => collapsed && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => collapsed && setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        aria-label={collapsed ? item.label : undefined}
        aria-current={isActive ? 'page' : undefined}
        title={collapsed ? item.label : undefined}
      >
        <span className="nav-icon">
          {getIcon(item.icon)}
        </span>
        
        {!collapsed && (
          <span className="nav-label">{item.label}</span>
        )}

        {!collapsed && hasChildren && (
          <span className="nav-arrow">
            <ChevronIcon size="small" direction="down" />
          </span>
        )}
      </Link>

      {/* Nested items (for future expansion) */}
      {!collapsed && hasChildren && (
        <ul className="nav-submenu">
          {item.children?.map((child) => (
            <NavigationItem
              key={child.id}
              item={child}
              isActive={isActive}
              collapsed={false}
              level={level + 1}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export default NavigationItem; 