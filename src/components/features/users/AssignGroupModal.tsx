import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/common/EmptyState';
import { GroupFormModal } from '@/components/features/groups/GroupFormModal';
import { groupService } from '@/services';
import { useToast } from '@/hooks';
import type { UserGroup, GroupFormData, UserGroupProjectValidation } from '@/types/group.types';
import { isDefaultUserGroup } from '@/utils/default-groups';
import { Search, XCircle, Plus, Users, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

interface AssignGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedGroupHash: string) => void;
  initialSelection?: string[];
  isLoading?: boolean;
  userName?: string;
}

export function AssignGroupModal({
  isOpen,
  onClose,
  onConfirm,
  initialSelection = [],
  isLoading = false,
  userName = 'user'
}: AssignGroupModalProps): React.JSX.Element {
  const { showToast } = useToast();
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>(initialSelection[0] || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [fetchingGroups, setFetchingGroups] = useState(false);
  const [error, setError] = useState('');
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [_creatingGroup, setCreatingGroup] = useState(false);

  // Pre-validation state
  const [validationCache, setValidationCache] = useState<
    Record<string, UserGroupProjectValidation>
  >({});
  const [validatingHash, setValidatingHash] = useState<string | null>(null);

  const fetchGroups = useCallback(async () => {
    setFetchingGroups(true);
    setError('');

    try {
      const response = await groupService.getGroups({ limit: 100 });
      if (response.success && Array.isArray(response.user_groups)) {
        setGroups(response.user_groups);
      } else {
        setError('Failed to load user groups');
      }
    } catch (err) {
      console.error('Error fetching groups:', err);
      setError('Failed to load user groups');
    } finally {
      setFetchingGroups(false);
    }
  }, []);

  const fetchGroupProjectGroups = useCallback(async (groupHash: string) => {
    // Skip if already cached
    if (validationCache[groupHash]) {
      return validationCache[groupHash];
    }

    setValidatingHash(groupHash);
    try {
      const response = await groupService.getGroupProjectGroups(groupHash);
      const projectGroups = (response as any)?.project_groups ?? [];
      const totalDerivedProjects = (response as any)?.total_derived_projects ?? 0;
      
      const validation: UserGroupProjectValidation = {
        groupHash,
        hasLinkedProjects: projectGroups.length > 0,
        projectGroupCount: projectGroups.length,
        projectGroupNames: projectGroups.map(
          (pg: any) => pg.group_name ?? pg.name ?? 'Unknown'
        ),
      };

      // Store derived project count for the "empty project groups" warning
      if (totalDerivedProjects === 0 && projectGroups.length > 0) {
        // Linked to project groups, but those groups contain zero projects
        setValidationCache((prev) => ({
          ...prev,
          [groupHash]: { ...validation, projectGroupNames: [...validation.projectGroupNames, '__empty_projects__'] },
        }));
      } else {
        setValidationCache((prev) => ({ ...prev, [groupHash]: validation }));
      }
      return validation;
    } catch (err) {
      console.error('Error fetching group project groups:', err);
      const validation: UserGroupProjectValidation = {
        groupHash,
        hasLinkedProjects: false,
        projectGroupCount: 0,
        projectGroupNames: [],
      };
      // Store error state in cache
      setValidationCache((prev) => ({
        ...prev,
        [groupHash]: { ...validation, projectGroupNames: ['__error__'] },
      }));
      return validation;
    } finally {
      setValidatingHash(null);
    }
  }, [validationCache]);

  useEffect(() => {
    if (isOpen) {
      fetchGroups();
      setSelectedGroup(initialSelection[0] || '');
      setShowCreateGroupModal(false);
    }
  }, [isOpen, initialSelection, fetchGroups]);

  const handleCreateGroup = useCallback(async (formData: GroupFormData) => {
    setCreatingGroup(true);
    try {
      const response = await groupService.createGroup(formData);
      if (response.success && response.user_group) {
        const newGroup = response.user_group;
        // Add new group to list
        setGroups(prev => [newGroup, ...prev]);
        // Auto-select the newly created group
        setSelectedGroup(newGroup.group_hash);
        // Close the create modal
        setShowCreateGroupModal(false);
        showToast(`Group "${newGroup.group_name}" created successfully`, 'success');
      } else {
        throw new Error(response.message || 'Failed to create group');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create group';
      showToast(errorMessage, 'error');
      throw err; // Let GroupFormModal handle the error display
    } finally {
      setCreatingGroup(false);
    }
  }, [showToast]);

  const filteredGroups = groups.filter(group =>
    group.group_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (group.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleGroupSelect = async (groupHash: string) => {
    const wasSelected = selectedGroup === groupHash;
    setSelectedGroup(prev => (prev === groupHash ? '' : groupHash));
    
    // Trigger validation on selection (not deselection)
    if (!wasSelected && groupHash) {
      await fetchGroupProjectGroups(groupHash);
    }
  };

  const handleConfirm = () => {
    if (!selectedGroup) return;
    onConfirm(selectedGroup);
  };

  const handleCancel = () => {
    setSelectedGroup(initialSelection[0] || '');
    setSearchTerm('');
    onClose();
  };

  const handleOpenCreateGroup = () => {
    setShowCreateGroupModal(true);
  };

  // Determine if we're in a true "no groups" state (not just search filtering)
  const hasNoGroups = !fetchingGroups && !error && groups.length === 0;
  const hasFilteredNoResults = !fetchingGroups && !error && groups.length > 0 && filteredGroups.length === 0;

  const selectedGroupName = selectedGroup
    ? groups.find(g => g.group_hash === selectedGroup)?.group_name
    : null;

  return (
    <>
      <Dialog open={isOpen && !showCreateGroupModal} onOpenChange={(open) => !isLoading && !open && handleCancel()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Assign Group to {userName}</DialogTitle>
            <DialogDescription>
              Consumer users must belong to a user group. The group determines which projects the user can access.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Status indicator */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {selectedGroupName
                  ? `Selected: ${selectedGroupName}`
                  : 'Select a group (required for consumer users)'}
              </p>
              {/* Always-visible create button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenCreateGroup}
                disabled={fetchingGroups || isLoading}
              >
                <Plus size={14} />
                Create New Group
              </Button>
            </div>

            {/* Search field - only show if groups exist or we're loading */}
            {(groups.length > 0 || fetchingGroups) && (
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search groups..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={fetchingGroups}
                  className="pl-9"
                />
              </div>
            )}

            {/* Groups list container */}
            <div className="max-h-[300px] overflow-y-auto rounded-md border">
              {fetchingGroups ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Spinner size="lg" />
                  <p className="mt-2 text-sm text-muted-foreground">Loading groups...</p>
                </div>
              ) : error ? (
                <EmptyState
                  icon={<XCircle size={32} />}
                  title="Failed to load groups"
                  description={error}
                  size="sm"
                  action={
                    <Button variant="outline" size="sm" onClick={fetchGroups}>
                      Retry
                    </Button>
                  }
                />
              ) : hasNoGroups ? (
                <EmptyState
                  icon={<Users size={32} />}
                  title="No user groups yet"
                  description="Consumer users need to be assigned to a group. Create your first group to continue."
                  size="sm"
                  action={
                    <Button variant="primary" size="sm" onClick={handleOpenCreateGroup}>
                      <Plus size={14} />
                      Create First Group
                    </Button>
                  }
                />
              ) : hasFilteredNoResults ? (
                <EmptyState
                  icon={<Search size={32} />}
                  title="No matching groups"
                  description="No groups match your search. Try different keywords or create a new group."
                  size="sm"
                  action={
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setSearchTerm('')}>
                        Clear Search
                      </Button>
                      <Button variant="primary" size="sm" onClick={handleOpenCreateGroup}>
                        <Plus size={14} />
                        Create New
                      </Button>
                    </div>
                  }
                />
              ) : (
                <div className="divide-y">
                  {filteredGroups.map(group => {
                    const isSelected = selectedGroup === group.group_hash;
                    const validation = validationCache[group.group_hash];
                    const isValidating = validatingHash === group.group_hash;
                    const isDefault = isDefaultUserGroup(group.group_name);

                    return (
                      <div
                        key={group.group_hash}
                        className={cn(
                          'flex cursor-pointer items-start gap-3 p-3 transition-colors hover:bg-muted/50',
                          isSelected && 'bg-primary/10'
                        )}
                        onClick={() => handleGroupSelect(group.group_hash)}
                      >
                        <input
                          type="radio"
                          name="group-selection"
                          checked={isSelected}
                          onChange={() => handleGroupSelect(group.group_hash)}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-1"
                        />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-medium">{group.group_name}</h4>
                            {isDefault && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge variant="subtleInfo" size="sm" className="cursor-help">
                                      Default
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    Auto-created when the project was created. Can be deleted like any other group.
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                            {isSelected && validation && !isValidating && (
                              validation.projectGroupNames.includes('__error__') ? (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3 text-warning" />
                                  Unable to verify
                                </span>
                              ) : validation.projectGroupNames.includes('__empty_projects__') ? (
                                <span className="text-xs text-warning-foreground flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  Linked to empty project groups
                                </span>
                              ) : validation.hasLinkedProjects ? (
                                <span className="text-xs text-success-foreground flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3" />
                                  Has linked projects
                                </span>
                              ) : validation.projectGroupCount > 0 ? (
                                <span className="text-xs text-warning-foreground flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  Linked to empty project groups
                                </span>
                              ) : (
                                <span className="text-xs text-warning-foreground flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  No linked projects
                                </span>
                              )
                            )}
                            {isSelected && isValidating && (
                              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                            )}
                          </div>
                          {group.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">{group.description}</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {group.member_count || 0} member{(group.member_count || 0) !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Validation warning banner for selected group */}
            {selectedGroup && validationCache[selectedGroup] && validatingHash !== selectedGroup && (
              (() => {
                const v = validationCache[selectedGroup];
                const hasError = v.projectGroupNames.includes('__error__');
                const hasEmptyProjects = v.projectGroupNames.includes('__empty_projects__');

                if (hasError) {
                  return (
                    <div className="flex items-start gap-2 p-3 rounded-md bg-warning/10 border border-warning/20 text-sm">
                      <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
                      <span className="text-warning-foreground">
                        Unable to verify project access for this group.
                      </span>
                    </div>
                  );
                }
                if (!v.hasLinkedProjects && v.projectGroupCount === 0) {
                  return (
                    <div className="flex items-start gap-2 p-3 rounded-md bg-warning/10 border border-warning/20 text-sm">
                      <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
                      <span className="text-warning-foreground">
                        This group has no linked projects. Users assigned to this group will not be able to access any projects.
                      </span>
                    </div>
                  );
                }
                if (hasEmptyProjects) {
                  return (
                    <div className="flex items-start gap-2 p-3 rounded-md bg-warning/10 border border-warning/20 text-sm">
                      <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
                      <span className="text-warning-foreground">
                        This group is linked to project groups, but those groups contain no projects. Users will not be able to access any projects.
                      </span>
                    </div>
                  );
                }
                return null;
              })()
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={fetchingGroups || validatingHash === selectedGroup || !selectedGroup || isLoading}
            >
              {isLoading && <Spinner size="sm" className="mr-2" />}
              {selectedGroup ? 'Assign Group' : 'Select a Group'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Inline Group Creation Modal */}
      <GroupFormModal
        isOpen={showCreateGroupModal}
        onClose={() => setShowCreateGroupModal(false)}
        onSubmit={handleCreateGroup}
        mode="create"
        group={null}
      />
    </>
  );
}

export default AssignGroupModal; 