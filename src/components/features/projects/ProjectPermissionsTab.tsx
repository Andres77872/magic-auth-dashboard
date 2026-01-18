import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ConfirmDialog, TabNavigation, DataView } from '@/components/common';
import type { Tab, DataViewColumn } from '@/components/common';
import { globalRolesService, permissionAssignmentsService } from '@/services';
import { useToast } from '@/contexts/ToastContext';
import type { ProjectDetails } from '@/types/project.types';
import type { GlobalRole, GlobalPermissionGroup } from '@/types/global-roles.types';
import { Plus, Trash2, Info, MoreHorizontal, Shield, Lock } from 'lucide-react';

interface ProjectPermissionsTabProps {
  project: ProjectDetails;
}

// Sub-component for Roles DataView
interface RolesDataViewSectionProps {
  catalogedRoles: CatalogedRole[];
  availableRoles: GlobalRole[];
  isLoading: boolean;
  viewMode: 'table' | 'grid';
  onViewModeChange: (mode: 'table' | 'grid') => void;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  onAddRole: () => void;
  onRemoveRole: (role: CatalogedRole) => void;
}

const RolesDataViewSection: React.FC<RolesDataViewSectionProps> = ({
  catalogedRoles,
  availableRoles,
  isLoading,
  viewMode,
  onViewModeChange,
  searchTerm,
  onSearchTermChange,
  onAddRole,
  onRemoveRole,
}) => {
  // Filter roles based on search term
  const filteredRoles = catalogedRoles.filter(role => {
    if (!searchTerm.trim()) return true;
    const search = searchTerm.toLowerCase();
    return (
      (role.role_display_name || '').toLowerCase().includes(search) ||
      (role.role_name || '').toLowerCase().includes(search) ||
      (role.role_description || '').toLowerCase().includes(search)
    );
  });

  // DataView columns for table view
  const columns: DataViewColumn<CatalogedRole>[] = [
    {
      key: 'role_display_name',
      header: 'Role',
      sortable: true,
      render: (_, role) => (
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">
            {role.role_display_name || role.role_name}
          </span>
          {role.is_system_role && <Badge variant="info" size="sm">System</Badge>}
        </div>
      ),
    },
    {
      key: 'role_description',
      header: 'Description',
      hideOnMobile: true,
      render: (value) => (
        <span className="text-muted-foreground line-clamp-1">{value || '—'}</span>
      ),
    },
    {
      key: 'catalog_purpose',
      header: 'Purpose',
      hideOnMobile: true,
      render: (value) => (
        <span className="text-muted-foreground line-clamp-1">{value || '—'}</span>
      ),
    },
    {
      key: 'role_hash',
      header: '',
      width: '60px',
      align: 'center',
      render: (_, role) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={(e) => { e.stopPropagation(); onRemoveRole(role); }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Remove from Catalog
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  // Card renderer for grid view
  const renderRoleCard = (role: CatalogedRole) => (
    <Card>
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
            onClick={(e) => { e.stopPropagation(); onRemoveRole(role); }}
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
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Cataloged Roles</h3>
          <p className="text-sm text-muted-foreground">Suggested global roles for users in this project</p>
        </div>
      </div>
      <DataView<CatalogedRole>
        data={filteredRoles}
        columns={columns}
        keyExtractor={(item) => item.role_hash}
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
        showViewToggle={true}
        defaultViewMode="grid"
        renderCard={renderRoleCard}
        gridColumns={{ mobile: 1, tablet: 2, desktop: 3 }}
        showSearch={true}
        searchValue={searchTerm}
        onSearchChange={onSearchTermChange}
        searchPlaceholder="Search roles..."
        toolbarActions={
          <Button onClick={onAddRole} disabled={availableRoles.length === 0}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Role to Catalog
          </Button>
        }
        isLoading={isLoading}
        emptyMessage="No Roles in Catalog"
        emptyDescription="Add roles to this project's catalog to suggest which roles are commonly used."
        emptyIcon={<Shield className="h-10 w-10" />}
        emptyAction={
          availableRoles.length > 0 ? (
            <Button onClick={onAddRole}>Add First Role</Button>
          ) : undefined
        }
      />
    </div>
  );
};

// Sub-component for Permission Groups DataView
interface PermissionGroupsDataViewSectionProps {
  catalogedPermissionGroups: CatalogedPermissionGroup[];
  availablePermissionGroups: GlobalPermissionGroup[];
  isLoading: boolean;
  viewMode: 'table' | 'grid';
  onViewModeChange: (mode: 'table' | 'grid') => void;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  onAddGroup: () => void;
  onRemoveGroup: (group: CatalogedPermissionGroup) => void;
}

const PermissionGroupsDataViewSection: React.FC<PermissionGroupsDataViewSectionProps> = ({
  catalogedPermissionGroups,
  availablePermissionGroups,
  isLoading,
  viewMode,
  onViewModeChange,
  searchTerm,
  onSearchTermChange,
  onAddGroup,
  onRemoveGroup,
}) => {
  // Filter groups based on search term
  const filteredGroups = catalogedPermissionGroups.filter(group => {
    if (!searchTerm.trim()) return true;
    const search = searchTerm.toLowerCase();
    return (
      (group.group_display_name || '').toLowerCase().includes(search) ||
      (group.group_name || '').toLowerCase().includes(search) ||
      (group.group_description || '').toLowerCase().includes(search) ||
      (group.group_category || '').toLowerCase().includes(search)
    );
  });

  // DataView columns for table view
  const columns: DataViewColumn<CatalogedPermissionGroup>[] = [
    {
      key: 'group_display_name',
      header: 'Permission Group',
      sortable: true,
      render: (_, group) => (
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">
            {group.group_display_name || group.group_name}
          </span>
        </div>
      ),
    },
    {
      key: 'group_category',
      header: 'Category',
      width: '120px',
      hideOnMobile: true,
      render: (value) => value ? <Badge variant="info">{value}</Badge> : <span className="text-muted-foreground">—</span>,
    },
    {
      key: 'group_description',
      header: 'Description',
      hideOnMobile: true,
      render: (value) => (
        <span className="text-muted-foreground line-clamp-1">{value || '—'}</span>
      ),
    },
    {
      key: 'catalog_purpose',
      header: 'Purpose',
      hideOnMobile: true,
      render: (value) => (
        <span className="text-muted-foreground line-clamp-1">{value || '—'}</span>
      ),
    },
    {
      key: 'group_hash',
      header: '',
      width: '60px',
      align: 'center',
      render: (_, group) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={(e) => { e.stopPropagation(); onRemoveGroup(group); }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Remove from Catalog
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  // Card renderer for grid view
  const renderGroupCard = (group: CatalogedPermissionGroup) => (
    <Card>
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
            onClick={(e) => { e.stopPropagation(); onRemoveGroup(group); }}
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
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Cataloged Permission Groups</h3>
          <p className="text-sm text-muted-foreground">Suggested permission groups for this project</p>
        </div>
      </div>
      <DataView<CatalogedPermissionGroup>
        data={filteredGroups}
        columns={columns}
        keyExtractor={(item) => item.group_hash}
        viewMode={viewMode}
        onViewModeChange={onViewModeChange}
        showViewToggle={true}
        defaultViewMode="grid"
        renderCard={renderGroupCard}
        gridColumns={{ mobile: 1, tablet: 2, desktop: 3 }}
        showSearch={true}
        searchValue={searchTerm}
        onSearchChange={onSearchTermChange}
        searchPlaceholder="Search permission groups..."
        toolbarActions={
          <Button onClick={onAddGroup} disabled={availablePermissionGroups.length === 0}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add Permission Group
          </Button>
        }
        isLoading={isLoading}
        emptyMessage="No Permission Groups in Catalog"
        emptyDescription="Add permission groups to this project's catalog to suggest which groups are commonly used."
        emptyIcon={<Lock className="h-10 w-10" />}
        emptyAction={
          availablePermissionGroups.length > 0 ? (
            <Button onClick={onAddGroup}>Add First Group</Button>
          ) : undefined
        }
      />
    </div>
  );
};

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
  const [rolesViewMode, setRolesViewMode] = useState<'table' | 'grid'>('grid');
  const [groupsViewMode, setGroupsViewMode] = useState<'table' | 'grid'>('grid');
  const [rolesSearchTerm, setRolesSearchTerm] = useState('');
  const [groupsSearchTerm, setGroupsSearchTerm] = useState('');
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
      {/* Roles Section */}
      {activeSection === 'roles' && (
        <RolesDataViewSection
          catalogedRoles={catalogedRoles}
          availableRoles={availableRoles}
          isLoading={isLoading}
          viewMode={rolesViewMode}
          onViewModeChange={setRolesViewMode}
          searchTerm={rolesSearchTerm}
          onSearchTermChange={setRolesSearchTerm}
          onAddRole={() => setShowAddRoleModal(true)}
          onRemoveRole={setConfirmRemoveRole}
        />
      )}

      {/* Permission Groups Section */}
      {activeSection === 'permission-groups' && (
        <PermissionGroupsDataViewSection
          catalogedPermissionGroups={catalogedPermissionGroups}
          availablePermissionGroups={availablePermissionGroups}
          isLoading={isLoading}
          viewMode={groupsViewMode}
          onViewModeChange={setGroupsViewMode}
          searchTerm={groupsSearchTerm}
          onSearchTermChange={setGroupsSearchTerm}
          onAddGroup={() => setShowAddPermissionGroupModal(true)}
          onRemoveGroup={setConfirmRemovePermissionGroup}
        />
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

