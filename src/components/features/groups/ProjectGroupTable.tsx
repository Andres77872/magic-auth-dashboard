import React from 'react';
import { Link } from 'react-router-dom';
import { Table, Badge, Button } from '@/components/common';
import { ProjectGroupActionsMenu } from './ProjectGroupActionsMenu';
import { GroupIcon, PlusIcon } from '@/components/icons';
import { formatDate } from '@/utils/component-utils';
import type { TableColumn } from '@/components/common/Table';
import type { ProjectGroup } from '@/services/project-group.service';

interface ProjectGroupTableProps {
  projectGroups: ProjectGroup[];
  isLoading?: boolean;
  onEdit?: (group: ProjectGroup) => void;
  onDelete?: (group: ProjectGroup) => void;
  onView?: (group: ProjectGroup) => void;
  onSort?: (key: keyof ProjectGroup, direction: 'asc' | 'desc') => void;
}

export function ProjectGroupTable({
  projectGroups,
  isLoading = false,
  onEdit,
  onDelete,
  onView,
  onSort
}: ProjectGroupTableProps): React.JSX.Element {
  const columns: TableColumn<ProjectGroup>[] = [
    {
      key: 'group_name',
      header: 'Group Name',
      sortable: true,
      render: (_value, group) => (
        <div className="table-group-name-cell">
          <Link 
            to={`/dashboard/groups/project-groups/${group.group_hash}`}
            className="table-group-name"
            style={{ 
              color: 'var(--color-primary-500)',
              textDecoration: 'none',
              transition: 'color var(--transition-fast)'
            }}
            onMouseOver={(e) => e.currentTarget.style.color = 'var(--color-primary-600)'}
            onMouseOut={(e) => e.currentTarget.style.color = 'var(--color-primary-500)'}
          >
            {group.group_name}
          </Link>
          {group.description && (
            <div className="table-group-description">
              {group.description}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'permissions',
      header: 'Permissions',
      sortable: false,
      render: (_value, group) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-1)' }}>
          {group.permissions.slice(0, 3).map((permission, index) => (
            <Badge key={index} variant="secondary" size="sm">
              {permission}
            </Badge>
          ))}
          {group.permissions.length > 3 && (
            <Badge variant="secondary" size="sm">
              +{group.permissions.length - 3} more
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'project_count',
      header: 'Projects',
      sortable: true,
      align: 'center',
      width: '120px',
      render: (_value, group) => (
        <Badge variant="info" size="sm">
          {group.project_count} {group.project_count !== 1 ? 'projects' : 'project'}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      header: 'Created',
      sortable: true,
      width: '140px',
      render: (_value, group) => (
        <span className="user-date">
          {formatDate(group.created_at)}
        </span>
      ),
    },
    {
      key: 'group_hash',
      header: 'Actions',
      sortable: false,
      width: '80px',
      align: 'center',
      render: (_value, group) => (
        <ProjectGroupActionsMenu
          group={group}
          onEdit={onEdit}
          onDelete={onDelete}
          onView={onView}
        />
      ),
    },
  ];

  const emptyAction = (
    <Button 
      variant="primary" 
      size="md"
      onClick={() => window.location.href = '/dashboard/groups/project-groups/create'}
    >
      <PlusIcon size="sm" />
      Create Project Group
    </Button>
  );

  return (
    <Table<ProjectGroup>
      data={projectGroups} 
      columns={columns}
      isLoading={isLoading}
      onSort={onSort}
      emptyMessage="No project groups found. Create your first project group to organize permissions across projects."
      emptyIcon={<GroupIcon size="xl" />}
      emptyAction={emptyAction}
      className="project-group-table"
      skeletonRows={6}
    />
  );
} 