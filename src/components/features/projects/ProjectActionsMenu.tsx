import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/common';
import { usePermissions } from '@/hooks';
import { ROUTES } from '@/utils/routes';
import type { ProjectDetails } from '@/types/project.types';

interface ProjectActionsMenuProps {
  project: ProjectDetails;
}

export const ProjectActionsMenu: React.FC<ProjectActionsMenuProps> = ({
  project,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { hasPermission } = usePermissions();
  const navigate = useNavigate();

  const handleViewDetails = () => {
    navigate(`${ROUTES.PROJECTS_DETAILS}/${project.project_hash}`);
    setIsMenuOpen(false);
  };

  const handleEditProject = () => {
    navigate(`${ROUTES.PROJECTS_EDIT}/${project.project_hash}`);
    setIsMenuOpen(false);
  };

  const handleArchiveProject = () => {
    // Navigate to project details page with settings tab
    navigate(`${ROUTES.PROJECTS_DETAILS}/${project.project_hash}?tab=settings`);
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