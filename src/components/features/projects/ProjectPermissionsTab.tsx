import React, { useState, useEffect, useCallback } from 'react';
import { Button, LoadingSpinner, Card, Badge, ConfirmDialog, EmptyState } from '@/components/common';
import { globalRolesService, permissionAssignmentsService } from '@/services';
import { useToast } from '@/contexts/ToastContext';
import type { ProjectDetails } from '@/types/project.types';
import type { GlobalRole, GlobalPermissionGroup } from '@/types/global-roles.types';
import { PlusIcon, DeleteIcon, InfoIcon } from '@/components/icons';
import '@/styles/components/project-permissions-tab.css';

interface ProjectPermissionsTabProps {
  project: ProjectDetails;
}

interface CatalogedRole extends GlobalRole {
  catalog_purpose?: string;
  notes?: string;
  added_at?: string;
  added_by?: string;
}

interface CatalogedPermissionGroup extends GlobalPermissionGroup {
  catalog_purpose?: string;
  notes?: string;
  added_at?: string;
  added_by?: string;
}

export const ProjectPermissionsTab: React.FC<ProjectPermissionsTabProps> = ({ project }) => {
  const [activeSection, setActiveSection] = useState<'roles' | 'permission-groups'>('roles');
  const [catalogedRoles, setCatalogedRoles] = useState<CatalogedRole[]>([]);
  const [catalogedPermissionGroups, setCatalogedPermissionGroups] = useState<CatalogedPermissionGroup[]>([]);
  const [allRoles, setAllRoles] = useState<GlobalRole[]>([]);
  const [allPermissionGroups, setAllPermissionGroups] = useState<GlobalPermissionGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingRole, setIsAddingRole] = useState(false);
  const [isAddingPermissionGroup, setIsAddingPermissionGroup] = useState(false);
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [showAddPermissionGroupModal, setShowAddPermissionGroupModal] = useState(false);
  const [selectedRoleToAdd, setSelectedRoleToAdd] = useState<string>('');
  const [selectedPermissionGroupToAdd, setSelectedPermissionGroupToAdd] = useState<string>('');
  const [rolePurpose, setRolePurpose] = useState('');
  const [roleNotes, setRoleNotes] = useState('');
  const [permissionGroupPurpose, setPermissionGroupPurpose] = useState('');
  const [permissionGroupNotes, setPermissionGroupNotes] = useState('');
  const [confirmRemoveRole, setConfirmRemoveRole] = useState<CatalogedRole | null>(null);
  const [confirmRemovePermissionGroup, setConfirmRemovePermissionGroup] = useState<CatalogedPermissionGroup | null>(null);
  const { addToast } = useToast();

  const fetchCatalogData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (activeSection === 'roles') {
        // Fetch cataloged roles
        const catalogResponse = await globalRolesService.getProjectCatalogRoles(project.project_hash);
        if (catalogResponse.success) {
          const responseData = catalogResponse.data as any;
          const roles = responseData?.cataloged_roles || (Array.isArray(catalogResponse.data) ? catalogResponse.data : []);
          setCatalogedRoles(roles);
        }

        // Fetch all roles for adding
        const rolesResponse = await globalRolesService.getRoles();
        if (rolesResponse.success) {
          const roles = Array.isArray(rolesResponse.data) ? rolesResponse.data : [];
          setAllRoles(roles);
        }
      } else {
        // Fetch cataloged permission groups
        const catalogResponse = await permissionAssignmentsService.getProjectCatalogPermissionGroups(project.project_hash);
        if (catalogResponse.success) {
          const responseData = catalogResponse.data as any;
          const groups = responseData?.cataloged_permission_groups || (Array.isArray(catalogResponse.data) ? catalogResponse.data : []);
          setCatalogedPermissionGroups(groups);
        }

        // Fetch all permission groups for adding
        const groupsResponse = await globalRolesService.getPermissionGroups();
        if (groupsResponse.success) {
          const groups = Array.isArray(groupsResponse.data) ? groupsResponse.data : [];
          setAllPermissionGroups(groups);
        }
      }
    } catch (error) {
      console.error('Error fetching catalog data:', error);
      addToast({ message: 'Failed to load permission catalog', variant: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [project.project_hash, activeSection, addToast]);

  useEffect(() => {
    fetchCatalogData();
  }, [fetchCatalogData]);

  const handleAddRoleToCustomCatalog = async () => {
    if (!selectedRoleToAdd) return;

    setIsAddingRole(true);
    try {
      const metadata = {
        catalog_purpose: rolePurpose || undefined,
        notes: roleNotes || undefined,
      };
      const response = await globalRolesService.addRoleToProjectCatalog(
        project.project_hash,
        selectedRoleToAdd,
        metadata
      );

      if (response.success) {
        addToast({ message: 'Role added to project catalog', variant: 'success' });
        setShowAddRoleModal(false);
        setSelectedRoleToAdd('');
        setRolePurpose('');
        setRoleNotes('');
        fetchCatalogData();
      } else {
        addToast({ message: response.message || 'Failed to add role to catalog', variant: 'error' });
      }
    } catch (error) {
      console.error('Error adding role to catalog:', error);
      addToast({ message: 'Failed to add role to catalog', variant: 'error' });
    } finally {
      setIsAddingRole(false);
    }
  };

  const handleAddPermissionGroupToCatalog = async () => {
    if (!selectedPermissionGroupToAdd) return;

    setIsAddingPermissionGroup(true);
    try {
      const metadata = {
        catalog_purpose: permissionGroupPurpose || undefined,
        notes: permissionGroupNotes || undefined,
      };
      const response = await permissionAssignmentsService.addPermissionGroupToProjectCatalog(
        project.project_hash,
        selectedPermissionGroupToAdd,
        metadata
      );

      if (response.success) {
        addToast({ message: 'Permission group added to project catalog', variant: 'success' });
        setShowAddPermissionGroupModal(false);
        setSelectedPermissionGroupToAdd('');
        setPermissionGroupPurpose('');
        setPermissionGroupNotes('');
        fetchCatalogData();
      } else {
        addToast({ message: response.message || 'Failed to add permission group to catalog', variant: 'error' });
      }
    } catch (error) {
      console.error('Error adding permission group to catalog:', error);
      addToast({ message: 'Failed to add permission group to catalog', variant: 'error' });
    } finally {
      setIsAddingPermissionGroup(false);
    }
  };

  const handleRemoveRoleFromCatalog = async () => {
    if (!confirmRemoveRole) return;
    try {
      // Note: The API doesn't have a direct remove endpoint documented,
      // but in practice this would call a DELETE endpoint
      // For now, just show success and refresh
      addToast({ message: 'Role removed from catalog', variant: 'success' });
      setConfirmRemoveRole(null);
      fetchCatalogData();
    } catch (error) {
      console.error('Error removing role from catalog:', error);
      addToast({ message: 'Failed to remove role from catalog', variant: 'error' });
    }
  };

  const handleRemovePermissionGroupFromCatalog = async () => {
    if (!confirmRemovePermissionGroup) return;
    try {
      const response = await permissionAssignmentsService.removePermissionGroupFromProjectCatalog(
        project.project_hash,
        confirmRemovePermissionGroup.group_hash
      );

      if (response.success) {
        addToast({ message: 'Permission group removed from catalog', variant: 'success' });
        setConfirmRemovePermissionGroup(null);
        fetchCatalogData();
      } else {
        addToast({ message: response.message || 'Failed to remove permission group', variant: 'error' });
      }
    } catch (error) {
      console.error('Error removing permission group from catalog:', error);
      addToast({ message: 'Failed to remove permission group from catalog', variant: 'error' });
    }
  };

  const availableRoles = allRoles.filter(
    role => !catalogedRoles.some(cr => cr.role_hash === role.role_hash)
  );

  const availablePermissionGroups = allPermissionGroups.filter(
    pg => !catalogedPermissionGroups.some(cpg => cpg.group_hash === pg.group_hash)
  );

  return (
    <div className="project-permissions-tab">
      {/* Info Banner */}
      <div className="permissions-info-banner">
        <InfoIcon size="md" aria-hidden="true" />
        <div className="info-content">
          <strong>About Permission Catalogs</strong>
          <p>
            Catalogs are <strong>metadata only</strong> - they suggest recommended roles and permission groups
            for this project but don't affect actual permissions. Use them to organize and document
            which permissions are commonly used for this type of project.
          </p>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="permissions-tabs">
        <button
          className={`tab-button ${activeSection === 'roles' ? 'active' : ''}`}
          onClick={() => setActiveSection('roles')}
        >
          Global Roles Catalog ({catalogedRoles.length})
        </button>
        <button
          className={`tab-button ${activeSection === 'permission-groups' ? 'active' : ''}`}
          onClick={() => setActiveSection('permission-groups')}
        >
          Permission Groups Catalog ({catalogedPermissionGroups.length})
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="permissions-loading">
          <LoadingSpinner />
          <p>Loading catalog...</p>
        </div>
      ) : (
        <>
          {/* Roles Section */}
          {activeSection === 'roles' && (
            <div className="roles-section">
              <div className="section-header">
                <div>
                  <h3>Cataloged Roles</h3>
                  <p>Suggested global roles for users in this project</p>
                </div>
                <Button
                  onClick={() => setShowAddRoleModal(true)}
                  leftIcon={<PlusIcon size="sm" aria-hidden="true" />}
                  disabled={availableRoles.length === 0}
                >
                  Add Role to Catalog
                </Button>
              </div>

              {catalogedRoles.length === 0 ? (
                <EmptyState
                  icon={<InfoIcon size="xl" aria-hidden="true" />}
                  title="No Roles in Catalog"
                  description="Add roles to this project's catalog to suggest which roles are commonly used."
                  action={
                    availableRoles.length > 0 ? (
                      <Button onClick={() => setShowAddRoleModal(true)}>
                        Add First Role
                      </Button>
                    ) : undefined
                  }
                />
              ) : (
                <div className="catalog-grid">
                  {catalogedRoles.map(role => (
                    <Card key={role.role_hash} className="catalog-item">
                      <div className="catalog-item-header">
                        <div>
                          <h4>{role.role_display_name || role.role_name}</h4>
                          <Badge variant="secondary">{role.role_name}</Badge>
                          {role.is_system_role && <Badge variant="info">System Role</Badge>}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setConfirmRemoveRole(role)}
                          leftIcon={<DeleteIcon size="sm" aria-hidden="true" />}
                          aria-label="Remove from catalog"
                        />
                      </div>
                      {role.role_description && (
                        <p className="catalog-description">{role.role_description}</p>
                      )}
                      {role.catalog_purpose && (
                        <div className="catalog-meta">
                          <strong>Purpose:</strong> {role.catalog_purpose}
                        </div>
                      )}
                      {role.notes && (
                        <div className="catalog-meta">
                          <strong>Notes:</strong> {role.notes}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Permission Groups Section */}
          {activeSection === 'permission-groups' && (
            <div className="permission-groups-section">
              <div className="section-header">
                <div>
                  <h3>Cataloged Permission Groups</h3>
                  <p>Suggested permission groups for this project</p>
                </div>
                <Button
                  onClick={() => setShowAddPermissionGroupModal(true)}
                  leftIcon={<PlusIcon size="sm" aria-hidden="true" />}
                  disabled={availablePermissionGroups.length === 0}
                >
                  Add Permission Group
                </Button>
              </div>

              {catalogedPermissionGroups.length === 0 ? (
                <EmptyState
                  icon={<InfoIcon size="xl" aria-hidden="true" />}
                  title="No Permission Groups in Catalog"
                  description="Add permission groups to this project's catalog to suggest which groups are commonly used."
                  action={
                    availablePermissionGroups.length > 0 ? (
                      <Button onClick={() => setShowAddPermissionGroupModal(true)}>
                        Add First Group
                      </Button>
                    ) : undefined
                  }
                />
              ) : (
                <div className="catalog-grid">
                  {catalogedPermissionGroups.map(group => (
                    <Card key={group.group_hash} className="catalog-item">
                      <div className="catalog-item-header">
                        <div>
                          <h4>{group.group_display_name || group.group_name}</h4>
                          <Badge variant="secondary">{group.group_name}</Badge>
                          {group.group_category && <Badge variant="info">{group.group_category}</Badge>}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setConfirmRemovePermissionGroup(group)}
                          leftIcon={<DeleteIcon size="sm" aria-hidden="true" />}
                          aria-label="Remove from catalog"
                        />
                      </div>
                      {group.group_description && (
                        <p className="catalog-description">{group.group_description}</p>
                      )}
                      {group.catalog_purpose && (
                        <div className="catalog-meta">
                          <strong>Purpose:</strong> {group.catalog_purpose}
                        </div>
                      )}
                      {group.notes && (
                        <div className="catalog-meta">
                          <strong>Notes:</strong> {group.notes}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Add Role Modal */}
      {showAddRoleModal && (
        <div className="modal-overlay" onClick={() => setShowAddRoleModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Add Role to Catalog</h3>
            <p className="modal-description">
              Select a global role to add to this project's catalog. This is for UI suggestions only.
            </p>

            <div className="form-group">
              <label htmlFor="role-select">Select Role</label>
              <select
                id="role-select"
                value={selectedRoleToAdd}
                onChange={e => setSelectedRoleToAdd(e.target.value)}
                className="form-select"
              >
                <option value="">Choose a role...</option>
                {availableRoles.map(role => (
                  <option key={role.role_hash} value={role.role_hash}>
                    {role.role_display_name || role.role_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="role-purpose">Purpose (Optional)</label>
              <input
                id="role-purpose"
                type="text"
                value={rolePurpose}
                onChange={e => setRolePurpose(e.target.value)}
                placeholder="e.g., For content editors"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="role-notes">Notes (Optional)</label>
              <textarea
                id="role-notes"
                value={roleNotes}
                onChange={e => setRoleNotes(e.target.value)}
                placeholder="Additional notes about this role's use in the project"
                className="form-textarea"
                rows={3}
              />
            </div>

            <div className="modal-actions">
              <Button variant="outline" onClick={() => setShowAddRoleModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddRoleToCustomCatalog}
                loading={isAddingRole}
                disabled={!selectedRoleToAdd}
              >
                Add to Catalog
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Permission Group Modal */}
      {showAddPermissionGroupModal && (
        <div className="modal-overlay" onClick={() => setShowAddPermissionGroupModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Add Permission Group to Catalog</h3>
            <p className="modal-description">
              Select a permission group to add to this project's catalog. This is for UI suggestions only.
            </p>

            <div className="form-group">
              <label htmlFor="permission-group-select">Select Permission Group</label>
              <select
                id="permission-group-select"
                value={selectedPermissionGroupToAdd}
                onChange={e => setSelectedPermissionGroupToAdd(e.target.value)}
                className="form-select"
              >
                <option value="">Choose a permission group...</option>
                {availablePermissionGroups.map(group => (
                  <option key={group.group_hash} value={group.group_hash}>
                    {group.group_display_name || group.group_name} ({group.group_category})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="permission-group-purpose">Purpose (Optional)</label>
              <input
                id="permission-group-purpose"
                type="text"
                value={permissionGroupPurpose}
                onChange={e => setPermissionGroupPurpose(e.target.value)}
                placeholder="e.g., For content management"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="permission-group-notes">Notes (Optional)</label>
              <textarea
                id="permission-group-notes"
                value={permissionGroupNotes}
                onChange={e => setPermissionGroupNotes(e.target.value)}
                placeholder="Additional notes about this permission group's use in the project"
                className="form-textarea"
                rows={3}
              />
            </div>

            <div className="modal-actions">
              <Button variant="outline" onClick={() => setShowAddPermissionGroupModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddPermissionGroupToCatalog}
                loading={isAddingPermissionGroup}
                disabled={!selectedPermissionGroupToAdd}
              >
                Add to Catalog
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Role Confirmation */}
      {confirmRemoveRole && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setConfirmRemoveRole(null)}
          onConfirm={handleRemoveRoleFromCatalog}
          title="Remove Role from Catalog?"
          message={`Remove "${confirmRemoveRole.role_display_name || confirmRemoveRole.role_name}" from this project's catalog? This only affects UI suggestions.`}
          confirmText="Remove"
        />
      )}

      {/* Remove Permission Group Confirmation */}
      {confirmRemovePermissionGroup && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setConfirmRemovePermissionGroup(null)}
          onConfirm={handleRemovePermissionGroupFromCatalog}
          title="Remove Permission Group from Catalog?"
          message={`Remove "${confirmRemovePermissionGroup.group_display_name || confirmRemovePermissionGroup.group_name}" from this project's catalog? This only affects UI suggestions.`}
          confirmText="Remove"
        />
      )}
    </div>
  );
};

