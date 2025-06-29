import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '@/hooks';
import { ROUTES } from '@/utils/routes';
import type { User } from '@/types/auth.types';

interface UserActionsMenuProps {
  user: User;
}

export function UserActionsMenu({ user }: UserActionsMenuProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { canCreateUser, canCreateAdmin } = usePermissions();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const canEditUser = (targetUser: User) => {
    // Basic permission check - admins can't edit root users
    if (targetUser.user_type === 'root' && !canCreateAdmin) {
      return false;
    }
    return canCreateUser;
  };

  const canDeleteUser = (targetUser: User) => {
    // Similar logic for delete permissions
    if (targetUser.user_type === 'root' && !canCreateAdmin) {
      return false;
    }
    return canCreateUser;
  };

  const handleEditUser = () => {
    navigate(`${ROUTES.USERS_EDIT}/${user.user_hash}`);
    setIsOpen(false);
  };

  const handleDeleteUser = () => {
    console.log('Delete user:', user.user_hash);
    // TODO: Implement delete user functionality in future milestone
    setIsOpen(false);
  };

  const handleChangeStatus = () => {
    console.log('Change status for user:', user.user_hash);
    // TODO: Implement status change functionality in future milestone
    setIsOpen(false);
  };

  const handleResetPassword = () => {
    console.log('Reset password for user:', user.user_hash);
    // TODO: Implement password reset functionality in future milestone
    setIsOpen(false);
  };

  const handleViewDetails = () => {
    navigate(`${ROUTES.USERS_PROFILE}/${user.user_hash}`);
    setIsOpen(false);
  };

  return (
    <div className="user-actions-menu" ref={menuRef}>
      <button
        type="button"
        className="actions-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={`Actions for ${user.username}`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="1"/>
          <circle cx="12" cy="5" r="1"/>
          <circle cx="12" cy="19" r="1"/>
        </svg>
      </button>

      {isOpen && (
        <div className="actions-dropdown" role="menu">
          <button
            type="button"
            className="action-item"
            role="menuitem"
            onClick={handleViewDetails}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            View Details
          </button>

          {canEditUser(user) && (
            <button
              type="button"
              className="action-item"
              role="menuitem"
              onClick={handleEditUser}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Edit User
            </button>
          )}

          {canEditUser(user) && (
            <button
              type="button"
              className="action-item"
              role="menuitem"
              onClick={handleResetPassword}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <circle cx="12" cy="16" r="1"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              Reset Password
            </button>
          )}

          {canEditUser(user) && (
            <button
              type="button"
              className="action-item"
              role="menuitem"
              onClick={handleChangeStatus}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12l2 2 4-4"/>
                <circle cx="12" cy="12" r="10"/>
              </svg>
              Change Status
            </button>
          )}

          <div className="action-divider" />

          {canDeleteUser(user) && (
            <button
              type="button"
              className="action-item action-item-danger"
              role="menuitem"
              onClick={handleDeleteUser}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3,6 5,6 21,6"/>
                <path d="M19,6v14a2,2 0,0,1-2,2H7a2,2 0,0,1-2-2V6m3,0V4a2,2 0,0,1,2-2h4a2,2 0,0,1,2,2v2"/>
                <line x1="10" y1="11" x2="10" y2="17"/>
                <line x1="14" y1="11" x2="14" y2="17"/>
              </svg>
              Delete User
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default UserActionsMenu; 