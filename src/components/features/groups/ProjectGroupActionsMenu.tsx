import React from 'react';
import { Button } from '@/components/common';
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

  return (
    <div className="group-actions-menu">
      <div className="actions-inline">
        <Button
          variant="outline"
          size="sm"
          onClick={handleViewDetails}
        >
          View
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleEdit}
        >
          Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDelete}
          className="actions-menu-item-danger"
        >
          Delete
        </Button>
      </div>
    </div>
  );
} 