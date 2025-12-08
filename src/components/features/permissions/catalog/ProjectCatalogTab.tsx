import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FolderOpen, Layers, Users, Plus, Trash2 } from 'lucide-react';
import { useProjects } from '@/hooks';
import { usePermissionManagement } from '@/contexts/PermissionManagementContext';
import { useGlobalRoles } from '@/hooks/useGlobalRoles';
import { permissionAssignmentsService, globalRolesService } from '@/services';
import { useToast } from '@/contexts/ToastContext';
import { CategoryBadge } from '../shared/CategoryBadge';
import { PriorityBadge } from '../shared/PriorityBadge';
import type { GlobalPermissionGroup, GlobalRole } from '@/types/global-roles.types';

interface CatalogEntry {
  group_hash?: string;
  role_hash?: string;
  group_name?: string;
  group_display_name?: string;
  role_name?: string;
  role_display_name?: string;
  catalog_purpose?: string;
  notes?: string;
  cataloged_at?: string;
}

export function ProjectCatalogTab(): React.JSX.Element {
  const { addToast } = useToast();
  const { projects, isLoading: projectsLoading } = useProjects({ limit: 100 });
  const { permissionGroups, permissionGroupsLoading } = usePermissionManagement();
  const { roles, loadingRoles } = useGlobalRoles();

  const [selectedProject, setSelectedProject] = useState<string>('');
  const [catalogedPermissionGroups, setCatalogedPermissionGroups] = useState<CatalogEntry[]>([]);
  const [catalogedRoles, setCatalogedRoles] = useState<CatalogEntry[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal states
  const [isAddPGModalOpen, setIsAddPGModalOpen] = useState(false);
  const [isAddRoleModalOpen, setIsAddRoleModalOpen] = useState(false);
  const [selectedPGToAdd, setSelectedPGToAdd] = useState<string>('');
  const [selectedRoleToAdd, setSelectedRoleToAdd] = useState<string>('');
  const [catalogPurpose, setCatalogPurpose] = useState('');
  const [catalogNotes, setCatalogNotes] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);

  const loadCatalogData = useCallback(async () => {
    if (!selectedProject) {
      setCatalogedPermissionGroups([]);
      setCatalogedRoles([]);
      return;
    }

    setLoading(true);
    try {
      const [pgResponse, rolesResponse] = await Promise.all([
        permissionAssignmentsService.getProjectCatalogPermissionGroups(selectedProject),
        globalRolesService.getProjectCatalogRoles(selectedProject)
      ]);

      if (pgResponse.success) {
        const data = (pgResponse as any).permission_groups || (pgResponse as any).catalog || pgResponse.data || [];
        setCatalogedPermissionGroups(data);
      }

      if (rolesResponse.success) {
        const data = (rolesResponse as any).roles || (rolesResponse as any).catalog || rolesResponse.data || [];
        setCatalogedRoles(data);
      }
    } catch (error) {
      addToast({
        message: error instanceof Error ? error.message : 'Failed to load catalog',
        variant: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [selectedProject, addToast]);

  useEffect(() => {
    loadCatalogData();
  }, [loadCatalogData]);

  const handleAddPermissionGroup = async () => {
    if (!selectedProject || !selectedPGToAdd) return;

    setIsAdding(true);
    try {
      await permissionAssignmentsService.addPermissionGroupToProjectCatalog(
        selectedProject,
        selectedPGToAdd,
        { catalog_purpose: catalogPurpose, notes: catalogNotes }
      );
      addToast({ message: 'Permission group added to catalog', variant: 'success' });
      setIsAddPGModalOpen(false);
      setSelectedPGToAdd('');
      setCatalogPurpose('');
      setCatalogNotes('');
      await loadCatalogData();
    } catch (error) {
      addToast({
        message: error instanceof Error ? error.message : 'Failed to add to catalog',
        variant: 'error'
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleAddRole = async () => {
    if (!selectedProject || !selectedRoleToAdd) return;

    setIsAdding(true);
    try {
      await globalRolesService.addRoleToProjectCatalog(
        selectedProject,
        selectedRoleToAdd,
        { catalog_purpose: catalogPurpose, notes: catalogNotes }
      );
      addToast({ message: 'Role added to catalog', variant: 'success' });
      setIsAddRoleModalOpen(false);
      setSelectedRoleToAdd('');
      setCatalogPurpose('');
      setCatalogNotes('');
      await loadCatalogData();
    } catch (error) {
      addToast({
        message: error instanceof Error ? error.message : 'Failed to add to catalog',
        variant: 'error'
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemovePermissionGroup = async (groupHash: string) => {
    if (!selectedProject) return;

    setIsRemoving(groupHash);
    try {
      await permissionAssignmentsService.removePermissionGroupFromProjectCatalog(
        selectedProject,
        groupHash
      );
      addToast({ message: 'Permission group removed from catalog', variant: 'success' });
      await loadCatalogData();
    } catch (error) {
      addToast({
        message: error instanceof Error ? error.message : 'Failed to remove from catalog',
        variant: 'error'
      });
    } finally {
      setIsRemoving(null);
    }
  };

  const handleRemoveRole = async (roleHash: string) => {
    if (!selectedProject) return;

    setIsRemoving(roleHash);
    try {
      await globalRolesService.removeRoleFromProjectCatalog(selectedProject, roleHash);
      addToast({ message: 'Role removed from catalog', variant: 'success' });
      await loadCatalogData();
    } catch (error) {
      addToast({
        message: error instanceof Error ? error.message : 'Failed to remove from catalog',
        variant: 'error'
      });
    } finally {
      setIsRemoving(null);
    }
  };

  const getPermissionGroupInfo = (hash: string): GlobalPermissionGroup | undefined => {
    return permissionGroups.find(pg => pg.group_hash === hash);
  };

  const getRoleInfo = (hash: string): GlobalRole | undefined => {
    return roles.find(r => r.role_hash === hash);
  };

  const availablePermissionGroups = permissionGroups.filter(
    pg => !catalogedPermissionGroups.some(c => c.group_hash === pg.group_hash)
  );

  const availableRoles = roles.filter(
    r => !catalogedRoles.some(c => c.role_hash === r.role_hash)
  );

  const selectedProjectData = projects.find(p => p.project_hash === selectedProject);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Project Catalog</h2>
          <p className="text-sm text-muted-foreground">
            Organize permission groups and roles by project for documentation and reference
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <FolderOpen className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <label className="text-sm font-medium">Select Project</label>
              <Select
                value={selectedProject}
                onValueChange={setSelectedProject}
                disabled={projectsLoading}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a project to view its catalog..." />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(project => (
                    <SelectItem key={project.project_hash} value={project.project_hash}>
                      {project.project_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {!selectedProject ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Select a Project</h3>
            <p className="text-sm text-muted-foreground">
              Choose a project to view and manage its permission catalog
            </p>
          </CardContent>
        </Card>
      ) : loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Permission Groups Section */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
                    <Layers className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Permission Groups</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {catalogedPermissionGroups.length} cataloged
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => setIsAddPGModalOpen(true)}
                  disabled={availablePermissionGroups.length === 0}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {catalogedPermissionGroups.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Layers className="h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    No permission groups cataloged
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {catalogedPermissionGroups.map((entry) => {
                    const pgInfo = getPermissionGroupInfo(entry.group_hash || '');
                    return (
                      <div
                        key={entry.group_hash}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="flex-1">
                          <p className="font-medium">
                            {entry.group_display_name || pgInfo?.group_display_name || entry.group_name}
                          </p>
                          <p className="text-xs font-mono text-muted-foreground">
                            {entry.group_name || pgInfo?.group_name}
                          </p>
                          {entry.catalog_purpose && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              Purpose: {entry.catalog_purpose}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {pgInfo?.group_category && (
                            <CategoryBadge category={pgInfo.group_category} />
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemovePermissionGroup(entry.group_hash || '')}
                            disabled={isRemoving === entry.group_hash}
                          >
                            {isRemoving === entry.group_hash ? (
                              <Spinner size="sm" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-destructive" />
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Roles Section */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Roles</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {catalogedRoles.length} cataloged
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => setIsAddRoleModalOpen(true)}
                  disabled={availableRoles.length === 0}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {catalogedRoles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Users className="h-8 w-8 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    No roles cataloged
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {catalogedRoles.map((entry) => {
                    const roleInfo = getRoleInfo(entry.role_hash || '');
                    return (
                      <div
                        key={entry.role_hash}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="flex-1">
                          <p className="font-medium">
                            {entry.role_display_name || roleInfo?.role_display_name || entry.role_name}
                          </p>
                          <p className="text-xs font-mono text-muted-foreground">
                            {entry.role_name || roleInfo?.role_name}
                          </p>
                          {entry.catalog_purpose && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              Purpose: {entry.catalog_purpose}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {roleInfo && (
                            <PriorityBadge priority={roleInfo.role_priority} />
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveRole(entry.role_hash || '')}
                            disabled={isRemoving === entry.role_hash}
                          >
                            {isRemoving === entry.role_hash ? (
                              <Spinner size="sm" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-destructive" />
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Permission Group Modal */}
      <Dialog open={isAddPGModalOpen} onOpenChange={(open) => !open && setIsAddPGModalOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Permission Group to Catalog</DialogTitle>
            <DialogDescription>
              Add a permission group to the catalog for {selectedProjectData?.project_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Permission Group</label>
              <Select
                value={selectedPGToAdd}
                onValueChange={setSelectedPGToAdd}
                disabled={permissionGroupsLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select permission group..." />
                </SelectTrigger>
                <SelectContent>
                  {availablePermissionGroups.map(pg => (
                    <SelectItem key={pg.group_hash} value={pg.group_hash}>
                      {pg.group_display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Purpose (optional)</label>
              <Input
                value={catalogPurpose}
                onChange={(e) => setCatalogPurpose(e.target.value)}
                placeholder="e.g., Content team access"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes (optional)</label>
              <Input
                value={catalogNotes}
                onChange={(e) => setCatalogNotes(e.target.value)}
                placeholder="Additional notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddPGModalOpen(false)} disabled={isAdding}>
              Cancel
            </Button>
            <Button onClick={handleAddPermissionGroup} disabled={!selectedPGToAdd || isAdding}>
              {isAdding ? <Spinner size="sm" className="mr-2" /> : null}
              Add to Catalog
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Role Modal */}
      <Dialog open={isAddRoleModalOpen} onOpenChange={(open) => !open && setIsAddRoleModalOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Role to Catalog</DialogTitle>
            <DialogDescription>
              Add a role to the catalog for {selectedProjectData?.project_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Select
                value={selectedRoleToAdd}
                onValueChange={setSelectedRoleToAdd}
                disabled={loadingRoles}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role..." />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map(role => (
                    <SelectItem key={role.role_hash} value={role.role_hash}>
                      {role.role_display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Purpose (optional)</label>
              <Input
                value={catalogPurpose}
                onChange={(e) => setCatalogPurpose(e.target.value)}
                placeholder="e.g., Project admin role"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes (optional)</label>
              <Input
                value={catalogNotes}
                onChange={(e) => setCatalogNotes(e.target.value)}
                placeholder="Additional notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddRoleModalOpen(false)} disabled={isAdding}>
              Cancel
            </Button>
            <Button onClick={handleAddRole} disabled={!selectedRoleToAdd || isAdding}>
              {isAdding ? <Spinner size="sm" className="mr-2" /> : null}
              Add to Catalog
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ProjectCatalogTab;
