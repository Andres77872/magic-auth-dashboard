import React, { useState } from 'react';
import { Button } from '@/components/common';
import { usePermissions } from '@/hooks';
import type { ProjectDetails } from '@/types/project.types';

interface ProjectActionsMenuProps {
  project: ProjectDetails;
}

export const ProjectActionsMenu: React.FC<ProjectActionsMenuProps> = ({
  project,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { hasPermission } = usePermissions();

  const handleViewDetails = () => {
    // TODO: Navigate to project details page
    console.log('View project details:', project.project_hash);
    setIsMenuOpen(false);
  };

  const handleEditProject = () => {
    // TODO: Navigate to project edit page
    console.log('Edit project:', project.project_hash);
    setIsMenuOpen(false);
  };

  const handleArchiveProject = () => {
    // TODO: Archive project functionality
    console.log('Archive project:', project.project_hash);
    setIsMenuOpen(false);
  };

  const canEdit = hasPermission('projects:edit');
  const canArchive = hasPermission('projects:archive');

  return (
    <div className="project-actions-menu">
      <Button
        variant="ghost"
        size="small"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        ⋯
      </Button>
      
      {isMenuOpen && (
        <div className="actions-dropdown">
          <div className="dropdown-overlay" onClick={() => setIsMenuOpen(false)} />
          <div className="dropdown-menu">
            <button
              type="button"
              className="dropdown-item"
              onClick={handleViewDetails}
            >
              View Details
            </button>
            
            {canEdit && (
              <button
                type="button"
                className="dropdown-item"
                onClick={handleEditProject}
              >
                Edit Project
              </button>
            )}
            
            {canArchive && (
              <button
                type="button"
                className="dropdown-item"
                onClick={handleArchiveProject}
              >
                Archive
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}; 