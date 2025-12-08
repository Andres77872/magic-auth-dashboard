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
import { EmptyState } from '@/components/common';
import { User as UserIcon, Search } from 'lucide-react';
import { userService } from '@/services';
import type { User } from '@/types/auth.types';
import { useToast } from '@/hooks';

interface BulkMemberAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (userHashes: string[]) => Promise<void>;
  groupName: string;
  existingMemberHashes?: string[];
}

export const BulkMemberAssignmentModal: React.FC<BulkMemberAssignmentModalProps> = ({
  isOpen,
  onClose,
  onAssign,
  groupName,
  existingMemberHashes = []
}) => {
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUserHashes, setSelectedUserHashes] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch users when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      setSelectedUserHashes([]);
      setSearchTerm('');
    }
  }, [isOpen]);

  // Filter users based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      // Filter out users who are already members
      const availableUsers = users.filter(
        user => !existingMemberHashes.includes(user.user_hash)
      );
      setFilteredUsers(availableUsers);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = users.filter(user => {
        const matchesSearch = 
          user.username.toLowerCase().includes(term) ||
          (user.email && user.email.toLowerCase().includes(term));
        const notMember = !existingMemberHashes.includes(user.user_hash);
        return matchesSearch && notMember;
      });
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users, existingMemberHashes]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await userService.getUsers({ limit: 1000 });
      if (response.success && response.users) {
        setUsers(response.users);
      }
    } catch (error) {
      showToast('Failed to load users', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleUser = (userHash: string) => {
    setSelectedUserHashes(prev => {
      if (prev.includes(userHash)) {
        return prev.filter(hash => hash !== userHash);
      } else {
        return [...prev, userHash];
      }
    });
  };

  const handleToggleAll = () => {
    if (selectedUserHashes.length === filteredUsers.length) {
      setSelectedUserHashes([]);
    } else {
      setSelectedUserHashes(filteredUsers.map(user => user.user_hash));
    }
  };

  const handleSubmit = async () => {
    if (selectedUserHashes.length === 0) {
      showToast('Please select at least one user', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAssign(selectedUserHashes);
      onClose();
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Add Members to {groupName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
            disabled={isLoading}
            fullWidth
          />

          {selectedUserHashes.length > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {selectedUserHashes.length} user{selectedUserHashes.length !== 1 ? 's' : ''} selected
              </span>
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={() => setSelectedUserHashes([])}
              >
                Clear selection
              </button>
            </div>
          )}

          <div className="max-h-[400px] overflow-y-auto border rounded-md">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Spinner size="lg" />
                <p className="text-sm text-muted-foreground mt-2">Loading users...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <EmptyState
                icon={<UserIcon className="h-10 w-10" />}
                title={searchTerm ? 'No users found' : 'No available users'}
                description={
                  searchTerm 
                    ? 'Try adjusting your search criteria'
                    : 'All users are already members of this group'
                }
              />
            ) : (
              <>
                <div className="flex items-center gap-2 p-3 border-b bg-muted/50">
                  <Checkbox
                    checked={selectedUserHashes.length === filteredUsers.length}
                    onCheckedChange={handleToggleAll}
                    label="Select all"
                  />
                </div>
                <div className="divide-y">
                  {filteredUsers.map(user => (
                    <div 
                      key={user.user_hash} 
                      className="flex items-center gap-3 p-3 hover:bg-accent/50 transition-colors"
                    >
                      <Checkbox
                        checked={selectedUserHashes.includes(user.user_hash)}
                        onCheckedChange={() => handleToggleUser(user.user_hash)}
                      />
                      <label 
                        className="flex-1 cursor-pointer"
                        onClick={() => handleToggleUser(user.user_hash)}
                      >
                        <div className="font-medium">{user.username}</div>
                        {user.email && (
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        )}
                      </label>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            
            <Button
              type="button"
              variant="primary"
              onClick={handleSubmit}
              loading={isSubmitting}
              disabled={isSubmitting || selectedUserHashes.length === 0}
            >
              Add {selectedUserHashes.length > 0 ? `${selectedUserHashes.length} ` : ''}
              Member{selectedUserHashes.length !== 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

