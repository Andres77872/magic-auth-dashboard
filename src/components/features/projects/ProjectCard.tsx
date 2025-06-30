import React from 'react';
import { Card, Badge, Pagination } from '@/components/common';
import { ProjectActionsMenu } from './ProjectActionsMenu';
import type { ProjectDetails } from '@/types/project.types';
import type { PaginationResponse } from '@/types/api.types';

interface ProjectCardProps {
  projects: ProjectDetails[];
  pagination: PaginationResponse | null;
  onPageChange: (page: number) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  projects,
  pagination,
  onPageChange,
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="project-cards">
      <div className="cards-grid">
        {projects.map((project) => (
          <Card key={project.project_hash} className="project-card">
            <div className="project-card-header">
              <div className="project-card-title">
                <h3>{project.project_name}</h3>
                <ProjectActionsMenu project={project} />
              </div>
              <div className="project-card-badges">
                <Badge variant={project.is_active ? 'success' : 'secondary'}>
                  {project.is_active ? 'Active' : 'Inactive'}
                </Badge>
                                 <Badge variant="info">
                   {project.access_level || 'Standard'}
                 </Badge>
              </div>
            </div>

            <div className="project-card-body">
              {project.project_description && (
                <p className="project-description">
                  {project.project_description}
                </p>
              )}
            </div>

            <div className="project-card-footer">
              <div className="project-stats">
                <div className="stat-item">
                  <span className="stat-label">Members:</span>
                  <span className="stat-value">{project.member_count || 0}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Created:</span>
                  <span className="stat-value">{formatDate(project.created_at)}</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {pagination && pagination.total > 0 && (
        <div className="cards-pagination">
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