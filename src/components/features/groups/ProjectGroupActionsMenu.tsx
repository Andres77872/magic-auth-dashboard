import React from 'react';
import { ActionsMenu } from '@/components/common';
import type { ActionMenuItem } from '@/components/common';
import { ViewIcon, EditIcon, DeleteIcon } from '@/components/icons';
import type { ProjectGroup } from '@/services/project-group.service';

interface ProjectGroupActionsMenuProps {
  group: ProjectGroup;
  onEdit?: (group: ProjectGroup) => void;
  onDelete?: (group: ProjectGroup) => void;
  onView?: (group: ProjectGroup) => void;
}

export function ProjectGroupActionsMenu({
  group,
  onEdit,
  onDelete,
  onView
}: ProjectGroupActionsMenuProps): React.JSX.Element {
  const handleViewDetails = () => {
    if (onView) {
      onView(group);
    } else {
      window.location.href = `/dashboard/groups/project-groups/${group.group_hash}`;
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(group);
    } else {
      window.location.href = `/dashboard/groups/project-groups/${group.group_hash}/edit`;
    }
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete the project group "${group.group_name}"?`)) {
      if (onDelete) {
        onDelete(group);
      } else {
        console.log('Delete project group:', group.group_hash);
      }
    }
  };

  const menuItems: ActionMenuItem[] = [
    {
      key: 'view',
      label: 'View Details',
      icon: <ViewIcon size="sm" />,
      onClick: handleViewDetails,
    },
    {
      key: 'edit',
      label: 'Edit Group',
      icon: <EditIcon size="sm" />,
      onClick: handleEdit,
    },
  ];

  // Only add delete option if onDelete callback is provided
  if (onDelete) {
    menuItems.push({
      key: 'delete',
      label: 'Delete Group',
      icon: <DeleteIcon size="sm" />,
      onClick: handleDelete,
      destructive: true,
    });
  }

  return (
    <ActionsMenu
      items={menuItems}
      ariaLabel={`Actions for ${group.group_name}`}
      placement="bottom-right"
    />
  );
} 