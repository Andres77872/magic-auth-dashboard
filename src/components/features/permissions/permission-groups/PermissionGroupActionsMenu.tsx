import React from 'react';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Pencil, Trash2, Settings } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { GlobalPermissionGroup } from '@/types/global-roles.types';

interface PermissionGroupActionsMenuProps {
  group: GlobalPermissionGroup;
  onEdit?: (group: GlobalPermissionGroup) => void;
  onDelete?: (group: GlobalPermissionGroup) => void;
  onManagePermissions?: (group: GlobalPermissionGroup) => void;
}

export function PermissionGroupActionsMenu({
  group,
  onEdit,
  onDelete,
  onManagePermissions
}: PermissionGroupActionsMenuProps): React.JSX.Element | null {
  const hasActions = onEdit || onDelete || onManagePermissions;

  if (!hasActions) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {onManagePermissions && (
          <DropdownMenuItem onClick={() => onManagePermissions(group)}>
            <Settings className="mr-2 h-4 w-4" />
            Manage Permissions
          </DropdownMenuItem>
        )}
        {onManagePermissions && (onEdit || onDelete) && (
          <DropdownMenuSeparator />
        )}
        {onEdit && (
          <DropdownMenuItem onClick={() => onEdit(group)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
        )}
        {onDelete && (
          <DropdownMenuItem
            onClick={() => onDelete(group)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default PermissionGroupActionsMenu;
