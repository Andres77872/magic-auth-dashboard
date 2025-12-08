import React from 'react';
import { DataView } from '@/components/common';
import type { DataViewColumn } from '@/components/common';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import type { UserType } from '@/types/auth.types';

/**
 * Member type for group member tables.
 * Matches API response from GET /admin/user-groups/{hash}/members
 */
export interface GroupMember {
  user_hash: string;
  username: string;
  email: string;
  user_type?: UserType | null;
  is_active?: boolean;
  joined_at?: string | null;
  /** @deprecated Use joined_at instead - kept for backward compatibility */
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
  const getUserTypeBadgeVariant = (userType?: UserType | null): 'destructive' | 'warning' | 'info' | 'secondary' => {
    switch (userType) {
      case 'root':
        return 'destructive';
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
        <Badge variant={getUserTypeBadgeVariant(value as UserType | null)}>
          {(value ? String(value) : 'N/A').toUpperCase()}
        </Badge>
      ),
    },
    {
      key: 'joined_at',
      header: 'Joined',
      sortable: true,
      width: '180px',
      render: (_value, member) => <span>{formatDate(member.joined_at || member.created_at)}</span>,
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
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                disabled={removingMember === member.user_hash}
              >
                <span className="sr-only">Actions for {member.username}</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => onRemove(member)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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