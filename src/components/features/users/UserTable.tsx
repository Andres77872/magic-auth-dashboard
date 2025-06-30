import React, { useState, useMemo } from 'react';
import { Table, Badge, Button } from '@/components/common';
import { UserActionsMenu } from './UserActionsMenu';
import { usePermissions } from '@/hooks';
import { CheckIcon, ErrorIcon, GroupIcon, DeleteIcon } from '@/components/icons';
import type { TableColumn } from '@/components/common';
import type { User, UserType } from '@/types/auth.types';

interface UserTableProps {
  users: User[];
  isLoading: boolean;
  onSort?: (key: keyof User, direction: 'asc' | 'desc') => void;
  onBulkDelete?: (userHashes: string[]) => Promise<void>;
  onBulkUpdateStatus?: (userHashes: string[], isActive: boolean) => Promise<void>;
  onBulkAssignGroup?: (userHashes: string[], groupId: string) => Promise<void>;
  onUserUpdated?: () => void;
}

export function UserTable({ 
  users, 
  isLoading, 
  onSort,
  onBulkDelete,
  onBulkUpdateStatus,
  onBulkAssignGroup,
  onUserUpdated
}: UserTableProps): React.JSX.Element {
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const { canCreateUser, canCreateAdmin } = usePermissions();

  // Determine which users can be bulk operated on
  const operableUsers = useMemo(() => {
    return users.filter(user => {
      // ROOT users can only be operated on by other ROOT users
      if (user.user_type === 'root' && !canCreateAdmin) {
        return false;
      }
      return canCreateUser;
    });
  }, [users, canCreateUser, canCreateAdmin]);

  const selectedUserHashes = Array.from(selectedUsers);
  const isSomeSelected = selectedUsers.size > 0;

  const getUserTypeBadgeVariant = (userType: UserType) => {
    switch (userType) {
      case 'root':
        return 'error';
      case 'admin':
        return 'warning';
      case 'consumer':
        return 'info';
      default:
        return 'secondary';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };



  const handleSelectUser = (userHash: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userHash)) {
      newSelected.delete(userHash);
    } else {
      newSelected.add(userHash);
    }
    setSelectedUsers(newSelected);
  };

  const handleBulkDelete = async () => {
    if (!onBulkDelete || selectedUserHashes.length === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedUserHashes.length} selected users? This action cannot be undone.`)) {
      setIsBulkLoading(true);
      try {
        await onBulkDelete(selectedUserHashes);
        setSelectedUsers(new Set());
      } catch (error) {
        console.error('Bulk delete failed:', error);
      } finally {
        setIsBulkLoading(false);
      }
    }
  };

  const handleBulkActivate = async () => {
    if (!onBulkUpdateStatus || selectedUserHashes.length === 0) return;
    
    setIsBulkLoading(true);
    try {
      await onBulkUpdateStatus(selectedUserHashes, true);
      setSelectedUsers(new Set());
    } catch (error) {
      console.error('Bulk activate failed:', error);
    } finally {
      setIsBulkLoading(false);
    }
  };

  const handleBulkDeactivate = async () => {
    if (!onBulkUpdateStatus || selectedUserHashes.length === 0) return;
    
    setIsBulkLoading(true);
    try {
      await onBulkUpdateStatus(selectedUserHashes, false);
      setSelectedUsers(new Set());
    } catch (error) {
      console.error('Bulk deactivate failed:', error);
    } finally {
      setIsBulkLoading(false);
    }
  };

  const handleBulkAssignGroup = async () => {
    if (!onBulkAssignGroup || selectedUserHashes.length === 0) return;
    
    // TODO: Show group selection modal
    const groupId = prompt('Enter group ID:');
    if (groupId) {
      setIsBulkLoading(true);
      try {
        await onBulkAssignGroup(selectedUserHashes, groupId);
        setSelectedUsers(new Set());
      } catch (error) {
        console.error('Bulk assign group failed:', error);
      } finally {
        setIsBulkLoading(false);
      }
    }
  };

  const isUserOperable = (user: User) => {
    return operableUsers.some(opUser => opUser.user_hash === user.user_hash);
  };

  const columns: TableColumn<User>[] = [
    // Checkbox column
    {
      key: 'user_hash' as keyof User,
      header: 'Select',
      sortable: false,
      width: '50px',
      render: (_, user) => (
        <div className="bulk-select-cell">
          <input
            type="checkbox"
            checked={selectedUsers.has(user.user_hash)}
            onChange={() => handleSelectUser(user.user_hash)}
            disabled={isLoading || !isUserOperable(user)}
            aria-label={`Select ${user.username}`}
          />
        </div>
      ),
    },
    {
      key: 'username',
      header: 'Username',
      sortable: true,
      render: (value, user) => (
        <div className="user-info">
          <div className="user-avatar">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div className="user-details">
            <div className="user-name">{value as string}</div>
            <div className="user-hash">{user.user_hash}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      sortable: true,
      render: (value) => (
        <span className="user-email">{value as string}</span>
      ),
    },
    {
      key: 'user_type',
      header: 'User Type',
      sortable: true,
      render: (value) => (
        <Badge 
          variant={getUserTypeBadgeVariant(value as UserType)}
          size="small"
        >
          {(value as string).toUpperCase()}
        </Badge>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      sortable: true,
      render: (value) => (
        <Badge variant={value ? 'success' : 'secondary'} size="small" dot>
          {value ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      header: 'Created At',
      sortable: true,
      render: (value) => (
        <span className="user-date">{formatDate(value as string)}</span>
      ),
    },
    {
      key: 'user_hash',
      header: 'Actions',
      sortable: false,
      render: (_, user) => (
        <UserActionsMenu 
          user={user} 
          onUserUpdated={onUserUpdated}
        />
      ),
      align: 'center',
      width: '120px',
    },
  ];

  const handleSort = (key: keyof User, direction: 'asc' | 'desc') => {
    onSort?.(key, direction);
  };

  return (
    <div className="user-table-container">
      {/* Bulk Actions Toolbar */}
      {isSomeSelected && (
        <div className="bulk-actions-toolbar">
          <div className="bulk-actions-info">
            <span className="selected-count">
              {selectedUsers.size} user{selectedUsers.size !== 1 ? 's' : ''} selected
            </span>
          </div>
          
          <div className="bulk-actions-buttons">
            {onBulkUpdateStatus && (
              <>
                <Button
                  variant="outline"
                  size="small"
                  onClick={handleBulkActivate}
                  disabled={isBulkLoading}
                >
                  <CheckIcon size="small" />
                  Activate
                </Button>
                
                <Button
                  variant="outline"
                  size="small"
                  onClick={handleBulkDeactivate}
                  disabled={isBulkLoading}
                >
                  <ErrorIcon size="small" />
                  Deactivate
                </Button>
              </>
            )}
            
            {onBulkAssignGroup && (
              <Button
                variant="outline"
                size="small"
                onClick={handleBulkAssignGroup}
                disabled={isBulkLoading}
              >
                <GroupIcon size="small" />
                Assign Group
              </Button>
            )}
            
            {onBulkDelete && (
              <Button
                variant="danger"
                size="small"
                onClick={handleBulkDelete}
                disabled={isBulkLoading}
              >
                <DeleteIcon size="small" />
                Delete
              </Button>
            )}
            
            <Button
              variant="outline"
              size="small"
              onClick={() => setSelectedUsers(new Set())}
              disabled={isBulkLoading}
            >
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      <Table
        columns={columns}
        data={users}
        isLoading={isLoading || isBulkLoading}
        onSort={handleSort}
        emptyMessage="No users found"
        className={`user-table ${isSomeSelected ? 'has-selection' : ''}`}
      />
    </div>
  );
}

export default UserTable; 