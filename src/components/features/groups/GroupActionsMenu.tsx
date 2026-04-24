import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, Pencil, Trash2 } from 'lucide-react';
import type { UserGroup } from '@/types/group.types';
import { ROUTES } from '@/utils/routes';

interface GroupActionsMenuProps {
  group: UserGroup;
  onEdit?: (group: UserGroup) => void;
  onDelete?: (group: UserGroup) => void;
  onView?: (group: UserGroup) => void;
}

export const GroupActionsMenu: React.FC<GroupActionsMenuProps> = ({ 
  group, 
  onEdit,
  onDelete,
  onView 
}) => {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    if (onView) {
      onView(group);
    } else {
      navigate(`${ROUTES.GROUP}/${group.group_hash}`);
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(group);
    }
    // No fallback navigation - inline modal edit is the approved pattern.
    // The route /groups/:hash/edit does not exist (GroupEditPage not implemented).
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(group);
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
};
