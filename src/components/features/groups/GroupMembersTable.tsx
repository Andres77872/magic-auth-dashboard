import React from 'react';
import { Table, Badge } from '@/components/common';
import type { TableColumn } from '@/components/common/Table';
import type { UserType } from '@/types/auth.types';

/**
 * Basic member type used for group member tables.
 * The backend might omit some optional fields, so all are optional except identifiers.
 */
export interface GroupMember {
  user_hash: string;
  username: string;
  email: string;
  user_type?: UserType | null;
  created_at?: string | null;
}

interface GroupMembersTableProps {
  members: GroupMember[];
  isLoading?: boolean;
  className?: string;
}

export function GroupMembersTable({
  members,
  isLoading = false,
  className = '',
}: GroupMembersTableProps): React.JSX.Element {
  const getUserTypeBadgeVariant = (userType?: UserType | null) => {
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

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const columns: TableColumn<GroupMember>[] = [
    {
      key: 'username',
      header: 'Username',
      sortable: true,
      render: (value, member) => (
        <div className="user-info flex items-center gap-2">
          <div className="user-avatar bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
            {(member.username || '?').charAt(0).toUpperCase()}
          </div>
          <div className="truncate max-w-200">
            <div className="font-medium text-primary truncate">{value as string}</div>
            <div className="text-xs text-tertiary truncate">{member.user_hash}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      sortable: true,
      render: (value) => <span>{value as string}</span>,
    },
    {
      key: 'user_type',
      header: 'User Type',
      sortable: true,
      width: '120px',
      render: (value) => (
        <Badge variant={getUserTypeBadgeVariant(value as UserType | null)} size="small">
          {(value ? String(value) : 'N/A').toUpperCase()}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      header: 'Joined',
      sortable: true,
      width: '180px',
      render: (value) => <span>{formatDate(value as string | null)}</span>,
    },
  ];

  return (
    <Table
      data={members}
      columns={columns}
      isLoading={isLoading}
      emptyMessage="This group has no members"
      className={className}
    />
  );
} 