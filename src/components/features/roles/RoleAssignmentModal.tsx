import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, Badge } from '@/components/common';
import { SearchIcon, UserIcon, CheckIcon, CloseIcon } from '@/components/icons';
import { useGlobalRoles } from '@/hooks';
import type { GlobalRole } from '@/types/global-roles.types';
import '../../../styles/components/role-assignment-modal.css';

interface User {
  user_hash: string;
  username: string;
  email: string;
  user_type: string;
  current_role?: string;
}

interface RoleAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  onAssignRole: (userHash: string, roleHash: string) => Promise<void>;
  isLoading?: boolean;
}

export function RoleAssignmentModal({
  isOpen,
  onClose,
  users,
  onAssignRole,
  isLoading = false
}: RoleAssignmentModalProps): React.JSX.Element {
  const { roles, loadingRoles } = useGlobalRoles();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<GlobalRole | null>(null);
  const [assignmentInProgress, setAssignmentInProgress] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSelectedUser(null);
      setSelectedRole(null);
    }
  }, [isOpen]);

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAssign = async () => {
    if (!selectedUser || !selectedRole) return;

    setAssignmentInProgress(true);
    try {
      await onAssignRole(selectedUser.user_hash, selectedRole.role_hash);
      setSelectedUser(null);
      setSelectedRole(null);
    } catch (error) {
      console.error('Failed to assign role:', error);
    } finally {
      setAssignmentInProgress(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Assign Global Role to User"
      size="lg"
    >
      <div className="role-assignment-modal">
        {/* Step 1: Select User */}
        <div className="assignment-step">
          <h3 className="step-title">
            <span className="step-number">1</span>
            Select User
          </h3>
          
          <div className="user-search">
            <div className="search-input-wrapper">
              <SearchIcon size={18} aria-hidden="true" className="search-icon" />
              <Input
                type="text"
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="user-list">
            {filteredUsers.length === 0 ? (
              <p className="empty-state">No users found</p>
            ) : (
              filteredUsers.map(user => (
                <div
                  key={user.user_hash}
                  className={`user-item ${selectedUser?.user_hash === user.user_hash ? 'selected' : ''}`}
                  onClick={() => setSelectedUser(user)}
                >
                  <UserIcon size={18} aria-hidden="true" />
                  <div className="user-info">
                    <div className="user-name">{user.username}</div>
                    <div className="user-email">{user.email}</div>
                  </div>
                  <div className="user-meta">
                    <Badge variant="secondary">{user.user_type}</Badge>
                    {user.current_role && (
                      <Badge variant="secondary">{user.current_role}</Badge>
                    )}
                  </div>
                  {selectedUser?.user_hash === user.user_hash && (
                    <CheckIcon size={18} className="selected-icon" aria-hidden="true" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Step 2: Select Role */}
        {selectedUser && (
          <div className="assignment-step">
            <h3 className="step-title">
              <span className="step-number">2</span>
              Select Role
            </h3>
            
            <div className="role-list">
              {loadingRoles ? (
                <p className="loading-state">Loading roles...</p>
              ) : roles.length === 0 ? (
                <p className="empty-state">No roles available</p>
              ) : (
                roles.map(role => (
                  <div
                    key={role.role_hash}
                    className={`role-item ${selectedRole?.role_hash === role.role_hash ? 'selected' : ''}`}
                    onClick={() => setSelectedRole(role)}
                  >
                    <div className="role-info">
                      <div className="role-name">{role.role_display_name}</div>
                      <div className="role-description">{role.role_description || role.role_name}</div>
                    </div>
                    <div className="role-meta">
                      <Badge variant="secondary">Priority: {role.role_priority}</Badge>
                      {role.is_system_role && (
                        <Badge variant="secondary">System</Badge>
                      )}
                    </div>
                    {selectedRole?.role_hash === role.role_hash && (
                      <CheckIcon size={18} className="selected-icon" aria-hidden="true" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Assignment Summary */}
        {selectedUser && selectedRole && (
          <div className="assignment-summary">
            <h4>Assignment Summary</h4>
            <p>
              Assign role <strong>{selectedRole.role_display_name}</strong> to user{' '}
              <strong>{selectedUser.username}</strong>
            </p>
            {selectedUser.current_role && (
              <p className="warning-text">
                This will replace the current role: {selectedUser.current_role}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="modal-actions">
          <Button
            variant="primary"
            onClick={handleAssign}
            disabled={!selectedUser || !selectedRole || assignmentInProgress || isLoading}
          >
            <CheckIcon size={16} aria-hidden="true" />
            Assign Role
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={assignmentInProgress || isLoading}
          >
            <CloseIcon size={16} aria-hidden="true" />
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default RoleAssignmentModal;
