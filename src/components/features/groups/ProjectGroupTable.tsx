import React from 'react';
import { Link } from 'react-router-dom';
import { Table, Badge, Button } from '@/components/common';
import { ProjectGroupActionsMenu } from './ProjectGroupActionsMenu';
import type { ProjectGroup } from '@/services/project-group.service';

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

interface ProjectGroupTableProps {
  projectGroups: ProjectGroup[];
  isLoading?: boolean;
  onEdit?: (group: ProjectGroup) => void;
  onDelete?: (group: ProjectGroup) => void;
  onView?: (group: ProjectGroup) => void;
}

export function ProjectGroupTable({
  projectGroups,
  isLoading = false,
  onEdit,
  onDelete,
  onView
}: ProjectGroupTableProps): React.JSX.Element {
  const columns = [
    {
      key: 'group_name' as keyof ProjectGroup,
      header: 'Group Name',
      sortable: true,
      render: (_value: any, group: ProjectGroup) => (
        <div className="flex flex-col">
          <Link 
            to={`/dashboard/groups/project-groups/${group.group_hash}`}
            className="font-medium text-primary hover:text-primary-dark"
          >
            {group.group_name}
          </Link>
          {group.description && (
            <span className="text-sm text-muted mt-1">
              {group.description}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'permissions' as keyof ProjectGroup,
      header: 'Permissions',
      render: (_value: any, group: ProjectGroup) => (
        <div className="flex flex-wrap gap-1">
          {group.permissions.slice(0, 3).map((permission, index) => (
            <Badge key={index} variant="secondary" size="small">
              {permission}
            </Badge>
          ))}
          {group.permissions.length > 3 && (
            <Badge variant="secondary" size="small">
              +{group.permissions.length - 3} more
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'project_count' as keyof ProjectGroup,
      header: 'Projects',
      sortable: true,
      render: (_value: any, group: ProjectGroup) => (
        <Badge variant="info" size="small">
          {group.project_count} project{group.project_count !== 1 ? 's' : ''}
        </Badge>
      ),
    },
    {
      key: 'created_at' as keyof ProjectGroup,
      header: 'Created',
      sortable: true,
      render: (_value: any, group: ProjectGroup) => (
        <span className="text-sm text-muted">
          {formatDate(group.created_at)}
        </span>
      ),
    },
    {
      key: 'group_hash' as keyof ProjectGroup,
      header: 'Actions',
      width: '100px',
      render: (_value: any, group: ProjectGroup) => (
        <ProjectGroupActionsMenu
          group={group}
          onEdit={onEdit}
          onDelete={onDelete}
          onView={onView}
        />
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2 text-muted">Loading project groups...</span>
      </div>
    );
  }

  if (projectGroups.length === 0) {
    return (
      <div className="text-center py-8">
        <h3 className="text-lg font-medium text-muted">No project groups found</h3>
        <p className="text-muted mt-2">
          Create your first project group to organize permissions across projects.
        </p>
        <Button className="mt-4" onClick={() => window.location.href = '/dashboard/groups/project-groups/create'}>
          Create Project Group
        </Button>
      </div>
    );
  }

  return (
    <Table 
      data={projectGroups} 
      columns={columns}
      className="project-group-table"
    />
  );
} 