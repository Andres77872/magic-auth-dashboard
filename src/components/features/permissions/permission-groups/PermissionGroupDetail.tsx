import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Spinner } from '@/components/ui/spinner';
import { ArrowLeft, Layers, Pencil, Shield, Trash2, Users } from 'lucide-react';
import { CategoryBadge } from '../shared/CategoryBadge';
import { PermissionGroupUsage } from './PermissionGroupUsage';
import { globalRolesService } from '@/services';
import type { GlobalPermission, GlobalPermissionGroup } from '@/types/global-roles.types';

interface PermissionGroupDetailProps {
  group: GlobalPermissionGroup;
  onBack?: () => void;
  onEdit?: (group: GlobalPermissionGroup) => void;
  onManagePermissions?: (group: GlobalPermissionGroup) => void;
  onDelete?: (group: GlobalPermissionGroup) => void;
}

export function PermissionGroupDetail({
  group,
  onBack,
  onEdit,
  onManagePermissions,
  onDelete
}: PermissionGroupDetailProps): React.JSX.Element {
  const [permissions, setPermissions] = useState<GlobalPermission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGroupPermissions();
  }, [group.group_hash]);

  const loadGroupPermissions = async () => {
    setLoading(true);
    try {
      const response: any = await globalRolesService.getGroupPermissions(group.group_hash);
      const permsData = response.permissions || response.data || [];
      if (response.success) {
        setPermissions(permsData);
      }
    } catch (error) {
      console.error('Failed to load group permissions:', error);
    } finally {
      setLoading(false);
    }
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
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{group.group_display_name}</h1>
              <p className="text-sm font-mono text-muted-foreground">{group.group_name}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onEdit && (
            <Button variant="outline" size="sm" onClick={() => onEdit(group)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}
          {onDelete && (
            <Button variant="outline" size="sm" className="text-destructive" onClick={() => onDelete(group)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <CategoryBadge category={group.group_category} />
        <Badge variant="secondary">
          {permissions.length} permission{permissions.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {group.group_description && (
        <p className="text-muted-foreground">{group.group_description}</p>
      )}

      <Tabs defaultValue="permissions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="permissions" className="gap-2">
            <Shield className="h-4 w-4" />
            Permissions
          </TabsTrigger>
          <TabsTrigger value="usage" className="gap-2">
            <Users className="h-4 w-4" />
            Usage
          </TabsTrigger>
        </TabsList>

        <TabsContent value="permissions" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Assigned Permissions</h3>
            {onManagePermissions && (
              <Button size="sm" onClick={() => onManagePermissions(group)}>
                Manage Permissions
              </Button>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner size="lg" />
            </div>
          ) : permissions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Shield className="h-10 w-10 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">No permissions assigned</p>
                {onManagePermissions && (
                  <Button className="mt-4" variant="outline" onClick={() => onManagePermissions(group)}>
                    Add Permissions
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-2">
              {permissions.map((permission) => (
                <Card key={permission.permission_hash} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Shield className="h-4 w-4 text-blue-500" />
                      <div>
                        <p className="font-medium">{permission.permission_display_name}</p>
                        <p className="text-xs font-mono text-muted-foreground">{permission.permission_name}</p>
                      </div>
                    </div>
                    <CategoryBadge category={permission.permission_category} />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <PermissionGroupUsage group={group} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default PermissionGroupDetail;
