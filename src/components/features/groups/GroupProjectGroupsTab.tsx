import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Spinner } from '@/components/ui/spinner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ConfirmDialog, EmptyState } from '@/components/common';
import { FolderOpen, Plus, Trash2, ExternalLink } from 'lucide-react';
import { groupService, projectGroupService } from '@/services';
import type { ProjectGroup } from '@/services/project-group.service';
import { useToast } from '@/contexts/ToastContext';
import { ROUTES } from '@/utils/routes';

interface ProjectGroupAccess {
  group_hash: string;
  group_name: string;
  project_count: number;
}

interface GroupProjectGroupsTabProps {
  groupHash: string;
  groupName: string;
}

export const GroupProjectGroupsTab: React.FC<GroupProjectGroupsTabProps> = ({
  groupHash,
  groupName
}) => {
  const [accessibleProjectGroups, setAccessibleProjectGroups] = useState<ProjectGroupAccess[]>([]);
  const [availableProjectGroups, setAvailableProjectGroups] = useState<ProjectGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<ProjectGroupAccess | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const { addToast } = useToast();

  // Fetch project groups accessible by this user group
  // GET /admin/user-groups/{group_hash}/project-groups
  const fetchAccessibleProjectGroups = useCallback(async () => {
    try {
      setLoading(true);
      const response: any = await groupService.getGroupProjectGroups(groupHash);
      
      // API returns project_groups array directly in response
      if (response.project_groups) {
        setAccessibleProjectGroups(response.project_groups);
      } else if (response.success === false) {
        throw new Error(response.message || 'Failed to fetch project groups');
      } else {
        setAccessibleProjectGroups([]);
      }
    } catch (error) {
      console.error('Failed to fetch accessible project groups:', error);
      addToast({ message: 'Failed to load project groups', variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [groupHash, addToast]);

  const fetchAvailableProjectGroups = async () => {
    try {
      const response = await projectGroupService.getProjectGroups({ limit: 500 });
      if (response.success && response.project_groups) {
        const accessibleHashes = new Set(
          accessibleProjectGroups.map(pg => pg.group_hash)
        );
        const available = response.project_groups.filter(
          pg => !accessibleHashes.has(pg.group_hash)
        );
        setAvailableProjectGroups(available);
      }
    } catch (error) {
      console.error('Failed to fetch available project groups:', error);
    }
  };

  useEffect(() => {
    fetchAccessibleProjectGroups();
  }, [fetchAccessibleProjectGroups]);

  useEffect(() => {
    if (showAddModal) {
      fetchAvailableProjectGroups();
    }
  }, [showAddModal, accessibleProjectGroups]);

  const handleGrantAccess = async () => {
    if (selectedGroups.length === 0) {
      addToast({ message: 'Please select at least one project group', variant: 'warning' });
      return;
    }

    setIsAssigning(true);
    let successCount = 0;
    let errorCount = 0;

    for (const projectGroupHash of selectedGroups) {
      try {
        const response = await groupService.grantProjectGroupAccess(groupHash, projectGroupHash);
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
        message: `Successfully granted access to ${successCount} project group(s)`,
        variant: 'success'
      });
      await fetchAccessibleProjectGroups();
    }
    if (errorCount > 0) {
      addToast({
        message: `Failed to grant access to ${errorCount} project group(s)`,
        variant: 'error'
      });
    }

    setShowAddModal(false);
    setSelectedGroups([]);
    setIsAssigning(false);
  };

  const handleRevokeAccess = async () => {
    if (!confirmRemove) return;

    setIsRemoving(true);
    try {
      const response = await groupService.revokeProjectGroupAccess(
        groupHash,
        confirmRemove.group_hash
      );

      if (response.success) {
        addToast({ message: 'Project group access revoked successfully', variant: 'success' });
        setConfirmRemove(null);
        await fetchAccessibleProjectGroups();
      } else {
        throw new Error(response.message || 'Failed to revoke access');
      }
    } catch (error) {
      console.error('Failed to revoke project group access:', error);
      addToast({ message: 'Failed to revoke project group access', variant: 'error' });
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Spinner size="lg" />
        <p className="text-sm text-muted-foreground mt-2">Loading project groups...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div className="space-y-1">
            <CardTitle>Project Group Access</CardTitle>
            <p className="text-sm text-muted-foreground">
              Manage which project groups <strong>{groupName}</strong> can access.
              Users in this group will have access to all projects within these project groups.
            </p>
          </div>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Grant Access
          </Button>
        </CardHeader>
        <CardContent>
          {accessibleProjectGroups.length === 0 ? (
            <EmptyState
              icon={<FolderOpen className="h-10 w-10" aria-hidden="true" />}
              title="No Project Group Access"
              description="This user group doesn't have access to any project groups. Click 'Grant Access' to add some."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {accessibleProjectGroups.map(pg => (
                <Card key={pg.group_hash}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <FolderOpen className="h-5 w-5 text-primary mt-0.5" aria-hidden="true" />
                        <div className="space-y-1">
                          <button
                            onClick={() => window.location.href = `${ROUTES.PROJECT_GROUPS}/${pg.group_hash}`}
                            className="font-medium hover:underline text-left flex items-center gap-1"
                          >
                            {pg.group_name}
                            <ExternalLink size={14} />
                          </button>
                          <Badge variant="info">
                            {pg.project_count} project{pg.project_count !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setConfirmRemove(pg)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        aria-label="Revoke access"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grant Access Modal */}
      <Dialog open={showAddModal} onOpenChange={(open) => !isAssigning && !open && setShowAddModal(false)}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>Grant Project Group Access</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select project groups to grant access to. Users in "{groupName}" will be able to access
              all projects within the selected project groups.
            </p>

            {availableProjectGroups.length === 0 ? (
              <EmptyState
                icon={<FolderOpen className="h-10 w-10" aria-hidden="true" />}
                title="No Available Project Groups"
                description="This user group already has access to all project groups, or no project groups exist."
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
                      <FolderOpen className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium">{pg.group_name}</h4>
                        {pg.description && (
                          <p className="text-sm text-muted-foreground truncate">
                            {pg.description}
                          </p>
                        )}
                      </div>
                      <Badge variant="secondary">
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
              onClick={handleGrantAccess}
              disabled={selectedGroups.length === 0 || isAssigning}
              loading={isAssigning}
            >
              Grant Access {selectedGroups.length > 0 ? `(${selectedGroups.length})` : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Access Confirmation Dialog */}
      {confirmRemove && (
        <ConfirmDialog
          isOpen={true}
          title="Revoke Project Group Access"
          message={`Are you sure you want to revoke access to "${confirmRemove.group_name}" from this user group? Users in this group will no longer be able to access projects in this project group.`}
          confirmText="Revoke Access"
          cancelText="Cancel"
          onConfirm={handleRevokeAccess}
          onClose={() => setConfirmRemove(null)}
          isLoading={isRemoving}
        />
      )}
    </div>
  );
};

export default GroupProjectGroupsTab;
