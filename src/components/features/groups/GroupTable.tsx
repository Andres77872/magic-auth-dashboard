import React from 'react';
import { DataView, DataViewCard } from '@/components/common';
import type { DataViewColumn } from '@/components/common';
import { Badge } from '@/components/ui/badge';
import { Users, Calendar } from 'lucide-react';
import { formatDate, formatCount } from '@/utils/component-utils';
import type { UserGroup } from '@/types/group.types';
import { GroupActionsMenu } from './GroupActionsMenu';

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
  const columns: DataViewColumn<UserGroup>[] = [
    {
      key: 'group_name',
      header: 'Group Name',
      sortable: true,
      render: (_value: unknown, group: UserGroup) => (
        <div>
          <div className="font-medium">{group.group_name}</div>
          {group.description && (
            <div className="text-sm text-muted-foreground truncate max-w-xs">
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
      hideOnMobile: true,
      render: (_value: unknown, group: UserGroup) => (
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
      hideOnMobile: true,
      render: (_value: unknown, group: UserGroup) => formatDate(group.created_at)
    },
    {
      key: 'group_hash',
      header: 'Actions',
      width: '80px',
      align: 'center',
      render: (_value: unknown, group: UserGroup) => (
        <GroupActionsMenu 
          group={group}
          onEdit={onEdit}
          onDelete={onDelete}
          onView={onView}
        />
      )
    }
  ];

  const renderGroupCard = (group: UserGroup) => (
    <DataViewCard
      title={group.group_name}
      subtitle={group.description}
      icon={<Users className="h-5 w-5" />}
      stats={[
        {
          label: 'Members',
          value: group.member_count || 0,
          icon: <Users className="h-3.5 w-3.5" />
        },
        {
          label: 'Created',
          value: formatDate(group.created_at),
          icon: <Calendar className="h-3.5 w-3.5" />
        }
      ]}
      actions={
        <GroupActionsMenu 
          group={group}
          onEdit={onEdit}
          onDelete={onDelete}
          onView={onView}
        />
      }
      onClick={onView ? () => onView(group) : undefined}
    />
  );

  return (
    <DataView<UserGroup>
      data={groups}
      columns={columns}
      keyExtractor={(group) => group.group_hash}
      renderCard={renderGroupCard}
      responsiveCardView
      responsiveBreakpoint="md"
      onSort={onSort}
      isLoading={loading}
      emptyMessage="No groups found"
      emptyIcon={<Users className="h-10 w-10" />}
      emptyAction={emptyAction}
      skeletonRows={6}
    />
  );
};
