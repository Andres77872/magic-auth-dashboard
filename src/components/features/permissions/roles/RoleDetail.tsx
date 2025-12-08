import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Spinner } from '@/components/ui/spinner';
import { ArrowLeft, Users, Pencil, Layers, Lock, Trash2, Shield } from 'lucide-react';
import { PriorityBadge } from '../shared/PriorityBadge';
import { CategoryBadge } from '../shared/CategoryBadge';
import { RoleEffectivePermissions } from './RoleEffectivePermissions';
import { globalRolesService } from '@/services';
import type { GlobalRole, GlobalPermissionGroup } from '@/types/global-roles.types';

interface RoleDetailProps {
  role: GlobalRole;
  onBack?: () => void;
  onEdit?: (role: GlobalRole) => void;
  onManagePermissionGroups?: (role: GlobalRole) => void;
  onAssignUsers?: (role: GlobalRole) => void;
  onDelete?: (role: GlobalRole) => void;
}

export function RoleDetail({
  role,
  onBack,
  onEdit,
  onManagePermissionGroups,
  onAssignUsers,
  onDelete
}: RoleDetailProps): React.JSX.Element {
  const [permissionGroups, setPermissionGroups] = useState<GlobalPermissionGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRolePermissionGroups();
  }, [role.role_hash]);

  const loadRolePermissionGroups = async () => {
    setLoading(true);
    try {
      const response: any = await globalRolesService.getRolePermissionGroups(role.role_hash);
      const groupsData = response.permission_groups || response.data || [];
      if (response.success) {
        setPermissionGroups(groupsData);
      }
    } catch (error) {
      console.error('Failed to load role permission groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const isSystemRole = role.is_system_role;

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
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{role.role_display_name}</h1>
                {isSystemRole && (
                  <Badge variant="outline" className="gap-1">
                    <Lock className="h-3 w-3" />
                    System
                  </Badge>
                )}
              </div>
              <p className="text-sm font-mono text-muted-foreground">{role.role_name}</p>
            </div>
          </div>
        </div>
        {!isSystemRole && (
          <div className="flex items-center gap-2">
            {onEdit && (
              <Button variant="outline" size="sm" onClick={() => onEdit(role)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}
            {onDelete && (
              <Button variant="outline" size="sm" className="text-destructive" onClick={() => onDelete(role)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <PriorityBadge priority={role.role_priority} />
        <Badge variant="secondary">
          {permissionGroups.length} group{permissionGroups.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {role.role_description && (
        <p className="text-muted-foreground">{role.role_description}</p>
      )}

      <Tabs defaultValue="permission-groups" className="space-y-4">
        <TabsList>
          <TabsTrigger value="permission-groups" className="gap-2">
            <Layers className="h-4 w-4" />
            Permission Groups
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="effective" className="gap-2">
            <Shield className="h-4 w-4" />
            Effective Permissions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="permission-groups" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Assigned Permission Groups</h3>
            {onManagePermissionGroups && !isSystemRole && (
              <Button size="sm" onClick={() => onManagePermissionGroups(role)}>
                Manage Groups
              </Button>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner size="lg" />
            </div>
          ) : permissionGroups.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <Layers className="h-10 w-10 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">No permission groups assigned</p>
                {onManagePermissionGroups && !isSystemRole && (
                  <Button className="mt-4" variant="outline" onClick={() => onManagePermissionGroups(role)}>
                    Add Permission Groups
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-2">
              {permissionGroups.map((group) => (
                <Card key={group.group_hash} className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Layers className="h-4 w-4 text-purple-500" />
                      <div>
                        <p className="font-medium">{group.group_display_name}</p>
                        <p className="text-xs font-mono text-muted-foreground">{group.group_name}</p>
                      </div>
                    </div>
                    <CategoryBadge category={group.group_category} />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Users with this Role</h3>
            {onAssignUsers && !isSystemRole && (
              <Button size="sm" onClick={() => onAssignUsers(role)}>
                Assign Users
              </Button>
            )}
          </div>
          <Card>
            <CardContent className="py-8">
              <div className="rounded-lg border-2 border-dashed p-8 text-center">
                <Users className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">User listing coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="effective" className="space-y-4">
          <RoleEffectivePermissions role={role} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default RoleDetail;
