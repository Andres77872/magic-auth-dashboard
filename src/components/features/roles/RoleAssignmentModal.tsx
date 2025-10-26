import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, Badge } from '@/components/common';
import { SearchIcon, UserIcon, CheckIcon, CloseIcon, SecurityIcon, ArrowRightIcon, InfoIcon } from '@/components/icons';
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
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleSearchQuery, setRoleSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<GlobalRole | null>(null);
  const [assignmentInProgress, setAssignmentInProgress] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setRoleSearchQuery('');
      setSelectedUser(null);
      setSelectedRole(null);
      setCurrentStep(1);
    }
  }, [isOpen]);

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRoles = roles.filter(role =>
    role.role_name.toLowerCase().includes(roleSearchQuery.toLowerCase()) ||
    role.role_display_name.toLowerCase().includes(roleSearchQuery.toLowerCase())
  );

  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    setCurrentStep(2);
  };

  const handleRoleSelect = (role: GlobalRole) => {
    setSelectedRole(role);
    setCurrentStep(3);
  };

  const handleAssign = async () => {
    if (!selectedUser || !selectedRole) return;

    setAssignmentInProgress(true);
    try {
      await onAssignRole(selectedUser.user_hash, selectedRole.role_hash);
      setSearchQuery('');
      setRoleSearchQuery('');
      setSelectedUser(null);
      setSelectedRole(null);
      setCurrentStep(1);
    } catch (error) {
      console.error('Failed to assign role:', error);
    } finally {
      setAssignmentInProgress(false);
    }
  };

  const handleBack = () => {
    if (currentStep === 2) {
      setSelectedUser(null);
      setCurrentStep(1);
    } else if (currentStep === 3) {
      setSelectedRole(null);
      setCurrentStep(2);
    }
  };

  const getPriorityLevel = (priority: number): { level: string; color: string } => {
    if (priority >= 900) return { level: 'Critical', color: 'error' };
    if (priority >= 700) return { level: 'High', color: 'warning' };
    if (priority >= 400) return { level: 'Medium', color: 'info' };
    return { level: 'Low', color: 'secondary' };
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Assign Global Role to User"
      size="lg"
    >
      <div className="role-assignment-modal">
        {/* Progress Indicator */}
        <div className="progress-steps">
          <div className={`progress-step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
            <div className="step-circle">
              {currentStep > 1 ? <CheckIcon size={16} aria-hidden="true" /> : '1'}
            </div>
            <span className="step-label">Select User</span>
          </div>
          <div className="progress-line"></div>
          <div className={`progress-step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
            <div className="step-circle">
              {currentStep > 2 ? <CheckIcon size={16} aria-hidden="true" /> : '2'}
            </div>
            <span className="step-label">Choose Role</span>
          </div>
          <div className="progress-line"></div>
          <div className={`progress-step ${currentStep >= 3 ? 'active' : ''}`}>
            <div className="step-circle">3</div>
            <span className="step-label">Confirm</span>
          </div>
        </div>

        {/* Step Content */}
        <div className="step-content">
          {/* Step 1: Select User */}
          {currentStep === 1 && (
            <div className="assignment-step">
              <div className="step-header">
                <h3 className="step-title">Select a User</h3>
                <p className="step-description">Choose the user you want to assign a role to</p>
              </div>
              
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
                  <div className="empty-state-box">
                    <UserIcon size={48} aria-hidden="true" />
                    <p>No users found</p>
                  </div>
                ) : (
                  filteredUsers.map(user => (
                    <div
                      key={user.user_hash}
                      className="user-item"
                      onClick={() => handleUserSelect(user)}
                    >
                      <div className="user-avatar">
                        <UserIcon size={20} aria-hidden="true" />
                      </div>
                      <div className="user-info">
                        <div className="user-name">{user.username}</div>
                        <div className="user-email">{user.email}</div>
                      </div>
                      <div className="user-meta">
                        <Badge variant="secondary">{user.user_type}</Badge>
                        {user.current_role && (
                          <Badge variant="info">Current: {user.current_role}</Badge>
                        )}
                      </div>
                      <ArrowRightIcon size={16} className="arrow-icon" aria-hidden="true" />
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Step 2: Select Role */}
          {currentStep === 2 && selectedUser && (
            <div className="assignment-step">
              <div className="step-header">
                <h3 className="step-title">Choose a Role</h3>
                <p className="step-description">
                  Select the role to assign to <strong>{selectedUser.username}</strong>
                </p>
              </div>

              {selectedUser.current_role && (
                <div className="current-role-notice">
                  <InfoIcon size={16} aria-hidden="true" />
                  <span>Current role: <strong>{selectedUser.current_role}</strong> (will be replaced)</span>
                </div>
              )}
              
              <div className="user-search">
                <div className="search-input-wrapper">
                  <SearchIcon size={18} aria-hidden="true" className="search-icon" />
                  <Input
                    type="text"
                    placeholder="Search roles..."
                    value={roleSearchQuery}
                    onChange={(e) => setRoleSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="role-list">
                {loadingRoles ? (
                  <div className="loading-state-box">
                    <div className="spinner"></div>
                    <p>Loading roles...</p>
                  </div>
                ) : filteredRoles.length === 0 ? (
                  <div className="empty-state-box">
                    <SecurityIcon size={48} aria-hidden="true" />
                    <p>No roles available</p>
                  </div>
                ) : (
                  filteredRoles.map(role => {
                    const priorityInfo = getPriorityLevel(role.role_priority);
                    return (
                      <div
                        key={role.role_hash}
                        className="role-item"
                        onClick={() => handleRoleSelect(role)}
                      >
                        <div className="role-icon-wrapper">
                          <SecurityIcon size={20} aria-hidden="true" />
                        </div>
                        <div className="role-info">
                          <div className="role-name">{role.role_display_name}</div>
                          <div className="role-description">
                            {role.role_description || role.role_name}
                          </div>
                        </div>
                        <div className="role-meta">
                          <Badge variant={priorityInfo.color as any}>
                            {priorityInfo.level}
                          </Badge>
                          {role.is_system_role && (
                            <Badge variant="info">System</Badge>
                          )}
                        </div>
                        <ArrowRightIcon size={16} className="arrow-icon" aria-hidden="true" />
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Step 3: Confirm Assignment */}
          {currentStep === 3 && selectedUser && selectedRole && (
            <div className="assignment-step">
              <div className="step-header">
                <h3 className="step-title">Confirm Assignment</h3>
                <p className="step-description">Review the details before confirming</p>
              </div>

              <div className="assignment-summary">
                <div className="summary-section">
                  <label className="summary-label">User</label>
                  <div className="summary-card">
                    <UserIcon size={20} aria-hidden="true" />
                    <div className="summary-info">
                      <div className="summary-primary">{selectedUser.username}</div>
                      <div className="summary-secondary">{selectedUser.email}</div>
                    </div>
                  </div>
                </div>

                <div className="summary-arrow">
                  <ArrowRightIcon size={24} aria-hidden="true" />
                </div>

                <div className="summary-section">
                  <label className="summary-label">New Role</label>
                  <div className="summary-card">
                    <SecurityIcon size={20} aria-hidden="true" />
                    <div className="summary-info">
                      <div className="summary-primary">{selectedRole.role_display_name}</div>
                      <div className="summary-secondary">
                        Priority: {selectedRole.role_priority}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {selectedUser.current_role && selectedUser.current_role !== selectedRole.role_name && (
                <div className="warning-notice">
                  <span className="warning-icon">⚠️</span>
                  <div>
                    <strong>Role Replacement</strong>
                    <p>
                      The current role "<strong>{selectedUser.current_role}</strong>" will be replaced 
                      with "<strong>{selectedRole.role_display_name}</strong>". This action cannot be undone.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="modal-actions">
          {currentStep > 1 && (
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={assignmentInProgress || isLoading}
            >
              <ArrowRightIcon size={16} aria-hidden="true" style={{ transform: 'rotate(180deg)' }} />
              Back
            </Button>
          )}
          
          {currentStep === 3 ? (
            <Button
              variant="primary"
              onClick={handleAssign}
              disabled={assignmentInProgress || isLoading}
            >
              {assignmentInProgress ? (
                <>
                  <span className="button-spinner"></span>
                  Assigning...
                </>
              ) : (
                <>
                  <CheckIcon size={16} aria-hidden="true" />
                  Confirm Assignment
                </>
              )}
            </Button>
          ) : null}

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
