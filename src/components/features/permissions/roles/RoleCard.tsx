import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreVertical, Pencil, Trash2, Users, Lock, Settings } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PriorityBadge } from '../shared/PriorityBadge';
import type { GlobalRole } from '@/types/global-roles.types';

interface RoleCardProps {
  role: GlobalRole;
  onClick?: (role: GlobalRole) => void;
  onEdit?: (role: GlobalRole) => void;
  onDelete?: (role: GlobalRole) => void;
  onManagePermissionGroups?: (role: GlobalRole) => void;
  onAssignUsers?: (role: GlobalRole) => void;
  permissionGroupCount?: number;
  userCount?: number;
}

export function RoleCard({
  role,
  onClick,
  onEdit,
  onDelete,
  onManagePermissionGroups,
  onAssignUsers,
  permissionGroupCount,
  userCount
}: RoleCardProps): React.JSX.Element {
  const isSystemRole = role.is_system_role;

  return (
    <Card 
      className={`group relative transition-shadow hover:shadow-md ${onClick ? 'cursor-pointer' : ''}`}
      onClick={() => onClick?.(role)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400">
              <Users className="h-4 w-4" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="font-medium leading-none">{role.role_display_name}</h4>
                {isSystemRole && (
                  <Badge variant="outline" className="text-xs gap-1">
                    <Lock className="h-3 w-3" />
                    System
                  </Badge>
                )}
              </div>
              <p className="text-xs font-mono text-muted-foreground">{role.role_name}</p>
            </div>
          </div>
          {(onEdit || onDelete || onManagePermissionGroups) && !isSystemRole && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
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
          )}
        </div>
        {role.role_description && (
          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
            {role.role_description}
          </p>
        )}
        <div className="mt-3 flex items-center justify-between">
          <PriorityBadge priority={role.role_priority} />
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {permissionGroupCount !== undefined && (
              <span>{permissionGroupCount} group{permissionGroupCount !== 1 ? 's' : ''}</span>
            )}
            {userCount !== undefined && (
              <span>{userCount} user{userCount !== 1 ? 's' : ''}</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default RoleCard;
