import React from 'react';
import { Link } from 'react-router-dom';
import { DataView } from '@/components/common';
import type { DataViewColumn } from '@/components/common';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProjectGroupActionsMenu } from './ProjectGroupActionsMenu';
import { FolderOpen, Plus } from 'lucide-react';
import { formatDate } from '@/utils/component-utils';
import { ROUTES } from '@/utils/routes';
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
  const columns: DataViewColumn<ProjectGroup>[] = [
    {
      key: 'group_name',
      header: 'Group Name',
      sortable: true,
      render: (_value, group) => (
        <div>
          <Link 
            to={`${ROUTES.PROJECT_GROUPS}/${group.group_hash}`}
            className="font-medium text-primary hover:underline"
          >
            {group.group_name}
          </Link>
          {group.description && (
            <div className="text-sm text-muted-foreground truncate max-w-xs">
              {group.description}
            </div>
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
        <Badge variant="info">
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
        <span className="text-sm text-muted-foreground">
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
      onClick={() => window.location.href = ROUTES.PROJECT_GROUPS_CREATE}
    >
      <Plus className="h-4 w-4" />
      Create Project Group
    </Button>
  );

  return (
    <DataView<ProjectGroup>
      data={projectGroups} 
      columns={columns}
      viewMode="table"
      showViewToggle={false}
      isLoading={isLoading}
      onSort={onSort}
      emptyMessage="No project groups found. Create your first project group to organize related projects together."
      emptyIcon={<FolderOpen className="h-10 w-10" />}
      emptyAction={emptyAction}
      className="project-group-table"
      skeletonRows={6}
    />
  );
} 