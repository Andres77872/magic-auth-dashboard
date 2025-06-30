import React from 'react';
import { Table, Badge } from '@/components/common';
import type { UserGroup } from '@/types/group.types';
import { GroupActionsMenu } from './GroupActionsMenu';

interface GroupTableProps {
  groups: UserGroup[];
  loading?: boolean;
  onSort?: (field: string, direction: 'asc' | 'desc') => void;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

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
            <div className="group-description" style={{ 
              fontSize: '0.875rem', 
              color: 'var(--color-text-secondary)',
              marginTop: '4px'
            }}>
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
          {group.member_count || 0} member{(group.member_count || 0) !== 1 ? 's' : ''}
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

  if (loading) {
    return <div className="table-loading">Loading groups...</div>;
  }

  return (
    <Table
      data={groups}
      columns={columns}
      onSort={onSort}
      isLoading={loading}
      emptyMessage="No groups found"
    />
  );
}; 