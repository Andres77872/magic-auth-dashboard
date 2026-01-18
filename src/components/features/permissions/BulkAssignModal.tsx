import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Search, Layers, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { usePermissionManagement } from '@/contexts/PermissionManagementContext';
import { permissionAssignmentsService } from '@/services';
import { useToast } from '@/contexts/ToastContext';

interface BulkAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  userGroup: { hash: string; name: string } | null;
  existingAssignments: string[];
  onSuccess: () => void;
}

interface AssignResult {
  permission_group_hash: string;
  permission_group_name?: string;
  success: boolean;
}

export function BulkAssignModal({
  isOpen,
  onClose,
  userGroup,
  existingAssignments,
  onSuccess
}: BulkAssignModalProps): React.JSX.Element {
  const { addToast } = useToast();
  const { permissionGroups, permissionGroupsLoading } = usePermissionManagement();
  
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [results, setResults] = useState<AssignResult[] | null>(null);

  // Filter out already assigned groups
  const availableGroups = permissionGroups.filter(
    pg => !existingAssignments.includes(pg.group_hash)
  );

  const filteredGroups = availableGroups.filter(pg =>
    pg.group_display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pg.group_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedGroups(new Set());
      setSearchTerm('');
      setResults(null);
    }
  }, [isOpen]);

  const handleToggleGroup = (groupHash: string) => {
    const newSelected = new Set(selectedGroups);
    if (newSelected.has(groupHash)) {
      newSelected.delete(groupHash);
    } else {
      newSelected.add(groupHash);
    }
    setSelectedGroups(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedGroups.size === filteredGroups.length) {
      setSelectedGroups(new Set());
    } else {
      setSelectedGroups(new Set(filteredGroups.map(g => g.group_hash)));
    }
  };

  const handleAssign = async () => {
    if (!userGroup || selectedGroups.size === 0) return;

    setIsAssigning(true);
    try {
      const response = await permissionAssignmentsService.bulkAssignPermissionGroupsToUserGroup(
        userGroup.hash,
        Array.from(selectedGroups)
      );

      const data = response as any;
      if (data.results) {
        setResults(data.results);
        const successCount = data.results.filter((r: AssignResult) => r.success).length;
        if (successCount === data.results.length) {
          addToast({
            message: `Successfully assigned ${successCount} permission group${successCount !== 1 ? 's' : ''}`,
            variant: 'success'
          });
        } else {
          addToast({
            message: `Assigned ${successCount} of ${data.results.length} permission groups`,
            variant: 'warning'
          });
        }
      } else {
        addToast({
          message: 'Permission groups assigned successfully',
          variant: 'success'
        });
        onSuccess();
        onClose();
      }
    } catch (error) {
      addToast({
        message: error instanceof Error ? error.message : 'Failed to assign permission groups',
        variant: 'error'
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleDone = () => {
    onSuccess();
    onClose();
  };

  const getGroupName = (hash: string): string => {
    const group = permissionGroups.find(g => g.group_hash === hash);
    return group?.group_display_name || hash;
  };

  if (!userGroup) return <></>;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="lg" className="max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Bulk Assign Permission Groups</DialogTitle>
          <DialogDescription>
            Assign multiple permission groups to <strong>{userGroup.name}</strong> at once
          </DialogDescription>
        </DialogHeader>

        {results ? (
          <div className="flex-1 overflow-auto py-4">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Badge variant="secondary" className="text-base px-3 py-1">
                  {results.filter(r => r.success).length} / {results.length} successful
                </Badge>
              </div>

              <div className="space-y-2">
                {results.map((result) => (
                  <div
                    key={result.permission_group_hash}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      result.success
                        ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950'
                        : 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {result.success ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                      )}
                      <span className="font-medium">
                        {result.permission_group_name || getGroupName(result.permission_group_hash)}
                      </span>
                    </div>
                    <Badge variant={result.success ? 'success' : 'destructive'}>
                      {result.success ? 'Assigned' : 'Failed'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-auto py-4">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search permission groups..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  disabled={filteredGroups.length === 0}
                >
                  {selectedGroups.size === filteredGroups.length && filteredGroups.length > 0
                    ? 'Deselect All'
                    : 'Select All'}
                </Button>
                <Badge variant="secondary">
                  {selectedGroups.size} selected
                </Badge>
              </div>

              {permissionGroupsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Spinner size="lg" />
                </div>
              ) : availableGroups.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <AlertTriangle className="h-10 w-10 text-amber-500" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    All permission groups are already assigned to this user group
                  </p>
                </div>
              ) : filteredGroups.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Layers className="h-10 w-10 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    No permission groups match your search
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-auto">
                  {filteredGroups.map((group) => (
                    <div
                      key={group.group_hash}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedGroups.has(group.group_hash)
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-muted/50'
                      }`}
                      onClick={() => handleToggleGroup(group.group_hash)}
                    >
                      <Checkbox
                        checked={selectedGroups.has(group.group_hash)}
                        onCheckedChange={() => handleToggleGroup(group.group_hash)}
                        onClick={(event) => event.stopPropagation()}
                      />
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-purple-100 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
                        <Layers className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{group.group_display_name}</p>
                        <p className="text-xs font-mono text-muted-foreground">{group.group_name}</p>
                      </div>
                      {group.group_category && (
                        <Badge variant="outline">{group.group_category}</Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          {results ? (
            <Button onClick={handleDone}>Done</Button>
          ) : (
            <>
              <Button variant="outline" onClick={onClose} disabled={isAssigning}>
                Cancel
              </Button>
              <Button
                onClick={handleAssign}
                disabled={selectedGroups.size === 0 || isAssigning}
              >
                {isAssigning ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Assigning...
                  </>
                ) : (
                  `Assign ${selectedGroups.size} Group${selectedGroups.size !== 1 ? 's' : ''}`
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default BulkAssignModal;
