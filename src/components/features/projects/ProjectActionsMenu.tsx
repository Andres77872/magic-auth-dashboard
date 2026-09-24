import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink, Pencil, Trash2 } from 'lucide-react';
import {
  ActionsMenu,
  type ActionMenuItem,
} from '@/components/common/ActionsMenu';
import { ROUTES } from '@/utils/routes';
import type { ProjectSummary } from '@/types/project.types';

interface ProjectActionsMenuProps {
  project: ProjectSummary;
  onEdit: (project: ProjectSummary) => void;
  onDelete: (project: ProjectSummary) => void;
}

/**
 * Row menu for the projects table. Edit and delete appear only where the
 * caller administers the project (root, or an admin assigned to it); the API
 * enforces the same rule. Dialogs live on the page, outside the table row.
 */
export function ProjectActionsMenu({
  project,
  onEdit,
  onDelete,
}: ProjectActionsMenuProps): React.JSX.Element {
  const navigate = useNavigate();
  const canManage = project.access_level === 'admin_access';

  const items: ActionMenuItem[] = [
    {
      key: 'open',
      label: 'Open',
      icon: <ExternalLink />,
      onClick: () =>
        void navigate(
          `${ROUTES.PROJECTS}/${encodeURIComponent(project.project_hash)}`
        ),
    },
    {
      key: 'edit',
      label: 'Edit',
      icon: <Pencil />,
      onClick: () => onEdit(project),
      hidden: !canManage,
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: <Trash2 />,
      onClick: () => onDelete(project),
      destructive: true,
      hidden: !canManage,
    },
  ];

  return (
    <div
      data-no-row-click
      className="flex justify-end"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <ActionsMenu
        items={items}
        ariaLabel={`Actions for ${project.project_name}`}
        size="sm"
      />
    </div>
  );
}

export default ProjectActionsMenu;
