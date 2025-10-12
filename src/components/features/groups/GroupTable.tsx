import React from 'react';
import { Table, Badge, Button } from '@/components/common';
import { GroupIcon } from '@/components/icons';
import { ROUTES } from '@/utils/routes';
import { formatDate, formatCount } from '@/utils/component-utils';
import type { UserGroup } from '@/types/group.types';
import { GroupActionsMenu } from './GroupActionsMenu';

interface GroupTableProps {
  groups: UserGroup[];
  loading?: boolean;
  onSort?: (field: string, direction: 'asc' | 'desc') => void;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
}

export const GroupTable: React.FC<GroupTableProps> = ({
  groups,
  loading = false,
  onSort,
  sortField: _sortField,
  sortDirection: _sortDirection
}) => {
  const columns = [
    {
      key: 'group_name' as keyof UserGroup,
      header: 'Group Name',
      sortable: true,
      render: (_value: any, group: UserGroup) => (
        <div className="group-name-cell">
          <strong>{group.group_name}</strong>
          {group.description && (
            <div className="group-description">
              {group.description}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'member_count' as keyof UserGroup,
      header: 'Members',
      sortable: true,
      render: (_value: any, group: UserGroup) => (
        <Badge variant="secondary">
          {formatCount(group.member_count || 0, 'member')}
        </Badge>
      )
    },
    {
      key: 'created_at' as keyof UserGroup,
      header: 'Created',
      sortable: true,
      render: (_value: any, group: UserGroup) => formatDate(group.created_at)
    },
    {
      key: 'group_hash' as keyof UserGroup,
      header: 'Actions',
      render: (_value: any, group: UserGroup) => (
        <GroupActionsMenu group={group} />
      )
    }
  ];

  return (
    <Table
      data={groups}
      columns={columns}
      onSort={onSort}
      isLoading={loading}
      emptyMessage="No groups found"
      emptyIcon={<GroupIcon size="large" />}
      emptyAction={
        <Button
          variant="primary"
          onClick={() => window.location.href = ROUTES.GROUPS_CREATE}
        >
          Create Group
        </Button>
      }
      skeletonRows={6}
    />
  );
}; 