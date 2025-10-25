import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, LoadingSpinner, ConfirmDialog, EmptyState } from '@/components/common';
import { LockIcon, PlusIcon, DeleteIcon, InfoIcon } from '@/components/icons';
import { permissionAssignmentsService, globalRolesService } from '@/services';
import type { DirectPermissionAssignment } from '@/types/permission-assignments.types';
import type { GlobalPermissionGroup } from '@/types/global-roles.types';
import { useToast } from '@/contexts/ToastContext';
import '../../../styles/components/user-permission-groups-tab.css';

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
  const { addToast } = useToast();

  // Fetch direct permission group assignments
  const fetchDirectAssignments = async () => {
    try {
      setLoading(true);
      const response = await permissionAssignmentsService.getUserDirectPermissionGroups(userHash);
      if (response.success && response.data) {
        setDirectAssignments(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch direct permission assignments:', error);
      addToast({ message: 'Failed to load permission groups', variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Fetch available permission groups
  const fetchAvailableGroups = async () => {
    try {
      const response = await globalRolesService.getPermissionGroups();
      if (response.success && response.data) {
        // Filter out already assigned groups
        const assignedHashes = new Set(directAssignments.map(a => a.permission_group_hash));
        const available = response.data.filter(g => !assignedHashes.has(g.group_hash));
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
        confirmRemove.permission_group_hash
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

  if (loading) {
    return (
      <div className="user-permission-groups-tab">
        <div className="loading-container">
          <LoadingSpinner />
          <p>Loading permission groups...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-permission-groups-tab">
      <Card>
        <CardHeader>
          <div className="permissions-header">
            <div>
              <CardTitle>Direct Permission Groups</CardTitle>
              <p className="subtitle">
                Direct permission assignments for <strong>{username}</strong>
              </p>
              <p className="info-note">
                <InfoIcon size={14} /> These are permission groups assigned directly to this user, overriding group memberships.
              </p>
            </div>
            <Button
              onClick={() => setShowAddModal(true)}
              leftIcon={<PlusIcon size={16} />}
            >
              Assign Permission Group
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {directAssignments.length === 0 ? (
            <EmptyState
              icon={<LockIcon size={48} />}
              title="No Direct Permission Groups"
              description="This user doesn't have any permission groups assigned directly. They inherit permissions from their user groups and global role."
            />
          ) : (
            <div className="assigned-groups-grid">
              {directAssignments.map(assignment => (
                <Card key={assignment.permission_group_hash} className="permission-group-card">
                  <CardContent>
                    <div className="group-card-header">
                      <div className="group-info">
                        <LockIcon size={20} className="group-icon" />
                        <div>
                          <h4>{assignment.permission_group_name}</h4>
                          <Badge variant="warning">Direct Assignment</Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirmRemove(assignment)}
                        leftIcon={<DeleteIcon size={16} />}
                        aria-label="Remove permission group"
                      />
                    </div>
                    {assignment.notes && (
                      <div className="assignment-notes">
                        <strong>Notes:</strong> {assignment.notes}
                      </div>
                    )}
                    <div className="group-meta">
                      <span className="meta-item">
                        Assigned: {new Date(assignment.assigned_at).toLocaleDateString()}
                      </span>
                      {assignment.assigned_by && (
                        <span className="meta-item">
                          By: {assignment.assigned_by}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assign Permission Group Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => !isAssigning && setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Assign Direct Permission Group</h2>
              <button
                className="modal-close"
                onClick={() => setShowAddModal(false)}
                disabled={isAssigning}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              {availableGroups.length === 0 ? (
                <EmptyState
                  icon={<InfoIcon size={48} />}
                  title="No Available Permission Groups"
                  description="All permission groups have been assigned to this user."
                />
              ) : (
                <>
                  <div className="form-group">
                    <label htmlFor="permission-group">Select Permission Group</label>
                    <select
                      id="permission-group"
                      className="form-select"
                      value={selectedGroup}
                      onChange={(e) => setSelectedGroup(e.target.value)}
                    >
                      <option value="">-- Select a permission group --</option>
                      {availableGroups.map(group => (
                        <option key={group.group_hash} value={group.group_hash}>
                          {group.group_display_name} ({group.group_name})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="notes">Notes (Optional)</label>
                    <textarea
                      id="notes"
                      className="form-textarea"
                      value={assignmentNotes}
                      onChange={(e) => setAssignmentNotes(e.target.value)}
                      placeholder="Reason for direct assignment (e.g., 'Temporary elevated access for migration')"
                      rows={3}
                    />
                    <p className="field-hint">
                      Document why this user needs direct permission assignment instead of group membership.
                    </p>
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
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
                loading={isAssigning}
              >
                Assign Permission Group
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Confirmation Dialog */}
      {confirmRemove && (
        <ConfirmDialog
          isOpen={true}
          title="Remove Direct Permission Group"
          message={`Are you sure you want to remove the direct permission group "${confirmRemove.permission_group_name}" from this user? They will still inherit permissions from their user groups and global role.`}
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

