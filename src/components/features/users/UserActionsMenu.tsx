import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePermissions, useUserType, useAuth } from '@/hooks';
import { Modal, Select, Button } from '@/components/common';
import { userService } from '@/services';
import { ROUTES } from '@/utils/routes';
import { MoreIcon, ViewIcon, EditIcon, GroupIcon, LockIcon, CheckIcon, DeleteIcon, WarningIcon } from '@/components/icons';
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
          <MoreIcon size="small" />
        </button>

        {isOpen && (
          <div className="actions-dropdown" role="menu">
            <button
              type="button"
              className="action-item"
              role="menuitem"
              onClick={handleViewDetails}
            >
              <ViewIcon size="small" />
              View Details
            </button>

            {canEditUser(user) && (
              <button
                type="button"
                className="action-item"
                role="menuitem"
                onClick={handleEditUser}
              >
                <EditIcon size="small" />
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
                <GroupIcon size="small" />
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
                <LockIcon size="small" />
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
                <CheckIcon size="small" />
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
                <DeleteIcon size="small" />
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
                <WarningIcon size="large" />
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