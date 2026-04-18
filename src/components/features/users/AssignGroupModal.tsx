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
import type { UserGroup, GroupFormData } from '@/types/group.types';
import { Search, XCircle, Plus, Users } from 'lucide-react';

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
  const [creatingGroup, setCreatingGroup] = useState(false);

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

  const handleGroupSelect = (groupHash: string) => {
    setSelectedGroup(prev => (prev === groupHash ? '' : groupHash));
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
              Select a group for this user. Consumer users must belong to exactly one group.
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
                          <h4 className="text-sm font-medium">{group.group_name}</h4>
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
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={fetchingGroups || !selectedGroup || isLoading}
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