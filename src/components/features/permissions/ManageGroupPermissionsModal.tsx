import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Spinner } from '@/components/ui/spinner';
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
      const currentPermissionHashes = new Set(groupPermissions.map(p => p.permission_hash));
      
      // Determine which permissions to add
      const permissionsToAdd = Array.from(selectedPermissions).filter(hash => !currentPermissionHashes.has(hash));
      
      // Determine which permissions to remove
      const permissionsToRemove = Array.from(currentPermissionHashes).filter(hash => !selectedPermissions.has(hash));

      // Add new permissions
      for (const permissionHash of permissionsToAdd) {
        await globalRolesService.assignPermissionToGroup(permissionGroup.group_hash, permissionHash);
      }

      // Remove unselected permissions
      for (const permissionHash of permissionsToRemove) {
        await globalRolesService.removePermissionFromGroup(permissionGroup.group_hash, permissionHash);
      }

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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Manage Permissions - {permissionGroup?.group_display_name || ''}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner size="lg" />
            </div>
          ) : (
            <>
              <div>
                <Input
                  type="text"
                  placeholder="Search permissions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  fullWidth
                />
              </div>

              <div className="max-h-[400px] overflow-y-auto space-y-2 border rounded-md p-3">
                {filteredPermissions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No permissions found</p>
                  </div>
                ) : (
                  filteredPermissions.map(permission => (
                    <div
                      key={permission.permission_hash}
                      className="flex items-start gap-3 p-2 rounded-md hover:bg-accent/50 transition-colors"
                    >
                      <Checkbox
                        id={`permission-${permission.permission_hash}`}
                        checked={selectedPermissions.has(permission.permission_hash)}
                        onCheckedChange={() => handleTogglePermission(permission.permission_hash)}
                      />
                      <label
                        htmlFor={`permission-${permission.permission_hash}`}
                        className="flex-1 cursor-pointer"
                      >
                        <div className="font-medium text-sm">{permission.permission_display_name}</div>
                        <div className="text-xs text-muted-foreground">{permission.permission_name}</div>
                      </label>
                    </div>
                  ))
                )}
              </div>

              <div className="text-sm text-muted-foreground">
                {selectedPermissions.size} permission{selectedPermissions.size !== 1 ? 's' : ''} selected
              </div>

              <DialogFooter>
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
              </DialogFooter>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManageGroupPermissionsModal;

