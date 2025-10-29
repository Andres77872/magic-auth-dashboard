import React from 'react';
import { Table, Badge } from '@/components/common';
import { GroupIcon } from '@/components/icons';
import { formatDate, formatCount } from '@/utils/component-utils';
import type { UserGroup } from '@/types/group.types';
import { GroupActionsMenu } from './GroupActionsMenu';
import type { TableColumn } from '@/components/common/Table';

interface GroupTableProps {
  groups: UserGroup[];
  loading?: boolean;
  onSort?: (key: keyof UserGroup, direction: 'asc' | 'desc') => void;
  onEdit?: (group: UserGroup) => void;
  onDelete?: (group: UserGroup) => void;
  onView?: (group: UserGroup) => void;
  emptyAction?: React.ReactNode;
}

export const GroupTable: React.FC<GroupTableProps> = ({
  groups,
  loading = false,
  onSort,
  onEdit,
  onDelete,
  onView,
  emptyAction
}) => {
  const columns: TableColumn<UserGroup>[] = [
    {
      key: 'group_name',
      header: 'Group Name',
      sortable: true,
      render: (_value: any, group: UserGroup) => (
        <div className="table-group-name-cell">
          <div className="table-group-name">{group.group_name}</div>
          {group.description && (
            <div className="table-group-description">
              {group.description}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'member_count',
      header: 'Members',
      sortable: true,
      align: 'center',
      width: '150px',
      render: (_value: any, group: UserGroup) => (
        <Badge variant="secondary">
          {formatCount(group.member_count || 0, 'member')}
        </Badge>
      )
    },
    {
      key: 'created_at',
      header: 'Created',
      sortable: true,
      width: '180px',
      render: (_value: any, group: UserGroup) => formatDate(group.created_at)
    },
    {
      key: 'group_hash',
      header: 'Actions',
      width: '80px',
      align: 'center',
      render: (_value: any, group: UserGroup) => (
        <GroupActionsMenu 
          group={group}
          onEdit={onEdit}
          onDelete={onDelete}
          onView={onView}
        />
      )
    }
  ];

  return (
    <Table<UserGroup>
      data={groups}
      columns={columns}
      onSort={onSort}
      isLoading={loading}
      emptyMessage="No groups found"
      emptyIcon={<GroupIcon size="xl" />}
      emptyAction={emptyAction}
      skeletonRows={6}
      className="groups-table"
    />
  );
};
