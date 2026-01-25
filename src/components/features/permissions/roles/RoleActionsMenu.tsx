import React from 'react';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Pencil, Trash2, Users, Settings } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { GlobalRole } from '@/types/global-roles.types';

interface RoleActionsMenuProps {
  role: GlobalRole;
  onEdit?: (role: GlobalRole) => void;
  onDelete?: (role: GlobalRole) => void;
  onManagePermissionGroups?: (role: GlobalRole) => void;
  onAssignUsers?: (role: GlobalRole) => void;
}

export function RoleActionsMenu({
  role,
  onEdit,
  onDelete,
  onManagePermissionGroups,
  onAssignUsers
}: RoleActionsMenuProps): React.JSX.Element | null {
  const isSystemRole = role.is_system_role;
  const hasActions = onEdit || onDelete || onManagePermissionGroups || onAssignUsers;

  if (!hasActions || isSystemRole) {
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
        {onManagePermissionGroups && (
          <DropdownMenuItem onClick={() => onManagePermissionGroups(role)}>
            <Settings className="mr-2 h-4 w-4" />
            Manage Permission Groups
          </DropdownMenuItem>
        )}
        {onAssignUsers && (
          <DropdownMenuItem onClick={() => onAssignUsers(role)}>
            <Users className="mr-2 h-4 w-4" />
            Assign Users
          </DropdownMenuItem>
        )}
        {(onManagePermissionGroups || onAssignUsers) && (onEdit || onDelete) && (
          <DropdownMenuSeparator />
        )}
        {onEdit && (
          <DropdownMenuItem onClick={() => onEdit(role)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
        )}
        {onDelete && (
          <DropdownMenuItem
            onClick={() => onDelete(role)}
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

export default RoleActionsMenu;
