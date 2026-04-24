import React, { useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Layers, Users, UserCircle } from 'lucide-react';
import { ClipboardList, BarChart3, FolderKanban } from 'lucide-react';
import { ConfirmDialog } from '@/components/common';
import { PermissionModal } from './PermissionModal';
import { PermissionGroupModal } from './PermissionGroupModal';
import { ManageGroupPermissionsModal } from './ManageGroupPermissionsModal';
import { ManageRolePermissionGroupsModal } from './ManageRolePermissionGroupsModal';
import { RoleModal } from './RoleModal';
import { PermissionList } from './permissions/PermissionList';
import { PermissionDetail } from './permissions/PermissionDetail';
import { PermissionGroupList } from './permission-groups/PermissionGroupList';
import { RoleList } from './roles/RoleList';
import { DetailPanel } from './shared/DetailPanel';
import { RoleDetail } from './roles/RoleDetail';
import { PermissionGroupDetail } from './permission-groups/PermissionGroupDetail';
import { PermissionsDashboardStats } from './PermissionsDashboardStats';
import { MyPermissionsTabContent } from './MyPermissionsTabContent';
import { AssignmentsTab } from '@/pages/permissions/tabs/AssignmentsTab';
import { AnalyticsTab } from '@/pages/permissions/tabs/AnalyticsTab';
import { ProjectCatalogTab } from './catalog/ProjectCatalogTab';
import { usePermissionManagement } from '@/contexts/PermissionManagementContext';
import { useGlobalRoles } from '@/hooks/useGlobalRoles';
import { useToast } from '@/hooks';
import { globalRolesService } from '@/services';
import type {
  GlobalPermission,
  GlobalPermissionGroup,
  GlobalRole,
} from '@/types/global-roles.types';

const VALID_TABS = [
  'permissions',
  'groups',
  'roles',
  'assignments',
  'analytics',
  'catalog',
  'my-permissions',
] as const;

type PermissionTab = (typeof VALID_TABS)[number];

const DEFAULT_TAB = 'permissions';

export function PermissionsDashboard(): React.JSX.Element {
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    permissions,
    permissionGroups,
    permissionsLoading,
    permissionGroupsLoading,
    refreshPermissions,
    refreshPermissionGroups,
    categories,
  } = usePermissionManagement();

  const { roles, loadingRoles, refreshRoles, currentRole } = useGlobalRoles();

  // Tab state from URL query param
  const tabParam = searchParams.get('tab');
  const activeTab: PermissionTab =
    tabParam !== null && VALID_TABS.includes(tabParam as PermissionTab)
      ? (tabParam as PermissionTab)
      : DEFAULT_TAB;

  const handleTabChange = useCallback(
    (tabId: string) => {
      setSearchParams((prev) => {
        prev.set('tab', tabId);
        return prev;
      });
    },
    [setSearchParams]
  );

  // Modal states
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isManagePermissionsModalOpen, setIsManagePermissionsModalOpen] =
    useState(false);
  const [isManageRoleGroupsModalOpen, setIsManageRoleGroupsModalOpen] =
    useState(false);

  // Edit states
  const [editingPermission, setEditingPermission] =
    useState<GlobalPermission | null>(null);
  const [editingGroup, setEditingGroup] =
    useState<GlobalPermissionGroup | null>(null);
  const [editingRole, setEditingRole] = useState<GlobalRole | null>(null);
  const [managingGroup, setManagingGroup] =
    useState<GlobalPermissionGroup | null>(null);
  const [managingRole, setManagingRole] = useState<GlobalRole | null>(null);

  // Delete states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'permission' | 'group' | 'role';
    item: any;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Detail panel states
  const [selectedRole, setSelectedRole] = useState<GlobalRole | null>(null);
  const [selectedGroup, setSelectedGroup] =
    useState<GlobalPermissionGroup | null>(null);
  const [selectedPermission, setSelectedPermission] =
    useState<GlobalPermission | null>(null);
  const [isRoleDetailOpen, setIsRoleDetailOpen] = useState(false);
  const [isGroupDetailOpen, setIsGroupDetailOpen] = useState(false);
  const [isPermissionDetailOpen, setIsPermissionDetailOpen] = useState(false);

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

  const handleDeleteClick = (
    type: 'permission' | 'group' | 'role',
    item: any
  ) => {
    setDeleteTarget({ type, item });
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      if (deleteTarget.type === 'permission') {
        await globalRolesService.deletePermission(
          deleteTarget.item.permission_hash
        );
        showToast('Permission deleted successfully', 'success');
        await refreshPermissions();
      } else if (deleteTarget.type === 'group') {
        await globalRolesService.deletePermissionGroup(
          deleteTarget.item.group_hash
        );
        showToast('Permission group deleted successfully', 'success');
        await refreshPermissionGroups();
      } else if (deleteTarget.type === 'role') {
        await globalRolesService.deleteRole(deleteTarget.item.role_hash);
        showToast('Role deleted successfully', 'success');
        await refreshRoles();
      }
      setIsDeleteDialogOpen(false);
      setDeleteTarget(null);
    } catch (error) {
showToast(error instanceof Error ? error.message : 'Delete failed', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePermissionSubmit = async (data: any) => {
    try {
      if (editingPermission) {
        await globalRolesService.updatePermission(
          editingPermission.permission_hash,
          data
        );
        showToast('Permission updated successfully', 'success');
      } else {
        await globalRolesService.createPermission(data);
        showToast('Permission created successfully', 'success');
      }
      await refreshPermissions();
      setIsPermissionModalOpen(false);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Operation failed', 'error');
      throw error;
    }
  };

  const handleGroupSubmit = async (data: any) => {
    try {
      if (editingGroup) {
        await globalRolesService.updatePermissionGroup(
          editingGroup.group_hash,
          data
        );
        showToast('Permission group updated successfully', 'success');
      } else {
        await globalRolesService.createPermissionGroup(data);
        showToast('Permission group created successfully', 'success');
      }
      await refreshPermissionGroups();
      setIsGroupModalOpen(false);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Operation failed', 'error');
      throw error;
    }
  };

  const handleRoleSubmit = async (data: any) => {
    try {
      if (editingRole) {
        await globalRolesService.updateRole(editingRole.role_hash, data);
        showToast('Role updated successfully', 'success');
      } else {
        await globalRolesService.createRole(data);
        showToast('Role created successfully', 'success');
      }
      await refreshRoles();
      setIsRoleModalOpen(false);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Operation failed', 'error');
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
          <h1 className="text-2xl font-bold tracking-tight">
            Permission Management
          </h1>
          <p className="text-muted-foreground">
            Manage permissions, permission groups, and roles in one place
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <PermissionsDashboardStats
        permissionsCount={permissions.length}
        permissionGroupsCount={permissionGroups.length}
        rolesCount={roles.length}
      />

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
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
          <PermissionList
            permissions={permissions}
            loading={permissionsLoading}
            categories={categories}
            onEdit={handleEditPermission}
            onDelete={(p) => handleDeleteClick('permission', p)}
            onCreate={handleCreatePermission}
            onViewDetails={handlePermissionClick}
          />
        </TabsContent>

        {/* Permission Groups Tab */}
        <TabsContent value="groups" className="space-y-4">
          <PermissionGroupList
            groups={permissionGroups}
            loading={permissionGroupsLoading}
            categories={categories}
            onEdit={handleEditGroup}
            onDelete={(g) => handleDeleteClick('group', g)}
            onManagePermissions={handleManageGroupPermissions}
            onCreate={handleCreateGroup}
            onViewDetails={handleGroupClick}
          />
        </TabsContent>

        {/* Roles Tab */}
        <TabsContent value="roles" className="space-y-4">
          <RoleList
            roles={roles}
            loading={loadingRoles}
            onEdit={handleEditRole}
            onDelete={(r) => handleDeleteClick('role', r)}
            onManagePermissionGroups={handleManageRolePermissionGroups}
            onCreate={handleCreateRole}
            onViewDetails={handleRoleClick}
          />
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
          <MyPermissionsTabContent currentRole={currentRole} />
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
        title={
          selectedPermission?.permission_display_name || 'Permission Details'
        }
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
