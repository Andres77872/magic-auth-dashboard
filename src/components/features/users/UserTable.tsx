import React, { useState, useMemo } from 'react';
import { Table, Badge } from '@/components/common';
import { UserActionsMenu } from './UserActionsMenu';
import { UserAvatar } from './UserAvatar';
import { BulkActionsBar } from './BulkActionsBar';
import { UserTableSkeleton } from './UserTableSkeleton';
import { usePermissions } from '@/hooks';
import { GroupIcon, ProjectIcon, WarningIcon } from '@/components/icons';
import { formatDateTime, getUserTypeBadgeVariant, truncateHash } from '@/utils/component-utils';
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
      key: 'select' as keyof User,
      header: 'Select',
      sortable: false,
      width: '50px',
      render: (_, user) => (
        <input
          type="checkbox"
          checked={selectedUsers.has(user.user_hash)}
          onChange={() => handleSelectUser(user.user_hash)}
          disabled={isLoading || !isUserOperable(user)}
          aria-label={`Select ${user.username}`}
          className="bulk-select-checkbox"
        />
      ),
    },
    {
      key: 'username',
      header: 'Username',
      sortable: true,
      render: (value, user) => (
        <div className="user-info">
          <UserAvatar 
            username={user.username} 
            userType={user.user_type}
            size="small"
          />
          <div className="user-details">
            <div className="user-name">{value as string}</div>
            <div className="user-hash" title={user.user_hash}>
              {truncateHash(user.user_hash)}
            </div>
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
      render: (value, user) => (
        <>
          <Badge 
            variant={getUserTypeBadgeVariant(value as UserType)}
            size="small"
          >
            {(value as string).toUpperCase()}
          </Badge>
          {user.user_type_info?.error && (
            <span className="user-type-error" title={user.user_type_info.error}>
              <WarningIcon size="small" />
            </span>
          )}
        </>
      ),
    },
    {
      key: 'groups',
      header: 'Groups',
      sortable: false,
      render: (_, user) => (
        user.groups && user.groups.length > 0 ? (
          <>
            {user.groups.slice(0, 2).map(group => (
              <Badge key={group.group_hash} variant="secondary" size="small">
                <GroupIcon size="small" />
                {group.group_name}
              </Badge>
            ))}
            {user.groups.length > 2 && (
              <Badge variant="secondary" size="small">
                +{user.groups.length - 2} more
              </Badge>
            )}
          </>
        ) : (
          <span className="no-groups">No groups</span>
        )
      ),
    },
    {
      key: 'projects',
      header: 'Projects',
      sortable: false,
      render: (_, user) => (
        user.projects && user.projects.length > 0 ? (
          <>
            {user.projects.slice(0, 2).map(project => (
              <Badge key={project.project_hash} variant="info" size="small">
                <ProjectIcon size="small" />
                {project.project_name}
              </Badge>
            ))}
            {user.projects.length > 2 && (
              <Badge variant="secondary" size="small">
                +{user.projects.length - 2} more
              </Badge>
            )}
          </>
        ) : (
          <span className="no-projects">No projects</span>
        )
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
        <span className="user-date">{formatDateTime(value as string)}</span>
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

  // Show skeleton while loading initial data
  if (isLoading && users.length === 0) {
    return <UserTableSkeleton rows={10} />;
  }

  return (
    <>
      {isSomeSelected && (
        <BulkActionsBar
          selectedCount={selectedUsers.size}
          onActivate={onBulkUpdateStatus ? handleBulkActivate : undefined}
          onDeactivate={onBulkUpdateStatus ? handleBulkDeactivate : undefined}
          onAssignGroup={onBulkAssignGroup ? handleBulkAssignGroup : undefined}
          onDelete={onBulkDelete ? handleBulkDelete : undefined}
          onClearSelection={() => setSelectedUsers(new Set())}
          isLoading={isBulkLoading}
        />
      )}

      <Table
        columns={columns}
        data={users}
        isLoading={isBulkLoading}
        onSort={handleSort}
        emptyMessage="No users found"
        className={`user-table ${isSomeSelected ? 'has-selection' : ''}`}
      />
    </>
  );
}

export default UserTable; 