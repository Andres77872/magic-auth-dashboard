import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Users, UserCircle, Building2, AlertTriangle } from 'lucide-react';
import { IconContainer } from '@/components/common';
import { permissionAssignmentsService, globalRolesService } from '@/services';
import type {
  GlobalPermissionGroup,
  GlobalRole,
} from '@/types/global-roles.types';

interface UserGroupUsage {
  group_hash: string;
  group_name: string;
  group_display_name?: string;
}

interface UserUsage {
  user_hash: string;
  username: string;
  assigned_at?: string;
  notes?: string;
}

interface PermissionGroupUsageProps {
  group: GlobalPermissionGroup;
}

export function PermissionGroupUsage({
  group,
}: PermissionGroupUsageProps): React.JSX.Element {
  const [userGroups, setUserGroups] = useState<UserGroupUsage[]>([]);
  const [directUsers, setDirectUsers] = useState<UserUsage[]>([]);
  const [rolesWithGroup, setRolesWithGroup] = useState<GlobalRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUsageData();
  }, [group.group_hash]);

  const loadUsageData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [userGroupsRes, usersRes, rolesRes] = await Promise.all([
        permissionAssignmentsService.getPermissionGroupUserGroups(
          group.group_hash
        ),
        permissionAssignmentsService.getPermissionGroupUsers(group.group_hash),
        globalRolesService.getRoles(),
      ]);

      if (userGroupsRes.success) {
        const data =
          (userGroupsRes as any).user_groups || userGroupsRes.data || [];
        setUserGroups(data);
      }

      if (usersRes.success) {
        const data = (usersRes as any).users || usersRes.data || [];
        setDirectUsers(data);
      }

      if (rolesRes.success) {
        const allRoles: GlobalRole[] =
          (rolesRes as any).roles || rolesRes.data || [];
        const rolesUsingGroup = await findRolesWithPermissionGroup(
          allRoles,
          group.group_hash
        );
        setRolesWithGroup(rolesUsingGroup);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load usage data'
      );
      console.error('Failed to load permission group usage:', err);
    } finally {
      setLoading(false);
    }
  };

  const findRolesWithPermissionGroup = async (
    roles: GlobalRole[],
    groupHash: string
  ): Promise<GlobalRole[]> => {
    const rolesWithGroup: GlobalRole[] = [];

    for (const role of roles) {
      try {
        const response: any = await globalRolesService.getRolePermissionGroups(
          role.role_hash
        );
        const groups = response.permission_groups || response.data || [];
        if (
          groups.some((g: GlobalPermissionGroup) => g.group_hash === groupHash)
        ) {
          rolesWithGroup.push(role);
        }
      } catch {
        // Skip roles where we can't fetch permission groups
      }
    }

    return rolesWithGroup;
  };

  const totalUsage =
    userGroups.length + directUsers.length + rolesWithGroup.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="flex items-center gap-3 py-4">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (totalUsage === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Users className="h-10 w-10 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            This permission group is not assigned anywhere
          </p>
          <p className="text-xs text-muted-foreground">
            It can be safely deleted without affecting any users
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Usage Summary</h3>
        <Badge variant="secondary">
          {totalUsage} assignment{totalUsage !== 1 ? 's' : ''}
        </Badge>
      </div>

      <Card className="border status-warning">
        <CardContent className="flex items-start gap-3 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 status-warning-text" />
          <p className="text-sm status-warning-text">
            Deleting this permission group will affect {totalUsage} assignment
            {totalUsage !== 1 ? 's' : ''}. Users and groups assigned to this
            permission group will lose the associated permissions.
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {rolesWithGroup.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <IconContainer
                  variant="success"
                  size="md"
                  icon={<Users className="h-4 w-4" />}
                />
                <div>
                  <CardTitle className="text-base">Roles</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {rolesWithGroup.length} role
                    {rolesWithGroup.length !== 1 ? 's' : ''} with this group
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {rolesWithGroup.map((role) => (
                  <div
                    key={role.role_hash}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Users className="h-4 w-4 text-success" />
                      <div>
                        <p className="font-medium">{role.role_display_name}</p>
                        <p className="text-xs font-mono text-muted-foreground">
                          {role.role_name}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">
                      Priority {role.role_priority}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {userGroups.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <IconContainer
                  variant="info"
                  size="md"
                  icon={<Building2 className="h-4 w-4" />}
                />
                <div>
                  <CardTitle className="text-base">User Groups</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {userGroups.length} user group
                    {userGroups.length !== 1 ? 's' : ''} with this permission
                    group
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {userGroups.map((ug) => (
                  <div
                    key={ug.group_hash}
                    className="flex items-center gap-3 rounded-lg border p-3"
                  >
                    <Building2 className="h-4 w-4 text-info" />
                    <div>
                      <p className="font-medium">
                        {ug.group_display_name || ug.group_name}
                      </p>
                      <p className="text-xs font-mono text-muted-foreground">
                        {ug.group_name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {directUsers.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <IconContainer
                  variant="primary"
                  size="md"
                  icon={<UserCircle className="h-4 w-4" />}
                />
                <div>
                  <CardTitle className="text-base">Direct Users</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {directUsers.length} user
                    {directUsers.length !== 1 ? 's' : ''} with direct assignment
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {directUsers.map((user) => (
                  <div
                    key={user.user_hash}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <UserCircle className="h-4 w-4 text-purple-subtle-foreground" />
                      <div>
                        <p className="font-medium">{user.username}</p>
                        {user.notes && (
                          <p className="text-xs text-muted-foreground">
                            {user.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    {user.assigned_at && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(user.assigned_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default PermissionGroupUsage;
