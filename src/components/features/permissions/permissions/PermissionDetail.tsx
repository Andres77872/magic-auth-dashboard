import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { ArrowLeft, Shield, Pencil, Trash2, Layers, AlertTriangle } from 'lucide-react';
import { CategoryBadge } from '../shared/CategoryBadge';
import { globalRolesService } from '@/services';
import type { GlobalPermission, GlobalPermissionGroup } from '@/types/global-roles.types';

interface PermissionDetailProps {
  permission: GlobalPermission;
  onBack?: () => void;
  onEdit?: (permission: GlobalPermission) => void;
  onDelete?: (permission: GlobalPermission) => void;
}

export function PermissionDetail({
  permission,
  onBack,
  onEdit,
  onDelete
}: PermissionDetailProps): React.JSX.Element {
  const [groupsUsingPermission, setGroupsUsingPermission] = useState<GlobalPermissionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUsageData();
  }, [permission.permission_hash]);

  const loadUsageData = async () => {
    setLoading(true);
    setError(null);

    try {
      const groupsRes = await globalRolesService.getPermissionGroups();
      
      if (groupsRes.success) {
        const allGroups: GlobalPermissionGroup[] = (groupsRes as any).permission_groups || groupsRes.data || [];
        const groupsWithPermission = await findGroupsWithPermission(allGroups, permission.permission_hash);
        setGroupsUsingPermission(groupsWithPermission);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load usage data');
      console.error('Failed to load permission usage:', err);
    } finally {
      setLoading(false);
    }
  };

  const findGroupsWithPermission = async (
    groups: GlobalPermissionGroup[],
    permissionHash: string
  ): Promise<GlobalPermissionGroup[]> => {
    const groupsWithPermission: GlobalPermissionGroup[] = [];

    for (const group of groups) {
      try {
        const response: any = await globalRolesService.getGroupPermissions(group.group_hash);
        const permissions = response.permissions || response.data || [];
        if (permissions.some((p: GlobalPermission) => p.permission_hash === permissionHash)) {
          groupsWithPermission.push(group);
        }
      } catch {
        // Skip groups where we can't fetch permissions
      }
    }

    return groupsWithPermission;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          )}
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{permission.permission_display_name}</h1>
              <p className="text-sm font-mono text-muted-foreground">{permission.permission_name}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onEdit && (
            <Button variant="outline" size="sm" onClick={() => onEdit(permission)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}
          {onDelete && (
            <Button variant="outline" size="sm" className="text-destructive" onClick={() => onDelete(permission)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <CategoryBadge category={permission.permission_category} />
        <Badge variant="secondary">
          Used in {groupsUsingPermission.length} group{groupsUsingPermission.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {permission.permission_description && (
        <p className="text-muted-foreground">{permission.permission_description}</p>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Permission Groups Using This Permission</h3>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <Card className="border-destructive">
            <CardContent className="flex items-center gap-3 py-4">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </CardContent>
          </Card>
        ) : groupsUsingPermission.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Layers className="h-10 w-10 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                This permission is not used in any permission groups
              </p>
              <p className="text-xs text-muted-foreground">
                It can be safely deleted without affecting any users
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
              <CardContent className="flex items-start gap-3 py-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600 dark:text-amber-400" />
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Deleting this permission will remove it from {groupsUsingPermission.length} permission group{groupsUsingPermission.length !== 1 ? 's' : ''}.
                  Users with those groups will lose this permission.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
                    <Layers className="h-4 w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Permission Groups</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {groupsUsingPermission.length} group{groupsUsingPermission.length !== 1 ? 's' : ''} include this permission
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {groupsUsingPermission.map((group) => (
                    <div
                      key={group.group_hash}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <Layers className="h-4 w-4 text-purple-500" />
                        <div>
                          <p className="font-medium">{group.group_display_name}</p>
                          <p className="text-xs font-mono text-muted-foreground">{group.group_name}</p>
                        </div>
                      </div>
                      <CategoryBadge category={group.group_category} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

export default PermissionDetail;
