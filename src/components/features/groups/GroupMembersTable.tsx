import React from 'react';
import { DataView, Badge, ActionsMenu } from '@/components/common';
import type { DataViewColumn } from '@/components/common';
import type { ActionMenuItem } from '@/components/common/ActionsMenu';
import type { UserType } from '@/types/auth.types';
import { DeleteIcon } from '@/components/icons';

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
  onRemove?: (member: GroupMember) => void;
  removingMember?: string | null;
}

export function GroupMembersTable({
  members,
  isLoading = false,
  className = '',
  onRemove,
  removingMember,
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

  const columns: DataViewColumn<GroupMember>[] = [
    {
      key: 'username',
      header: 'Username',
      sortable: true,
      render: (value, member) => (
        <div className="user-info flex items-center gap-2">
                              <div className="group-member-avatar bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
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
        <Badge variant={getUserTypeBadgeVariant(value as UserType | null)} size="sm">
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

  // Add actions column if onRemove is provided
  if (onRemove) {
    columns.push({
      key: 'user_hash',
      header: 'Actions',
      sortable: false,
      width: '80px',
      align: 'center',
      render: (_, member) => {
        const menuItems: ActionMenuItem[] = [
          {
            key: 'remove',
            label: 'Remove',
            icon: <DeleteIcon size="sm" />,
            onClick: () => onRemove(member),
            disabled: removingMember === member.user_hash,
            destructive: true,
          },
        ];

        return (
          <ActionsMenu
            items={menuItems}
            ariaLabel={`Actions for ${member.username}`}
          />
        );
      },
    });
  }

  return (
    <DataView
      data={members}
      columns={columns}
      viewMode="table"
      showViewToggle={false}
      isLoading={isLoading}
      emptyMessage="This group has no members"
      className={className}
    />
  );
} 