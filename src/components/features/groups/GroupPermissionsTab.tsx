import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, LoadingSpinner, ConfirmDialog, EmptyState } from '@/components/common';
import { LockIcon, PlusIcon, DeleteIcon, InfoIcon } from '@/components/icons';
import { permissionAssignmentsService, globalRolesService } from '@/services';
import type { PermissionGroupAssignment } from '@/types/permission-assignments.types';
import type { GlobalPermissionGroup } from '@/types/global-roles.types';
import { useToast } from '@/contexts/ToastContext';
import '../../../styles/components/group-permissions-tab.css';

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
  const { addToast } = useToast();

  // Fetch assigned permission groups
  const fetchAssignedGroups = async () => {
    try {
      setLoading(true);
      const response = await permissionAssignmentsService.getUserGroupPermissionGroups(groupHash);
      if (response.success && response.data) {
        setAssignedGroups(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch assigned permission groups:', error);
      addToast({ message: 'Failed to load permission groups', variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Fetch all available permission groups
  const fetchAvailableGroups = async () => {
    try {
      const response = await globalRolesService.getPermissionGroups();
      if (response.success && response.data) {
        // Filter out already assigned groups
        const assignedHashes = new Set(assignedGroups.map(g => g.permission_group_hash));
        const available = response.data.filter(g => !assignedHashes.has(g.group_hash));
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
        confirmRemove.permission_group_hash
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

  if (loading) {
    return (
      <div className="group-permissions-tab">
        <div className="loading-container">
          <LoadingSpinner />
          <p>Loading permission groups...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="group-permissions-tab">
      <Card>
        <CardHeader>
          <div className="permissions-header">
            <div>
              <CardTitle>Permission Groups</CardTitle>
              <p className="subtitle">
                Manage permission groups assigned to <strong>{groupName}</strong>
              </p>
            </div>
            <Button
              onClick={() => setShowAddModal(true)}
              leftIcon={<PlusIcon size={16} />}
            >
              Assign Permission Groups
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {assignedGroups.length === 0 ? (
            <EmptyState
              icon={<LockIcon size={48} />}
              title="No Permission Groups Assigned"
              description="This user group doesn't have any permission groups assigned. Click 'Assign Permission Groups' to add some."
            />
          ) : (
            <div className="assigned-groups-grid">
              {assignedGroups.map(assignment => (
                <Card key={assignment.permission_group_hash} className="permission-group-card">
                  <CardContent>
                    <div className="group-card-header">
                      <div className="group-info">
                        <LockIcon size={20} className="group-icon" />
                        <div>
                          <h4>{assignment.permission_group_name}</h4>
                          <Badge variant="secondary">
                            {assignment.permission_group_hash}
                          </Badge>
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

      {/* Add Permission Groups Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => !isAssigning && setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Assign Permission Groups</h2>
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
                  description="All permission groups have been assigned to this user group."
                />
              ) : (
                <>
                  <div className="selection-info">
                    <Badge variant="info">
                      {selectedGroups.length} selected
                    </Badge>
                  </div>

                  {Object.entries(groupedByCategory).map(([category, groups]) => (
                    <div key={category} className="category-section">
                      <h3 className="category-title">
                        {category}
                        <Badge variant="secondary">{groups.length}</Badge>
                      </h3>
                      <div className="groups-list">
                        {groups.map(group => (
                          <div
                            key={group.group_hash}
                            className={`group-item ${selectedGroups.includes(group.group_hash) ? 'selected' : ''}`}
                            onClick={() => toggleGroupSelection(group.group_hash)}
                          >
                            <div className="group-item-content">
                              <input
                                type="checkbox"
                                checked={selectedGroups.includes(group.group_hash)}
                                onChange={() => toggleGroupSelection(group.group_hash)}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <div className="group-item-info">
                                <h4>{group.group_display_name}</h4>
                                <p className="group-name">{group.group_name}</p>
                                {group.group_description && (
                                  <p className="group-description">{group.group_description}</p>
                                )}
                              </div>
                            </div>
                            <Badge variant="secondary">{group.group_category}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
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
                onClick={handleBulkAssign}
                disabled={selectedGroups.length === 0 || isAssigning}
                loading={isAssigning}
              >
                Assign {selectedGroups.length > 0 ? `(${selectedGroups.length})` : ''}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Confirmation Dialog */}
      {confirmRemove && (
        <ConfirmDialog
          isOpen={true}
          title="Remove Permission Group"
          message={`Are you sure you want to remove the permission group "${confirmRemove.permission_group_name}" from this user group?`}
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

