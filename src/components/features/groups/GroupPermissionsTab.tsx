import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import { ConfirmDialog, EmptyState, DataView } from '@/components/common';
import type { DataViewColumn } from '@/components/common';
import { Lock, Plus, Trash2, Info, MoreHorizontal } from 'lucide-react';
import { permissionAssignmentsService, globalRolesService } from '@/services';
import type { PermissionGroupAssignment } from '@/types/permission-assignments.types';
import type { GlobalPermissionGroup } from '@/types/global-roles.types';
import { useToast } from '@/contexts/ToastContext';

interface GroupPermissionsTabProps {
  groupHash: string;
  groupName: string;
}

export const GroupPermissionsTab: React.FC<GroupPermissionsTabProps> = ({ groupHash, groupName }) => {
  const [assignedGroups, setAssignedGroups] = useState<PermissionGroupAssignment[]>([]);
  const [availableGroups, setAvailableGroups] = useState<GlobalPermissionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<PermissionGroupAssignment | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const { addToast } = useToast();

  // Fetch assigned permission groups
  // GET /permissions/admin/user-groups/{group_hash}/permission-groups
  const fetchAssignedGroups = async () => {
    try {
      setLoading(true);
      const response: any = await permissionAssignmentsService.getUserGroupPermissionGroups(groupHash);
      
      // API returns permission_groups array directly in response
      if (response.permission_groups) {
        setAssignedGroups(response.permission_groups);
      } else if (response.success === false) {
        throw new Error(response.message || 'Failed to fetch permission groups');
      } else {
        setAssignedGroups([]);
      }
    } catch (error) {
      console.error('Failed to fetch assigned permission groups:', error);
      addToast({ message: 'Failed to load permission groups', variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Fetch all available permission groups
  // GET /roles/permission-groups
  const fetchAvailableGroups = async () => {
    try {
      const response: any = await globalRolesService.getPermissionGroups();
      
      // API returns permission_groups array directly in response
      const permissionGroupsData = response.permission_groups || [];
      
      if (response.success !== false) {
        // Filter out already assigned groups
        const assignedHashes = new Set(assignedGroups.map((g: PermissionGroupAssignment) => g.group_hash));
        const available = permissionGroupsData.filter((g: GlobalPermissionGroup) => !assignedHashes.has(g.group_hash));
        setAvailableGroups(available);
      }
    } catch (error) {
      console.error('Failed to fetch available permission groups:', error);
    }
  };

  useEffect(() => {
    fetchAssignedGroups();
  }, [groupHash]);

  useEffect(() => {
    if (showAddModal) {
      fetchAvailableGroups();
    }
  }, [showAddModal, assignedGroups]);

  // Handle bulk assignment
  const handleBulkAssign = async () => {
    if (selectedGroups.length === 0) {
      addToast({ message: 'Please select at least one permission group', variant: 'warning' });
      return;
    }

    try {
      setIsAssigning(true);
      const response = await permissionAssignmentsService.bulkAssignPermissionGroupsToUserGroup(
        groupHash,
        selectedGroups
      );

      if (response.success) {
        addToast({ message: `Successfully assigned ${selectedGroups.length} permission group(s)`, variant: 'success' });
        setShowAddModal(false);
        setSelectedGroups([]);
        await fetchAssignedGroups();
      }
    } catch (error) {
      console.error('Failed to assign permission groups:', error);
      addToast({ message: 'Failed to assign permission groups', variant: 'error' });
    } finally {
      setIsAssigning(false);
    }
  };

  // Handle remove permission group
  const handleRemove = async () => {
    if (!confirmRemove) return;

    try {
      setIsRemoving(true);
      const response = await permissionAssignmentsService.removePermissionGroupFromUserGroup(
        groupHash,
        confirmRemove.group_hash
      );

      if (response.success) {
        addToast({ message: 'Permission group removed successfully', variant: 'success' });
        setConfirmRemove(null);
        await fetchAssignedGroups();
      }
    } catch (error) {
      console.error('Failed to remove permission group:', error);
      addToast({ message: 'Failed to remove permission group', variant: 'error' });
    } finally {
      setIsRemoving(false);
    }
  };

  // Toggle permission group selection
  const toggleGroupSelection = (groupHash: string) => {
    setSelectedGroups(prev =>
      prev.includes(groupHash)
        ? prev.filter(h => h !== groupHash)
        : [...prev, groupHash]
    );
  };

  // Group permission groups by category
  const groupedByCategory = availableGroups.reduce((acc, group) => {
    const category = group.group_category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(group);
    return acc;
  }, {} as Record<string, GlobalPermissionGroup[]>);

  // Filter assigned groups based on search term
  const filteredAssignedGroups = assignedGroups.filter(assignment => {
    if (!searchTerm.trim()) return true;
    const search = searchTerm.toLowerCase();
    return (
      (assignment.group_display_name || '').toLowerCase().includes(search) ||
      (assignment.group_name || '').toLowerCase().includes(search)
    );
  });

  // DataView columns for table view
  const columns: DataViewColumn<PermissionGroupAssignment>[] = [
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
      key: 'group_hash',
      header: 'Hash',
      width: '150px',
      hideOnMobile: true,
      render: (value) => (
        <Badge variant="secondary" className="text-xs font-mono">
          {String(value).slice(0, 12)}...
        </Badge>
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
      key: 'group_name',
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
  const renderAssignmentCard = (assignment: PermissionGroupAssignment) => (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Lock className="h-5 w-5 text-primary mt-0.5" aria-hidden="true" />
            <div className="space-y-1">
              <h4 className="font-medium">{assignment.group_display_name || assignment.group_name}</h4>
              <Badge variant="secondary" className="text-xs">
                {assignment.group_hash.slice(0, 12)}...
              </Badge>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setConfirmRemove(assignment);
            }}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            aria-label="Remove permission group"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
        <div className="mt-3 space-y-1 text-xs text-muted-foreground">
          <p>Assigned: {new Date(assignment.assigned_at).toLocaleDateString()}</p>
          {assignment.assigned_by && (
            <p>By: {assignment.assigned_by}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div className="space-y-1">
            <CardTitle>Permission Groups</CardTitle>
            <p className="text-sm text-muted-foreground">
              Manage permission groups assigned to <strong>{groupName}</strong>
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <DataView<PermissionGroupAssignment>
            data={filteredAssignedGroups}
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
                <Plus className="h-4 w-4" aria-hidden="true" />
                Assign Permission Groups
              </Button>
            }
            isLoading={loading}
            emptyMessage="No Permission Groups Assigned"
            emptyDescription="This user group doesn't have any permission groups assigned. Click 'Assign Permission Groups' to add some."
            emptyIcon={<Lock className="h-10 w-10" />}
            emptyAction={
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Assign Permission Groups
              </Button>
            }
          />
        </CardContent>
      </Card>

      {/* Add Permission Groups Modal */}
      <Dialog open={showAddModal} onOpenChange={(open) => !isAssigning && !open && setShowAddModal(false)}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>Assign Permission Groups</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {availableGroups.length === 0 ? (
              <EmptyState
                icon={<Info className="h-10 w-10" aria-hidden="true" />}
                title="No Available Permission Groups"
                description="All permission groups have been assigned to this user group."
              />
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <Badge variant="info">
                    {selectedGroups.length} selected
                  </Badge>
                </div>

                <div className="max-h-[400px] overflow-y-auto space-y-4">
                  {Object.entries(groupedByCategory).map(([category, groups]) => (
                    <div key={category} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{category}</h3>
                        <Badge variant="secondary">{groups.length}</Badge>
                      </div>
                      <div className="space-y-2">
                        {groups.map(group => (
                          <div
                            key={group.group_hash}
                            className={`flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
                              selectedGroups.includes(group.group_hash)
                                ? 'border-primary bg-primary/5'
                                : 'hover:bg-accent/50'
                            }`}
                            onClick={() => toggleGroupSelection(group.group_hash)}
                          >
                            <Checkbox
                              checked={selectedGroups.includes(group.group_hash)}
                              onCheckedChange={() => toggleGroupSelection(group.group_hash)}
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium">{group.group_display_name}</h4>
                              <p className="text-sm text-muted-foreground">{group.group_name}</p>
                              {group.group_description && (
                                <p className="text-sm text-muted-foreground mt-1 truncate">
                                  {group.group_description}
                                </p>
                              )}
                            </div>
                            <Badge variant="secondary">{group.group_category}</Badge>
                          </div>
                        ))}
                      </div>
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
              onClick={handleBulkAssign}
              disabled={selectedGroups.length === 0 || isAssigning}
              loading={isAssigning}
            >
              Assign {selectedGroups.length > 0 ? `(${selectedGroups.length})` : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Confirmation Dialog */}
      {confirmRemove && (
        <ConfirmDialog
          isOpen={true}
          title="Remove Permission Group"
          message={`Are you sure you want to remove the permission group "${confirmRemove.group_display_name || confirmRemove.group_name}" from this user group?`}
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

export default GroupPermissionsTab;

