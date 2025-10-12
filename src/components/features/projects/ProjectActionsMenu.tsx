import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ActionsMenu } from '@/components/common';
import type { ActionMenuItem } from '@/components/common';
import { usePermissions } from '@/hooks';
import { ROUTES } from '@/utils/routes';
import { ViewIcon, EditIcon, SettingsIcon } from '@/components/icons';
import type { ProjectDetails } from '@/types/project.types';

interface ProjectActionsMenuProps {
  project: ProjectDetails;
}

export const ProjectActionsMenu: React.FC<ProjectActionsMenuProps> = ({
  project,
}) => {
  const { hasPermission } = usePermissions();
  const navigate = useNavigate();

  const handleViewDetails = () => {
    navigate(`${ROUTES.PROJECTS_DETAILS}/${project.project_hash}`);
  };

  const handleEditProject = () => {
    navigate(`${ROUTES.PROJECTS_EDIT}/${project.project_hash}`);
  };

  const handleArchiveProject = () => {
    // Navigate to project details page with settings tab
    navigate(`${ROUTES.PROJECTS_DETAILS}/${project.project_hash}?tab=settings`);
  };

  const canEdit = hasPermission('projects:edit');
  const canArchive = hasPermission('projects:archive');

  const menuItems: ActionMenuItem[] = [
    {
      key: 'view',
      label: 'View Details',
      icon: <ViewIcon size="sm" />,
      onClick: handleViewDetails,
    },
    {
      key: 'edit',
      label: 'Edit Project',
      icon: <EditIcon size="sm" />,
      onClick: handleEditProject,
      hidden: !canEdit,
    },
    {
      key: 'archive',
      label: 'Archive',
      icon: <SettingsIcon size="sm" />,
      onClick: handleArchiveProject,
      hidden: !canArchive,
    },
  ];

  return (
    <ActionsMenu
      items={menuItems}
      ariaLabel={`Actions for ${project.project_name}`}
      placement="bottom-right"
    />
  );
}; 