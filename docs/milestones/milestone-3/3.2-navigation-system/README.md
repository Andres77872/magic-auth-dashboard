# Milestone 3.2: Navigation System

## Overview
**Duration**: Day 3-4  
**Status**: 🟡 **READY TO START**  
**Goal**: Build dynamic navigation system with user permissions, interactive menu items, and user profile management

**Dependencies**: ✅ Milestone 3.1 completed (Main Layout Structure)

## 📋 Tasks Checklist

### Step 1: Navigation Menu Foundation
- [ ] Create main navigation menu component with permission filtering
- [ ] Implement individual navigation item components
- [ ] Add active route highlighting and hover states
- [ ] Handle nested menu items and categories

### Step 2: User Menu Implementation
- [ ] Create user profile dropdown with avatar and user info
- [ ] Implement logout functionality with confirmation
- [ ] Add profile access and settings options
- [ ] Style dropdown with smooth animations

### Step 3: Permission-Based Menu Filtering
- [ ] Filter navigation items based on user type (ROOT, ADMIN)
- [ ] Hide/show menu sections based on permissions
- [ ] Add visual indicators for access levels
- [ ] Handle dynamic menu updates on permission changes

### Step 4: Interactive Navigation Features
- [ ] Add keyboard navigation support for all menu items
- [ ] Implement tooltip support for collapsed sidebar items
- [ ] Create notification bell foundation (placeholder)
- [ ] Add smooth animations and transitions

---

## 🔧 Detailed Implementation Steps

### Step 1: Create Navigation Menu Foundation

Create `src/components/navigation/NavigationMenu.tsx`:

```typescript
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
```

### Step 2: Create Individual Navigation Items

Create `src/components/navigation/NavigationItem.tsx`:

```typescript
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
```

### Step 3: Create User Menu Component

Create `src/components/navigation/UserMenu.tsx`:

```typescript
import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, useUserType } from '@/hooks';
import { ROUTES } from '@/utils/routes';

export function UserMenu(): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const { getUserTypeLabel, getUserTypeBadgeColor } = useUserType();
  const navigate = useNavigate();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowLogoutConfirm(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
      setShowLogoutConfirm(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate(ROUTES.LOGIN);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleLogoutConfirm = () => {
    setShowLogoutConfirm(false);
    handleLogout();
  };

  const handleLogoutCancel = () => {
    setShowLogoutConfirm(false);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="user-menu" ref={menuRef} onKeyDown={handleKeyDown}>
      {/* User avatar/trigger */}
      <button
        type="button"
        className="user-menu-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="User menu"
      >
        <div className="user-avatar">
          <span className="avatar-text">
            {user.username.charAt(0).toUpperCase()}
          </span>
        </div>
        <svg 
          className={`chevron ${isOpen ? 'open' : ''}`}
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
        >
          <polyline points="6,9 12,15 18,9"/>
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="user-menu-dropdown" role="menu">
          {/* User info header */}
          <div className="user-menu-header">
            <div className="user-info-detailed">
              <div className="user-avatar-large">
                <span className="avatar-text-large">
                  {user.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="user-details">
                <div className="user-name-large">{user.username}</div>
                <div className="user-email">{user.email}</div>
                <div 
                  className="user-type-badge"
                  style={{ color: getUserTypeBadgeColor() }}
                >
                  {getUserTypeLabel()}
                </div>
              </div>
            </div>
          </div>

          {/* Menu items */}
          <div className="user-menu-items">
            <Link
              to={ROUTES.PROFILE}
              className="user-menu-item"
              role="menuitem"
              onClick={() => setIsOpen(false)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <span>Profile</span>
            </Link>

            <button
              type="button"
              className="user-menu-item"
              role="menuitem"
              onClick={() => setIsOpen(false)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
              <span>Settings</span>
            </button>

            <hr className="user-menu-divider" />

            <button
              type="button"
              className="user-menu-item logout-item"
              role="menuitem"
              onClick={handleLogoutClick}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16,17 21,12 16,7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Logout confirmation modal */}
      {showLogoutConfirm && (
        <div className="logout-confirm-overlay">
          <div className="logout-confirm-dialog" role="dialog" aria-labelledby="logout-title">
            <h3 id="logout-title">Confirm Sign Out</h3>
            <p>Are you sure you want to sign out of your account?</p>
            <div className="logout-confirm-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleLogoutCancel}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleLogoutConfirm}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserMenu;
```

### Step 4: Create Notification Bell (Placeholder)

Create `src/components/navigation/NotificationBell.tsx`:

```typescript
import React, { useState } from 'react';

interface NotificationBellProps {
  count?: number;
}

export function NotificationBell({ count = 0 }: NotificationBellProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="notification-bell">
      <button
        type="button"
        className="notification-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Notifications${count > 0 ? ` (${count} unread)` : ''}`}
        aria-expanded={isOpen}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {count > 0 && (
          <span className="notification-badge" aria-hidden="true">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
          </div>
          <div className="notification-content">
            <p className="no-notifications">No new notifications</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
```

### Step 5: Create Navigation Components Index

Create `src/components/navigation/index.ts`:

```typescript
export { default as NavigationMenu } from './NavigationMenu';
export { default as NavigationItem } from './NavigationItem';
export { default as UserMenu } from './UserMenu';
export { default as NotificationBell } from './NotificationBell';
```

### Step 6: Create Navigation CSS Styles

Create `src/styles/components/navigation.css`:

```css
/* Navigation Menu Styles */
.navigation-menu {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: var(--spacing-4) 0;
}

.nav-list {
  list-style: none;
  margin: 0;
  padding: 0;
  flex: 1;
}

.nav-item {
  margin-bottom: var(--spacing-1);
  position: relative;
}

.nav-link {
  display: flex;
  align-items: center;
  padding: var(--spacing-3) var(--spacing-4);
  text-decoration: none;
  color: var(--color-gray-600);
  border-radius: var(--border-radius-md);
  margin: 0 var(--spacing-2);
  transition: all var(--transition-fast);
  position: relative;
}

.nav-link:hover {
  background-color: var(--color-gray-100);
  color: var(--color-gray-900);
}

.nav-item.active .nav-link {
  background-color: var(--color-primary-100);
  color: var(--color-primary-700);
}

.nav-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: var(--spacing-3);
  flex-shrink: 0;
}

.nav-label {
  flex: 1;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.nav-arrow {
  margin-left: auto;
  transition: transform var(--transition-fast);
}

.nav-tooltip {
  position: absolute;
  left: 100%;
  top: 50%;
  transform: translateY(-50%);
  background: var(--color-gray-900);
  color: white;
  padding: var(--spacing-2) var(--spacing-3);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
  white-space: nowrap;
  z-index: var(--z-index-tooltip);
  margin-left: var(--spacing-2);
}

.nav-tooltip::before {
  content: '';
  position: absolute;
  right: 100%;
  top: 50%;
  transform: translateY(-50%);
  border: 4px solid transparent;
  border-right-color: var(--color-gray-900);
}

/* Navigation Footer */
.navigation-footer {
  margin-top: auto;
  padding: var(--spacing-4);
}

.nav-footer-content {
  border-top: 1px solid var(--color-gray-200);
  padding-top: var(--spacing-4);
}

.user-type-indicator {
  text-align: center;
}

.access-level {
  font-size: var(--font-size-xs);
  color: var(--color-gray-500);
  font-weight: var(--font-weight-medium);
}

/* User Menu Styles */
.user-menu {
  position: relative;
}

.user-menu-trigger {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  background: none;
  border: none;
  cursor: pointer;
  padding: var(--spacing-2);
  border-radius: var(--border-radius-md);
  transition: background-color var(--transition-fast);
}

.user-menu-trigger:hover {
  background-color: var(--color-gray-100);
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-primary-500);
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-text {
  color: white;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
}

.chevron {
  transition: transform var(--transition-fast);
  color: var(--color-gray-400);
}

.chevron.open {
  transform: rotate(180deg);
}

.user-menu-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--color-gray-200);
  min-width: 280px;
  z-index: var(--z-index-dropdown);
  overflow: hidden;
  margin-top: var(--spacing-2);
}

.user-menu-header {
  padding: var(--spacing-4);
  border-bottom: 1px solid var(--color-gray-200);
  background: var(--color-gray-50);
}

.user-info-detailed {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}

.user-avatar-large {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--color-primary-500);
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-text-large {
  color: white;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
}

.user-details {
  flex: 1;
}

.user-name-large {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--color-gray-900);
  margin-bottom: var(--spacing-1);
}

.user-email {
  font-size: var(--font-size-sm);
  color: var(--color-gray-600);
  margin-bottom: var(--spacing-1);
}

.user-type-badge {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.user-menu-items {
  padding: var(--spacing-2);
}

.user-menu-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  width: 100%;
  padding: var(--spacing-3) var(--spacing-3);
  background: none;
  border: none;
  text-decoration: none;
  color: var(--color-gray-700);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: background-color var(--transition-fast);
  font-size: var(--font-size-sm);
}

.user-menu-item:hover {
  background-color: var(--color-gray-100);
}

.user-menu-item.logout-item {
  color: var(--color-error);
}

.user-menu-item.logout-item:hover {
  background-color: var(--color-error-light);
}

.user-menu-divider {
  border: 0;
  height: 1px;
  background: var(--color-gray-200);
  margin: var(--spacing-2) 0;
}

/* Logout Confirmation Modal */
.logout-confirm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-index-modal);
}

.logout-confirm-dialog {
  background: white;
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-6);
  max-width: 400px;
  width: 90%;
  box-shadow: var(--shadow-xl);
}

.logout-confirm-dialog h3 {
  margin-bottom: var(--spacing-3);
  color: var(--color-gray-900);
}

.logout-confirm-dialog p {
  margin-bottom: var(--spacing-6);
  color: var(--color-gray-600);
}

.logout-confirm-actions {
  display: flex;
  gap: var(--spacing-3);
  justify-content: flex-end;
}

/* Notification Bell Styles */
.notification-bell {
  position: relative;
}

.notification-trigger {
  position: relative;
  background: none;
  border: none;
  cursor: pointer;
  padding: var(--spacing-2);
  border-radius: var(--border-radius-md);
  color: var(--color-gray-600);
  transition: all var(--transition-fast);
}

.notification-trigger:hover {
  background-color: var(--color-gray-100);
  color: var(--color-gray-900);
}

.notification-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  background: var(--color-error);
  color: white;
  border-radius: 50%;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  min-width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.notification-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--color-gray-200);
  min-width: 300px;
  z-index: var(--z-index-dropdown);
  margin-top: var(--spacing-2);
}

.notification-header {
  padding: var(--spacing-4);
  border-bottom: 1px solid var(--color-gray-200);
}

.notification-header h3 {
  margin: 0;
  font-size: var(--font-size-base);
  color: var(--color-gray-900);
}

.notification-content {
  padding: var(--spacing-4);
}

.no-notifications {
  text-align: center;
  color: var(--color-gray-500);
  font-size: var(--font-size-sm);
  margin: 0;
}

/* Responsive Navigation */
@media (max-width: 1024px) {
  .nav-tooltip {
    display: none;
  }
}
```

---

## 🧪 Testing & Verification

### Step 1: Navigation Menu Testing
- [ ] Navigation items filter correctly based on user type
- [ ] Active route highlighting works properly
- [ ] Collapsed sidebar shows tooltips on hover
- [ ] Menu items are keyboard accessible

### Step 2: User Menu Testing
- [ ] User dropdown opens and closes correctly
- [ ] User information displays accurately
- [ ] Logout confirmation modal appears
- [ ] Profile link navigation works

### Step 3: Permission Integration Testing
- [ ] ROOT users see all navigation items
- [ ] ADMIN users see appropriate subset
- [ ] Menu updates when user type changes
- [ ] Inaccessible routes are hidden

### Step 4: Responsive Behavior Testing
- [ ] Navigation works on mobile devices
- [ ] Tooltips don't appear on touch devices
- [ ] Menu interactions work with touch
- [ ] Keyboard navigation functions properly

---

## 📁 Files Created/Modified

### New Files Created
- `src/components/navigation/NavigationMenu.tsx` - Main navigation with permission filtering
- `src/components/navigation/NavigationItem.tsx` - Individual navigation items with tooltips
- `src/components/navigation/UserMenu.tsx` - User profile dropdown with logout
- `src/components/navigation/NotificationBell.tsx` - Notification system placeholder
- `src/components/navigation/index.ts` - Navigation component exports
- `src/styles/components/navigation.css` - Complete navigation styling

### Modified Files
- `src/components/layout/Header.tsx` - Integrate UserMenu component
- `src/components/layout/Sidebar.tsx` - Integrate NavigationMenu component

---

## ✅ Completion Criteria

- [ ] Navigation menu renders with correct permissions
- [ ] User menu functions properly with logout
- [ ] Active route highlighting works correctly
- [ ] Accessibility requirements met (WCAG 2.1 AA)
- [ ] TypeScript compilation passes without errors
- [ ] Responsive design works on all devices
- [ ] Smooth animations and transitions implemented

---

## 🎉 MILESTONE 3.2 - COMPLETION CHECKLIST

**When all tasks are completed:**
- [ ] All navigation components created and tested
- [ ] Permission-based filtering working correctly
- [ ] User menu and logout functionality operational
- [ ] CSS styling follows design system patterns
- [ ] Mobile responsiveness verified
- [ ] Performance targets met (< 100ms interactions)

**Next Step**: [Milestone 3.3: Common UI Components](../3.3-ui-components/README.md)

### Key Deliverables
- ✅ **Dynamic Navigation System** - Permission-based menu filtering
- ✅ **User Profile Management** - Complete user menu with logout
- ✅ **Interactive Features** - Tooltips, animations, keyboard support
- ✅ **Mobile-Friendly** - Touch-optimized navigation experience

### Integration Points
- Uses authentication context for user information ✅
- Leverages permission system for menu filtering ✅
- Integrates with layout components from 3.1 ✅
- Ready for content area components in 3.3 ✅
</rewritten_file> 