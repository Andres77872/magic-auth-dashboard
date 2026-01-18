import React, { useState, useMemo } from 'react';
import { DataView, TableSkeleton } from '@/components/common';
import type { DataViewColumn } from '@/components/common';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { UserActionsMenu } from './UserActionsMenu';
import { UserAvatar } from './UserAvatar';
import { BulkActionsBar } from './BulkActionsBar';
import { usePermissions } from '@/hooks';
import { Users, FolderKanban, AlertTriangle } from 'lucide-react';
import { formatDateTime, getUserTypeBadgeVariant, truncateHash } from '@/utils/component-utils';
import type { User } from '@/types/auth.types';

interface UserTableProps {
  users: User[];
  isLoading: boolean;
  onSort?: (key: keyof User, direction: 'asc' | 'desc') => void;
  onBulkDelete?: (userHashes: string[]) => Promise<void>;
  onBulkUpdateStatus?: (userHashes: string[], isActive: boolean) => Promise<void>;
  onBulkAssignGroup?: (userHashes: string[], groupId: string) => Promise<void>;
  onUserUpdated?: () => void;
  onEditUser?: (user: User) => void;
}

export function UserTable({ 
  users, 
  isLoading, 
  onSort,
  onBulkDelete,
  onBulkUpdateStatus,
  onBulkAssignGroup,
  onUserUpdated,
  onEditUser
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

  const columns: DataViewColumn<User>[] = [
    // Checkbox column
    {
      key: 'select' as keyof User,
      header: 'Select',
      sortable: false,
      width: '50px',
      render: (_, user) => (
        <Checkbox
          checked={selectedUsers.has(user.user_hash)}
          onCheckedChange={() => handleSelectUser(user.user_hash)}
          disabled={isLoading || !isUserOperable(user)}
          aria-label={`Select ${user.username}`}
        />
      ),
    },
    {
      key: 'username',
      header: 'Username',
      sortable: true,
      render: (value, user) => (
        <div className="flex items-center gap-3">
          <UserAvatar 
            username={user.username} 
            userType={user.user_type}
            size="sm"
          />
          <div className="flex flex-col">
            <span className="font-medium text-foreground">{value as string}</span>
            <span className="text-xs text-muted-foreground" title={user.user_hash}>
              {truncateHash(user.user_hash)}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-foreground">{value as string}</span>
      ),
    },
    {
      key: 'user_type',
      header: 'User Type',
      sortable: true,
      render: (_, user) => (
        <div className="flex items-center gap-2">
          <Badge 
            variant={getUserTypeBadgeVariant(user.user_type)}
          >
            {(user.user_type).toUpperCase()}
          </Badge>
          {user.user_type_info?.error && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-destructive cursor-help">
                    <AlertTriangle size={16} aria-hidden="true" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[200px] bg-destructive text-destructive-foreground">
                  {user.user_type_info.error}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      ),
    },
    {
      key: 'groups',
      header: 'Groups',
      sortable: false,
      render: (_, user) => (
        <div className="flex flex-wrap gap-1">
          {user.groups && user.groups.length > 0 ? (
            <>
              {user.groups.slice(0, 2).map(group => (
                <Badge key={group.group_hash} variant="secondary" className="gap-1">
                  <Users size={12} aria-hidden="true" />
                  {group.group_name}
                </Badge>
              ))}
              {user.groups.length > 2 && (
                <Badge variant="secondary">
                  +{user.groups.length - 2} more
                </Badge>
              )}
            </>
          ) : (
            <span className="text-sm text-muted-foreground">No groups</span>
          )}
        </div>
      ),
    },
    {
      key: 'projects',
      header: 'Projects',
      sortable: false,
      render: (_, user) => (
        <div className="flex flex-wrap gap-1">
          {user.projects && user.projects.length > 0 ? (
            <>
              {user.projects.slice(0, 2).map(project => (
                <Badge key={project.project_hash} variant="outline" className="gap-1">
                  <FolderKanban size={12} aria-hidden="true" />
                  {project.project_name}
                </Badge>
              ))}
              {user.projects.length > 2 && (
                <Badge variant="secondary">
                  +{user.projects.length - 2} more
                </Badge>
              )}
            </>
          ) : (
            <span className="text-sm text-muted-foreground">No projects</span>
          )}
        </div>
      ),
    },
    {
      key: 'is_active',
      header: 'Status',
      sortable: true,
      render: (value) => (
        <Badge variant={value ? 'success' : 'secondary'}>
          {value ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      header: 'Created At',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-muted-foreground">{formatDateTime(value as string)}</span>
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
          onEditUser={onEditUser}
        />
      ),
      align: 'center',
      width: '80px',
    },
  ];

  const handleSort = (key: keyof User, direction: 'asc' | 'desc') => {
    onSort?.(key, direction);
  };

  // Show skeleton while loading initial data
  if (isLoading && users.length === 0) {
    return <TableSkeleton rows={10} columns={7} />;
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

      <DataView
        columns={columns}
        data={users}
        viewMode="table"
        showViewToggle={false}
        isLoading={isBulkLoading}
        onSort={handleSort}
        emptyMessage="No users found"
        className={isSomeSelected ? 'ring-2 ring-primary/20 rounded-lg' : ''}
      />
    </>
  );
}

export default UserTable; 