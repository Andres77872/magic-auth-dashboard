import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import type { UserType } from '@/types/auth.types';
import { NAVIGATION_ITEMS } from '@/utils/routes';

interface NavigationMenuProps {
  userType: UserType | null;
  collapsed: boolean;
}

interface NavIconProps {
  icon: string;
  className?: string;
}

function NavIcon({ icon, className = '' }: NavIconProps): React.JSX.Element {
  const iconSvgs: Record<string, React.JSX.Element> = {
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
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2l5 0 2 3h9a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    'users-group': (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
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
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    ),
  };

  return (
    <span className={`nav-icon ${className}`}>
      {iconSvgs[icon] || iconSvgs.dashboard}
    </span>
  );
}

export function NavigationMenu({ userType, collapsed }: NavigationMenuProps): React.JSX.Element {
  const location = useLocation();

  // Filter navigation items based on user type
  const filteredItems = NAVIGATION_ITEMS.filter(item => 
    userType && item.allowedUserTypes.includes(userType)
  );

  const isActiveNavItem = (path: string): boolean => {
    if (path === '/dashboard/overview' && location.pathname === '/dashboard') {
      return true;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="navigation-menu" role="navigation" aria-label="Main navigation">
      <ul className="nav-list">
        {filteredItems.map((item) => (
          <li key={item.id} className="nav-item">
            <NavLink
              to={item.path}
              className={({ isActive }) => 
                `nav-link ${isActive || isActiveNavItem(item.path) ? 'active' : ''}`
              }
              aria-current={isActiveNavItem(item.path) ? 'page' : undefined}
              title={collapsed ? item.label : undefined}
            >
              <NavIcon icon={item.icon} />
              {!collapsed && (
                <span className="nav-label">{item.label}</span>
              )}
              {isActiveNavItem(item.path) && (
                <span className="nav-indicator" aria-hidden="true" />
              )}
            </NavLink>
          </li>
        ))}
      </ul>

      {/* Quick Actions Section (when expanded) */}
      {!collapsed && (
        <div className="nav-section">
          <h3 className="nav-section-title">Quick Actions</h3>
          <ul className="nav-list nav-quick-actions">
            {userType === 'root' && (
              <li className="nav-item">
                <NavLink to="/dashboard/users/create" className="nav-link nav-quick-action">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="16"/>
                    <line x1="8" y1="12" x2="16" y2="12"/>
                  </svg>
                  <span>Create User</span>
                </NavLink>
              </li>
            )}
            
            {(userType === 'root' || userType === 'admin') && (
              <li className="nav-item">
                <NavLink to="/dashboard/projects/create" className="nav-link nav-quick-action">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="16"/>
                    <line x1="8" y1="12" x2="16" y2="12"/>
                  </svg>
                  <span>New Project</span>
                </NavLink>
              </li>
            )}
          </ul>
        </div>
      )}
    </nav>
  );
}

export default NavigationMenu; 