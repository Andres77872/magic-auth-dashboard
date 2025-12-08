import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ConfirmDialog, EmptyState, TabNavigation } from '@/components/common';
import type { Tab } from '@/components/common';
import { globalRolesService, permissionAssignmentsService } from '@/services';
import { useToast } from '@/contexts/ToastContext';
import type { ProjectDetails } from '@/types/project.types';
import type { GlobalRole, GlobalPermissionGroup } from '@/types/global-roles.types';
import { Plus, Trash2, Info } from 'lucide-react';

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
      const response = await globalRolesService.removeRoleFromProjectCatalog(
        project.project_hash,
        confirmRemoveRole.role_hash
      );

      if (response.success) {
        addToast({ message: 'Role removed from catalog', variant: 'success' });
        setConfirmRemoveRole(null);
        fetchCatalogData();
      } else {
        addToast({ message: response.message || 'Failed to remove role from catalog', variant: 'error' });
      }
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

  const tabs: Tab[] = [
    {
      id: 'roles',
      label: 'Global Roles Catalog',
      count: catalogedRoles.length,
    },
    {
      id: 'permission-groups',
      label: 'Permission Groups Catalog',
      count: catalogedPermissionGroups.length,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-info/10 border border-info/20">
        <Info className="h-5 w-5 text-info mt-0.5 flex-shrink-0" aria-hidden="true" />
        <div className="space-y-1">
          <strong className="text-sm font-semibold">About Permission Catalogs</strong>
          <p className="text-sm text-muted-foreground">
            Catalogs are <strong>metadata only</strong> - they suggest recommended roles and permission groups
            for this project but don't affect actual permissions. Use them to organize and document
            which permissions are commonly used for this type of project.
          </p>
        </div>
      </div>

      {/* Section Tabs */}
      <TabNavigation
        tabs={tabs}
        activeTab={activeSection}
        onChange={(tabId) => setActiveSection(tabId as 'roles' | 'permission-groups')}
      />

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Spinner size="lg" />
          <p className="text-sm text-muted-foreground mt-2">Loading catalog...</p>
        </div>
      ) : (
        <>
          {/* Roles Section */}
          {activeSection === 'roles' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Cataloged Roles</h3>
                  <p className="text-sm text-muted-foreground">Suggested global roles for users in this project</p>
                </div>
                <Button
                  onClick={() => setShowAddRoleModal(true)}
                  disabled={availableRoles.length === 0}
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Add Role to Catalog
                </Button>
              </div>

              {catalogedRoles.length === 0 ? (
                <EmptyState
                  icon={<Info className="h-8 w-8" aria-hidden="true" />}
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
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {catalogedRoles.map(role => (
                    <Card key={role.role_hash}>
                      <CardContent className="pt-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <h4 className="font-medium">{role.role_display_name || role.role_name}</h4>
                            <div className="flex gap-1 flex-wrap">
                              <Badge variant="secondary">{role.role_name}</Badge>
                              {role.is_system_role && <Badge variant="info">System Role</Badge>}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setConfirmRemoveRole(role)}
                            aria-label="Remove from catalog"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        </div>
                        {role.role_description && (
                          <p className="text-sm text-muted-foreground">{role.role_description}</p>
                        )}
                        {role.catalog_purpose && (
                          <div className="text-sm">
                            <strong>Purpose:</strong> {role.catalog_purpose}
                          </div>
                        )}
                        {role.notes && (
                          <div className="text-sm">
                            <strong>Notes:</strong> {role.notes}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Permission Groups Section */}
          {activeSection === 'permission-groups' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Cataloged Permission Groups</h3>
                  <p className="text-sm text-muted-foreground">Suggested permission groups for this project</p>
                </div>
                <Button
                  onClick={() => setShowAddPermissionGroupModal(true)}
                  disabled={availablePermissionGroups.length === 0}
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Add Permission Group
                </Button>
              </div>

              {catalogedPermissionGroups.length === 0 ? (
                <EmptyState
                  icon={<Info className="h-8 w-8" aria-hidden="true" />}
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
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {catalogedPermissionGroups.map(group => (
                    <Card key={group.group_hash}>
                      <CardContent className="pt-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <h4 className="font-medium">{group.group_display_name || group.group_name}</h4>
                            <div className="flex gap-1 flex-wrap">
                              <Badge variant="secondary">{group.group_name}</Badge>
                              {group.group_category && <Badge variant="info">{group.group_category}</Badge>}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setConfirmRemovePermissionGroup(group)}
                            aria-label="Remove from catalog"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        </div>
                        {group.group_description && (
                          <p className="text-sm text-muted-foreground">{group.group_description}</p>
                        )}
                        {group.catalog_purpose && (
                          <div className="text-sm">
                            <strong>Purpose:</strong> {group.catalog_purpose}
                          </div>
                        )}
                        {group.notes && (
                          <div className="text-sm">
                            <strong>Notes:</strong> {group.notes}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Add Role Modal */}
      <Dialog open={showAddRoleModal} onOpenChange={(open) => !open && setShowAddRoleModal(false)}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>Add Role to Catalog</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select a global role to add to this project's catalog. This is for UI suggestions only.
            </p>

            <div className="space-y-2">
              <Label htmlFor="role-select">Select Role</Label>
              <Select
                value={selectedRoleToAdd}
                onValueChange={setSelectedRoleToAdd}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a role..." />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map(role => (
                    <SelectItem key={role.role_hash} value={role.role_hash}>
                      {role.role_display_name || role.role_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role-purpose">Purpose (Optional)</Label>
              <Input
                id="role-purpose"
                type="text"
                value={rolePurpose}
                onChange={e => setRolePurpose(e.target.value)}
                placeholder="e.g., For content editors"
                fullWidth
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role-notes">Notes (Optional)</Label>
              <Textarea
                id="role-notes"
                value={roleNotes}
                onChange={e => setRoleNotes(e.target.value)}
                placeholder="Additional notes about this role's use in the project"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
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
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Permission Group Modal */}
      <Dialog open={showAddPermissionGroupModal} onOpenChange={(open) => !open && setShowAddPermissionGroupModal(false)}>
        <DialogContent size="md">
          <DialogHeader>
            <DialogTitle>Add Permission Group to Catalog</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select a permission group to add to this project's catalog. This is for UI suggestions only.
            </p>

            <div className="space-y-2">
              <Label htmlFor="permission-group-select">Select Permission Group</Label>
              <Select
                value={selectedPermissionGroupToAdd}
                onValueChange={setSelectedPermissionGroupToAdd}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a permission group..." />
                </SelectTrigger>
                <SelectContent>
                  {availablePermissionGroups.map(group => (
                    <SelectItem key={group.group_hash} value={group.group_hash}>
                      {group.group_display_name || group.group_name} ({group.group_category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="permission-group-purpose">Purpose (Optional)</Label>
              <Input
                id="permission-group-purpose"
                type="text"
                value={permissionGroupPurpose}
                onChange={e => setPermissionGroupPurpose(e.target.value)}
                placeholder="e.g., For content management"
                fullWidth
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="permission-group-notes">Notes (Optional)</Label>
              <Textarea
                id="permission-group-notes"
                value={permissionGroupNotes}
                onChange={e => setPermissionGroupNotes(e.target.value)}
                placeholder="Additional notes about this permission group's use in the project"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
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
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

