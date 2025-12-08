import React, { useState } from 'react';
import { useGlobalRoles, usePermissionAssignments } from '@/hooks';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Badge } from '@/components/common';
import { User, Check, X, ShieldCheck, Lock } from 'lucide-react';

export function GlobalRolesPage() {
  const {
    roles,
    currentRole,
    permissionGroups,
    myPermissions,
    loadingRoles,
    loadingGroups,
    createRole,
  } = useGlobalRoles();

  const {
    myPermissionSources,
    checkMyPermission,
  } = usePermissionAssignments();

  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDisplayName, setNewRoleDisplayName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [hasAdminPermission, setHasAdminPermission] = useState(false);

  // Check if user has admin permission
  React.useEffect(() => {
    checkMyPermission('manage_global_roles').then(setHasAdminPermission);
  }, [checkMyPermission]);

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim() || !newRoleDisplayName.trim()) return;

    try {
      await createRole({
        role_name: newRoleName.trim(),
        role_display_name: newRoleDisplayName.trim(),
        role_description: '',
      });
      setNewRoleName('');
      setNewRoleDisplayName('');
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create role:', error);
    }
  };

  return (
    <div className="global-roles-page">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>🛡️ Global Roles Management</h1>
          <p className="subtitle">
            Manage global roles and permission assignments across all projects
          </p>
        </div>
        
        {hasAdminPermission && (
          <Button onClick={() => setShowCreateForm(!showCreateForm)}>
            + Create Role
          </Button>
        )}
      </div>

      {/* Current User Info */}
      {currentRole && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User size={20} aria-hidden="true" />
              Your Role
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <span className="font-semibold">Role:</span>{' '}
                <Badge variant="primary">{currentRole.role_display_name}</Badge>
              </div>
              <div>
                <span className="font-semibold">Permissions:</span>{' '}
                <span className="text-sm text-muted-foreground">
                  {myPermissions.length} active permissions
                </span>
              </div>
              {myPermissionSources && (
                <div className="mt-4 space-y-2">
                  <div className="font-semibold">Permission Sources:</div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <div className="text-sm font-medium">From Role</div>
                      <div className="text-2xl font-bold">{myPermissionSources.from_role.length}</div>
                    </div>
                    <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                      <div className="text-sm font-medium">From Groups</div>
                      <div className="text-2xl font-bold">{myPermissionSources.from_user_groups.length}</div>
                    </div>
                    <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                      <div className="text-sm font-medium">Direct</div>
                      <div className="text-2xl font-bold">{myPermissionSources.from_direct_assignment.length}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Role Form */}
      {showCreateForm && hasAdminPermission && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Role</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateRole} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Role Name (internal)
                </label>
                <Input
                  type="text"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="e.g., super_admin"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Display Name
                </label>
                <Input
                  type="text"
                  value={newRoleDisplayName}
                  onChange={(e) => setNewRoleDisplayName(e.target.value)}
                  placeholder="e.g., Super Administrator"
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">
                  <Check size={16} aria-hidden="true" />
                  Create Role
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  <X size={16} aria-hidden="true" />
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Roles List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck size={20} aria-hidden="true" />
            Global Roles
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingRoles ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading roles...
            </div>
          ) : roles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No roles found. Create your first role to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {roles.map((role) => (
                <div
                  key={role.role_hash}
                  className="p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">
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
                        <p className="text-sm mt-2">{role.role_description}</p>
                      )}
                      <div className="mt-2 text-xs text-muted-foreground">
                        Priority: {role.role_priority} | Created: {new Date(role.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Permission Groups */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock size={20} aria-hidden="true" />
            Permission Groups
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingGroups ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading permission groups...
            </div>
          ) : permissionGroups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No permission groups found.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {permissionGroups.map((group) => (
                <div
                  key={group.group_hash}
                  className="p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Lock size={16} aria-hidden="true" />
                    <h4 className="font-semibold">{group.group_display_name}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {group.group_name}
                  </p>
                  <Badge variant="secondary">{group.group_category}</Badge>
                  {group.group_description && (
                    <p className="text-xs mt-2 text-muted-foreground">
                      {group.group_description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* My Permissions */}
      {myPermissions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Check size={20} aria-hidden="true" />
              Your Active Permissions
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
    </div>
  );
}

export default GlobalRolesPage;
