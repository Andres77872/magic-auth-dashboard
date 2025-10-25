import React, { useState, useMemo } from 'react';
import { useGlobalRoles, useUsers } from '@/hooks';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Badge } from '@/components/common';
import {
  GlobalRoleCard,
  GlobalRoleForm,
  PermissionGroupCard,
  RoleAssignmentModal
} from '@/components/features/roles';
import { SearchIcon, PlusIcon, SecurityIcon, LockIcon, UserIcon } from '@/components/icons';
import { useToast } from '@/hooks';
import type { GlobalRole, GlobalPermissionGroup } from '@/types/global-roles.types';
import '../../styles/pages/role-management.css';

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

  const handleDeleteRole = async (roleHash: string) => {
    try {
      await deleteRole(roleHash);
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

  const handleViewRolePermissions = (roleHash: string) => {
    const role = roles.find(r => r.role_hash === roleHash);
    setSelectedRole(role || null);
    // Permission groups would be loaded here with additional hook method
  };

  return (
    <div className="role-management-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="header-content">
          <div className="title-section">
            <h1>🎭 Role Management</h1>
            <p className="subtitle">
              Manage global roles, permission groups, and role assignments
            </p>
          </div>

          <div className="header-stats">
            <div className="stat-card">
              <SecurityIcon size={20} aria-hidden="true" />
              <div>
                <div className="stat-value">{roles.length}</div>
                <div className="stat-label">Roles</div>
              </div>
            </div>
            <div className="stat-card">
              <LockIcon size={20} aria-hidden="true" />
              <div>
                <div className="stat-value">{permissionGroups.length}</div>
                <div className="stat-label">Permission Groups</div>
              </div>
            </div>
            <div className="stat-card">
              <UserIcon size={20} aria-hidden="true" />
              <div>
                <div className="stat-value">{users.length}</div>
                <div className="stat-label">Users</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="tab-navigation">
        <button
          className={`tab-button ${activeTab === 'roles' ? 'active' : ''}`}
          onClick={() => setActiveTab('roles')}
        >
          <SecurityIcon size={16} aria-hidden="true" />
          Roles
        </button>
        <button
          className={`tab-button ${activeTab === 'groups' ? 'active' : ''}`}
          onClick={() => setActiveTab('groups')}
        >
          <LockIcon size={16} aria-hidden="true" />
          Permission Groups
        </button>
        <button
          className={`tab-button ${activeTab === 'assignments' ? 'active' : ''}`}
          onClick={() => setActiveTab('assignments')}
        >
          <UserIcon size={16} aria-hidden="true" />
          Assignments
        </button>
      </div>

      {/* Search and Actions Bar */}
      <div className="actions-bar">
        <div className="search-section">
          <div className="search-input-wrapper">
            <SearchIcon size={18} aria-hidden="true" className="search-icon" />
            <Input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="action-buttons">
          {activeTab === 'roles' && (
            <Button
              onClick={() => {
                setEditingRole(null);
                setShowRoleForm(true);
              }}
            >
              <PlusIcon size={18} aria-hidden="true" />
              Create Role
            </Button>
          )}
          {activeTab === 'assignments' && (
            <Button onClick={() => setShowAssignmentModal(true)}>
              <UserIcon size={18} aria-hidden="true" />
              Assign Roles
            </Button>
          )}
        </div>
      </div>

      {/* Role Form Modal */}
      {showRoleForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <GlobalRoleForm
              mode={editingRole ? 'edit' : 'create'}
              initialData={editingRole || undefined}
              onSubmit={editingRole ? handleUpdateRole : handleCreateRole}
              onCancel={() => {
                setShowRoleForm(false);
                setEditingRole(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="content-area">
        {/* Roles Tab */}
        {activeTab === 'roles' && (
          <div className="roles-grid">
            {loadingRoles ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading roles...</p>
              </div>
            ) : filteredRoles.length === 0 ? (
              <div className="empty-state">
                <SecurityIcon size={48} aria-hidden="true" />
                <h3>No roles found</h3>
                <p>Create your first role to get started</p>
                <Button onClick={() => setShowRoleForm(true)}>
                  <PlusIcon size={18} aria-hidden="true" />
                  Create Role
                </Button>
              </div>
            ) : (
              filteredRoles.map(role => (
                <GlobalRoleCard
                  key={role.role_hash}
                  role={role}
                  onEdit={handleEditRole}
                  onDelete={handleDeleteRole}
                  onViewPermissions={handleViewRolePermissions}
                  onAssignUsers={() => {
                    setSelectedRole(role);
                    setShowAssignmentModal(true);
                  }}
                  userCount={users.filter(u => u.user_type === role.role_name).length}
                />
              ))
            )}
          </div>
        )}

        {/* Permission Groups Tab */}
        {activeTab === 'groups' && (
          <div className="groups-section">
            {loadingGroups ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading permission groups...</p>
              </div>
            ) : Object.keys(groupedPermissionGroups).length === 0 ? (
              <div className="empty-state">
                <LockIcon size={48} aria-hidden="true" />
                <h3>No permission groups found</h3>
                <p>Permission groups are managed by the system</p>
              </div>
            ) : (
              Object.entries(groupedPermissionGroups).map(([category, groups]) => (
                <div key={category} className="category-section">
                  <h3 className="category-title">
                    <Badge variant="secondary">{category}</Badge>
                    <span className="category-count">{groups.length} groups</span>
                  </h3>
                  <div className="groups-grid">
                    {groups.map(group => (
                      <PermissionGroupCard
                        key={group.group_hash}
                        group={group}
                        onViewPermissions={(hash) => console.log('View permissions:', hash)}
                        onAssignToRole={selectedRole ? (hash) => handleAssignPermissionGroup(selectedRole.role_hash, hash) : undefined}
                        isAssigned={false}
                      />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Assignments Tab */}
        {activeTab === 'assignments' && (
          <div className="assignments-section">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SecurityIcon size={20} aria-hidden="true" />
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
                  <Button onClick={() => setShowAssignmentModal(true)}>
                    <UserIcon size={18} aria-hidden="true" />
                    Assign Roles to Users
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

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
    </div>
  );
}

export default RoleManagementPage;
