import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Spinner } from '@/components/ui/spinner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { DataView, Pagination, ErrorState, EmptyState, ConfirmDialog } from '@/components/common';
import type { DataViewColumn } from '@/components/common';
import { projectService, projectGroupService } from '@/services';
import type { ProjectGroup } from '@/services/project-group.service';
import type { ProjectDetails, ProjectGroupInfo } from '@/types/project.types';
import type { UserGroup } from '@/types/group.types';
import { useToast } from '@/contexts/ToastContext';
import { 
  Users, 
  FolderTree, 
  Plus, 
  Trash2, 
  ExternalLink, 
  ArrowRight,
  FolderOpen
} from 'lucide-react';
import { ROUTES } from '@/utils/routes';

interface ProjectGroupsTabProps {
  project: ProjectDetails;
  projectGroups?: ProjectGroupInfo[];
  onProjectGroupsChange?: () => void;
}

export const ProjectGroupsTab: React.FC<ProjectGroupsTabProps> = ({ 
  project,
  projectGroups = [],
  onProjectGroupsChange
}) => {
  // User Groups state
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [isLoadingUserGroups, setIsLoadingUserGroups] = useState(true);
  const [userGroupsError, setUserGroupsError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Project Groups management state
  const [assignedProjectGroups, setAssignedProjectGroups] = useState<ProjectGroupInfo[]>(projectGroups);
  const [availableProjectGroups, setAvailableProjectGroups] = useState<ProjectGroup[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<ProjectGroupInfo | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isLoadingProjectGroups, setIsLoadingProjectGroups] = useState(false);

  const { addToast } = useToast();

  // Update assigned project groups when prop changes
  useEffect(() => {
    setAssignedProjectGroups(projectGroups);
  }, [projectGroups]);

  // Fetch user groups with access
  const fetchUserGroups = useCallback(async (page = 1) => {
    try {
      setIsLoadingUserGroups(true);
      setUserGroupsError(null);
      const response = await projectService.getProjectGroups(project.project_hash, {
        limit: 10,
        offset: (page - 1) * 10,
      });
      
      if (response.success && response.user_groups) {
        setUserGroups(response.user_groups);
        if (response.pagination) {
          setTotalPages(Math.ceil(response.pagination.total / 10));
          setTotalItems(response.pagination.total);
        } else {
          setTotalItems(response.user_groups.length);
        }
      } else {
        setUserGroupsError(response.message || 'Failed to load user groups');
      }
    } catch (err) {
      console.error('Error fetching user groups:', err);
      setUserGroupsError('Failed to load user groups. Please try again.');
    } finally {
      setIsLoadingUserGroups(false);
    }
  }, [project.project_hash]);

  useEffect(() => {
    fetchUserGroups(currentPage);
  }, [fetchUserGroups, currentPage]);

  // Fetch available project groups for the add modal
  const fetchAvailableProjectGroups = async () => {
    try {
      setIsLoadingProjectGroups(true);
      const response = await projectGroupService.getProjectGroups({ limit: 500 });
      if (response.success && response.project_groups) {
        const assignedHashes = new Set(assignedProjectGroups.map(pg => pg.group_hash));
        const available = response.project_groups.filter(
          pg => !assignedHashes.has(pg.group_hash)
        );
        setAvailableProjectGroups(available);
      }
    } catch (error) {
      console.error('Failed to fetch available project groups:', error);
    } finally {
      setIsLoadingProjectGroups(false);
    }
  };

  useEffect(() => {
    if (showAddModal) {
      fetchAvailableProjectGroups();
    }
  }, [showAddModal, assignedProjectGroups]);

  // Handle adding project to project groups
  const handleAssignToGroups = async () => {
    if (selectedGroups.length === 0) {
      addToast({ message: 'Please select at least one project group', variant: 'warning' });
      return;
    }

    setIsAssigning(true);
    let successCount = 0;
    let errorCount = 0;

    for (const projectGroupHash of selectedGroups) {
      try {
        const response = await projectGroupService.assignProjectToGroup(
          projectGroupHash,
          project.project_hash
        );
        if (response.success) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch {
        errorCount++;
      }
    }

    if (successCount > 0) {
      addToast({
        message: `Successfully added to ${successCount} project group(s)`,
        variant: 'success'
      });
      onProjectGroupsChange?.();
      await fetchUserGroups(currentPage);
    }
    if (errorCount > 0) {
      addToast({
        message: `Failed to add to ${errorCount} project group(s)`,
        variant: 'error'
      });
    }

    setShowAddModal(false);
    setSelectedGroups([]);
    setIsAssigning(false);
  };

  // Handle removing project from a project group
  const handleRemoveFromGroup = async () => {
    if (!confirmRemove) return;

    setIsRemoving(true);
    try {
      const response = await projectGroupService.removeProjectFromGroup(
        confirmRemove.group_hash,
        project.project_hash
      );

      if (response.success) {
        addToast({ message: 'Removed from project group successfully', variant: 'success' });
        setConfirmRemove(null);
        onProjectGroupsChange?.();
        await fetchUserGroups(currentPage);
      } else {
        throw new Error(response.message || 'Failed to remove from project group');
      }
    } catch (error) {
      console.error('Failed to remove from project group:', error);
      addToast({ message: 'Failed to remove from project group', variant: 'error' });
    } finally {
      setIsRemoving(false);
    }
  };

  const toggleGroupSelection = (projectGroupHash: string) => {
    setSelectedGroups(prev =>
      prev.includes(projectGroupHash)
        ? prev.filter(h => h !== projectGroupHash)
        : [...prev, projectGroupHash]
    );
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const userGroupColumns: DataViewColumn<UserGroup>[] = [
    { 
      key: 'group_name', 
      header: 'User Group', 
      sortable: true,
      render: (value, group) => (
        <Link 
          to={`${ROUTES.GROUPS}/${group.group_hash}`}
          className="font-medium text-primary hover:underline inline-flex items-center gap-1"
        >
          {String(value)}
          <ExternalLink className="h-3 w-3" />
        </Link>
      )
    },
    { 
      key: 'description', 
      header: 'Description', 
      sortable: false,
      render: (value) => (
        <span className="text-muted-foreground">
          {String(value || 'No description')}
        </span>
      )
    },
    { 
      key: 'member_count', 
      header: 'Members', 
      sortable: true,
      render: (value) => (
        <Badge variant="secondary">{String(value || 0)} members</Badge>
      )
    },
    { 
      key: 'created_at', 
      header: 'Added', 
      sortable: true,
      render: (value) => formatDate(value as string)
    },
  ];

  return (
    <div className="space-y-6">
      {/* Architecture Info Banner */}
      <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 border text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>User</span>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <div className="flex items-center gap-2 text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>User Group</span>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <div className="flex items-center gap-2 text-primary font-medium">
          <FolderTree className="h-4 w-4" />
          <span>Project Group</span>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <div className="flex items-center gap-2 text-muted-foreground">
          <FolderOpen className="h-4 w-4" />
          <span>Project</span>
        </div>
      </div>

      {/* Project Groups Section - Manageable */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <FolderTree className="h-5 w-5" />
              Project Groups ({assignedProjectGroups.length})
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Project groups this project belongs to. Add to a project group to grant access to user groups.
            </p>
          </div>
          <Button onClick={() => setShowAddModal(true)} size="sm">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add to Group
          </Button>
        </CardHeader>
        <CardContent>
          {assignedProjectGroups.length === 0 ? (
            <EmptyState
              icon={<FolderTree className="h-10 w-10" aria-hidden="true" />}
              title="Not in Any Project Groups"
              description="This project hasn't been added to any project groups yet. Add it to a project group to manage access."
              size="sm"
              action={
                <Button onClick={() => setShowAddModal(true)} variant="outline" size="sm">
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Add to Project Group
                </Button>
              }
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {assignedProjectGroups.map(pg => (
                <div 
                  key={pg.group_hash} 
                  className="group flex items-start justify-between gap-3 p-4 rounded-lg border bg-card hover:bg-accent/30 transition-colors"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="p-2 rounded-md bg-primary/10 flex-shrink-0">
                      <FolderTree className="h-4 w-4 text-primary" aria-hidden="true" />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <Link
                        to={`${ROUTES.PROJECT_GROUPS}/${pg.group_hash}`}
                        className="font-medium text-sm hover:underline flex items-center gap-1"
                      >
                        <span className="truncate">{pg.group_name}</span>
                        <ExternalLink className="h-3 w-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                      {pg.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {pg.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setConfirmRemove(pg)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    aria-label={`Remove from ${pg.group_name}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Groups Section - Read Only */}
      <Card>
        <CardHeader>
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Groups with Access ({totalItems})
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              User groups that can access this project through the project groups above.
            </p>
          </div>
        </CardHeader>
        <CardContent>
          {userGroupsError ? (
            <ErrorState
              icon={<Users size={24} />}
              title="Failed to load user groups"
              message={userGroupsError}
              onRetry={() => fetchUserGroups(currentPage)}
              retryLabel="Retry"
              variant="inline"
              size="sm"
            />
          ) : isLoadingUserGroups ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Spinner size="lg" />
              <p className="text-sm text-muted-foreground mt-2">Loading user groups...</p>
            </div>
          ) : userGroups.length === 0 ? (
            <EmptyState
              icon={<Users className="h-10 w-10" aria-hidden="true" />}
              title="No User Groups Have Access"
              description={
                assignedProjectGroups.length === 0
                  ? "Add this project to a project group first, then grant user groups access to that project group."
                  : "Grant user groups access to the project groups above to give them access to this project."
              }
              size="sm"
              action={
                assignedProjectGroups.length > 0 && (
                  <Link to={ROUTES.GROUPS}>
                    <Button variant="outline" size="sm">
                      Manage User Groups
                    </Button>
                  </Link>
                )
              }
            />
          ) : (
            <>
              <DataView
                data={userGroups}
                columns={userGroupColumns}
                viewMode="table"
                showViewToggle={false}
                isLoading={isLoadingUserGroups}
                emptyMessage="No user groups found"
              />
              
              {totalPages > 1 && (
                <div className="mt-4">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalItems={totalItems}
                    itemsPerPage={10}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Add to Project Group Modal */}
      <Dialog open={showAddModal} onOpenChange={(open) => !isAssigning && !open && setShowAddModal(false)}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>Add to Project Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select project groups to add this project to. User groups with access to the selected 
              project groups will be able to access this project.
            </p>

            {isLoadingProjectGroups ? (
              <div className="flex items-center justify-center py-8">
                <Spinner size="lg" />
              </div>
            ) : availableProjectGroups.length === 0 ? (
              <EmptyState
                icon={<FolderTree className="h-10 w-10" aria-hidden="true" />}
                title="No Available Project Groups"
                description="This project is already in all project groups, or no project groups exist yet."
                size="sm"
                action={
                  <Link to={ROUTES.PROJECT_GROUPS_CREATE}>
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4" aria-hidden="true" />
                      Create Project Group
                    </Button>
                  </Link>
                }
              />
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <Badge variant="info">
                    {selectedGroups.length} selected
                  </Badge>
                </div>

                <div className="max-h-[400px] overflow-y-auto border rounded-md divide-y">
                  {availableProjectGroups.map(pg => (
                    <div
                      key={pg.group_hash}
                      className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                        selectedGroups.includes(pg.group_hash)
                          ? 'bg-primary/5'
                          : 'hover:bg-accent/50'
                      }`}
                      onClick={() => toggleGroupSelection(pg.group_hash)}
                    >
                      <Checkbox
                        checked={selectedGroups.includes(pg.group_hash)}
                        onCheckedChange={() => toggleGroupSelection(pg.group_hash)}
                      />
                      <FolderTree className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm">{pg.group_name}</h4>
                        {pg.description && (
                          <p className="text-xs text-muted-foreground truncate">
                            {pg.description}
                          </p>
                        )}
                      </div>
                      <Badge variant="secondary" className="flex-shrink-0">
                        {pg.project_count} project{pg.project_count !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddModal(false)}
              disabled={isAssigning}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignToGroups}
              disabled={selectedGroups.length === 0 || isAssigning}
              loading={isAssigning}
            >
              Add to Group{selectedGroups.length > 1 ? 's' : ''} {selectedGroups.length > 0 ? `(${selectedGroups.length})` : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove from Project Group Confirmation */}
      {confirmRemove && (
        <ConfirmDialog
          isOpen={true}
          title="Remove from Project Group"
          message={`Are you sure you want to remove this project from "${confirmRemove.group_name}"? User groups that only have access through this project group will lose access to this project.`}
          confirmText="Remove"
          cancelText="Cancel"
          onConfirm={handleRemoveFromGroup}
          onClose={() => setConfirmRemove(null)}
          isLoading={isRemoving}
        />
      )}
    </div>
  );
}; 