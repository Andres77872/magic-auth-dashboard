import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, Checkbox, LoadingSpinner, EmptyState } from '@/components/common';
import { UserIcon, SearchIcon } from '@/components/icons';
import { userService } from '@/services';
import type { User } from '@/types/auth.types';
import { useToast } from '@/hooks';
import '../../../styles/components/bulk-member-assignment-modal.css';

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
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Add Members to ${groupName}`}
      size="lg"
      closeOnBackdropClick={!isSubmitting}
      closeOnEscape={!isSubmitting}
    >
      <div className="bulk-member-assignment-modal">
        <div className="bulk-member-search">
          <Input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<SearchIcon size="sm" />}
            disabled={isLoading}
          />
        </div>

        {selectedUserHashes.length > 0 && (
          <div className="bulk-member-selection-info">
            <span className="selection-count">
              {selectedUserHashes.length} user{selectedUserHashes.length !== 1 ? 's' : ''} selected
            </span>
            <button
              type="button"
              className="clear-selection-btn"
              onClick={() => setSelectedUserHashes([])}
            >
              Clear selection
            </button>
          </div>
        )}

        <div className="bulk-member-list-container">
          {isLoading ? (
            <div className="bulk-member-loading">
              <LoadingSpinner size="md" />
              <p>Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <EmptyState
              icon={<UserIcon size="lg" />}
              title={searchTerm ? 'No users found' : 'No available users'}
              description={
                searchTerm 
                  ? 'Try adjusting your search criteria'
                  : 'All users are already members of this group'
              }
            />
          ) : (
            <>
              <div className="bulk-member-list-header">
                <Checkbox
                  checked={selectedUserHashes.length === filteredUsers.length}
                  indeterminate={
                    selectedUserHashes.length > 0 && 
                    selectedUserHashes.length < filteredUsers.length
                  }
                  onChange={handleToggleAll}
                  label="Select all"
                />
              </div>
              <div className="bulk-member-list">
                {filteredUsers.map(user => (
                  <div key={user.user_hash} className="bulk-member-item">
                    <Checkbox
                      checked={selectedUserHashes.includes(user.user_hash)}
                      onChange={() => handleToggleUser(user.user_hash)}
                      label={
                        <div className="bulk-member-info">
                          <div className="bulk-member-name">{user.username}</div>
                          {user.email && (
                            <div className="bulk-member-email">{user.email}</div>
                          )}
                        </div>
                      }
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="bulk-member-actions">
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
        </div>
      </div>
    </Modal>
  );
};

