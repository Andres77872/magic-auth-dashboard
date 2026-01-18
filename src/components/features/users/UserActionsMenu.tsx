import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePermissions, useUserType, useAuth, useToast } from '@/hooks';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { userService, groupService } from '@/services';
import { ROUTES } from '@/utils/routes';
import { Eye, Pencil, Users, Lock, Check, Trash2, AlertTriangle, FolderKanban, MoreHorizontal, AlertCircle } from 'lucide-react';
import type { User, UserType } from '@/types/auth.types';
import { AdminProjectsManager } from './AdminProjectsManager';
import { UserDetailsModal } from './UserDetailsModal';
import { AssignGroupModal } from './AssignGroupModal';

interface UserActionsMenuProps {
  user: User;
  onUserUpdated?: () => void;
  onEditUser?: (user: User) => void;
  onViewDetails?: (user: User) => void;
}

export function UserActionsMenu({ user, onUserUpdated, onEditUser, onViewDetails }: UserActionsMenuProps): React.JSX.Element {
  const [showChangeTypeModal, setShowChangeTypeModal] = useState(false);
  const [showProjectsManager, setShowProjectsManager] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAssignGroupModal, setShowAssignGroupModal] = useState(false);
  const [selectedUserType, setSelectedUserType] = useState<UserType>(user.user_type);
  const [isChangingType, setIsChangingType] = useState(false);
  const [changeTypeError, setChangeTypeError] = useState('');
  
  const navigate = useNavigate();
  const { canCreateUser, canCreateAdmin, canCreateRoot } = usePermissions();
  const { userType: currentUserType } = useUserType();
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();

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
    if (onEditUser) {
      onEditUser(user);
    } else {
      // Fallback to navigation if callback not provided
      navigate(`${ROUTES.USERS_EDIT}/${user.user_hash}`);
    }
  };

  const handleDeleteUser = async () => {
    if (!window.confirm(`Are you sure you want to delete user "${user.username}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const response = await userService.deleteUser(user.user_hash);
      if (response.success) {
        showToast(`User "${user.username}" has been deleted`, 'success');
        onUserUpdated?.();
      } else {
        showToast(response.message || 'Failed to delete user', 'error');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      showToast('Failed to delete user', 'error');
    }
  };

  const handleChangeStatus = async () => {
    const newStatus = !user.is_active;
    const action = newStatus ? 'activate' : 'deactivate';
    
    if (!window.confirm(`Are you sure you want to ${action} user "${user.username}"?`)) {
      return;
    }
    
    try {
      const response = await userService.toggleUserStatus(user.user_hash, newStatus);
      if (response.success) {
        showToast(`User "${user.username}" has been ${newStatus ? 'activated' : 'deactivated'}`, 'success');
        onUserUpdated?.();
      } else {
        showToast(response.message || `Failed to ${action} user`, 'error');
      }
    } catch (error) {
      console.error(`Error ${action} user:`, error);
      showToast(`Failed to ${action} user`, 'error');
    }
  };

  const handleResetPassword = async () => {
    if (!window.confirm(`Are you sure you want to reset the password for "${user.username}"? A temporary password will be generated.`)) {
      return;
    }
    
    try {
      const response = await userService.resetUserPassword(user.user_hash);
      if (response.success) {
        const tempPassword = response.reset_data?.temporary_password;
        if (tempPassword) {
          showToast(`Password reset. Temporary password: ${tempPassword}`, 'success');
        } else {
          showToast('Password has been reset successfully', 'success');
        }
        onUserUpdated?.();
      } else {
        showToast(response.message || 'Failed to reset password', 'error');
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      showToast('Failed to reset password', 'error');
    }
  };

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(user);
      return;
    }
    setShowDetailsModal(true);
  };

  const handleAssignGroup = () => {
    setShowAssignGroupModal(true);
  };

  const handleGroupAssigned = async (groupHash: string) => {
    try {
      const response = await groupService.addMemberToGroup(groupHash, { user_hash: user.user_hash });
      if (response.success) {
        showToast('User assigned to group successfully', 'success');
        setShowAssignGroupModal(false);
        onUserUpdated?.();
      } else {
        showToast(response.message || 'Failed to assign user to group', 'error');
      }
    } catch (error) {
      console.error('Error assigning user to group:', error);
      showToast('Failed to assign user to group', 'error');
    }
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

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <span className="sr-only">Actions for {user.username}</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleViewDetails}>
            <Eye className="mr-2 h-4 w-4" />
            View Details
          </DropdownMenuItem>
          {canEditUser(user) && (
            <DropdownMenuItem onClick={handleEditUser}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit User
            </DropdownMenuItem>
          )}
          {canEditUser(user) && (
            <DropdownMenuItem onClick={handleAssignGroup}>
              <Users className="mr-2 h-4 w-4" />
              Assign to Group
            </DropdownMenuItem>
          )}
          {canChangeUserType(user) && (
            <DropdownMenuItem onClick={handleChangeUserType}>
              <Users className="mr-2 h-4 w-4" />
              Change User Type
            </DropdownMenuItem>
          )}
          {user.user_type === 'admin' && currentUserType === 'root' && (
            <DropdownMenuItem onClick={handleManageProjects}>
              <FolderKanban className="mr-2 h-4 w-4" />
              Manage Projects
            </DropdownMenuItem>
          )}
          {canEditUser(user) && (
            <DropdownMenuItem onClick={handleResetPassword}>
              <Lock className="mr-2 h-4 w-4" />
              Reset Password
            </DropdownMenuItem>
          )}
          {canEditUser(user) && (
            <DropdownMenuItem onClick={handleChangeStatus}>
              <Check className="mr-2 h-4 w-4" />
              Change Status
            </DropdownMenuItem>
          )}
          {canDeleteUser(user) && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDeleteUser}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete User
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* User Details Modal */}
      <UserDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        user={user}
        onEdit={() => {
          setShowDetailsModal(false);
          handleEditUser();
        }}
      />

      {/* Assign Group Modal */}
      <AssignGroupModal
        isOpen={showAssignGroupModal}
        onClose={() => setShowAssignGroupModal(false)}
        onConfirm={handleGroupAssigned}
        initialSelection={user.groups?.[0]?.group_hash ? [user.groups[0].group_hash] : []}
        isLoading={false}
        userName={user.username}
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
      <Dialog open={showChangeTypeModal} onOpenChange={(open) => !isChangingType && !open && handleCancelTypeChange()}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>Change User Type</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="font-medium">User: {user.username}</p>
              <p className="text-sm text-muted-foreground">Current Type: <strong>{user.user_type.toUpperCase()}</strong></p>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-warning/10 border border-warning/20">
              <AlertTriangle className="h-5 w-5 text-warning mt-0.5" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">Changing a user's type will immediately affect their permissions and access level.</p>
            </div>

            <div className="space-y-2">
              <Label>New User Type</Label>
              <Select
                value={selectedUserType}
                onValueChange={(value) => setSelectedUserType(value as UserType)}
                disabled={isChangingType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select user type" />
                </SelectTrigger>
                <SelectContent>
                  {availableUserTypes.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {changeTypeError && (
              <div className="flex items-center gap-2 text-sm text-destructive" role="alert">
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                {changeTypeError}
              </div>
            )}
          </div>
          <DialogFooter>
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default UserActionsMenu; 