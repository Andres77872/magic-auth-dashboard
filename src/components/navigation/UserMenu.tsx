import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, useUserType } from '@/hooks';
import { ChevronIcon, UserIcon, SettingsIcon, LogoutIcon } from '@/components/icons';
import { ROUTES } from '@/utils/routes';
import { getUserTypeBadgeClass } from '@/utils/userTypeStyles';

export function UserMenu(): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const { getUserTypeLabel, userType } = useUserType();
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
    return <></>;
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
        <ChevronIcon 
          className={`chevron ${isOpen ? 'open' : ''}`}
          size="small"
          direction={isOpen ? "up" : "down"}
        />
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
                  className={`user-type-badge ${getUserTypeBadgeClass(userType || undefined)}`}
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
              <UserIcon size="small" />
              <span>Profile</span>
            </Link>

            <button
              type="button"
              className="user-menu-item"
              role="menuitem"
              onClick={() => setIsOpen(false)}
            >
              <SettingsIcon size="small" />
              <span>Settings</span>
            </button>

            <hr className="user-menu-divider" />

            <button
              type="button"
              className="user-menu-item logout-item"
              role="menuitem"
              onClick={handleLogoutClick}
            >
              <LogoutIcon size="small" />
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