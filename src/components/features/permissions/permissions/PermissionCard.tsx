import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreVertical, Pencil, Trash2, Shield } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CategoryBadge } from '../shared/CategoryBadge';
import type { GlobalPermission } from '@/types/global-roles.types';

interface PermissionCardProps {
  permission: GlobalPermission;
  onClick?: (permission: GlobalPermission) => void;
  onEdit?: (permission: GlobalPermission) => void;
  onDelete?: (permission: GlobalPermission) => void;
  usageCount?: number;
}

export function PermissionCard({
  permission,
  onClick,
  onEdit,
  onDelete,
  usageCount
}: PermissionCardProps): React.JSX.Element {
  return (
    <Card 
      className={`group relative transition-shadow hover:shadow-md ${onClick ? 'cursor-pointer' : ''}`}
      onClick={() => onClick?.(permission)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              <Shield className="h-4 w-4" />
            </div>
            <div className="flex-1 space-y-1">
              <h4 className="font-medium leading-none">{permission.permission_display_name}</h4>
              <p className="text-xs font-mono text-muted-foreground">{permission.permission_name}</p>
            </div>
          </div>
          {(onEdit || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(permission)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem
                    onClick={() => onDelete(permission)}
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
        {permission.permission_description && (
          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
            {permission.permission_description}
          </p>
        )}
        <div className="mt-3 flex items-center justify-between">
          <CategoryBadge category={permission.permission_category} />
          {usageCount !== undefined && (
            <span className="text-xs text-muted-foreground">
              Used in {usageCount} group{usageCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default PermissionCard;
