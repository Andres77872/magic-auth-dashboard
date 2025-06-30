import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useProjects } from '@/hooks/useProjects';
import { RBACDashboard } from '@/components/features/rbac/RBACDashboard';
import { ProjectPermissionsSummary } from '@/components/features/rbac/ProjectPermissionsSummary';
import { QuickActions } from '@/components/features/rbac/QuickActions';
import './PermissionsOverview.css';

export const PermissionsOverviewPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { projects, isLoading: projectsLoading } = useProjects();
  const [selectedProjectHash, setSelectedProjectHash] = useState<string | null>(
    searchParams.get('project') || null
  );

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
  };

  const selectedProject = projects.find(p => p.project_hash === selectedProjectHash);

  if (projectsLoading) {
    return (
      <div className="permissions-overview loading">
        <div className="loading-spinner">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="permissions-overview">
      <div className="permissions-overview__header">
        <div className="permissions-overview__title">
          <h1>Permission Management</h1>
          <p>Manage roles, permissions, and access control policies</p>
        </div>
        
        {projects.length > 0 && (
          <div className="permissions-overview__project-selector">
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
        <div className="permissions-overview__content">
          <div className="permissions-overview__grid">
            <div className="permissions-overview__dashboard">
              <RBACDashboard projectHash={selectedProjectHash} />
            </div>
            
            <div className="permissions-overview__summary">
              <ProjectPermissionsSummary 
                projectHash={selectedProjectHash}
                projectName={selectedProject.project_name}
              />
            </div>
            
            <div className="permissions-overview__actions">
              <QuickActions projectHash={selectedProjectHash} />
            </div>
          </div>
        </div>
      ) : (
        <div className="permissions-overview__empty">
          <div className="empty-state">
            <h3>No Projects Available</h3>
            <p>Create a project first to manage permissions and roles.</p>
          </div>
        </div>
      )}
    </div>
  );
}; 