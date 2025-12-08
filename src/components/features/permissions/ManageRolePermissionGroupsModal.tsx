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
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Search, Layers, Shield } from 'lucide-react';
import type { GlobalPermissionGroup, GlobalRole } from '@/types/global-roles.types';
import { globalRolesService } from '@/services';

interface ManageRolePermissionGroupsModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: GlobalRole | null;
  onUpdate: () => void;
}

export const ManageRolePermissionGroupsModal: React.FC<ManageRolePermissionGroupsModalProps> = ({
  isOpen,
  onClose,
  role,
  onUpdate
}) => {
  const [allGroups, setAllGroups] = useState<GlobalPermissionGroup[]>([]);
  const [roleGroups, setRoleGroups] = useState<GlobalPermissionGroup[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [effectivePermissionsCount, setEffectivePermissionsCount] = useState(0);

  useEffect(() => {
    if (isOpen && role) {
      loadData();
    }
  }, [isOpen, role]);

  useEffect(() => {
    calculateEffectivePermissions();
  }, [selectedGroups, allGroups]);

  const loadData = async () => {
    if (!role) return;

    setLoading(true);
    try {
      const groupsResponse: any = await globalRolesService.getPermissionGroups();
      const groupsData = groupsResponse.permission_groups || groupsResponse.data || [];
      if (groupsResponse.success && groupsData.length >= 0) {
        setAllGroups(groupsData);
      }

      const roleGroupsResponse: any = await globalRolesService.getRolePermissionGroups(role.role_hash);
      const roleGroupsData = roleGroupsResponse.permission_groups || roleGroupsResponse.data || [];
      if (roleGroupsResponse.success && roleGroupsData.length >= 0) {
        setRoleGroups(roleGroupsData);
        setSelectedGroups(new Set(roleGroupsData.map((g: GlobalPermissionGroup) => g.group_hash)));
      }
    } catch (error) {
      console.error('Failed to load permission groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateEffectivePermissions = async () => {
    let count = 0;
    const selectedGroupsList = allGroups.filter(g => selectedGroups.has(g.group_hash));
    
    for (const group of selectedGroupsList) {
      try {
        const response: any = await globalRolesService.getGroupPermissions(group.group_hash);
        const permissions = response.permissions || response.data || [];
        count += permissions.length;
      } catch {
        // Ignore errors in permission count
      }
    }
    setEffectivePermissionsCount(count);
  };

  const handleToggleGroup = (groupHash: string) => {
    setSelectedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupHash)) {
        newSet.delete(groupHash);
      } else {
        newSet.add(groupHash);
      }
      return newSet;
    });
  };

  const handleSubmit = async () => {
    if (!role) return;

    setIsSubmitting(true);
    try {
      const currentGroupHashes = new Set(roleGroups.map(g => g.group_hash));
      
      const groupsToAdd = Array.from(selectedGroups).filter(hash => !currentGroupHashes.has(hash));
      const groupsToRemove = Array.from(currentGroupHashes).filter(hash => !selectedGroups.has(hash));

      for (const groupHash of groupsToAdd) {
        await globalRolesService.assignPermissionGroupToRole(role.role_hash, groupHash);
      }

      for (const groupHash of groupsToRemove) {
        await globalRolesService.removePermissionGroupFromRole(role.role_hash, groupHash);
      }

      onUpdate();
      onClose();
    } catch (error) {
      console.error('Failed to update role permission groups:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredGroups = allGroups.filter(group =>
    group.group_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.group_display_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedGroupsList = allGroups.filter(g => selectedGroups.has(g.group_hash));
  const availableGroupsList = filteredGroups.filter(g => !selectedGroups.has(g.group_hash));

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Manage Permission Groups - {role?.role_display_name || ''}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner size="lg" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">Available Groups</h4>
                    <Badge variant="outline">{availableGroupsList.length}</Badge>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search groups..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <div className="max-h-[300px] overflow-y-auto space-y-2 border rounded-md p-3">
                    {availableGroupsList.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No available groups</p>
                      </div>
                    ) : (
                      availableGroupsList.map(group => (
                        <div
                          key={group.group_hash}
                          className="flex items-start gap-3 p-2 rounded-md hover:bg-accent/50 transition-colors cursor-pointer"
                          onClick={() => handleToggleGroup(group.group_hash)}
                        >
                          <Checkbox
                            id={`available-${group.group_hash}`}
                            checked={false}
                            onCheckedChange={() => handleToggleGroup(group.group_hash)}
                          />
                          <label
                            htmlFor={`available-${group.group_hash}`}
                            className="flex-1 cursor-pointer"
                          >
                            <div className="font-medium text-sm">{group.group_display_name}</div>
                            <div className="text-xs text-muted-foreground font-mono">{group.group_name}</div>
                            {group.group_category && (
                              <Badge variant="outline" className="mt-1 text-xs">
                                {group.group_category}
                              </Badge>
                            )}
                          </label>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">Groups in Role</h4>
                    <Badge variant="secondary">{selectedGroups.size}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span>~{effectivePermissionsCount} effective permissions</span>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto space-y-2 border rounded-md p-3 bg-accent/20">
                    {selectedGroupsList.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No groups assigned</p>
                        <p className="text-xs">Select groups from the left</p>
                      </div>
                    ) : (
                      selectedGroupsList.map(group => (
                        <div
                          key={group.group_hash}
                          className="flex items-start gap-3 p-2 rounded-md hover:bg-accent/50 transition-colors cursor-pointer bg-background"
                          onClick={() => handleToggleGroup(group.group_hash)}
                        >
                          <Checkbox
                            id={`selected-${group.group_hash}`}
                            checked={true}
                            onCheckedChange={() => handleToggleGroup(group.group_hash)}
                          />
                          <label
                            htmlFor={`selected-${group.group_hash}`}
                            className="flex-1 cursor-pointer"
                          >
                            <div className="font-medium text-sm">{group.group_display_name}</div>
                            <div className="text-xs text-muted-foreground font-mono">{group.group_name}</div>
                            {group.group_category && (
                              <Badge variant="outline" className="mt-1 text-xs">
                                {group.group_category}
                              </Badge>
                            )}
                          </label>
                        </div>
                      ))
                    )}
                  </div>
                </div>
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

export default ManageRolePermissionGroupsModal;
