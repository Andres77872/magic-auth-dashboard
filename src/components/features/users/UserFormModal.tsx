import React, { useState, useEffect } from 'react';
import { Modal, Input, Select, Button } from '@/components/common';
import { usePermissions, useUserType, useAuth, useGlobalRoles, useToast } from '@/hooks';
import { authService, userService, globalRolesService } from '@/services';
import AssignProjectModal from './AssignProjectModal';
import AssignGroupModal from './AssignGroupModal';
import { WarningIcon, InfoIcon, ProjectIcon, GroupIcon } from '@/components/icons';
import type { UserFormData, UserFormErrors } from '@/types/user.types';
import type { UserType, User } from '@/types/auth.types';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode: 'create' | 'edit';
  user?: User | null;
}

const USER_TYPE_OPTIONS = [
  { value: 'consumer', label: 'Consumer User' },
  { value: 'admin', label: 'Admin User' },
  { value: 'root', label: 'ROOT User' },
];

export function UserFormModal({
  isOpen,
  onClose,
  onSuccess,
  mode,
  user = null,
}: UserFormModalProps): React.JSX.Element {
  const { canCreateAdmin, canCreateRoot } = usePermissions();
  const { userType: currentUserType } = useUserType();
  const { user: currentUser } = useAuth();
  const { roles: globalRoles, loadingRoles: loadingGlobalRoles, currentRole: userGlobalRole } = useGlobalRoles();
  const { showToast } = useToast();

  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: 'consumer',
    assignedProjects: [],
    assignedGroup: '',
    globalRoleHash: '',
  });

  const [errors, setErrors] = useState<UserFormErrors>({});
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | undefined>(undefined);
  const [emailAvailable, setEmailAvailable] = useState<boolean | undefined>(undefined);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // ROOT user creation confirmation
  const [showRootConfirmation, setShowRootConfirmation] = useState(false);
  const [rootConfirmationPassword, setRootConfirmationPassword] = useState('');
  const [rootConfirmationError, setRootConfirmationError] = useState('');
  
  // Project/Group assignment modals
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);

  // Initialize form data when user prop changes (for edit mode)
  useEffect(() => {
    if (mode === 'edit' && user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        password: '',
        confirmPassword: '',
        userType: (user.user_type as UserType) || 'consumer',
        assignedProjects: user.projects?.map(p => p.project_hash) || [],
        assignedGroup: user.groups?.[0]?.group_hash || '',
        globalRoleHash: userGlobalRole?.role_hash || '',
      });
    } else if (mode === 'create') {
      // Reset form for create mode
      setFormData({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        userType: 'consumer',
        assignedProjects: [],
        assignedGroup: '',
        globalRoleHash: '',
      });
    }
    
    // Reset validation states
    setErrors({});
    setUsernameAvailable(undefined);
    setEmailAvailable(undefined);
  }, [mode, user, isOpen]);

  // Check if editing own account
  const isEditingSelf = mode === 'edit' && currentUser && user?.user_hash === currentUser.user_hash;

  // Filter user type options based on permissions
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
    if (mode === 'edit') return;

    const timer = setTimeout(async () => {
      if (formData.username && formData.username !== user?.username) {
        await checkAvailability('username', formData.username);
      }
      if (formData.email && formData.email.trim() && formData.email !== user?.email) {
        await checkAvailability('email', formData.email);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.username, formData.email, mode, user]);

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

    // Email validation (optional)
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

    await submitForm();
  };

  const submitForm = async () => {
    setIsLoading(true);

    try {
      let response;

      if (mode === 'create') {
        // Create new user
        switch (formData.userType) {
          case 'root':
            response = await userService.createRootUser({
              username: formData.username,
              password: formData.password,
              email: formData.email,
            });
            break;
          case 'admin':
            response = await userService.createAdminUser({
              username: formData.username,
              password: formData.password,
              email: formData.email,
              assigned_project_ids: [],
            });
            break;
          case 'consumer':
          default:
            if (!formData.assignedGroup) {
              showToast('Consumer users must be assigned to a user group', 'error');
              setIsLoading(false);
              return;
            }
            
            response = await userService.createConsumerUser({
              username: formData.username,
              password: formData.password,
              email: formData.email,
              user_group_hash: formData.assignedGroup,
            });
            break;
        }

        if (response.success) {
          // Assign global role if specified
          if (formData.globalRoleHash && response.user?.user_hash) {
            try {
              await globalRolesService.assignRoleToUser(
                response.user.user_hash,
                formData.globalRoleHash
              );
            } catch (roleError) {
              console.error('Failed to assign global role:', roleError);
            }
          }
          
          showToast(`User "${formData.username}" created successfully`, 'success');
          onSuccess();
          onClose();
        } else {
          showToast(response.message || 'Failed to create user', 'error');
        }
      } else {
        // Update existing user
        if (!user?.user_hash) return;

        const updateData: Partial<User> = {
          username: formData.username,
          email: formData.email,
          user_type: formData.userType,
        };

        response = await userService.updateUser(user.user_hash, updateData);

        if (response.success) {
          // Update global role if specified
          if (formData.globalRoleHash !== undefined) {
            try {
              if (formData.globalRoleHash) {
                await globalRolesService.assignRoleToUser(
                  user.user_hash,
                  formData.globalRoleHash
                );
              }
            } catch (roleError) {
              console.error('Failed to update global role:', roleError);
            }
          }
          
          showToast(`User "${formData.username}" updated successfully`, 'success');
          onSuccess();
          onClose();
        } else {
          showToast(response.message || 'Failed to update user', 'error');
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
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
      const loginResponse = await authService.login({
        username: currentUser.username,
        password: rootConfirmationPassword,
      });

      if (loginResponse.success) {
        setShowRootConfirmation(false);
        setRootConfirmationPassword('');
        setRootConfirmationError('');
        await submitForm();
      } else {
        setRootConfirmationError('Incorrect password');
      }
    } catch (error) {
      setRootConfirmationError('Password verification failed');
    }
  };

  const handleInputChange = (field: keyof UserFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
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

  return (
    <>
      <Modal
        isOpen={isOpen && !showRootConfirmation}
        onClose={onClose}
        title={mode === 'create' ? 'Create New User' : 'Edit User'}
        size="lg"
        closeOnBackdropClick={!isLoading}
        closeOnEscape={!isLoading}
      >
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Security Warning for ROOT users */}
            {mode === 'create' && formData.userType === 'root' && (
              <div className="form-alert form-alert-warning">
                <WarningIcon size={20} aria-hidden="true" />
                <div>
                  <strong>Creating ROOT User</strong>
                  <p>You are about to create a ROOT user with full system access.</p>
                </div>
              </div>
            )}

            {/* Self-editing protection warning */}
            {isEditingSelf && (
              <div className="form-alert form-alert-info">
                <InfoIcon size={20} aria-hidden="true" />
                <p>You are editing your own account. Some restrictions apply for security reasons.</p>
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
                  required
                  disabled={isLoading || mode === 'edit'}
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
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  error={errors.email}
                  success={mode === 'create' && !!formData.email && emailAvailable === true}
                  disabled={isLoading}
                  helperText={mode === 'create' && formData.email ? 
                    (emailAvailable === true ? 'Email is available' : 
                     emailAvailable === false ? 'Email is already in use' : 
                     checkingAvailability ? 'Checking availability...' : 'Optional but recommended') : 'Optional but recommended'
                  }
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
                {isEditingSelf && currentUserType === 'root' && (
                  <p className="field-helper-text text-warning">You cannot change your own user type</p>
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
              </div>

              {/* Password Fields */}
              {mode === 'create' && (
                <>
                  <div className="form-field">
                    <Input
                      label="Password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      error={errors.password}
                      required
                      disabled={isLoading}
                      helperText="Minimum 8 characters"
                    />
                  </div>

                  <div className="form-field">
                    <Input
                      label="Confirm Password"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      error={errors.confirmPassword}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Project Assignment for Admin Users */}
            {formData.userType === 'admin' && (
              <div className="form-section">
                <h4 className="form-section-title">Project Assignment</h4>
                <p className="form-section-description">
                  Assign this admin user to specific projects they can manage.
                </p>
                
                <div className="form-assignment-display">
                  {formData.assignedProjects && formData.assignedProjects.length > 0 ? (
                    <p className="text-sm text-secondary">
                      {formData.assignedProjects.length} project{formData.assignedProjects.length !== 1 ? 's' : ''} assigned
                    </p>
                  ) : (
                    <p className="text-sm text-muted">No projects assigned</p>
                  )}
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowProjectModal(true)}
                    disabled={isLoading}
                    leftIcon={<ProjectIcon size={16} />}
                  >
                    {formData.assignedProjects && formData.assignedProjects.length > 0 ? 'Change' : 'Assign'} Projects
                  </Button>
                </div>
              </div>
            )}

            {/* Group Assignment for Consumer Users */}
            {formData.userType === 'consumer' && (
              <div className="form-section">
                <h4 className="form-section-title">User Group Assignment</h4>
                <p className="form-section-description">
                  Assign this consumer user to a user group. This is required.
                </p>

                <div className="form-assignment-display">
                  {formData.assignedGroup ? (
                    <p className="text-sm text-secondary">1 group assigned</p>
                  ) : (
                    <p className="text-sm text-muted">No group assigned</p>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowGroupModal(true)}
                    disabled={isLoading}
                    leftIcon={<GroupIcon size={16} />}
                  >
                    {formData.assignedGroup ? 'Change Group' : 'Assign Group'}
                  </Button>
                </div>

                {errors.assignedGroup && (
                  <p className="field-error-text">{errors.assignedGroup}</p>
                )}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isLoading}
              disabled={checkingAvailability || (mode === 'create' && (usernameAvailable === false || emailAvailable === false))}
            >
              {mode === 'create' ? 'Create User' : 'Update User'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ROOT User Creation Confirmation Dialog */}
      <Modal
        isOpen={showRootConfirmation}
        onClose={() => {
          setShowRootConfirmation(false);
          setRootConfirmationPassword('');
          setRootConfirmationError('');
        }}
        title="Confirm ROOT User Creation"
        size="md"
        closeOnBackdropClick={!isLoading}
        closeOnEscape={!isLoading}
      >
        <div className="modal-body">
          <div className="form-alert form-alert-warning">
            <WarningIcon size={32} aria-hidden="true" />
            <div>
              <p>You are about to create a ROOT user with full administrative privileges. This is a security-sensitive operation.</p>
              <p><strong>Please enter your password to confirm this action:</strong></p>
            </div>
          </div>
          
          <div className="form-field">
            <Input
              type="password"
              value={rootConfirmationPassword}
              onChange={(e) => setRootConfirmationPassword(e.target.value)}
              placeholder="Enter your password"
              error={rootConfirmationError}
              autoFocus
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

export default UserFormModal;

