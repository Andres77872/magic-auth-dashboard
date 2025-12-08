import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Spinner } from '@/components/ui/spinner';
import { Shield, Layers, Users, Plus, Search, UserCircle } from 'lucide-react';
import { ConfirmDialog } from '@/components/common';
import { PermissionModal } from './PermissionModal';
import { PermissionGroupModal } from './PermissionGroupModal';
import { ManageGroupPermissionsModal } from './ManageGroupPermissionsModal';
import { ManageRolePermissionGroupsModal } from './ManageRolePermissionGroupsModal';
import { RoleModal } from './RoleModal';
import { PermissionCard } from './permissions/PermissionCard';
import { PermissionDetail } from './permissions/PermissionDetail';
import { PermissionGroupCard } from './permission-groups/PermissionGroupCard';
import { RoleCard } from './roles/RoleCard';
import { UserPermissionSources } from './user-permissions/UserPermissionSources';
import { UserPermissionCheck } from './user-permissions/UserPermissionCheck';
import { DetailPanel } from './shared/DetailPanel';
import { RoleDetail } from './roles/RoleDetail';
import { PermissionGroupDetail } from './permission-groups/PermissionGroupDetail';
import { usePermissionManagement } from '@/contexts/PermissionManagementContext';
import { useGlobalRoles } from '@/hooks/useGlobalRoles';
import { useToast } from '@/contexts/ToastContext';
import { globalRolesService } from '@/services';
import type { GlobalPermission, GlobalPermissionGroup, GlobalRole } from '@/types/global-roles.types';
import { ClipboardList, BarChart3, FolderKanban } from 'lucide-react';
import { AssignmentsTab } from '@/pages/permissions/tabs/AssignmentsTab';
import { AnalyticsTab } from '@/pages/permissions/tabs/AnalyticsTab';
import { ProjectCatalogTab } from './catalog/ProjectCatalogTab';

export function PermissionsDashboard(): React.JSX.Element {
  const { addToast } = useToast();
  const {
    permissions,
    permissionGroups,
    permissionsLoading,
    permissionGroupsLoading,
    refreshPermissions,
    refreshPermissionGroups,
    categories
  } = usePermissionManagement();

  const {
    roles,
    loadingRoles,
    refreshRoles,
    currentRole
  } = useGlobalRoles();

  // Search state
  const [permissionSearch, setPermissionSearch] = useState('');
  const [groupSearch, setGroupSearch] = useState('');
  const [roleSearch, setRoleSearch] = useState('');

  // Modal states
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isManagePermissionsModalOpen, setIsManagePermissionsModalOpen] = useState(false);
  const [isManageRoleGroupsModalOpen, setIsManageRoleGroupsModalOpen] = useState(false);

  // Edit states
  const [editingPermission, setEditingPermission] = useState<GlobalPermission | null>(null);
  const [editingGroup, setEditingGroup] = useState<GlobalPermissionGroup | null>(null);
  const [editingRole, setEditingRole] = useState<GlobalRole | null>(null);
  const [managingGroup, setManagingGroup] = useState<GlobalPermissionGroup | null>(null);
  const [managingRole, setManagingRole] = useState<GlobalRole | null>(null);

  // Delete states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'permission' | 'group' | 'role'; item: any } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Detail panel states
  const [selectedRole, setSelectedRole] = useState<GlobalRole | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<GlobalPermissionGroup | null>(null);
  const [selectedPermission, setSelectedPermission] = useState<GlobalPermission | null>(null);
  const [isRoleDetailOpen, setIsRoleDetailOpen] = useState(false);
  const [isGroupDetailOpen, setIsGroupDetailOpen] = useState(false);
  const [isPermissionDetailOpen, setIsPermissionDetailOpen] = useState(false);

  // Filter data
  const filteredPermissions = permissions.filter(p =>
    p.permission_name.toLowerCase().includes(permissionSearch.toLowerCase()) ||
    p.permission_display_name.toLowerCase().includes(permissionSearch.toLowerCase())
  );

  const filteredGroups = permissionGroups.filter(g =>
    g.group_name.toLowerCase().includes(groupSearch.toLowerCase()) ||
    g.group_display_name.toLowerCase().includes(groupSearch.toLowerCase())
  );

  const filteredRoles = roles.filter(r =>
    r.role_name.toLowerCase().includes(roleSearch.toLowerCase()) ||
    r.role_display_name.toLowerCase().includes(roleSearch.toLowerCase())
  );

  // Handlers
  const handleCreatePermission = () => {
    setEditingPermission(null);
    setIsPermissionModalOpen(true);
  };

  const handleEditPermission = (permission: GlobalPermission) => {
    setEditingPermission(permission);
    setIsPermissionModalOpen(true);
  };

  const handleCreateGroup = () => {
    setEditingGroup(null);
    setIsGroupModalOpen(true);
  };

  const handleEditGroup = (group: GlobalPermissionGroup) => {
    setEditingGroup(group);
    setIsGroupModalOpen(true);
  };

  const handleManageGroupPermissions = (group: GlobalPermissionGroup) => {
    setManagingGroup(group);
    setIsManagePermissionsModalOpen(true);
  };

  const handleManageRolePermissionGroups = (role: GlobalRole) => {
    setManagingRole(role);
    setIsManageRoleGroupsModalOpen(true);
  };

  const handleRoleClick = (role: GlobalRole) => {
    setSelectedRole(role);
    setIsRoleDetailOpen(true);
  };

  const handleGroupClick = (group: GlobalPermissionGroup) => {
    setSelectedGroup(group);
    setIsGroupDetailOpen(true);
  };

  const handlePermissionClick = (permission: GlobalPermission) => {
    setSelectedPermission(permission);
    setIsPermissionDetailOpen(true);
  };

  const handleCreateRole = () => {
    setEditingRole(null);
    setIsRoleModalOpen(true);
  };

  const handleEditRole = (role: GlobalRole) => {
    setEditingRole(role);
    setIsRoleModalOpen(true);
  };

  const handleDeleteClick = (type: 'permission' | 'group' | 'role', item: any) => {
    setDeleteTarget({ type, item });
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      if (deleteTarget.type === 'permission') {
        await globalRolesService.deletePermission(deleteTarget.item.permission_hash);
        addToast({ message: 'Permission deleted successfully', variant: 'success' });
        await refreshPermissions();
      } else if (deleteTarget.type === 'group') {
        await globalRolesService.deletePermissionGroup(deleteTarget.item.group_hash);
        addToast({ message: 'Permission group deleted successfully', variant: 'success' });
        await refreshPermissionGroups();
      } else if (deleteTarget.type === 'role') {
        await globalRolesService.deleteRole(deleteTarget.item.role_hash);
        addToast({ message: 'Role deleted successfully', variant: 'success' });
        await refreshRoles();
      }
      setIsDeleteDialogOpen(false);
      setDeleteTarget(null);
    } catch (error) {
      addToast({
        message: error instanceof Error ? error.message : 'Delete failed',
        variant: 'error'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePermissionSubmit = async (data: any) => {
    try {
      if (editingPermission) {
        await globalRolesService.updatePermission(editingPermission.permission_hash, data);
        addToast({ message: 'Permission updated successfully', variant: 'success' });
      } else {
        await globalRolesService.createPermission(data);
        addToast({ message: 'Permission created successfully', variant: 'success' });
      }
      await refreshPermissions();
      setIsPermissionModalOpen(false);
    } catch (error) {
      addToast({
        message: error instanceof Error ? error.message : 'Operation failed',
        variant: 'error'
      });
      throw error;
    }
  };

  const handleGroupSubmit = async (data: any) => {
    try {
      if (editingGroup) {
        await globalRolesService.updatePermissionGroup(editingGroup.group_hash, data);
        addToast({ message: 'Permission group updated successfully', variant: 'success' });
      } else {
        await globalRolesService.createPermissionGroup(data);
        addToast({ message: 'Permission group created successfully', variant: 'success' });
      }
      await refreshPermissionGroups();
      setIsGroupModalOpen(false);
    } catch (error) {
      addToast({
        message: error instanceof Error ? error.message : 'Operation failed',
        variant: 'error'
      });
      throw error;
    }
  };

  const handleRoleSubmit = async (data: any) => {
    try {
      if (editingRole) {
        await globalRolesService.updateRole(editingRole.role_hash, data);
        addToast({ message: 'Role updated successfully', variant: 'success' });
      } else {
        await globalRolesService.createRole(data);
        addToast({ message: 'Role created successfully', variant: 'success' });
      }
      await refreshRoles();
      setIsRoleModalOpen(false);
    } catch (error) {
      addToast({
        message: error instanceof Error ? error.message : 'Operation failed',
        variant: 'error'
      });
      throw error;
    }
  };

  const getDeleteMessage = () => {
    if (!deleteTarget) return '';
    if (deleteTarget.type === 'permission') {
      return `Are you sure you want to delete "${deleteTarget.item.permission_display_name}"? This cannot be undone.`;
    }
    if (deleteTarget.type === 'group') {
      return `Are you sure you want to delete "${deleteTarget.item.group_display_name}"? This will remove all permission assignments.`;
    }
    return `Are you sure you want to delete "${deleteTarget.item.role_display_name}"? Users with this role will lose access.`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Permission Management</h1>
          <p className="text-muted-foreground">
            Manage permissions, permission groups, and roles in one place
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">{permissions.length}</p>
              <p className="text-sm text-muted-foreground">Permissions</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">{permissionGroups.length}</p>
              <p className="text-sm text-muted-foreground">Permission Groups</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">{roles.length}</p>
              <p className="text-sm text-muted-foreground">Roles</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="permissions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-7 lg:w-auto lg:inline-grid">
          <TabsTrigger value="permissions" className="gap-2">
            <Shield className="h-4 w-4" />
            Permissions
          </TabsTrigger>
          <TabsTrigger value="groups" className="gap-2">
            <Layers className="h-4 w-4" />
            Groups
          </TabsTrigger>
          <TabsTrigger value="roles" className="gap-2">
            <Users className="h-4 w-4" />
            Roles
          </TabsTrigger>
          <TabsTrigger value="assignments" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            Assignments
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="catalog" className="gap-2">
            <FolderKanban className="h-4 w-4" />
            Catalog
          </TabsTrigger>
          <TabsTrigger value="my-permissions" className="gap-2">
            <UserCircle className="h-4 w-4" />
            My Permissions
          </TabsTrigger>
        </TabsList>

        {/* Permissions Tab */}
        <TabsContent value="permissions" className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search permissions..."
                value={permissionSearch}
                onChange={(e) => setPermissionSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={handleCreatePermission}>
              <Plus className="mr-2 h-4 w-4" />
              New Permission
            </Button>
          </div>

          {permissionsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : filteredPermissions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Shield className="h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No permissions found</h3>
                <p className="text-sm text-muted-foreground">Create your first permission to get started</p>
                <Button className="mt-4" onClick={handleCreatePermission}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Permission
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {filteredPermissions.map((permission) => (
                <PermissionCard
                  key={permission.permission_hash}
                  permission={permission}
                  onClick={handlePermissionClick}
                  onEdit={handleEditPermission}
                  onDelete={(p) => handleDeleteClick('permission', p)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Permission Groups Tab */}
        <TabsContent value="groups" className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search groups..."
                value={groupSearch}
                onChange={(e) => setGroupSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={handleCreateGroup}>
              <Plus className="mr-2 h-4 w-4" />
              New Group
            </Button>
          </div>

          {permissionGroupsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : filteredGroups.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Layers className="h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No permission groups found</h3>
                <p className="text-sm text-muted-foreground">Create groups to organize permissions</p>
                <Button className="mt-4" onClick={handleCreateGroup}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Group
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {filteredGroups.map((group) => (
                <PermissionGroupCard
                  key={group.group_hash}
                  group={group}
                  onClick={handleGroupClick}
                  onEdit={handleEditGroup}
                  onDelete={(g) => handleDeleteClick('group', g)}
                  onManagePermissions={handleManageGroupPermissions}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Roles Tab */}
        <TabsContent value="roles" className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search roles..."
                value={roleSearch}
                onChange={(e) => setRoleSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button onClick={handleCreateRole}>
              <Plus className="mr-2 h-4 w-4" />
              New Role
            </Button>
          </div>

          {loadingRoles ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="lg" />
            </div>
          ) : filteredRoles.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No roles found</h3>
                <p className="text-sm text-muted-foreground">Create roles to assign permission groups to users</p>
                <Button className="mt-4" onClick={handleCreateRole}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Role
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {filteredRoles.map((role) => (
                <RoleCard
                  key={role.role_hash}
                  role={role}
                  onClick={handleRoleClick}
                  onEdit={handleEditRole}
                  onDelete={(r) => handleDeleteClick('role', r)}
                  onManagePermissionGroups={handleManageRolePermissionGroups}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments" className="space-y-4">
          <AssignmentsTab />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <AnalyticsTab />
        </TabsContent>

        {/* Catalog Tab */}
        <TabsContent value="catalog" className="space-y-4">
          <ProjectCatalogTab />
        </TabsContent>

        {/* My Permissions Tab */}
        <TabsContent value="my-permissions" className="space-y-6">
          {currentRole && (
            <Card>
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Your Current Role</p>
                  <p className="text-xl font-bold">{currentRole.role_display_name}</p>
                  <p className="text-xs font-mono text-muted-foreground">{currentRole.role_name}</p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <UserPermissionCheck />
            <div className="space-y-4">
              <UserPermissionSources compact />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <PermissionModal
        isOpen={isPermissionModalOpen}
        onClose={() => {
          setIsPermissionModalOpen(false);
          setEditingPermission(null);
        }}
        onSubmit={handlePermissionSubmit}
        permission={editingPermission}
        mode={editingPermission ? 'edit' : 'create'}
        categories={categories}
      />

      <PermissionGroupModal
        isOpen={isGroupModalOpen}
        onClose={() => {
          setIsGroupModalOpen(false);
          setEditingGroup(null);
        }}
        onSubmit={handleGroupSubmit}
        permissionGroup={editingGroup}
        mode={editingGroup ? 'edit' : 'create'}
        categories={categories}
      />

      <ManageGroupPermissionsModal
        isOpen={isManagePermissionsModalOpen}
        onClose={() => {
          setIsManagePermissionsModalOpen(false);
          setManagingGroup(null);
        }}
        permissionGroup={managingGroup}
        onUpdate={refreshPermissionGroups}
      />

      <ManageRolePermissionGroupsModal
        isOpen={isManageRoleGroupsModalOpen}
        onClose={() => {
          setIsManageRoleGroupsModalOpen(false);
          setManagingRole(null);
        }}
        role={managingRole}
        onUpdate={refreshRoles}
      />

      <RoleModal
        isOpen={isRoleModalOpen}
        onClose={() => {
          setIsRoleModalOpen(false);
          setEditingRole(null);
        }}
        onSubmit={handleRoleSubmit}
        role={editingRole}
        mode={editingRole ? 'edit' : 'create'}
      />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setDeleteTarget(null);
        }}
        onConfirm={handleConfirmDelete}
        title={`Delete ${deleteTarget?.type === 'permission' ? 'Permission' : deleteTarget?.type === 'group' ? 'Permission Group' : 'Role'}`}
        message={getDeleteMessage()}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />

      {/* Detail Panels */}
      <DetailPanel
        isOpen={isRoleDetailOpen}
        onClose={() => {
          setIsRoleDetailOpen(false);
          setSelectedRole(null);
        }}
        title={selectedRole?.role_display_name || 'Role Details'}
        description={selectedRole?.role_name}
      >
        {selectedRole && (
          <RoleDetail
            role={selectedRole}
            onEdit={handleEditRole}
            onManagePermissionGroups={handleManageRolePermissionGroups}
            onDelete={(r) => handleDeleteClick('role', r)}
          />
        )}
      </DetailPanel>

      <DetailPanel
        isOpen={isGroupDetailOpen}
        onClose={() => {
          setIsGroupDetailOpen(false);
          setSelectedGroup(null);
        }}
        title={selectedGroup?.group_display_name || 'Permission Group Details'}
        description={selectedGroup?.group_name}
      >
        {selectedGroup && (
          <PermissionGroupDetail
            group={selectedGroup}
            onEdit={handleEditGroup}
            onManagePermissions={handleManageGroupPermissions}
            onDelete={(g) => handleDeleteClick('group', g)}
          />
        )}
      </DetailPanel>

      <DetailPanel
        isOpen={isPermissionDetailOpen}
        onClose={() => {
          setIsPermissionDetailOpen(false);
          setSelectedPermission(null);
        }}
        title={selectedPermission?.permission_display_name || 'Permission Details'}
        description={selectedPermission?.permission_name}
      >
        {selectedPermission && (
          <PermissionDetail
            permission={selectedPermission}
            onEdit={handleEditPermission}
            onDelete={(p) => handleDeleteClick('permission', p)}
          />
        )}
      </DetailPanel>
    </div>
  );
}

export default PermissionsDashboard;
