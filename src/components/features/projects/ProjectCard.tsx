import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination } from '@/components/common';
import { ProjectActionsMenu } from './ProjectActionsMenu';
import { Users, Calendar } from 'lucide-react';
import type { ProjectDetails } from '@/types/project.types';
import type { PaginationResponse } from '@/types/api.types';
import { formatDate } from '@/utils';

interface ProjectCardProps {
  projects: ProjectDetails[];
  pagination: PaginationResponse | null;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

/**
 * ProjectCard component for displaying project grid
 * Uses shared formatters and follows Design System guidelines
 */
export const ProjectCard: React.FC<ProjectCardProps> = ({
  projects,
  pagination,
  onPageChange,
  isLoading = false,
}) => {

  if (isLoading) {
    return (
      <div role="region" aria-label="Loading projects" aria-busy="true">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} aria-hidden="true">
              <CardContent className="pt-4 space-y-4">
                <div className="flex items-start justify-between">
                  <Skeleton className="h-5 w-3/5" />
                  <Skeleton className="h-8 w-8" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
                <div className="flex gap-4 pt-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <span className="sr-only" aria-live="polite">Loading projects...</span>
      </div>
    );
  }

  return (
    <div role="region" aria-label="Projects grid">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <Card 
            key={project.project_hash}
            role="article"
            aria-labelledby={`project-name-${project.project_hash}`}
          >
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-start justify-between">
                <h3 
                  id={`project-name-${project.project_hash}`}
                  className="font-semibold truncate flex-1"
                >
                  {project.project_name}
                </h3>
                <ProjectActionsMenu project={project} />
              </div>
              
              <div className="flex gap-2" role="group" aria-label="Project status">
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

              {project.project_description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {project.project_description}
                </p>
              )}

              <div className="flex gap-4 pt-2 text-sm text-muted-foreground border-t">
                <div className="flex items-center gap-1" aria-label={`${project.member_count || 0} members`}>
                  <Users className="h-4 w-4" />
                  <span>{project.member_count || 0} members</span>
                </div>
                <div className="flex items-center gap-1" aria-label={`Created on ${formatDate(project.created_at)}`}>
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(project.created_at)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {pagination && pagination.total > 0 && (
        <nav className="mt-6" aria-label="Projects pagination">
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