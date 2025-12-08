import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { groupService } from '@/services';
import type { UserGroup } from '@/types/group.types';
import { Search, XCircle, Activity } from 'lucide-react';

interface AssignGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedGroupHash: string) => void;
  initialSelection?: string[];
  isLoading?: boolean;
  userName?: string;
}

export function AssignGroupModal({
  isOpen,
  onClose,
  onConfirm,
  initialSelection = [],
  isLoading = false,
  userName = 'user'
}: AssignGroupModalProps): React.JSX.Element {
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>(initialSelection[0] || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [fetchingGroups, setFetchingGroups] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchGroups();
      setSelectedGroup(initialSelection[0] || '');
    }
  }, [isOpen, initialSelection]);

  const fetchGroups = async () => {
    setFetchingGroups(true);
    setError('');

    try {
      const response = await groupService.getGroups({ limit: 100 });
      if (response.success && Array.isArray(response.user_groups)) {
        setGroups(response.user_groups);
      } else {
        setError('Failed to load user groups');
      }
    } catch (err) {
      console.error('Error fetching groups:', err);
      setError('Failed to load user groups');
    } finally {
      setFetchingGroups(false);
    }
  };

  const filteredGroups = groups.filter(group =>
    group.group_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (group.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleGroupSelect = (groupHash: string) => {
    setSelectedGroup(prev => (prev === groupHash ? '' : groupHash));
  };

  const handleConfirm = () => {
    if (!selectedGroup) return;
    onConfirm(selectedGroup);
  };

  const handleCancel = () => {
    setSelectedGroup(initialSelection[0] || '');
    setSearchTerm('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isLoading && !open && handleCancel()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Assign Group to {userName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {selectedGroup ? 'Group selected' : 'Select a group (required)'}
          </p>

          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search groups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={fetchingGroups}
              className="pl-9"
            />
          </div>

          <div className="max-h-[300px] overflow-y-auto rounded-md border">
            {fetchingGroups ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Spinner size="lg" />
                <p className="mt-2 text-sm text-muted-foreground">Loading groups...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-8">
                <XCircle size={24} className="text-destructive" />
                <p className="mt-2 text-sm text-destructive">{error}</p>
                <Button variant="outline" size="sm" onClick={fetchGroups} className="mt-2">
                  Retry
                </Button>
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Activity size={24} className="text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  {searchTerm ? 'No groups match your search.' : 'No user groups available.'}
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredGroups.map(group => {
                  const isSelected = selectedGroup === group.group_hash;
                  return (
                    <div
                      key={group.group_hash}
                      className={cn(
                        'flex cursor-pointer items-start gap-3 p-3 transition-colors hover:bg-muted/50',
                        isSelected && 'bg-primary/10'
                      )}
                      onClick={() => handleGroupSelect(group.group_hash)}
                    >
                      <input
                        type="radio"
                        name="group-selection"
                        checked={isSelected}
                        onChange={() => handleGroupSelect(group.group_hash)}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1"
                      />
                      <div className="flex-1 space-y-1">
                        <h4 className="text-sm font-medium">{group.group_name}</h4>
                        {group.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{group.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {group.member_count || 0} member{(group.member_count || 0) !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={fetchingGroups || !selectedGroup}
          >
            {isLoading && <Spinner size="sm" className="mr-2" />}
            {selectedGroup ? 'Assign Group' : 'Select a Group'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AssignGroupModal; 