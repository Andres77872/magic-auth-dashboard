import React from 'react';
import { DataView, Pagination } from '@/components/common';
import type { DataViewColumn } from '@/components/common';
import { Badge } from '@/components/ui/badge';
import { ProjectActionsMenu } from './ProjectActionsMenu';
import { FolderKanban } from 'lucide-react';
import { formatDate, getStatusBadgeVariant } from '@/utils/component-utils';
import type { ProjectDetails } from '@/types/project.types';
import type { PaginationResponse } from '@/types/api.types';

interface ProjectTableProps {
  projects: ProjectDetails[];
  pagination: PaginationResponse | null;
  onPageChange: (page: number) => void;
  onSort: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  sortBy: string | null;
  sortOrder: 'asc' | 'desc';
  isLoading?: boolean;
  onEdit?: (project: ProjectDetails) => void;
  onDelete?: () => void;
  onArchive?: () => void;
}

export const ProjectTable: React.FC<ProjectTableProps> = ({
  projects,
  pagination,
  onPageChange,
  onSort,
  sortBy: _sortBy,
  sortOrder: _sortOrder,
  isLoading = false,
  onEdit,
  onDelete,
  onArchive,
}) => {

  const columns: DataViewColumn<ProjectDetails>[] = [
    {
      key: 'project_name' as keyof ProjectDetails,
      header: 'Project Name',
      sortable: true,
      render: (_value: any, project: ProjectDetails) => (
        <div>
          <div className="font-medium">{project.project_name}</div>
          {project.project_description && (
            <div className="text-sm text-muted-foreground truncate max-w-xs">{project.project_description}</div>
          )}
        </div>
      ),
    },
    {
      key: 'member_count' as keyof ProjectDetails,
      header: 'Members',
      sortable: true,
      render: (_value: any, project: ProjectDetails) => (
        <span className="font-medium">
          {project.member_count || 0}
        </span>
      ),
    },
    {
      key: 'is_active' as keyof ProjectDetails,
      header: 'Status',
      sortable: true,
      render: (_value: any, project: ProjectDetails) => (
        <Badge variant={getStatusBadgeVariant(project.is_active ?? false)}>
          {project.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'created_at' as keyof ProjectDetails,
      header: 'Created',
      sortable: true,
      render: (_value: any, project: ProjectDetails) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(project.created_at)}
        </span>
      ),
    },
    {
      key: 'access_level' as keyof ProjectDetails,
      header: 'Access Level',
      sortable: false,
      render: (_value: any, project: ProjectDetails) => (
        <Badge variant="info">
          {project.access_level || 'Standard'}
        </Badge>
      ),
    },
    {
      key: 'project_hash' as keyof ProjectDetails,
      header: 'Actions',
      sortable: false,
      width: '80px',
      align: 'center' as const,
      render: (_value: any, project: ProjectDetails) => (
        <ProjectActionsMenu
          project={project}
          onEdit={onEdit}
          onDelete={onDelete}
          onArchive={onArchive}
        />
      ),
    },
  ];

  return (
    <>
      <DataView
        data={projects}
        columns={columns}
        viewMode="table"
        showViewToggle={false}
        onSort={onSort}
        isLoading={isLoading}
        emptyMessage="No projects found"
        emptyIcon={<FolderKanban className="h-10 w-10" />}
        skeletonRows={8}
        className="project-table"
      />
      
      {pagination && pagination.total > 0 && (
        <div className="mt-4">
          <Pagination
            currentPage={Math.floor(pagination.offset / pagination.limit) + 1}
            totalPages={Math.ceil(pagination.total / pagination.limit)}
            onPageChange={onPageChange}
            totalItems={pagination.total}
            itemsPerPage={pagination.limit}
          />
        </div>
      )}
    </>
  );
}; 