import React, { useState } from 'react';
import { Button, Input, Select, ConfirmDialog, DataView, ActionsMenu } from '@/components/common';
import type { DataViewColumn } from '@/components/common';
import type { ActionMenuItem } from '@/components/common/ActionsMenu';
import { PlusIcon, DeleteIcon } from '@/components/icons';
import { usePermissionAssignments, useGroups, useUsers, useToast, usePermissionManagement } from '@/hooks';

interface AssignmentRecord {
  id: string;
  type: 'user_group' | 'direct_user';
  targetHash: string;
  targetName: string;
  permissionGroupHash: string;
  permissionGroupName: string;
  assignedAt: string;
  notes?: string;
}

export const AssignmentsTab: React.FC = () => {
  const { showToast } = useToast();
  const [viewType, setViewType] = useState<'user_group' | 'user'>('user_group');
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

  const {
    assignPermissionGroupToUserGroup,
    removePermissionGroupFromUserGroup,
    assignPermissionGroupToUser,
    removePermissionGroupFromUser,
    getUserGroupPermissionGroups,
    getUserDirectPermissionGroups
  } = usePermissionAssignments();

  const { groups, isLoading: groupsLoading } = useGroups();
  const { users, isLoading: usersLoading } = useUsers();
  const { permissionGroups, permissionGroupsLoading } = usePermissionManagement();

  // Load assignments when target changes
  const loadAssignments = async () => {
    if (!selectedTarget) {
      setAssignments([]);
      return;
    }

    setLoading(true);
    try {
      if (viewType === 'user_group') {
        const response = await getUserGroupPermissionGroups(selectedTarget);
        const records: AssignmentRecord[] = response.map(pg => ({
          id: `${selectedTarget}-${pg.group_hash}`,
          type: 'user_group',
          targetHash: selectedTarget,
          targetName: groups.find(g => g.group_hash === selectedTarget)?.group_name || selectedTarget,
          permissionGroupHash: pg.group_hash,
          permissionGroupName: pg.group_name,
          assignedAt: pg.assigned_at,
        }));
        setAssignments(records);
      } else {
        const response = await getUserDirectPermissionGroups(selectedTarget);
        const records: AssignmentRecord[] = response.map(pg => ({
          id: `${selectedTarget}-${pg.permission_group_hash}`,
          type: 'direct_user',
          targetHash: selectedTarget,
          targetName: users.find(u => u.user_hash === selectedTarget)?.username || selectedTarget,
          permissionGroupHash: pg.permission_group_hash,
          permissionGroupName: pg.permission_group_name,
          assignedAt: pg.assigned_at,
          notes: pg.notes,
        }));
        setAssignments(records);
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to load assignments', 'error');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadAssignments();
  }, [selectedTarget, viewType]);

  // Handle view type change
  const handleViewTypeChange = (newViewType: 'user_group' | 'user') => {
    setViewType(newViewType);
    setSelectedTarget('');
    setAssignments([]);
    setSelectedPermissionGroup('');
    setNotes('');
  };

  // Assign handler
  const handleAssign = async () => {
    if (!selectedTarget || !selectedPermissionGroup) {
      showToast('Please select both a target and a permission group', 'warning');
      return;
    }

    setIsAssigning(true);
    try {
      if (viewType === 'user_group') {
        await assignPermissionGroupToUserGroup(selectedTarget, selectedPermissionGroup);
      } else {
        await assignPermissionGroupToUser(selectedTarget, selectedPermissionGroup, notes || undefined);
      }
      showToast('Permission group assigned successfully', 'success');
      setSelectedPermissionGroup('');
      setNotes('');
      await loadAssignments();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to assign permission group', 'error');
    } finally {
      setIsAssigning(false);
    }
  };

  // Delete handlers
  const handleDelete = (assignment: AssignmentRecord) => {
    setAssignmentToDelete(assignment);
    setIsDeleteDialogOpen(true);
  };

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
      showToast('Permission group removed successfully', 'success');
      await loadAssignments();
      setIsDeleteDialogOpen(false);
      setAssignmentToDelete(null);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to remove permission group', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredAssignments = assignments.filter(assignment =>
    assignment.permissionGroupName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assignment.targetName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns: DataViewColumn<AssignmentRecord>[] = [
    {
      key: 'permissionGroupName',
      header: 'Permission Group',
      sortable: true,
      width: '30%',
    },
    {
      key: 'assignedAt',
      header: 'Assigned',
      sortable: true,
      width: '20%',
      render: (value) => new Date(value as string).toLocaleDateString(),
    },
    {
      key: 'notes',
      header: 'Notes',
      sortable: false,
      width: '35%',
      render: (value) => value || <span className="text-muted">—</span>,
    },
    {
      key: 'id',
      header: 'Actions',
      sortable: false,
      width: '80px',
      align: 'center',
      render: (_, row) => {
        const menuItems: ActionMenuItem[] = [
          {
            key: 'remove',
            label: 'Remove',
            icon: <DeleteIcon size={16} />,
            onClick: () => handleDelete(row),
            destructive: true,
          },
        ];

        return (
          <ActionsMenu
            items={menuItems}
            ariaLabel={`Actions for ${row.permissionGroupName}`}
          />
        );
      },
    },
  ];

  const targetOptions = viewType === 'user_group'
    ? groups.map(g => ({ value: g.group_hash, label: g.group_name }))
    : users.map(u => ({ value: u.user_hash, label: u.username }));

  const permissionGroupOptions = permissionGroups
    .filter(pg => !assignments.some(a => a.permissionGroupHash === pg.group_hash))
    .map(pg => ({ value: pg.group_hash, label: pg.group_display_name }));

  const selectedTargetName = viewType === 'user_group'
    ? groups.find(g => g.group_hash === selectedTarget)?.group_name || ''
    : users.find(u => u.user_hash === selectedTarget)?.username || '';

  return (
    <div className="assignments-tab">
      <div className="tab-header">
        <div className="tab-header-text">
          <h2>Permission Assignments</h2>
          <p>Assign permission groups to user groups (recommended) or individual users (special cases)</p>
        </div>
      </div>

      <div className="assignments-type-selector">
        <button
          className={`type-button ${viewType === 'user_group' ? 'active' : ''}`}
          onClick={() => handleViewTypeChange('user_group')}
        >
          User Group Assignments (PRIMARY)
        </button>
        <button
          className={`type-button ${viewType === 'user' ? 'active' : ''}`}
          onClick={() => handleViewTypeChange('user')}
        >
          Direct User Assignments (SECONDARY)
        </button>
      </div>

      <div className="assignments-form">
        <div className="form-row">
          <div className="form-group">
            <label>
              {viewType === 'user_group' ? 'User Group:' : 'User:'}
            </label>
            <Select
              value={selectedTarget}
              onChange={setSelectedTarget}
              options={targetOptions}
              placeholder={`Select ${viewType === 'user_group' ? 'a user group' : 'a user'}...`}
              disabled={groupsLoading || usersLoading}
            />
          </div>

          {selectedTarget && (
            <>
              <div className="form-group">
                <label>Permission Group:</label>
                <Select
                  value={selectedPermissionGroup}
                  onChange={setSelectedPermissionGroup}
                  options={permissionGroupOptions}
                  placeholder="Select permission group..."
                  disabled={permissionGroupsLoading}
                />
              </div>

              {viewType === 'user' && (
                <div className="form-group">
                  <label>Notes (optional):</label>
                  <Input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Reason for direct assignment..."
                  />
                </div>
              )}

              <div className="form-group">
                <label>&nbsp;</label>
                <Button
                  variant="primary"
                  leftIcon={<PlusIcon size={16} />}
                  onClick={handleAssign}
                  disabled={!selectedPermissionGroup}
                  loading={isAssigning}
                >
                  Assign
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {selectedTarget && (
        <>
          <div className="tab-toolbar">
            <div className="tab-search">
              <Input
                type="text"
                placeholder="Search assignments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="tab-count">
              {filteredAssignments.length} assignment{filteredAssignments.length !== 1 ? 's' : ''}
            </div>
          </div>

          <DataView
            columns={columns}
            data={filteredAssignments}
            viewMode="table"
            showViewToggle={false}
            isLoading={loading}
            emptyMessage={`No permission groups assigned to ${selectedTargetName}`}
            caption={`Permission Assignments for ${selectedTargetName}`}
          />
        </>
      )}

      {!selectedTarget && (
        <div className="empty-state">
          <h3>Select a {viewType === 'user_group' ? 'User Group' : 'User'}</h3>
          <p>Choose a {viewType === 'user_group' ? 'user group' : 'user'} to view and manage permission assignments.</p>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setAssignmentToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Remove Permission Group"
        message={`Are you sure you want to remove "${assignmentToDelete?.permissionGroupName}" from "${assignmentToDelete?.targetName}"?`}
        confirmText="Remove"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default AssignmentsTab;

