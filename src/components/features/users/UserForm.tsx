import React, { useState, useEffect } from 'react';
import { Input, Select, Button, Card, Modal } from '@/components/common';
import { usePermissions, useUserType, useAuth } from '@/hooks';
import { authService } from '@/services';
import AssignProjectModal from './AssignProjectModal';
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

  const [formData, setFormData] = useState<UserFormData>({
    username: initialData?.username || '',
    email: initialData?.email || '',
    password: '',
    confirmPassword: '',
    userType: (initialData?.user_type as UserType) || 'consumer',
    assignedProjects: [],
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

  // Check if editing own account
  const isEditingSelf = mode === 'edit' && currentUser && initialData?.user_hash === currentUser.user_hash;

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
      if (formData.email && formData.email !== initialData?.email) {
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
          setUsernameAvailable(response.username_available === null ? undefined : response.username_available);
        } else {
          setEmailAvailable(response.email_available === null ? undefined : response.email_available);
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

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    } else if (mode === 'create' && emailAvailable === false) {
      newErrors.email = 'Email is already taken';
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

  return (
    <>
      <Card title={mode === 'create' ? 'Create New User' : 'Edit User'} padding="large">
        <form onSubmit={handleSubmit} className="user-form">
          {/* Security Warning for ROOT users */}
          {mode === 'create' && formData.userType === 'root' && (
            <div className="security-warning">
              <div className="warning-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
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
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 16v-4"/>
                  <path d="M12 8h.01"/>
                </svg>
              </div>
              <div className="info-content">
                <p>You are editing your own account. Some restrictions apply for security reasons.</p>
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
                required
                disabled={isLoading || mode === 'edit'} // Username can't be changed in edit mode
                helperText={mode === 'create' ? 
                  (usernameAvailable === true ? 'Username is available' : 
                   usernameAvailable === false ? 'Username is taken' : 
                   'Checking availability...') : undefined
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
                required
                disabled={isLoading}
                helperText={mode === 'create' ? 
                  (emailAvailable === true ? 'Email is available' : 
                   emailAvailable === false ? 'Email is taken' : 
                   'Checking availability...') : undefined
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
                disabled={isLoading || (mode === 'edit' && (currentUserType !== 'root' || isEditingSelf))}
              />
              <p className="field-help-text">Select the user's access level</p>
              {isEditingSelf && currentUserType === 'root' && (
                <p className="field-warning-text">You cannot change your own user type for security reasons</p>
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

          {/* Admin Project Assignment */}
          {formData.userType === 'admin' && (
            <div className="admin-projects-section">
              <h4>Project Assignment</h4>
              <p className="help-text">
                Assign this admin user to specific projects they can manage.
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
                    <p className="no-projects">No projects assigned</p>
                  )}
                </div>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowProjectModal(true)}
                  disabled={isLoading}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                  </svg>
                  Assign Projects
                </Button>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="form-actions">
            <Button
              type="submit"
              variant="primary"
              size="large"
              isLoading={isLoading}
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
          size="medium"
          className="root-confirmation-modal"
          closeOnBackdropClick={!isLoading}
          closeOnEscape={!isLoading}
        >
          <div className="root-confirmation-content">
            <div className="warning-section">
              <div className="warning-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="confirm-icon confirm-icon-warning">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
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
            
            <div className="confirmation-actions">
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
                isLoading={isLoading}
              >
                Create ROOT User
              </Button>
            </div>
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
        userName={formData.username || 'Admin User'}
      />
    </>
  );
}

export default UserForm; 