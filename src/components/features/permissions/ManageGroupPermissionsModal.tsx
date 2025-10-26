import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, Checkbox } from '@/components/common';
import { LoadingSpinner } from '@/components/common';
import type { GlobalPermission, GlobalPermissionGroup } from '@/types/global-roles.types';
import { globalRolesService } from '@/services';

interface ManageGroupPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  permissionGroup: GlobalPermissionGroup | null;
  onUpdate: () => void;
}

export const ManageGroupPermissionsModal: React.FC<ManageGroupPermissionsModalProps> = ({
  isOpen,
  onClose,
  permissionGroup,
  onUpdate
}) => {
  const [allPermissions, setAllPermissions] = useState<GlobalPermission[]>([]);
  const [groupPermissions, setGroupPermissions] = useState<GlobalPermission[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && permissionGroup) {
      loadData();
    }
  }, [isOpen, permissionGroup]);

  const loadData = async () => {
    if (!permissionGroup) return;

    setLoading(true);
    try {
      // Load all available permissions
      const permissionsResponse: any = await globalRolesService.getPermissions();
      const permissionsData = permissionsResponse.permissions || permissionsResponse.data || [];
      if (permissionsResponse.success && permissionsData.length >= 0) {
        setAllPermissions(permissionsData);
      }

      // Load current group permissions
      const groupPermsResponse: any = await globalRolesService.getGroupPermissions(permissionGroup.group_hash);
      const groupPermsData = groupPermsResponse.permissions || groupPermsResponse.data || [];
      if (groupPermsResponse.success && groupPermsData.length >= 0) {
        setGroupPermissions(groupPermsData);
        setSelectedPermissions(new Set(groupPermsData.map((p: GlobalPermission) => p.permission_hash)));
      }
    } catch (error) {
      console.error('Failed to load permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePermission = (permissionHash: string) => {
    setSelectedPermissions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(permissionHash)) {
        newSet.delete(permissionHash);
      } else {
        newSet.add(permissionHash);
      }
      return newSet;
    });
  };

  const handleSubmit = async () => {
    if (!permissionGroup) return;

    setIsSubmitting(true);
    try {
      // Determine which permissions to add and remove
      const currentPermissionHashes = new Set(groupPermissions.map(p => p.permission_hash));
      const permissionsToAdd = Array.from(selectedPermissions).filter(hash => !currentPermissionHashes.has(hash));

      // Add new permissions
      for (const permissionHash of permissionsToAdd) {
        await globalRolesService.assignPermissionToGroup(permissionGroup.group_hash, permissionHash);
      }

      // Note: API doesn't provide a remove endpoint for permissions from groups
      // This is a limitation of the current API

      onUpdate();
      onClose();
    } catch (error) {
      console.error('Failed to update permissions:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPermissions = allPermissions.filter(permission =>
    permission.permission_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    permission.permission_display_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Manage Permissions - ${permissionGroup?.group_display_name || ''}`}
      size="lg"
    >
      <div className="manage-group-permissions-modal">
        {loading ? (
          <div className="loading-container">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            <div className="search-container">
              <Input
                type="text"
                placeholder="Search permissions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="permissions-list">
              {filteredPermissions.length === 0 ? (
                <div className="empty-state">
                  <p>No permissions found</p>
                </div>
              ) : (
                filteredPermissions.map(permission => (
                  <div key={permission.permission_hash} className="permission-item">
                    <Checkbox
                      id={`permission-${permission.permission_hash}`}
                      checked={selectedPermissions.has(permission.permission_hash)}
                      onChange={() => handleTogglePermission(permission.permission_hash)}
                      label={
                        <div className="permission-label">
                          <div className="permission-name">{permission.permission_display_name}</div>
                          <div className="permission-description">{permission.permission_name}</div>
                        </div>
                      }
                    />
                  </div>
                ))
              )}
            </div>

            <div className="selected-count">
              {selectedPermissions.size} permission{selectedPermissions.size !== 1 ? 's' : ''} selected
            </div>

            <div className="modal-actions">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleSubmit}
                loading={isSubmitting}
              >
                Save Changes
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default ManageGroupPermissionsModal;

