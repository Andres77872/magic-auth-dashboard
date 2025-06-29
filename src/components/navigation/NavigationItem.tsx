import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import type { NavItem } from '@/utils/routes';

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
      dashboard: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="9"/>
          <rect x="14" y="3" width="7" height="5"/>
          <rect x="14" y="12" width="7" height="9"/>
          <rect x="3" y="16" width="7" height="5"/>
        </svg>
      ),
      users: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
      folder: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2l5 0l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
      ),
      'users-group': (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
      shield: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      ),
      settings: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      ),
    };

    return icons[iconName] || icons.dashboard;
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
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6,9 12,15 18,9"/>
            </svg>
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