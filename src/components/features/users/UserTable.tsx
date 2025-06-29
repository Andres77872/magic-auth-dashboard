import React, { useState, useMemo } from 'react';
import { Table, Badge, Button } from '@/components/common';
import { UserActionsMenu } from './UserActionsMenu';
import { usePermissions } from '@/hooks';
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
  const isAllOperableSelected = operableUsers.length > 0 && 
    operableUsers.every(user => selectedUsers.has(user.user_hash));
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

  const handleSelectAll = () => {
    if (isAllOperableSelected) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(operableUsers.map(user => user.user_hash)));
    }
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
      key: 'select',
      header: (
        <div className="bulk-select-header">
          <input
            type="checkbox"
            checked={isAllOperableSelected}
            onChange={handleSelectAll}
            disabled={isLoading || operableUsers.length === 0}
            aria-label="Select all users"
          />
        </div>
      ),
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
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 12l2 2 4-4"/>
                    <circle cx="12" cy="12" r="10"/>
                  </svg>
                  Activate
                </Button>
                
                <Button
                  variant="outline"
                  size="small"
                  onClick={handleBulkDeactivate}
                  disabled={isBulkLoading}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
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
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
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
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3,6 5,6 21,6"/>
                  <path d="M19,6v14a2,2 0,0,1-2,2H7a2,2 0,0,1-2-2V6m3,0V4a2,2 0,0,1,2-2h4a2,2 0,0,1,2,2v2"/>
                </svg>
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