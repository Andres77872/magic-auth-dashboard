import React, { useState, useMemo } from 'react';
import { useGlobalRoles, useUsers } from '@/hooks';
import {
  PageContainer,
  PageHeader,
  TabNavigation,
  StatsGrid,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  Modal,
  DataView
} from '@/components/common';
import {
  RoleAssignmentModal,
  RoleCard,
  RoleForm,
  PermissionGroupCard
} from '@/components/features/permissions';
import { Plus, ShieldCheck, Lock, User } from 'lucide-react';
import { useToast } from '@/hooks';
import type { GlobalRole, GlobalPermissionGroup } from '@/types/global-roles.types';
import type { Tab, StatCardProps } from '@/components/common';

export function RoleManagementPage(): React.JSX.Element {
  const {
    roles,
    permissionGroups,
    loadingRoles,
    loadingGroups,
    createRole,
    updateRole,
    deleteRole,
    assignRoleToUser,
    assignPermissionGroupToRole
  } = useGlobalRoles();

  const { users, fetchUsers } = useUsers();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'roles' | 'groups' | 'assignments'>('roles');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid');
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [editingRole, setEditingRole] = useState<GlobalRole | null>(null);
  const [selectedRole, setSelectedRole] = useState<GlobalRole | null>(null);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);

  // Filter roles based on search
  const filteredRoles = useMemo(() => {
    if (!searchQuery) return roles;
    const query = searchQuery.toLowerCase();
    return roles.filter(role =>
      role.role_name.toLowerCase().includes(query) ||
      role.role_display_name.toLowerCase().includes(query) ||
      role.role_description?.toLowerCase().includes(query)
    );
  }, [roles, searchQuery]);

  // Filter permission groups based on search
  const filteredGroups = useMemo(() => {
    if (!searchQuery) return permissionGroups;
    const query = searchQuery.toLowerCase();
    return permissionGroups.filter(group =>
      group.group_name.toLowerCase().includes(query) ||
      group.group_display_name.toLowerCase().includes(query) ||
      group.group_description?.toLowerCase().includes(query)
    );
  }, [permissionGroups, searchQuery]);

  // Group permission groups by category
  const groupedPermissionGroups = useMemo(() => {
    const grouped: Record<string, GlobalPermissionGroup[]> = {};
    filteredGroups.forEach(group => {
      const category = group.group_category || 'Other';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(group);
    });
    return grouped;
  }, [filteredGroups]);

  // Load permission groups for a role
  // Note: Permission groups loading would require additional hook method

  // Handlers
  const handleCreateRole = async (data: any) => {
    try {
      await createRole(data);
      showToast('Role created successfully', 'success');
      setShowRoleForm(false);
    } catch (error) {
      showToast('Failed to create role', 'error');
    }
  };

  const handleUpdateRole = async (data: any) => {
    if (!editingRole) return;
    try {
      await updateRole(editingRole.role_hash, data);
      showToast('Role updated successfully', 'success');
      setEditingRole(null);
      setShowRoleForm(false);
    } catch (error) {
      showToast('Failed to update role', 'error');
    }
  };

  const handleDeleteRole = async (role: GlobalRole) => {
    try {
      await deleteRole(role.role_hash);
      showToast('Role deleted successfully', 'success');
    } catch (error) {
      showToast('Failed to delete role', 'error');
    }
  };

  const handleAssignRole = async (userHash: string, roleHash: string) => {
    try {
      await assignRoleToUser(userHash, roleHash);
      showToast('Role assigned to user successfully', 'success');
      fetchUsers();
    } catch (error) {
      showToast('Failed to assign role to user', 'error');
    }
  };

  const handleAssignPermissionGroup = async (roleHash: string, groupHash: string) => {
    try {
      await assignPermissionGroupToRole(roleHash, groupHash);
      showToast('Permission group assigned to role', 'success');
      // Permission groups will be refreshed automatically
    } catch (error) {
      showToast('Failed to assign permission group', 'error');
    }
  };

  const handleEditRole = (role: GlobalRole) => {
    setEditingRole(role);
    setShowRoleForm(true);
  };

  const handleViewRolePermissions = (role: GlobalRole) => {
    setSelectedRole(role);
  };

  // Generate tabs
  const tabs: Tab[] = [
    {
      id: 'roles',
      label: 'Roles',
      icon: <ShieldCheck size={16} />,
      count: roles.length,
    },
    {
      id: 'groups',
      label: 'Permission Groups',
      icon: <Lock size={16} />,
      count: permissionGroups.length,
    },
    {
      id: 'assignments',
      label: 'Assignments',
      icon: <User size={16} />,
    },
  ];

  // Generate stat cards
  const statCards: StatCardProps[] = [
    {
      title: 'Roles',
      value: roles.length,
      icon: <ShieldCheck size={20} />,
    },
    {
      title: 'Permission Groups',
      value: permissionGroups.length,
      icon: <Lock size={20} />,
    },
    {
      title: 'Users',
      value: users.length,
      icon: <User size={20} />,
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Role Management"
        subtitle="Manage global roles, permission groups, and role assignments"
        icon={<ShieldCheck size={28} />}
        actions={
          <>
            {activeTab === 'roles' && (
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  setEditingRole(null);
                  setShowRoleForm(true);
                }}
                leftIcon={<Plus size={16} />}
              >
                Create Role
              </Button>
            )}
            {activeTab === 'assignments' && (
              <Button
                variant="primary"
                size="md"
                onClick={() => setShowAssignmentModal(true)}
                leftIcon={<User size={16} />}
              >
                Assign Roles
              </Button>
            )}
          </>
        }
      >
        <StatsGrid stats={statCards} columns={3} />
      </PageHeader>

      {/* Tabs */}
      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onChange={(tabId) => setActiveTab(tabId as 'roles' | 'groups' | 'assignments')}
      />

      {/* Role Form Modal */}
      <Modal
        isOpen={showRoleForm}
        onClose={() => {
          setShowRoleForm(false);
          setEditingRole(null);
        }}
        title={editingRole ? 'Edit Global Role' : 'Create New Global Role'}
        size="lg"
        showCloseButton={true}
      >
        <RoleForm
          mode={editingRole ? 'edit' : 'create'}
          initialData={editingRole || undefined}
          onSubmit={editingRole ? handleUpdateRole : handleCreateRole}
          onCancel={() => {
            setShowRoleForm(false);
            setEditingRole(null);
          }}
        />
      </Modal>

      {/* Content Area */}
      {/* Roles Tab */}
      {activeTab === 'roles' && (
        <DataView
          data={filteredRoles}
          columns={[
            { key: 'role_display_name', header: 'Role Name', sortable: true },
            { key: 'role_name', header: 'Internal Name', sortable: true },
            { key: 'role_priority', header: 'Priority', sortable: true },
            { key: 'role_description', header: 'Description' },
          ]}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          showViewToggle={true}
          showSearch={true}
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search roles..."
          defaultViewMode="grid"
          renderCard={(role) => (
            <RoleCard
              key={role.role_hash}
              role={role}
              onEdit={handleEditRole}
              onDelete={handleDeleteRole}
              onManagePermissionGroups={() => handleViewRolePermissions(role)}
              onAssignUsers={() => {
                setSelectedRole(role);
                setShowAssignmentModal(true);
              }}
              userCount={users.filter(u => u.user_type === role.role_name).length}
              permissionGroupCount={0}
            />
          )}
          isLoading={loadingRoles}
          emptyMessage="No roles found"
          emptyIcon={<ShieldCheck size={48} aria-hidden="true" />}
          emptyAction={
            <Button onClick={() => setShowRoleForm(true)} variant="primary">
              <Plus size={18} aria-hidden="true" />
              Create Role
            </Button>
          }
          skeletonRows={6}
          gridColumns={{
            mobile: 1,
            tablet: 2,
            desktop: 3,
          }}
        />
      )}

      {/* Permission Groups Tab */}
      {activeTab === 'groups' && (
        <div className="groups-section">
          {loadingGroups ? (
            <DataView
              data={[]}
              columns={[]}
              viewMode="grid"
              isLoading={true}
              skeletonRows={6}
              gridColumns={{
                mobile: 1,
                tablet: 2,
                desktop: 3,
              }}
            />
          ) : Object.keys(groupedPermissionGroups).length === 0 ? (
            <Card className="empty-state-card" padding="lg">
              <Lock size={48} aria-hidden="true" />
              <h3>No permission groups found</h3>
              <p>Permission groups are managed by the system</p>
            </Card>
          ) : (
            Object.entries(groupedPermissionGroups).map(([category, groups]) => (
              <div key={category} className="category-section">
                <h3 className="category-title">
                  <Badge variant="secondary">{category}</Badge>
                  <span className="category-count">{groups.length} groups</span>
                </h3>
                <DataView
                  data={groups}
                  columns={[
                    { key: 'group_display_name', header: 'Group Name', sortable: true },
                    { key: 'group_name', header: 'Internal Name', sortable: true },
                    { key: 'group_category', header: 'Category', sortable: true },
                    { key: 'group_description', header: 'Description' },
                  ]}
                  viewMode="grid"
                  defaultViewMode="grid"
                  renderCard={(group: GlobalPermissionGroup) => (
                    <PermissionGroupCard
                      key={group.group_hash}
                      group={group}
                      permissionCount={0}
                      onManagePermissions={selectedRole 
                        ? () => handleAssignPermissionGroup(selectedRole.role_hash, group.group_hash) 
                        : undefined
                      }
                    />
                  )}
                  gridColumns={{
                    mobile: 1,
                    tablet: 2,
                    desktop: 3,
                  }}
                />
              </div>
            ))
          )}
        </div>
      )}

      {/* Assignments Tab */}
      {activeTab === 'assignments' && (
        <Card padding="lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck size={20} aria-hidden="true" />
              Role Assignment Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="assignment-stats">
              {roles.map(role => {
                const userCount = users.filter(u => u.user_type === role.role_name).length;
                return (
                  <div key={role.role_hash} className="assignment-stat-item">
                    <div className="stat-header">
                      <span className="stat-role-name">{role.role_display_name}</span>
                      <Badge variant="secondary">{userCount} users</Badge>
                    </div>
                    <div className="stat-bar">
                      <div
                        className="stat-bar-fill"
                        style={{
                          width: `${users.length > 0 ? (userCount / users.length) * 100 : 0}%`
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="assignment-actions">
              <Button onClick={() => setShowAssignmentModal(true)} variant="primary">
                <User size={18} aria-hidden="true" />
                Assign Roles to Users
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Role Assignment Modal */}
      <RoleAssignmentModal
        isOpen={showAssignmentModal}
        onClose={() => {
          setShowAssignmentModal(false);
          setSelectedRole(null);
        }}
        users={users.map(u => ({
          user_hash: u.user_hash,
          username: u.username,
          email: u.email,
          user_type: u.user_type,
          current_role: u.user_type
        }))}
        onAssignRole={handleAssignRole}
      />
    </PageContainer>
  );
}

export default RoleManagementPage;
