import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePermissions, useUserType, useAuth } from '@/hooks';
import { Modal, Select, Button, ActionsMenu } from '@/components/common';
import type { ActionMenuItem } from '@/components/common';
import { userService } from '@/services';
import { ROUTES } from '@/utils/routes';
import { ViewIcon, EditIcon, GroupIcon, LockIcon, CheckIcon, DeleteIcon, WarningIcon, ProjectIcon, ErrorIcon } from '@/components/icons';
import type { User, UserType } from '@/types/auth.types';
import { AdminProjectsManager } from './AdminProjectsManager';

interface UserActionsMenuProps {
  user: User;
  onUserUpdated?: () => void;
}

export function UserActionsMenu({ user, onUserUpdated }: UserActionsMenuProps): React.JSX.Element {
  const [showChangeTypeModal, setShowChangeTypeModal] = useState(false);
  const [showProjectsManager, setShowProjectsManager] = useState(false);
  const [selectedUserType, setSelectedUserType] = useState<UserType>(user.user_type);
  const [isChangingType, setIsChangingType] = useState(false);
  const [changeTypeError, setChangeTypeError] = useState('');
  
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
  };

  const handleDeleteUser = () => {
    console.log('Delete user:', user.user_hash);
    // TODO: Implement delete user functionality in future milestone
  };

  const handleChangeStatus = () => {
    console.log('Change status for user:', user.user_hash);
    // TODO: Implement status change functionality in future milestone
  };

  const handleResetPassword = () => {
    console.log('Reset password for user:', user.user_hash);
    // TODO: Implement password reset functionality in future milestone
  };

  const handleViewDetails = () => {
    navigate(`${ROUTES.USERS_PROFILE}/${user.user_hash}`);
  };

  const handleChangeUserType = () => {
    setShowChangeTypeModal(true);
    setSelectedUserType(user.user_type);
    setChangeTypeError('');
  };

  const handleManageProjects = () => {
    setShowProjectsManager(true);
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

  // Build menu items based on permissions
  const menuItems: ActionMenuItem[] = [
    {
      key: 'view',
      label: 'View Details',
      icon: <ViewIcon size={16} />,
      onClick: handleViewDetails,
    },
    {
      key: 'edit',
      label: 'Edit User',
      icon: <EditIcon size={16} />,
      onClick: handleEditUser,
      hidden: !canEditUser(user),
    },
    {
      key: 'change-type',
      label: 'Change User Type',
      icon: <GroupIcon size={16} />,
      onClick: handleChangeUserType,
      hidden: !canChangeUserType(user),
    },
    {
      key: 'manage-projects',
      label: 'Manage Projects',
      icon: <ProjectIcon size={16} />,
      onClick: handleManageProjects,
      hidden: user.user_type !== 'admin' || currentUserType !== 'root',
    },
    {
      key: 'reset-password',
      label: 'Reset Password',
      icon: <LockIcon size={16} />,
      onClick: handleResetPassword,
      hidden: !canEditUser(user),
    },
    {
      key: 'change-status',
      label: 'Change Status',
      icon: <CheckIcon size={16} />,
      onClick: handleChangeStatus,
      hidden: !canEditUser(user),
    },
    {
      key: 'delete',
      label: 'Delete User',
      icon: <DeleteIcon size={16} />,
      onClick: handleDeleteUser,
      destructive: true,
      hidden: !canDeleteUser(user),
    },
  ];

  return (
    <>
      <ActionsMenu
        items={menuItems}
        ariaLabel={`Actions for ${user.username}`}
        placement="bottom-right"
      />

      {/* Admin Projects Manager */}
      <AdminProjectsManager
        userHash={user.user_hash}
        username={user.username}
        isOpen={showProjectsManager}
        onClose={() => setShowProjectsManager(false)}
        onUpdate={onUserUpdated}
      />

      {/* Change User Type Modal */}
      <Modal
        isOpen={showChangeTypeModal}
        onClose={handleCancelTypeChange}
        title="Change User Type"
        size="md"
        className="change-user-type-modal"
        closeOnBackdropClick={!isChangingType}
        closeOnEscape={!isChangingType}
      >
        <div className="modal-body">
          <div className="user-info">
            <h4>User: {user.username}</h4>
            <p>Current Type: <strong>{user.user_type.toUpperCase()}</strong></p>
          </div>

          <div className="warning-section">
            <WarningIcon size={24} />
            <p>Changing a user's type will immediately affect their permissions and access level.</p>
          </div>

          <Select
            label="New User Type"
            options={availableUserTypes}
            value={selectedUserType}
            onChange={(value) => setSelectedUserType(value as UserType)}
            disabled={isChangingType}
            fullWidth
          />
          
          {changeTypeError && (
            <div className="form-error" role="alert">
              <ErrorIcon size={14} aria-hidden="true" />
              {changeTypeError}
            </div>
          )}
        </div>

        <div className="modal-footer">
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
            loading={isChangingType}
            disabled={selectedUserType === user.user_type}
          >
            Change User Type
          </Button>
        </div>
      </Modal>
    </>
  );
}

export default UserActionsMenu; 