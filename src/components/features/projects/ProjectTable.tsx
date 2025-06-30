import React from 'react';
import { Table, Pagination, Badge } from '@/components/common';
import { ProjectActionsMenu } from './ProjectActionsMenu';
import type { ProjectDetails } from '@/types/project.types';
import type { PaginationResponse } from '@/types/api.types';

interface ProjectTableProps {
  projects: ProjectDetails[];
  pagination: PaginationResponse | null;
  onPageChange: (page: number) => void;
  onSort: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  sortBy: string | null;
  sortOrder: 'asc' | 'desc';
}

export const ProjectTable: React.FC<ProjectTableProps> = ({
  projects,
  pagination,
  onPageChange,
  onSort,
  sortBy: _sortBy,
  sortOrder: _sortOrder,
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const columns = [
    {
      key: 'project_name' as keyof ProjectDetails,
      header: 'Project Name',
      sortable: true,
      render: (_value: any, project: ProjectDetails) => (
        <div className="project-name-cell">
          <div className="project-name">{project.project_name}</div>
          {project.project_description && (
            <div className="project-description">{project.project_description}</div>
          )}
        </div>
      ),
    },
    {
      key: 'member_count' as keyof ProjectDetails,
      header: 'Members',
      sortable: true,
      render: (_value: any, project: ProjectDetails) => (
        <span className="member-count">
          {project.member_count || 0}
        </span>
      ),
    },
    {
      key: 'is_active' as keyof ProjectDetails,
      header: 'Status',
      sortable: true,
      render: (_value: any, project: ProjectDetails) => (
        <Badge variant={project.is_active ? 'success' : 'secondary'}>
          {project.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'created_at' as keyof ProjectDetails,
      header: 'Created',
      sortable: true,
      render: (_value: any, project: ProjectDetails) => (
        <span className="created-date">
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
      render: (_value: any, project: ProjectDetails) => (
        <ProjectActionsMenu project={project} />
      ),
    },
  ];

  return (
    <div className="project-table">
      <Table
        data={projects}
        columns={columns}
        onSort={onSort}
        emptyMessage="No projects found"
      />
      
      {pagination && pagination.total > 0 && (
        <div className="table-pagination">
                     <Pagination
             currentPage={Math.floor(pagination.offset / pagination.limit) + 1}
             totalPages={Math.ceil(pagination.total / pagination.limit)}
             onPageChange={onPageChange}
             totalItems={pagination.total}
             itemsPerPage={pagination.limit}
           />
        </div>
      )}
    </div>
  );
}; 