import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProjects } from '@/hooks/useProjects';
import { AuditLogTable } from '@/components/features/rbac/AuditLogTable';
import { AuditFilters } from '@/components/features/rbac/AuditFilters';
import '@/styles/pages/AuditPage.css';

export interface AuditFilters {
  action_type?: string;
  user_id?: string;
  days?: number;
  limit?: number;
  offset?: number;
}

export const AuditPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { projects, isLoading: projectsLoading } = useProjects();
  const [selectedProjectHash, setSelectedProjectHash] = useState<string | null>(
    searchParams.get('project') || null
  );
  const [filters, setFilters] = useState<AuditFilters>({
    limit: 50,
    offset: 0,
    days: 30
  });

  // Set default project if none selected and projects are available
  useEffect(() => {
    if (!selectedProjectHash && projects.length > 0 && !projectsLoading) {
      const firstProject = projects[0];
      setSelectedProjectHash(firstProject.project_hash);
      setSearchParams({ project: firstProject.project_hash });
    }
  }, [projects, projectsLoading, selectedProjectHash, setSearchParams]);

  const handleProjectChange = (projectHash: string) => {
    setSelectedProjectHash(projectHash);
    setSearchParams({ project: projectHash });
    // Reset filters when changing projects
    setFilters(prev => ({ ...prev, offset: 0 }));
  };

  const handleFiltersChange = (newFilters: Partial<AuditFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, offset: 0 }));
  };

  const handlePageChange = (offset: number) => {
    setFilters(prev => ({ ...prev, offset }));
  };

  const selectedProject = projects.find(p => p.project_hash === selectedProjectHash);

  if (projectsLoading) {
    return (
      <div className="audit-page loading">
        <div className="loading-spinner">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="audit-page">
      <div className="audit-page__header">
        <div className="audit-page__title">
          <h1>RBAC Audit Log</h1>
          <p>Track all permission and role changes with comprehensive filtering</p>
        </div>
        
        {projects.length > 0 && (
          <div className="audit-page__project-selector">
            <label htmlFor="project-select">Project:</label>
            <select
              id="project-select"
              value={selectedProjectHash || ''}
              onChange={(e) => handleProjectChange(e.target.value)}
              className="project-selector"
            >
              {projects.map((project) => (
                <option key={project.project_hash} value={project.project_hash}>
                  {project.project_name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {selectedProjectHash && selectedProject ? (
        <div className="audit-page__content">
          <div className="audit-page__filters">
            <AuditFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
            />
          </div>

          <div className="audit-page__table">
            <AuditLogTable
              projectHash={selectedProjectHash}
              filters={filters}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      ) : (
        <div className="audit-page__empty">
          <div className="empty-state">
            <h3>No Projects Available</h3>
            <p>Create a project first to view audit logs.</p>
          </div>
        </div>
      )}
    </div>
  );
}; 