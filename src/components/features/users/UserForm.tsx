import React, { useState, useEffect } from 'react';
import { Input, Select, Button, Card } from '@/components/common';
import { usePermissions, useUserType } from '@/hooks';
import { authService } from '@/services';
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

  const [formData, setFormData] = useState<UserFormData>({
    username: initialData?.username || '',
    email: initialData?.email || '',
    password: '',
    confirmPassword: '',
    userType: (initialData?.user_type as UserType) || 'consumer',
    assignedProjects: [],
  });

  const [errors, setErrors] = useState<UserFormErrors>({});
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  // Filter user type options based on permissions
  const availableUserTypes = USER_TYPE_OPTIONS.filter(option => {
    if (option.value === 'root' && !canCreateRoot) return false;
    if (option.value === 'admin' && !canCreateAdmin) return false;
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
          setUsernameAvailable(response.username_available || false);
        } else {
          setEmailAvailable(response.email_available || false);
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

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleInputChange = (field: keyof UserFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear related errors
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Card title={mode === 'create' ? 'Create New User' : 'Edit User'} padding="large">
      <form onSubmit={handleSubmit} className="user-form">
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
              disabled={isLoading || (mode === 'edit' && currentUserType !== 'root')}
            />
            <p className="field-help-text">Select the user's access level</p>
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

        {/* Admin Project Assignment (for future implementation) */}
        {formData.userType === 'admin' && (
          <div className="admin-projects-section">
            <h4>Project Assignment</h4>
            <p className="help-text">
              Project assignment will be available in a future update.
            </p>
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
  );
}

export default UserForm; 