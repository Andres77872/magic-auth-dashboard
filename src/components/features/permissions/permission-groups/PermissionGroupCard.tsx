import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreVertical, Pencil, Trash2, Settings, Layers, ChevronRight } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CategoryBadge } from '../shared/CategoryBadge';
import type { GlobalPermissionGroup } from '@/types/global-roles.types';

interface PermissionGroupCardProps {
  group: GlobalPermissionGroup;
  onClick?: (group: GlobalPermissionGroup) => void;
  onEdit?: (group: GlobalPermissionGroup) => void;
  onDelete?: (group: GlobalPermissionGroup) => void;
  onManagePermissions?: (group: GlobalPermissionGroup) => void;
  permissionCount?: number;
  assignmentCount?: number;
}

export function PermissionGroupCard({
  group,
  onClick,
  onEdit,
  onDelete,
  onManagePermissions,
  permissionCount,
  assignmentCount
}: PermissionGroupCardProps): React.JSX.Element {
  return (
    <Card 
      className={`group relative transition-shadow hover:shadow-md ${onClick ? 'cursor-pointer' : ''}`}
      onClick={() => onClick?.(group)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
              <Layers className="h-4 w-4" />
            </div>
            <div className="flex-1 space-y-1">
              <h4 className="font-medium leading-none">{group.group_display_name}</h4>
              <p className="text-xs font-mono text-muted-foreground">{group.group_name}</p>
            </div>
          </div>
          {(onEdit || onDelete || onManagePermissions) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onManagePermissions && (
                  <DropdownMenuItem onClick={() => onManagePermissions(group)}>
                    <Settings className="mr-2 h-4 w-4" />
                    Manage Permissions
                  </DropdownMenuItem>
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
          )}
        </div>
        {group.group_description && (
          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
            {group.group_description}
          </p>
        )}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CategoryBadge category={group.group_category} />
            {permissionCount !== undefined && (
              <span className="text-xs text-muted-foreground">
                {permissionCount} permission{permissionCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          {onManagePermissions && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => onManagePermissions(group)}
            >
              Manage
              <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
          )}
        </div>
        {assignmentCount !== undefined && assignmentCount > 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            Assigned to {assignmentCount} user group{assignmentCount !== 1 ? 's' : ''}/role{assignmentCount !== 1 ? 's' : ''}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default PermissionGroupCard;
