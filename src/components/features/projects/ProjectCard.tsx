import React from 'react';
import { Card, Badge, Pagination, Skeleton } from '@/components/common';
import { ProjectActionsMenu } from './ProjectActionsMenu';
import type { ProjectDetails } from '@/types/project.types';
import type { PaginationResponse } from '@/types/api.types';

interface ProjectCardProps {
  projects: ProjectDetails[];
  pagination: PaginationResponse | null;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  projects,
  pagination,
  onPageChange,
  isLoading = false,
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="project-cards" role="region" aria-label="Loading projects" aria-busy="true">
        <div className="cards-grid">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="project-card" aria-hidden="true">
              <div className="project-card-header">
                <div className="project-card-title">
                  <Skeleton variant="title" width="60%" />
                </div>
                <div className="project-card-badges">
                  <Skeleton variant="button" width="80px" />
                  <Skeleton variant="button" width="80px" />
                </div>
              </div>
              <div className="project-card-body">
                <Skeleton variant="line" count={2} />
              </div>
              <div className="project-card-footer">
                <Skeleton variant="text" width="40%" />
              </div>
            </Card>
          ))}
        </div>
        <span className="sr-only" aria-live="polite">Loading projects...</span>
      </div>
    );
  }

  return (
    <div className="project-cards" role="region" aria-label="Projects grid">
      <div className="cards-grid">
        {projects.map((project) => (
          <article 
            key={project.project_hash} 
            className="project-card"
            aria-labelledby={`project-name-${project.project_hash}`}
          >
            <Card>
            <div className="project-card-header">
              <div className="project-card-title">
                <h3 id={`project-name-${project.project_hash}`}>
                  {project.project_name}
                </h3>
                <ProjectActionsMenu project={project} />
              </div>
              <div className="project-card-badges" role="group" aria-label="Project status">
                <Badge 
                  variant={project.is_active ? 'success' : 'secondary'}
                  aria-label={project.is_active ? 'Status: Active' : 'Status: Inactive'}
                >
                  {project.is_active ? 'Active' : 'Inactive'}
                </Badge>
                <Badge variant="info" aria-label={`Access level: ${project.access_level || 'Standard'}`}>
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

            <footer className="project-card-footer">
              <dl className="project-stats">
                <div className="stat-item">
                  <dt className="stat-label">Members:</dt>
                  <dd className="stat-value" aria-label={`${project.member_count || 0} members`}>
                    {project.member_count || 0}
                  </dd>
                </div>
                <div className="stat-item">
                  <dt className="stat-label">Created:</dt>
                  <dd className="stat-value" aria-label={`Created on ${formatDate(project.created_at)}`}>
                    {formatDate(project.created_at)}
                  </dd>
                </div>
              </dl>
            </footer>
            </Card>
          </article>
        ))}
      </div>

      {pagination && pagination.total > 0 && (
        <nav className="cards-pagination" aria-label="Projects pagination">
          <Pagination
            currentPage={Math.floor(pagination.offset / pagination.limit) + 1}
            totalPages={Math.ceil(pagination.total / pagination.limit)}
            onPageChange={onPageChange}
            totalItems={pagination.total}
            itemsPerPage={pagination.limit}
          />
        </nav>
      )}
    </div>
  );
}; 