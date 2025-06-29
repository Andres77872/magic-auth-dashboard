import React from 'react';
import { Table, Badge } from '@/components/common';
import { UserActionsMenu } from './UserActionsMenu';
import type { TableColumn } from '@/components/common';
import type { User, UserType } from '@/types/auth.types';

interface UserTableProps {
  users: User[];
  isLoading: boolean;
  onSort?: (key: keyof User, direction: 'asc' | 'desc') => void;
}

export function UserTable({ 
  users, 
  isLoading, 
  onSort
}: UserTableProps): React.JSX.Element {
  
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

  const columns: TableColumn<User>[] = [
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
      render: (_, user) => <UserActionsMenu user={user} />,
      align: 'center',
      width: '120px',
    },
  ];

  const handleSort = (key: keyof User, direction: 'asc' | 'desc') => {
    onSort?.(key, direction);
  };

  return (
    <div className="user-table-container">
      <Table
        columns={columns}
        data={users}
        isLoading={isLoading}
        onSort={handleSort}
        emptyMessage="No users found"
        className="user-table"
      />
    </div>
  );
}

export default UserTable; 