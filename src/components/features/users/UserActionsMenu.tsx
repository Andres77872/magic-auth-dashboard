import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePermissions, useUserType, useAuth } from '@/hooks';
import { Modal, Select, Button } from '@/components/common';
import { userService } from '@/services';
import { ROUTES } from '@/utils/routes';
import type { User, UserType } from '@/types/auth.types';

interface UserActionsMenuProps {
  user: User;
  onUserUpdated?: () => void;
}

export function UserActionsMenu({ user, onUserUpdated }: UserActionsMenuProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [showChangeTypeModal, setShowChangeTypeModal] = useState(false);
  const [selectedUserType, setSelectedUserType] = useState<UserType>(user.user_type);
  const [isChangingType, setIsChangingType] = useState(false);
  const [changeTypeError, setChangeTypeError] = useState('');
  
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { canCreateUser, canCreateAdmin, canCreateRoot } = usePermissions();
  const { userType: currentUserType } = useUserType();
  const { user: currentUser } = useAuth();

  // User type options for the change type modal
  const USER_TYPE_OPTIONS = [
    { value: 'consumer', label: 'Consumer User' },
    { value: 'admin', label: 'Admin User' },
    { value: 'root', label: 'ROOT User' },
  ];

  // Filter available user types based on permissions
  const availableUserTypes = USER_TYPE_OPTIONS.filter(option => {
    if (option.value === 'root' && !canCreateRoot) return false;
    if (option.value === 'admin' && !canCreateAdmin) return false;
    return true;
  });

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

  const canChangeUserType = (targetUser: User) => {
    // Only ROOT users can change user types
    if (currentUserType !== 'root') return false;
    
    // Can't change own user type
    if (currentUser && targetUser.user_hash === currentUser.user_hash) return false;
    
    return true;
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

  const handleChangeUserType = () => {
    setShowChangeTypeModal(true);
    setSelectedUserType(user.user_type);
    setChangeTypeError('');
    setIsOpen(false);
  };

  const handleConfirmTypeChange = async () => {
    if (selectedUserType === user.user_type) {
      setShowChangeTypeModal(false);
      return;
    }

    setIsChangingType(true);
    setChangeTypeError('');

    try {
      const response = await userService.changeUserType(
        user.user_hash,
        selectedUserType
      );

      if (response.success) {
        setShowChangeTypeModal(false);
        onUserUpdated?.();
      } else {
        setChangeTypeError(response.message || 'Failed to change user type');
      }
    } catch (error) {
      setChangeTypeError('An error occurred while changing user type');
      console.error('Error changing user type:', error);
    } finally {
      setIsChangingType(false);
    }
  };

  const handleCancelTypeChange = () => {
    setShowChangeTypeModal(false);
    setSelectedUserType(user.user_type);
    setChangeTypeError('');
  };

  return (
    <>
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

            {canChangeUserType(user) && (
              <button
                type="button"
                className="action-item"
                role="menuitem"
                onClick={handleChangeUserType}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                Change User Type
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

      {/* Change User Type Modal */}
      <Modal
        isOpen={showChangeTypeModal}
        onClose={handleCancelTypeChange}
        title="Change User Type"
        size="medium"
        className="change-user-type-modal"
        closeOnBackdropClick={!isChangingType}
        closeOnEscape={!isChangingType}
      >
        <div className="change-type-content">
          <div className="user-info">
            <h4>User: {user.username}</h4>
            <p>Current Type: <span className="current-type">{user.user_type.toUpperCase()}</span></p>
          </div>

          <div className="warning-section">
            <div className="warning-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <p>Changing a user's type will immediately affect their permissions and access level.</p>
          </div>

          <div className="type-selection">
            <Select
              label="New User Type"
              options={availableUserTypes}
              value={selectedUserType}
              onChange={(value) => setSelectedUserType(value as UserType)}
              disabled={isChangingType}
              fullWidth
            />
            {changeTypeError && (
              <div className="error-message">{changeTypeError}</div>
            )}
          </div>

          <div className="modal-actions">
            <Button
              variant="outline"
              onClick={handleCancelTypeChange}
              disabled={isChangingType}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleConfirmTypeChange}
              isLoading={isChangingType}
              disabled={selectedUserType === user.user_type}
            >
              Change User Type
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export default UserActionsMenu; 