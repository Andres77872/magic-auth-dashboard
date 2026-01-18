import React, { useState, useEffect } from 'react';
import { ConfirmDialog, DataView, EmptyState } from '@/components/common';
import type { DataViewColumn } from '@/components/common';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Lock, Plus, Trash2, Info, MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { permissionAssignmentsService, globalRolesService } from '@/services';
import type { DirectPermissionAssignment } from '@/types/permission-assignments.types';
import type { GlobalPermissionGroup } from '@/types/global-roles.types';
import { useToast } from '@/contexts/ToastContext';

interface UserPermissionGroupsTabProps {
  userHash: string;
  username: string;
}

export const UserPermissionGroupsTab: React.FC<UserPermissionGroupsTabProps> = ({ userHash, username }) => {
  const [directAssignments, setDirectAssignments] = useState<DirectPermissionAssignment[]>([]);
  const [availableGroups, setAvailableGroups] = useState<GlobalPermissionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<DirectPermissionAssignment | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const { addToast } = useToast();

  // Fetch direct permission group assignments
  // GET /permissions/users/{user_hash}/permission-groups
  const fetchDirectAssignments = async () => {
    try {
      setLoading(true);
      const response: any = await permissionAssignmentsService.getUserDirectPermissionGroups(userHash);
      
      // API returns direct_permission_groups array directly in response
      if (response.direct_permission_groups) {
        setDirectAssignments(response.direct_permission_groups);
      } else if (response.success === false) {
        throw new Error(response.message || 'Failed to fetch permission groups');
      } else {
        setDirectAssignments([]);
      }
    } catch (error) {
      console.error('Failed to fetch direct permission assignments:', error);
      addToast({ message: 'Failed to load permission groups', variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Fetch available permission groups
  // GET /roles/permission-groups
  const fetchAvailableGroups = async () => {
    try {
      const response: any = await globalRolesService.getPermissionGroups();
      
      // API returns permission_groups array directly in response
      const permissionGroupsData = response.permission_groups || [];
      
      if (response.success !== false) {
        // Filter out already assigned groups
        const assignedHashes = new Set(directAssignments.map(a => a.group_hash));
        const available = permissionGroupsData.filter((g: GlobalPermissionGroup) => !assignedHashes.has(g.group_hash));
        setAvailableGroups(available);
      }
    } catch (error) {
      console.error('Failed to fetch available permission groups:', error);
    }
  };

  useEffect(() => {
    fetchDirectAssignments();
  }, [userHash]);

  useEffect(() => {
    if (showAddModal) {
      fetchAvailableGroups();
    }
  }, [showAddModal, directAssignments]);

  // Handle assign permission group
  const handleAssign = async () => {
    if (!selectedGroup) {
      addToast({ message: 'Please select a permission group', variant: 'warning' });
      return;
    }

    try {
      setIsAssigning(true);
      const response = await permissionAssignmentsService.assignPermissionGroupToUser(
        userHash,
        selectedGroup,
        assignmentNotes.trim() || undefined
      );

      if (response.success) {
        addToast({ message: 'Permission group assigned successfully', variant: 'success' });
        setShowAddModal(false);
        setSelectedGroup('');
        setAssignmentNotes('');
        await fetchDirectAssignments();
      }
    } catch (error) {
      console.error('Failed to assign permission group:', error);
      addToast({ message: 'Failed to assign permission group', variant: 'error' });
    } finally {
      setIsAssigning(false);
    }
  };

  // Handle remove permission group
  const handleRemove = async () => {
    if (!confirmRemove) return;

    try {
      setIsRemoving(true);
      const response = await permissionAssignmentsService.removePermissionGroupFromUser(
        userHash,
        confirmRemove.group_hash
      );

      if (response.success) {
        addToast({ message: 'Permission group removed successfully', variant: 'success' });
        setConfirmRemove(null);
        await fetchDirectAssignments();
      }
    } catch (error) {
      console.error('Failed to remove permission group:', error);
      addToast({ message: 'Failed to remove permission group', variant: 'error' });
    } finally {
      setIsRemoving(false);
    }
  };

  // Filter assignments based on search term
  const filteredAssignments = directAssignments.filter(assignment => {
    if (!searchTerm.trim()) return true;
    const search = searchTerm.toLowerCase();
    return (
      (assignment.group_display_name || '').toLowerCase().includes(search) ||
      (assignment.group_name || '').toLowerCase().includes(search) ||
      (assignment.notes || '').toLowerCase().includes(search)
    );
  });

  // DataView columns for table view
  const columns: DataViewColumn<DirectPermissionAssignment>[] = [
    {
      key: 'group_display_name',
      header: 'Permission Group',
      sortable: true,
      render: (_, assignment) => (
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">
            {assignment.group_display_name || assignment.group_name}
          </span>
        </div>
      ),
    },
    {
      key: 'notes',
      header: 'Notes',
      hideOnMobile: true,
      render: (value) => (
        <span className="text-muted-foreground line-clamp-1">
          {value || '—'}
        </span>
      ),
    },
    {
      key: 'assigned_at',
      header: 'Assigned',
      width: '140px',
      hideOnMobile: true,
      render: (value) => (
        <span className="text-sm text-muted-foreground">
          {value ? new Date(value as string).toLocaleDateString() : '—'}
        </span>
      ),
    },
    {
      key: 'assigned_by',
      header: 'Assigned By',
      width: '120px',
      hideOnMobile: true,
      render: (value) => (
        <span className="text-sm text-muted-foreground">{value || '—'}</span>
      ),
    },
    {
      key: 'group_hash',
      header: '',
      width: '60px',
      align: 'center',
      render: (_, assignment) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                setConfirmRemove(assignment);
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  // Card renderer for grid view
  const renderAssignmentCard = (assignment: DirectPermissionAssignment) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3">
            <Lock size={20} className="mt-0.5 text-muted-foreground" aria-hidden="true" />
            <div className="space-y-1">
              <h4 className="font-medium">{assignment.group_display_name || assignment.group_name}</h4>
              <Badge variant="warning">Direct Assignment</Badge>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setConfirmRemove(assignment);
            }}
            aria-label="Remove permission group"
          >
            <Trash2 size={16} aria-hidden="true" />
          </Button>
        </div>
        {assignment.notes && (
          <div className="mt-3 rounded-md bg-muted p-2 text-sm">
            <strong>Notes:</strong> {assignment.notes}
          </div>
        )}
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span>
            Assigned: {new Date(assignment.assigned_at).toLocaleDateString()}
          </span>
          {assignment.assigned_by && (
            <span>
              By: {assignment.assigned_by}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle>Direct Permission Groups</CardTitle>
              <p className="text-sm text-muted-foreground">
                Direct permission assignments for <strong>{username}</strong>
              </p>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Info size={14} /> These are permission groups assigned directly to this user, overriding group memberships.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataView<DirectPermissionAssignment>
            data={filteredAssignments}
            columns={columns}
            keyExtractor={(item) => item.group_hash}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            showViewToggle={true}
            defaultViewMode="grid"
            renderCard={renderAssignmentCard}
            gridColumns={{ mobile: 1, tablet: 2, desktop: 3 }}
            showSearch={true}
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search permission groups..."
            toolbarActions={
              <Button onClick={() => setShowAddModal(true)}>
                <Plus size={16} aria-hidden="true" />
                Assign Permission Group
              </Button>
            }
            isLoading={loading}
            emptyMessage="No Direct Permission Groups"
            emptyDescription="This user doesn't have any permission groups assigned directly. They inherit permissions from their user groups and global role."
            emptyIcon={<Lock className="h-10 w-10" />}
            emptyAction={
              <Button onClick={() => setShowAddModal(true)}>
                <Plus size={16} className="mr-2" />
                Assign Permission Group
              </Button>
            }
          />
        </CardContent>
      </Card>

      {/* Assign Permission Group Modal */}
      <Dialog open={showAddModal} onOpenChange={(open) => !isAssigning && !open && setShowAddModal(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Direct Permission Group</DialogTitle>
          </DialogHeader>

          {availableGroups.length === 0 ? (
            <EmptyState
              icon={<Info size={32} aria-hidden="true" />}
              title="No Available Permission Groups"
              description="All permission groups have been assigned to this user."
            />
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="permission-group">Select Permission Group</Label>
                <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                  <SelectTrigger>
                    <SelectValue placeholder="-- Select a permission group --" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableGroups.map(group => (
                      <SelectItem key={group.group_hash} value={group.group_hash}>
                        {group.group_display_name} ({group.group_name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={assignmentNotes}
                  onChange={(e) => setAssignmentNotes(e.target.value)}
                  placeholder="Reason for direct assignment (e.g., 'Temporary elevated access for migration')"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Document why this user needs direct permission assignment instead of group membership.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddModal(false)}
              disabled={isAssigning}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssign}
              disabled={!selectedGroup || isAssigning}
            >
              {isAssigning && <Spinner size="sm" className="mr-2" />}
              Assign Permission Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Confirmation Dialog */}
      {confirmRemove && (
        <ConfirmDialog
          isOpen={true}
          title="Remove Direct Permission Group"
          message={`Are you sure you want to remove the direct permission group "${confirmRemove.group_display_name || confirmRemove.group_name}" from this user? They will still inherit permissions from their user groups and global role.`}
          confirmText="Remove"
          cancelText="Cancel"
          onConfirm={handleRemove}
          onClose={() => setConfirmRemove(null)}
          isLoading={isRemoving}
        />
      )}
    </div>
  );
};

export default UserPermissionGroupsTab;

