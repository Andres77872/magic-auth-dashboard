import React, { useState } from 'react';
import { useGlobalRoles, usePermissionAssignments, useToast } from '@/hooks';
import {
  PageContainer,
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Input,
  Badge,
  StatsGrid,
  ErrorState,
  Skeleton,
} from '@/components/common';
import type { StatCardProps } from '@/components/common';
import { User, Check, X, ShieldCheck, Lock, Shield, Plus } from 'lucide-react';

export function GlobalRolesPage() {
  const {
    roles,
    currentRole,
    permissionGroups,
    myPermissions,
    loadingRoles,
    loadingGroups,
    rolesError,
    groupsError,
    createRole,
  } = useGlobalRoles();

  const { myPermissionSources, checkMyPermission } = usePermissionAssignments();
  const { showToast } = useToast();

  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDisplayName, setNewRoleDisplayName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [hasAdminPermission, setHasAdminPermission] = useState(false);

  // Check whether the current user can manage global roles
  React.useEffect(() => {
    void checkMyPermission('manage_global_roles').then(setHasAdminPermission);
  }, [checkMyPermission]);

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim() || !newRoleDisplayName.trim()) return;

    setIsCreating(true);
    try {
      await createRole({
        role_name: newRoleName.trim(),
        role_display_name: newRoleDisplayName.trim(),
        role_description: '',
      });
      showToast('Role created successfully.', 'success');
      setNewRoleName('');
      setNewRoleDisplayName('');
      setShowCreateForm(false);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Failed to create role.',
        'error'
      );
    } finally {
      setIsCreating(false);
    }
  };

  const permissionSourceStats: StatCardProps[] = myPermissionSources
    ? [
        {
          title: 'From role',
          value: myPermissionSources.from_role.length,
          icon: <ShieldCheck size={18} aria-hidden="true" />,
          variant: 'info',
        },
        {
          title: 'From groups',
          value: myPermissionSources.from_user_groups.length,
          icon: <User size={18} aria-hidden="true" />,
          variant: 'success',
        },
        {
          title: 'Direct',
          value: myPermissionSources.from_direct_assignment.length,
          icon: <Lock size={18} aria-hidden="true" />,
          variant: 'primary',
        },
      ]
    : [];

  return (
    <PageContainer className="space-y-6">
      <PageHeader
        title="Global roles"
        subtitle="Roles and permission assignments that apply across every project."
        icon={<Shield size={24} />}
        actions={
          hasAdminPermission ? (
            <Button onClick={() => setShowCreateForm((open) => !open)}>
              <Plus size={16} aria-hidden="true" />
              Create role
            </Button>
          ) : undefined
        }
      />

      {/* Current user's role & permission sources */}
      {currentRole && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User size={20} aria-hidden="true" />
              Your role
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium text-muted-foreground">Role</span>
                <Badge variant="primary">{currentRole.role_display_name}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-muted-foreground">
                  Active permissions
                </span>
                <span className="font-semibold text-foreground">
                  {myPermissions.length}
                </span>
              </div>
            </div>
            {permissionSourceStats.length > 0 && (
              <StatsGrid stats={permissionSourceStats} columns={3} />
            )}
          </CardContent>
        </Card>
      )}

      {/* Create role form */}
      {showCreateForm && hasAdminPermission && (
        <Card>
          <CardHeader>
            <CardTitle>Create a new role</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateRole} className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="new-role-name"
                  className="block text-sm font-medium"
                >
                  Role name (internal)
                </label>
                <Input
                  id="new-role-name"
                  type="text"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="e.g. super_admin"
                  required
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="new-role-display-name"
                  className="block text-sm font-medium"
                >
                  Display name
                </label>
                <Input
                  id="new-role-display-name"
                  type="text"
                  value={newRoleDisplayName}
                  onChange={(e) => setNewRoleDisplayName(e.target.value)}
                  placeholder="e.g. Super administrator"
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isCreating}>
                  <Check size={16} aria-hidden="true" />
                  {isCreating ? 'Creating…' : 'Create role'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                  disabled={isCreating}
                >
                  <X size={16} aria-hidden="true" />
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Roles list */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck size={20} aria-hidden="true" />
            Global roles
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingRoles ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : rolesError ? (
            <ErrorState
              variant="inline"
              title="Couldn't load roles"
              message={rolesError}
            />
          ) : roles.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No roles yet. Create your first role to get started.
            </div>
          ) : (
            <div className="space-y-3">
              {roles.map((role) => (
                <div
                  key={role.role_hash}
                  className="rounded-lg border p-4 transition-colors hover:bg-accent"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate font-semibold">
                          {role.role_display_name}
                        </h3>
                        {role.is_system_role && (
                          <Badge variant="secondary">System</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {role.role_name}
                      </p>
                      {role.role_description && (
                        <p className="mt-2 text-sm">{role.role_description}</p>
                      )}
                      <div className="mt-2 text-xs text-muted-foreground">
                        Priority {role.role_priority} · Created{' '}
                        {new Date(role.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Permission groups */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock size={20} aria-hidden="true" />
            Permission groups
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingGroups ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
            </div>
          ) : groupsError ? (
            <ErrorState
              variant="inline"
              title="Couldn't load permission groups"
              message={groupsError}
            />
          ) : permissionGroups.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No permission groups found.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {permissionGroups.map((group) => (
                <div
                  key={group.group_hash}
                  className="rounded-lg border p-4 transition-colors hover:bg-accent"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <Lock size={16} aria-hidden="true" />
                    <h4 className="truncate font-semibold">
                      {group.group_display_name}
                    </h4>
                  </div>
                  <p className="mb-2 text-sm text-muted-foreground">
                    {group.group_name}
                  </p>
                  <Badge variant="secondary">{group.group_category}</Badge>
                  {group.group_description && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {group.group_description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Your active permissions */}
      {myPermissions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Check size={20} aria-hidden="true" />
              Your active permissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {myPermissions.map((permission) => (
                <Badge key={permission} variant="secondary">
                  {permission}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}

export default GlobalRolesPage;
