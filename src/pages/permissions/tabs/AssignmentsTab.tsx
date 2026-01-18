import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ConfirmDialog, DataView, ActionsMenu, EmptyState } from '@/components/common';
import type { DataViewColumn } from '@/components/common';
import type { ActionMenuItem } from '@/components/common/ActionsMenu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ClipboardList, Info, Layers, Plus, Trash2, User, Users } from 'lucide-react';
import { usePermissionAssignments, useGroups, useUsers, usePermissionManagement } from '@/hooks';
import { useToast } from '@/contexts/ToastContext';
import { BulkAssignModal } from '@/components/features/permissions';

interface AssignmentRecord {
  id: string;
  type: 'user_group' | 'direct_user';
  targetHash: string;
  permissionGroupHash: string;
  permissionGroupName: string;
  permissionGroupKey: string;
  assignedAt: string;
  assignedBy?: string;
  notes?: string;
}

type AssignmentViewType = 'user_group' | 'direct_user';

export const AssignmentsTab: React.FC = () => {
  const { addToast } = useToast();
  const [viewType, setViewType] = useState<AssignmentViewType>('user_group');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTarget, setSelectedTarget] = useState<string>('');
  const [selectedPermissionGroup, setSelectedPermissionGroup] = useState<string>('');
  const [notes, setNotes] = useState('');

  // Assignment states
  const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState<AssignmentRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isBulkAssignModalOpen, setIsBulkAssignModalOpen] = useState(false);
  const loadIdRef = useRef(0);

  const {
    assignPermissionGroupToUserGroup,
    removePermissionGroupFromUserGroup,
    assignPermissionGroupToUser,
    removePermissionGroupFromUser,
    getUserGroupPermissionGroups,
    getUserDirectPermissionGroups,
  } = usePermissionAssignments();

  const { groups, isLoading: groupsLoading } = useGroups();
  const { users, isLoading: usersLoading } = useUsers();
  const { permissionGroups, permissionGroupsLoading } = usePermissionManagement();

  const isUserGroupView = viewType === 'user_group';
  const isTargetLoading = isUserGroupView ? groupsLoading : usersLoading;

  const selectedTargetName = useMemo(() => {
    if (!selectedTarget) return '';
    if (isUserGroupView) {
      return groups.find((g) => g.group_hash === selectedTarget)?.group_name || selectedTarget;
    }
    return users.find((u) => u.user_hash === selectedTarget)?.username || selectedTarget;
  }, [groups, isUserGroupView, selectedTarget, users]);

  const targetOptions = useMemo(() => {
    if (isUserGroupView) {
      return groups.map((group) => ({
        value: group.group_hash,
        label: group.group_name,
      }));
    }
    return users.map((user) => ({
      value: user.user_hash,
      label: user.username,
    }));
  }, [groups, isUserGroupView, users]);

  const permissionGroupOptions = useMemo(
    () =>
      permissionGroups
        .filter((group) => !assignments.some((assignment) => assignment.permissionGroupHash === group.group_hash))
        .map((group) => ({
          value: group.group_hash,
          label: group.group_display_name || group.group_name,
          key: group.group_name,
          category: group.group_category,
        })),
    [assignments, permissionGroups]
  );

  const filteredAssignments = useMemo(() => {
    if (!searchTerm.trim()) return assignments;
    const search = searchTerm.toLowerCase();
    return assignments.filter((assignment) => {
      const notesValue = assignment.notes ? assignment.notes.toLowerCase() : '';
      return (
        assignment.permissionGroupName.toLowerCase().includes(search) ||
        assignment.permissionGroupKey.toLowerCase().includes(search) ||
        notesValue.includes(search) ||
        (assignment.assignedBy || '').toLowerCase().includes(search)
      );
    });
  }, [assignments, searchTerm]);

  const formatDate = useCallback((value?: string) => {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
  }, []);

  // Load assignments when target changes
  const loadAssignments = useCallback(async () => {
    loadIdRef.current += 1;
    const loadId = loadIdRef.current;

    if (!selectedTarget) {
      setAssignments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setAssignments([]);
    try {
      if (isUserGroupView) {
        const response = await getUserGroupPermissionGroups(selectedTarget);
        if (loadId !== loadIdRef.current) return;
        const records: AssignmentRecord[] = response.map((group) => ({
          id: `${selectedTarget}-${group.group_hash}`,
          type: 'user_group',
          targetHash: selectedTarget,
          permissionGroupHash: group.group_hash,
          permissionGroupName: group.group_display_name || group.group_name,
          permissionGroupKey: group.group_name,
          assignedAt: group.assigned_at,
          assignedBy: group.assigned_by,
        }));
        setAssignments(records);
      } else {
        const response = await getUserDirectPermissionGroups(selectedTarget);
        if (loadId !== loadIdRef.current) return;
        const records: AssignmentRecord[] = response.map((group) => ({
          id: `${selectedTarget}-${group.group_hash}`,
          type: 'direct_user',
          targetHash: selectedTarget,
          permissionGroupHash: group.group_hash,
          permissionGroupName: group.group_display_name || group.group_name,
          permissionGroupKey: group.group_name,
          assignedAt: group.assigned_at,
          assignedBy: group.assigned_by,
          notes: group.notes,
        }));
        setAssignments(records);
      }
    } catch (error) {
      if (loadId !== loadIdRef.current) return;
      addToast({
        message: error instanceof Error ? error.message : 'Failed to load assignments',
        variant: 'error',
      });
    } finally {
      if (loadId === loadIdRef.current) {
        setLoading(false);
      }
    }
  }, [
    addToast,
    getUserDirectPermissionGroups,
    getUserGroupPermissionGroups,
    isUserGroupView,
    selectedTarget,
  ]);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  useEffect(() => {
    if (
      selectedPermissionGroup &&
      !permissionGroupOptions.some((option) => option.value === selectedPermissionGroup)
    ) {
      setSelectedPermissionGroup('');
    }
  }, [permissionGroupOptions, selectedPermissionGroup]);

  // Handle view type change
  const handleViewTypeChange = (newViewType: AssignmentViewType) => {
    setViewType(newViewType);
    setSelectedTarget('');
    setAssignments([]);
    setSelectedPermissionGroup('');
    setNotes('');
    setSearchTerm('');
    setAssignmentToDelete(null);
    setIsDeleteDialogOpen(false);
  };

  const handleTargetChange = (value: string) => {
    setSelectedTarget(value);
    setAssignments([]);
    setSelectedPermissionGroup('');
    setNotes('');
    setSearchTerm('');
    setAssignmentToDelete(null);
    setIsDeleteDialogOpen(false);
  };

  // Assign handler
  const handleAssign = async () => {
    if (!selectedTarget || !selectedPermissionGroup) {
      addToast({ message: 'Select a target and permission group first', variant: 'warning' });
      return;
    }

    setIsAssigning(true);
    try {
      if (isUserGroupView) {
        await assignPermissionGroupToUserGroup(selectedTarget, selectedPermissionGroup);
      } else {
        await assignPermissionGroupToUser(selectedTarget, selectedPermissionGroup, notes.trim() || undefined);
      }
      addToast({ message: 'Permission group assigned successfully', variant: 'success' });
      setSelectedPermissionGroup('');
      setNotes('');
      await loadAssignments();
    } catch (error) {
      addToast({
        message: error instanceof Error ? error.message : 'Failed to assign permission group',
        variant: 'error',
      });
    } finally {
      setIsAssigning(false);
    }
  };

  // Delete handlers
  const handleDelete = useCallback((assignment: AssignmentRecord) => {
    setAssignmentToDelete(assignment);
    setIsDeleteDialogOpen(true);
  }, []);

  const handleConfirmDelete = async () => {
    if (!assignmentToDelete) return;

    setIsDeleting(true);
    try {
      if (assignmentToDelete.type === 'user_group') {
        await removePermissionGroupFromUserGroup(
          assignmentToDelete.targetHash,
          assignmentToDelete.permissionGroupHash
        );
      } else {
        await removePermissionGroupFromUser(
          assignmentToDelete.targetHash,
          assignmentToDelete.permissionGroupHash
        );
      }
      addToast({ message: 'Permission group removed successfully', variant: 'success' });
      await loadAssignments();
      setIsDeleteDialogOpen(false);
      setAssignmentToDelete(null);
    } catch (error) {
      addToast({
        message: error instanceof Error ? error.message : 'Failed to remove permission group',
        variant: 'error',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const viewBadge = isUserGroupView
    ? { label: 'Primary', variant: 'success' as const }
    : { label: 'Secondary', variant: 'warning' as const };

  const viewDescription = isUserGroupView
    ? 'Assign permission groups to user groups for scalable, consistent access control.'
    : 'Direct assignments are exceptions for temporary or specialized access.';

  const columns = useMemo<DataViewColumn<AssignmentRecord>[]>(() => {
    const baseColumns: DataViewColumn<AssignmentRecord>[] = [
      {
        key: 'permissionGroupName',
        header: 'Permission Group',
        render: (_, assignment) => (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <span className="font-medium">{assignment.permissionGroupName}</span>
              {!isUserGroupView && (
                <Badge variant="warning" size="sm">
                  Direct
                </Badge>
              )}
            </div>
            <div className="text-xs font-mono text-muted-foreground">{assignment.permissionGroupKey}</div>
          </div>
        ),
      },
    ];

    if (!isUserGroupView) {
      baseColumns.push({
        key: 'notes',
        header: 'Notes',
        hideOnMobile: true,
        render: (value) => (
          <span className="text-sm text-muted-foreground">{value ? String(value) : '—'}</span>
        ),
      });
    }

    baseColumns.push(
      {
        key: 'assignedAt',
        header: 'Assigned',
        width: '140px',
        hideOnMobile: true,
        render: (value) => <span className="text-sm text-muted-foreground">{formatDate(String(value))}</span>,
      },
      {
        key: 'assignedBy',
        header: 'Assigned By',
        width: '140px',
        hideOnMobile: true,
        render: (value) => <span className="text-sm text-muted-foreground">{value ? String(value) : '—'}</span>,
      },
      {
        key: 'id',
        header: '',
        width: '60px',
        align: 'center',
        render: (_, row) => {
          const menuItems: ActionMenuItem[] = [
            {
              key: 'remove',
              label: 'Remove',
              icon: <Trash2 className="h-4 w-4" />,
              onClick: () => handleDelete(row),
              destructive: true,
            },
          ];

          return (
            <ActionsMenu items={menuItems} ariaLabel={`Actions for ${row.permissionGroupName}`} size="sm" />
          );
        },
      }
    );

    return baseColumns;
  }, [formatDate, handleDelete, isUserGroupView]);

  const renderAssignmentCard = useCallback(
    (assignment: AssignmentRecord) => (
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <span className="font-medium">{assignment.permissionGroupName}</span>
                {!isUserGroupView && (
                  <Badge variant="warning" size="sm">
                    Direct
                  </Badge>
                )}
              </div>
              <div className="text-xs font-mono text-muted-foreground">{assignment.permissionGroupKey}</div>
            </div>
            <ActionsMenu
              items={[
                {
                  key: 'remove',
                  label: 'Remove',
                  icon: <Trash2 className="h-4 w-4" />,
                  onClick: () => handleDelete(assignment),
                  destructive: true,
                },
              ]}
              ariaLabel={`Actions for ${assignment.permissionGroupName}`}
              size="sm"
            />
          </div>
          {assignment.notes && (
            <div className="rounded-md bg-muted/40 p-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Notes:</span> {assignment.notes}
            </div>
          )}
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span>Assigned: {formatDate(assignment.assignedAt)}</span>
            <span>By: {assignment.assignedBy || '—'}</span>
          </div>
        </CardContent>
      </Card>
    ),
    [formatDate, handleDelete, isUserGroupView]
  );

  const assignmentCountLabel = searchTerm.trim()
    ? `${filteredAssignments.length} of ${assignments.length} assignments`
    : `${assignments.length} assignment${assignments.length !== 1 ? 's' : ''}`;

  const emptyMessage = isUserGroupView
    ? 'No permission groups assigned'
    : 'No direct assignments';
  const emptyDescription = isUserGroupView
    ? 'Assign permission groups to manage access through group membership.'
    : 'Use direct assignments sparingly for exceptions or temporary access.';

  const deleteTargetLabel = selectedTargetName
    ? `"${selectedTargetName}"`
    : isUserGroupView
      ? 'this user group'
      : 'this user';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-2">
          <CardTitle>Permission Assignments</CardTitle>
          <CardDescription>
            Assign permission groups to user groups (recommended) or individual users (special cases).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs value={viewType} onValueChange={(value) => handleViewTypeChange(value as AssignmentViewType)}>
            <TabsList className="grid w-full grid-cols-2 md:w-auto">
              <TabsTrigger value="user_group" className="gap-2">
                <Users className="h-4 w-4" aria-hidden="true" />
                User Groups
                <Badge variant="success" size="sm">
                  Primary
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="direct_user" className="gap-2">
                <User className="h-4 w-4" aria-hidden="true" />
                Direct Users
                <Badge variant="warning" size="sm">
                  Secondary
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <Info className="mt-0.5 h-4 w-4" aria-hidden="true" />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant={viewBadge.variant} size="sm">
                    {viewBadge.label}
                  </Badge>
                  <span>{isUserGroupView ? 'Recommended approach' : 'Use for exceptions'}</span>
                </div>
                <p>{viewDescription}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="assignment-target">
                {isUserGroupView ? 'User Group' : 'User'}
              </Label>
              <Select
                value={selectedTarget}
                onValueChange={handleTargetChange}
                disabled={isTargetLoading}
              >
                <SelectTrigger id="assignment-target">
                  <SelectValue
                    placeholder={
                      isTargetLoading
                        ? `Loading ${isUserGroupView ? 'user groups' : 'users'}...`
                        : `Select ${isUserGroupView ? 'a user group' : 'a user'}`
                    }
                  />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {isTargetLoading ? (
                    <SelectItem value="loading" disabled>
                      Loading...
                    </SelectItem>
                  ) : targetOptions.length === 0 ? (
                    <SelectItem value="empty" disabled>
                      No {isUserGroupView ? 'user groups' : 'users'} found
                    </SelectItem>
                  ) : (
                    targetOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignment-group">Permission Group</Label>
              <Select
                value={selectedPermissionGroup}
                onValueChange={setSelectedPermissionGroup}
                disabled={!selectedTarget || permissionGroupsLoading || loading}
              >
                <SelectTrigger id="assignment-group">
                  <SelectValue
                    placeholder={
                      !selectedTarget
                        ? 'Select a target first'
                        : permissionGroupsLoading
                          ? 'Loading permission groups...'
                          : 'Select a permission group'
                    }
                  />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {permissionGroupsLoading ? (
                    <SelectItem value="loading" disabled>
                      Loading permission groups...
                    </SelectItem>
                  ) : permissionGroupOptions.length === 0 ? (
                    <SelectItem value="empty" disabled>
                      No available permission groups
                    </SelectItem>
                  ) : (
                    permissionGroupOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="py-2">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex flex-col">
                            <span className="font-medium">{option.label}</span>
                            <span className="text-xs font-mono text-muted-foreground">{option.key}</span>
                          </div>
                          {option.category && <Badge variant="outline">{option.category}</Badge>}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {!isUserGroupView && (
            <Textarea
              label="Notes (Optional)"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Reason for direct assignment (e.g., temporary elevated access)"
              rows={3}
              helperText="Document why this user needs direct permission assignment instead of group membership."
              disabled={!selectedTarget}
            />
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="primary"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={handleAssign}
              disabled={!selectedTarget || !selectedPermissionGroup || isAssigning || loading}
              loading={isAssigning}
            >
              Assign
            </Button>
            {isUserGroupView && (
              <Button
                variant="secondary"
                leftIcon={<Layers className="h-4 w-4" />}
                onClick={() => setIsBulkAssignModalOpen(true)}
                disabled={!selectedTarget || permissionGroupOptions.length === 0}
              >
                Bulk Assign
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle>Assignments</CardTitle>
            <CardDescription>
              {selectedTarget
                ? `Permission groups assigned to ${selectedTargetName}`
                : `Select a ${isUserGroupView ? 'user group' : 'user'} to view assignments.`}
            </CardDescription>
          </div>
          {selectedTarget && (
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{assignmentCountLabel}</Badge>
              <Badge variant="outline">{selectedTargetName}</Badge>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {selectedTarget ? (
            <DataView
              columns={columns}
              data={filteredAssignments}
              viewMode="table"
              showViewToggle={false}
              responsiveCardView={true}
              renderCard={renderAssignmentCard}
              isLoading={loading}
              showSearch={true}
              searchValue={searchTerm}
              onSearchChange={setSearchTerm}
              searchPlaceholder={`Search ${isUserGroupView ? 'group' : 'direct'} assignments...`}
              emptyMessage={emptyMessage}
              emptyDescription={emptyDescription}
              emptyIcon={<ClipboardList className="h-10 w-10" />}
              caption={selectedTargetName ? `Permission assignments for ${selectedTargetName}` : undefined}
            />
          ) : (
            <EmptyState
              icon={<ClipboardList className="h-10 w-10" aria-hidden="true" />}
              title={`Select a ${isUserGroupView ? 'user group' : 'user'}`}
              description={`Choose a ${isUserGroupView ? 'user group' : 'user'} to view and manage permission assignments.`}
            />
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setAssignmentToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Remove Permission Group"
        message={`Are you sure you want to remove "${assignmentToDelete?.permissionGroupName}" from ${deleteTargetLabel}?`}
        confirmText="Remove"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />

      {/* Bulk Assign Modal */}
      <BulkAssignModal
        isOpen={isBulkAssignModalOpen}
        onClose={() => setIsBulkAssignModalOpen(false)}
        userGroup={
          selectedTarget && isUserGroupView
            ? {
                hash: selectedTarget,
                name: selectedTargetName,
              }
            : null
        }
        existingAssignments={assignments.map((assignment) => assignment.permissionGroupHash)}
        onSuccess={loadAssignments}
      />
    </div>
  );
};

export default AssignmentsTab;

