import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
  const [menuStyles, setMenuStyles] = useState<{ top: number; left: number; minWidth: number } | null>(null);
  const [showChangeTypeModal, setShowChangeTypeModal] = useState(false);
  const [selectedUserType, setSelectedUserType] = useState<UserType>(user.user_type);
  const [isChangingType, setIsChangingType] = useState(false);
  const [changeTypeError, setChangeTypeError] = useState('');
  
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstItemRef = useRef<HTMLButtonElement>(null);
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

  const updateMenuPosition = useCallback(() => {
    const trigger = triggerRef.current;
    const menu = menuRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Default placement: bottom-right of trigger
    let top = rect.bottom + 6; // small offset
    let left = rect.right - 240; // assume ~240px width
    const minWidth = 200;

    // Flip vertically if would overflow bottom
    if (top + 280 > viewportHeight) {
      top = rect.top - 6 - 280; // approximate height
      if (top < 8) top = 8;
    }

    // Ensure within viewport horizontally
    if (left + 240 > viewportWidth) {
      left = viewportWidth - 248; // padding
    }
    if (left < 8) left = 8;

    setMenuStyles({ top, left, minWidth });

    // If we know the actual menu size, refine after mount
    if (menu) {
      const menuRect = menu.getBoundingClientRect();
      let adjustedLeft = left;
      let adjustedTop = top;
      if (adjustedLeft + menuRect.width > viewportWidth) {
        adjustedLeft = Math.max(8, viewportWidth - menuRect.width - 8);
      }
      if (adjustedTop + menuRect.height > viewportHeight) {
        adjustedTop = Math.max(8, viewportHeight - menuRect.height - 8);
      }
      setMenuStyles({ top: adjustedTop, left: adjustedLeft, minWidth });
    }
  }, []);

  // Close menu when clicking outside and keep positioned on scroll/resize
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        menuRef.current &&
        triggerRef.current &&
        !menuRef.current.contains(target) &&
        !triggerRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    const handleScroll = () => {
      if (isOpen) updateMenuPosition();
    };

    document.addEventListener('mousedown', handleClickOutside, true);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleScroll);
    // capture scroll on all ancestors
    document.addEventListener('scroll', handleScroll, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleScroll);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen, updateMenuPosition]);

  // When opened, position and focus first item
  useEffect(() => {
    if (isOpen) {
      updateMenuPosition();
      // Slight delay so menu exists
      setTimeout(() => firstItemRef.current?.focus(), 0);
    }
  }, [isOpen, updateMenuPosition]);

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
      <div className="user-actions-menu">
        <button
          type="button"
          className="menu-trigger"
          ref={triggerRef}
          onClick={() => setIsOpen((v) => !v)}
          aria-expanded={isOpen}
          aria-haspopup="true"
          aria-label={`Actions for ${user.username}`}
        >
          <MoreIcon size="small" />
        </button>
        {isOpen && menuStyles && createPortal(
          <div
            className="menu-dropdown"
            role="menu"
            ref={menuRef}
            style={{ position: 'fixed', top: menuStyles.top, left: menuStyles.left, minWidth: menuStyles.minWidth, zIndex: 1000 }}
          >
            <button
              type="button"
              className="menu-item"
              role="menuitem"
              onClick={handleViewDetails}
              ref={firstItemRef}
            >
              <ViewIcon size="small" />
              View Details
            </button>

            {canEditUser(user) && (
              <button
                type="button"
                className="menu-item"
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
                className="menu-item"
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
                className="menu-item"
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
                className="menu-item"
                role="menuitem"
                onClick={handleChangeStatus}
              >
                <CheckIcon size="small" />
                Change Status
              </button>
            )}

            <div className="user-menu-divider" />

            {canDeleteUser(user) && (
              <button
                type="button"
                className="menu-item destructive"
                role="menuitem"
                onClick={handleDeleteUser}
              >
                <DeleteIcon size="small" />
                Delete User
              </button>
            )}
          </div>,
          document.body
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

          <div className="user-modal-actions">
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