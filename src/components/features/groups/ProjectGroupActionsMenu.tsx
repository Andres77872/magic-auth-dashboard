import React from 'react';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/utils/routes';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, Pencil, Trash2 } from 'lucide-react';
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
      window.location.href = `${ROUTES.PROJECT_GROUPS}/${group.group_hash}`;
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(group);
    } else {
      window.location.href = `${ROUTES.PROJECT_GROUPS_EDIT}/${group.group_hash}`;
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <span className="sr-only">Actions for {group.group_name}</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleViewDetails}>
          <Eye className="mr-2 h-4 w-4" />
          View Details
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleEdit}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit Group
        </DropdownMenuItem>
        {onDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Group
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 