import React, { useState, useEffect } from 'react';
import { Input, Select, Button, Card, Modal } from '@/components/common';
import { usePermissions, useUserType, useAuth, useGlobalRoles } from '@/hooks';
import { authService } from '@/services';
import AssignProjectModal from './AssignProjectModal';
import AssignGroupModal from './AssignGroupModal';
import { WarningIcon, InfoIcon, ProjectIcon, GroupIcon } from '@/components/icons';
import type { UserFormData, UserFormErrors } from '@/types/user.types';
import type { UserType, User } from '@/types/auth.types';

interface UserFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<User>;
  onSubmit: (data: UserFormData) => Promise<void>;
  isLoading?: boolean;
  submitButtonText?: string;
}

const USER_TYPE_OPTIONS = [
  { value: 'consumer', label: 'Consumer User' },
  { value: 'admin', label: 'Admin User' },
  { value: 'root', label: 'ROOT User' },
];

export function UserForm({
  mode,
  initialData,
  onSubmit,
  isLoading = false,
  submitButtonText
}: UserFormProps): React.JSX.Element {
  const { canCreateAdmin, canCreateRoot } = usePermissions();
  const { userType: currentUserType } = useUserType();
  const { user: currentUser } = useAuth();
  const { roles: globalRoles, loadingRoles: loadingGlobalRoles, currentRole: userGlobalRole } = useGlobalRoles();

  const [formData, setFormData] = useState<UserFormData>({
    username: initialData?.username || '',
    email: initialData?.email || '',
    password: '',
    confirmPassword: '',
    userType: (initialData?.user_type as UserType) || 'consumer',
    assignedProjects: initialData?.projects?.map(p => p.project_hash) || [],
    assignedGroup: initialData?.groups?.[0]?.group_hash || '',
    globalRoleHash: '', // Will be set from userGlobalRole
  });

  const [errors, setErrors] = useState<UserFormErrors>({});
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | undefined>(undefined);
  const [emailAvailable, setEmailAvailable] = useState<boolean | undefined>(undefined);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  
  // ROOT user creation confirmation
  const [showRootConfirmation, setShowRootConfirmation] = useState(false);
  const [rootConfirmationPassword, setRootConfirmationPassword] = useState('');
  const [rootConfirmationError, setRootConfirmationError] = useState('');
  
  // Project assignment modal
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  
  // Email input ref for auto-focus
  const emailInputRef = React.useRef<HTMLInputElement>(null);

  // Load user's current global role if in edit mode
  useEffect(() => {
    if (mode === 'edit' && initialData?.user_hash && userGlobalRole) {
      setFormData(prev => ({
        ...prev,
        globalRoleHash: userGlobalRole.role_hash
      }));
    }
  }, [mode, initialData?.user_hash, userGlobalRole]);

  // Check if editing own account
  const isEditingSelf = mode === 'edit' && currentUser && initialData?.user_hash === currentUser.user_hash;

  // Auto-focus email field on component mount for create mode
  React.useEffect(() => {
    if (mode === 'create' && emailInputRef.current) {
      // Small delay to ensure component is fully rendered
      setTimeout(() => {
        emailInputRef.current?.focus();
      }, 100);
    }
  }, [mode]);

  // Filter user type options based on permissions and prevent self-demotion
  const availableUserTypes = USER_TYPE_OPTIONS.filter(option => {
    if (option.value === 'root' && !canCreateRoot) return false;
    if (option.value === 'admin' && !canCreateAdmin) return false;
    
    // Prevent ROOT user from demoting themselves
    if (isEditingSelf && currentUserType === 'root' && option.value !== 'root') {
      return false;
    }
    
    return true;
  });

  // Debounced availability check
  useEffect(() => {
    if (mode === 'edit') return; // Skip availability check for edit mode

    const timer = setTimeout(async () => {
      if (formData.username && formData.username !== initialData?.username) {
        await checkAvailability('username', formData.username);
      }
      if (formData.email && formData.email.trim() && formData.email !== initialData?.email) {
        await checkAvailability('email', formData.email);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.username, formData.email, mode, initialData]);

  const checkAvailability = async (field: 'username' | 'email', value: string) => {
    setCheckingAvailability(true);
    try {
      const response = await authService.checkAvailability({
        [field]: value
      });

      if (response.success) {
        if (field === 'username') {
          setUsernameAvailable(response.username_available === null ? undefined : Boolean(response.username_available));
        } else {
          setEmailAvailable(response.email_available === null ? undefined : Boolean(response.email_available));
        }
      }
    } catch (error) {
      console.error(`Error checking ${field} availability:`, error);
    } finally {
      setCheckingAvailability(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: UserFormErrors = {};

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (mode === 'create' && usernameAvailable === false) {
      newErrors.username = 'Username is already taken';
    }

    // Email validation (now optional)
    if (formData.email.trim()) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      } else if (mode === 'create' && emailAvailable === false) {
        newErrors.email = 'Email is already taken';
      }
    }

    // Password validation (required for create, optional for edit)
    if (mode === 'create' || formData.password) {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    // User type validation
    if (!formData.userType) {
      newErrors.userType = 'User type is required';
    }

    // Group assignment validation for consumer users
    if (mode === 'create' && formData.userType === 'consumer') {
      if (!formData.assignedGroup) {
        newErrors.assignedGroup = 'Consumer users must be assigned to a user group';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    if (checkingAvailability) return;

    // Special handling for ROOT user creation
    if (mode === 'create' && formData.userType === 'root') {
      setShowRootConfirmation(true);
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleRootConfirmation = async () => {
    if (!rootConfirmationPassword) {
      setRootConfirmationError('Please enter your password to confirm');
      return;
    }

    if (!currentUser) {
      setRootConfirmationError('Unable to verify current user');
      return;
    }

    try {
      // Verify current user's password before proceeding
      const loginResponse = await authService.login({
        username: currentUser.username,
        password: rootConfirmationPassword,
      });

      if (loginResponse.success) {
        setShowRootConfirmation(false);
        setRootConfirmationPassword('');
        setRootConfirmationError('');
        await onSubmit(formData);
      } else {
        setRootConfirmationError('Incorrect password');
      }
    } catch (error) {
      setRootConfirmationError('Password verification failed');
    }
  };

  const handleInputChange = (field: keyof UserFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear related errors
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleProjectAssignment = (selectedProjects: string[]) => {
    setFormData(prev => ({ ...prev, assignedProjects: selectedProjects }));
    setShowProjectModal(false);
  };

  const handleGroupAssignment = (selectedGroup: string) => {
    setFormData(prev => ({ ...prev, assignedGroup: selectedGroup }));
    setShowGroupModal(false);
  };

  // Helper function to display current user data
  const getCurrentUserGroups = () => {
    if (!initialData?.groups) return [];
    return initialData.groups;
  };

  const getCurrentUserProjects = () => {
    if (!initialData?.projects) return [];
    return initialData.projects;
  };

  return (
    <>
      <Card title={mode === 'create' ? 'Create New User' : 'Edit User'} padding="lg">
        <form onSubmit={handleSubmit} className="user-form">
          {/* Security Warning for ROOT users */}
          {mode === 'create' && formData.userType === 'root' && (
            <div className="security-warning">
              <div className="warning-icon">
                <WarningIcon size="lg" aria-hidden="true" />
              </div>
              <div className="warning-content">
                <h4>Creating ROOT User</h4>
                <p>You are about to create a ROOT user with full system access. This action requires additional confirmation for security purposes.</p>
              </div>
            </div>
          )}

          {/* Self-editing protection warning */}
          {isEditingSelf && (
            <div className="info-banner">
              <div className="info-icon">
                <InfoIcon size="lg" aria-hidden="true" />
              </div>
              <div className="info-content">
                <p>You are editing your own account. Some restrictions apply for security reasons.</p>
              </div>
            </div>
          )}

          {/* Display current user data in edit mode */}
          {mode === 'edit' && initialData && (
            <div className="current-user-info">
              <h4>Current User Information</h4>
              <div className="user-data-summary">
                <div className="data-item">
                  <label>Groups:</label>
                  <div className="current-groups">
                    {getCurrentUserGroups().length > 0 ? (
                      getCurrentUserGroups().map(group => (
                        <span key={group.group_hash} className="group-tag">
                          {group.group_name}
                        </span>
                      ))
                    ) : (
                      <span className="no-data">No groups assigned</span>
                    )}
                  </div>
                </div>
                <div className="data-item">
                  <label>Projects:</label>
                  <div className="current-projects">
                    {getCurrentUserProjects().length > 0 ? (
                      getCurrentUserProjects().map(project => (
                        <span key={project.project_hash} className="project-tag">
                          {project.project_name}
                        </span>
                      ))
                    ) : (
                      <span className="no-data">No projects assigned</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="form-grid">
            {/* Username Field */}
            <div className="form-field">
              <Input
                label="Username"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                error={errors.username}
                success={mode === 'create' && usernameAvailable === true}
                validationState={mode === 'create' ? (usernameAvailable === true ? 'success' : usernameAvailable === false ? 'error' : null) : null}
                required
                disabled={isLoading || mode === 'edit'}
                loading={mode === 'create' && checkingAvailability}
                helperText={mode === 'create' ? 
                  (usernameAvailable === true ? 'Username is available' : 
                   usernameAvailable === false ? 'Username is taken' : 
                   checkingAvailability ? 'Checking availability...' : 'Enter a unique username') : 'Username cannot be changed'
                }
              />
            </div>

            {/* Email Field */}
            <div className="form-field">
              <Input
                label="Email Address (Optional)"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                error={errors.email}
                success={mode === 'create' && !!formData.email && emailAvailable === true}
                validationState={mode === 'create' && formData.email ? (emailAvailable === true ? 'success' : emailAvailable === false ? 'error' : null) : null}
                disabled={isLoading}
                loading={mode === 'create' && checkingAvailability && formData.email.length > 0}
                helperText={mode === 'create' && formData.email ? 
                  (emailAvailable === true ? 'Email is available' : 
                   emailAvailable === false ? 'Email is already in use' : 
                   checkingAvailability ? 'Checking availability...' : 'Optional but recommended') : 'Optional but recommended'
                }
                ref={emailInputRef}
              />
            </div>

            {/* User Type Field */}
            <div className="form-field">
              <Select
                label="User Type"
                options={availableUserTypes}
                value={formData.userType}
                onChange={(value) => handleInputChange('userType', value)}
                error={errors.userType}
                disabled={isLoading || (mode === 'edit' && (currentUserType !== 'root' || isEditingSelf)) || undefined}
              />
              <p className="field-help-text">Select the user's access level</p>
              {isEditingSelf && currentUserType === 'root' && (
                <p className="field-warning-text">You cannot change your own user type for security reasons</p>
              )}
            </div>

            {/* Global Role Field */}
            <div className="form-field">
              <Select
                label="Global Role"
                options={[
                  { value: '', label: 'No Global Role' },
                  ...globalRoles.map(role => ({
                    value: role.role_hash,
                    label: role.role_display_name
                  }))
                ]}
                value={formData.globalRoleHash || ''}
                onChange={(value) => handleInputChange('globalRoleHash', value)}
                disabled={isLoading || loadingGlobalRoles}
              />
              <p className="field-help-text">
                {loadingGlobalRoles ? 'Loading global roles...' : 'Assign a global role for system-wide permissions'}
              </p>
              {formData.globalRoleHash && (
                <p className="field-info-text">
                  Global roles provide permissions across all projects
                </p>
              )}
            </div>

            {/* Password Field (create mode or if changing password) */}
            {(mode === 'create' || formData.password) && (
              <>
                <div className="form-field">
                  <Input
                    label={mode === 'create' ? 'Password' : 'New Password'}
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    error={errors.password}
                    required={mode === 'create'}
                    disabled={isLoading}
                    helperText="Minimum 8 characters"
                  />
                </div>

                <div className="form-field">
                  <Input
                    label={mode === 'create' ? 'Confirm Password' : 'Confirm New Password'}
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    error={errors.confirmPassword}
                    required={mode === 'create' || !!formData.password}
                    disabled={isLoading}
                  />
                </div>
              </>
            )}
          </div>

          {/* Project Assignment for Admin and Consumer Users */}
          {formData.userType === 'admin' && (
            <div className="project-assignment-section">
              <h4>Project Assignment</h4>
              <p className="help-text">
                {formData.userType === 'admin' 
                  ? 'Assign this admin user to specific projects they can manage.'
                  : 'Assign this user to a project. Consumer users need to be associated with at least one project.'}
              </p>
              
              <div className="project-assignment-controls">
                <div className="assigned-projects-display">
                  {formData.assignedProjects && formData.assignedProjects.length > 0 ? (
                    <div className="project-list-summary">
                      <p className="project-count">
                        {formData.assignedProjects.length} project{formData.assignedProjects.length !== 1 ? 's' : ''} assigned
                      </p>
                      <div className="project-tags">
                        {formData.assignedProjects.slice(0, 3).map((projectHash, index) => (
                          <span key={projectHash} className="project-tag">
                            <ProjectIcon size="xs" aria-hidden="true" />
                            Project {index + 1}
                          </span>
                        ))}
                        {formData.assignedProjects.length > 3 && (
                          <span className="project-tag project-tag-more">
                            +{formData.assignedProjects.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="no-projects">
                                        No projects assigned
                    </p>
                  )}
                </div>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowProjectModal(true)}
                  disabled={isLoading}
                >
                  <ProjectIcon size="sm" aria-hidden="true" />
                  {formData.assignedProjects && formData.assignedProjects.length > 0 ? 'Change' : 'Assign'} Projects
                </Button>
              </div>
              
              {mode === 'create' && (!formData.assignedProjects || formData.assignedProjects.length === 0) && (
                <p className="field-warning-text">
                  Admin users should be assigned to at least one project
                </p>
              )}
              
              {errors.assignedProjects && (
                <p className="field-error-text">
                  {errors.assignedProjects}
                </p>
              )}
            </div>
          )}

          {/* Group Assignment for Consumer Users */}
          {formData.userType === 'consumer' && (
            <div className="group-assignment-section">
              <h4>User Group Assignment</h4>
              <p className="help-text">Assign this consumer user to a user group. This is required.</p>

              <div className="project-assignment-controls">
                <div className="assigned-projects-display">
                  {formData.assignedGroup ? (
                    <div className="project-list-summary">
                      <p className="project-count">1 group assigned</p>
                      <div className="project-tags">
                        <span className="project-tag">{formData.assignedGroup}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="no-projects">No group assigned</p>
                  )}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowGroupModal(true)}
                  disabled={isLoading}
                >
                  <GroupIcon size="sm" aria-hidden="true" />
                  {formData.assignedGroup ? 'Change Group' : 'Assign Group'}
                </Button>
              </div>

              {errors.assignedGroup && (
                <p className="field-error-text">
                  {errors.assignedGroup}
                </p>
              )}
            </div>
          )}

          {/* Form Actions */}
          <div className="form-actions">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isLoading}
              disabled={checkingAvailability || (mode === 'create' && (usernameAvailable === false || emailAvailable === false))}
            >
              {submitButtonText || (mode === 'create' ? 'Create User' : 'Update User')}
            </Button>
          </div>
        </form>
      </Card>

      {/* ROOT User Creation Confirmation Dialog */}
      {showRootConfirmation && (
        <Modal
          isOpen={showRootConfirmation}
          onClose={() => {
            setShowRootConfirmation(false);
            setRootConfirmationPassword('');
            setRootConfirmationError('');
          }}
          title="Confirm ROOT User Creation"
          size="md"
          className="root-confirmation-modal"
          closeOnBackdropClick={!isLoading}
          closeOnEscape={!isLoading}
        >
          <div className="modal-body">
            <div className="warning-section">
              <div className="warning-icon">
                <WarningIcon size="xl" className="confirm-icon confirm-icon-warning" aria-hidden="true" />
              </div>
              <div className="warning-message">
                <p>You are about to create a ROOT user with full administrative privileges. This is a security-sensitive operation.</p>
                <p><strong>Please enter your password to confirm this action:</strong></p>
              </div>
            </div>
            
            <div className="confirmation-input">
              <Input
                type="password"
                value={rootConfirmationPassword}
                onChange={(e) => setRootConfirmationPassword(e.target.value)}
                placeholder="Enter your password"
                error={rootConfirmationError}
                autoFocus={true}
                fullWidth
              />
            </div>
          </div>

          <div className="modal-footer">
            <Button
              variant="outline"
              onClick={() => {
                setShowRootConfirmation(false);
                setRootConfirmationPassword('');
                setRootConfirmationError('');
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleRootConfirmation}
              loading={isLoading}
            >
              Create ROOT User
            </Button>
          </div>
        </Modal>
      )}

      {/* Assign Projects Modal */}
      <AssignProjectModal
        isOpen={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        onConfirm={handleProjectAssignment}
        initialSelection={formData.assignedProjects || []}
        isLoading={isLoading}
        userName={formData.username || (formData.userType === 'admin' ? 'Admin User' : 'Consumer User')}
        allowMultiple={true}
        userType={formData.userType}
      />

      {/* Assign Group Modal */}
      <AssignGroupModal
        isOpen={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        onConfirm={handleGroupAssignment}
        initialSelection={formData.assignedGroup ? [formData.assignedGroup] : []}
        isLoading={isLoading}
        userName={formData.username || 'Consumer User'}
      />
    </>
  );
}

export default UserForm; 