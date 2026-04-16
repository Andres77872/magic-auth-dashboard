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
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  usePermissions,
  useUserType,
  useAuth,
  useGlobalRoles,
  useToast,
} from '@/hooks';
import { authService, userService, globalRolesService } from '@/services';
import AssignProjectModal from './AssignProjectModal';
import AssignGroupModal from './AssignGroupModal';
import RootConfirmationDialog from './RootConfirmationDialog';
import UserFormWarnings from './UserFormWarnings';
import UserFormSections from './UserFormSections';
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
  const {
    roles: globalRoles,
    loadingRoles: loadingGlobalRoles,
    currentRole: userGlobalRole,
  } = useGlobalRoles();
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
  const [usernameAvailable, setUsernameAvailable] = useState<
    boolean | undefined
  >(undefined);
  const [emailAvailable, setEmailAvailable] = useState<boolean | undefined>(
    undefined
  );
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // ROOT user creation confirmation
  const [showRootConfirmation, setShowRootConfirmation] = useState(false);
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
        assignedProjects: user.projects?.map((p) => p.project_hash) || [],
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
  const isEditingSelf =
    mode === 'edit' &&
    !!currentUser &&
    user?.user_hash === currentUser.user_hash;

  // Filter user type options based on permissions
  const availableUserTypes = USER_TYPE_OPTIONS.filter((option) => {
    if (option.value === 'root' && !canCreateRoot) return false;
    if (option.value === 'admin' && !canCreateAdmin) return false;

    // Prevent ROOT user from demoting themselves
    if (
      isEditingSelf &&
      currentUserType === 'root' &&
      option.value !== 'root'
    ) {
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
      if (
        formData.email &&
        formData.email.trim() &&
        formData.email !== user?.email
      ) {
        await checkAvailability('email', formData.email);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.username, formData.email, mode, user]);

  const checkAvailability = async (
    field: 'username' | 'email',
    value: string
  ) => {
    setCheckingAvailability(true);
    try {
      const response = await authService.checkAvailability({
        [field]: value,
      });

      if (response.success) {
        if (field === 'username') {
          setUsernameAvailable(
            response.username_available === null
              ? undefined
              : Boolean(response.username_available)
          );
        } else {
          setEmailAvailable(
            response.email_available === null
              ? undefined
              : Boolean(response.email_available)
          );
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
        newErrors.assignedGroup =
          'Consumer users must be assigned to a user group';
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
              showToast(
                'Consumer users must be assigned to a user group',
                'error'
              );
              setIsLoading(false);
              return;
            }

            response = await userService.createConsumerUser({
              username: formData.username,
              password: formData.password,
              user_group_hash: formData.assignedGroup,
              email: formData.email || undefined,
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

          showToast(
            `User "${formData.username}" created successfully`,
            'success'
          );
          onSuccess();
          onClose();
        } else {
          showToast(response.message || 'Failed to create user', 'error');
        }
      } else {
        // Update existing user
        if (!user?.user_hash) return;

        // Only update username/email - user_type changes use separate endpoint
        const updateData: { username?: string; email?: string } = {};
        if (formData.email !== user.email) {
          updateData.email = formData.email;
        }
        // Note: username changes are typically not allowed in edit mode

        // Update user details if there are changes
        if (Object.keys(updateData).length > 0) {
          response = await userService.updateUser(user.user_hash, updateData);
          if (!response.success) {
            showToast(response.message || 'Failed to update user', 'error');
            return;
          }
        }

        // Handle user type change separately (ROOT only operation)
        if (
          currentUserType === 'root' &&
          formData.userType !== user.user_type
        ) {
          try {
            const typeChangeResponse = await userService.changeUserType(
              user.user_hash,
              formData.userType
            );
            if (!typeChangeResponse.success) {
              showToast(
                typeChangeResponse.message || 'Failed to change user type',
                'error'
              );
              return;
            }
          } catch (typeError) {
            console.error('Failed to change user type:', typeError);
            showToast('Failed to change user type', 'error');
            return;
          }
        }

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

        showToast(
          `User "${formData.username}" updated successfully`,
          'success'
        );
        onSuccess();
        onClose();
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'An unexpected error occurred';
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRootConfirmation = async (password: string) => {
    if (!currentUser) {
      setRootConfirmationError('Unable to verify current user');
      return;
    }

    try {
      const loginResponse = await authService.login({
        username: currentUser.username,
        password: password,
      });

      if (loginResponse.success) {
        setShowRootConfirmation(false);
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
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleProjectAssignment = (selectedProjects: string[]) => {
    setFormData((prev) => ({ ...prev, assignedProjects: selectedProjects }));
    setShowProjectModal(false);
  };

  const handleGroupAssignment = (selectedGroup: string) => {
    setFormData((prev) => ({ ...prev, assignedGroup: selectedGroup }));
    setShowGroupModal(false);
  };

  return (
    <>
      <Dialog
        open={isOpen && !showRootConfirmation}
        onOpenChange={(open) => !isLoading && !open && onClose()}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {mode === 'create' ? 'Create New User' : 'Edit User'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <UserFormWarnings
                mode={mode}
                userType={formData.userType}
                isEditingSelf={isEditingSelf}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                {/* Username Field */}
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) =>
                      handleInputChange('username', e.target.value)
                    }
                    required
                    disabled={isLoading || mode === 'edit'}
                  />
                  {errors.username && (
                    <p className="text-xs text-destructive">
                      {errors.username}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {mode === 'create'
                      ? usernameAvailable === true
                        ? 'Username is available'
                        : usernameAvailable === false
                          ? 'Username is taken'
                          : checkingAvailability
                            ? 'Checking availability...'
                            : 'Enter a unique username'
                      : 'Username cannot be changed'}
                  </p>
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={isLoading}
                  />
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {mode === 'create' && formData.email
                      ? emailAvailable === true
                        ? 'Email is available'
                        : emailAvailable === false
                          ? 'Email is already in use'
                          : checkingAvailability
                            ? 'Checking availability...'
                            : 'Optional but recommended'
                      : 'Optional but recommended'}
                  </p>
                </div>

                {/* User Type Field */}
                <div className="space-y-2">
                  <Label>User Type</Label>
                  <Select
                    value={formData.userType}
                    onValueChange={(value: string) =>
                      handleInputChange('userType', value)
                    }
                    disabled={
                      isLoading ||
                      (mode === 'edit' &&
                        (currentUserType !== 'root' || isEditingSelf)) ||
                      undefined
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select user type" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUserTypes.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.userType && (
                    <p className="text-xs text-destructive">
                      {errors.userType}
                    </p>
                  )}
                  {isEditingSelf && currentUserType === 'root' && (
                    <p className="text-xs text-yellow-600">
                      You cannot change your own user type
                    </p>
                  )}
                </div>

                {/* Global Role Field */}
                <div className="space-y-2">
                  <Label>Global Role</Label>
                  <Select
                    value={formData.globalRoleHash || 'none'}
                    onValueChange={(value: string) =>
                      handleInputChange(
                        'globalRoleHash',
                        value === 'none' ? '' : value
                      )
                    }
                    disabled={isLoading || loadingGlobalRoles}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select global role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Global Role</SelectItem>
                      {globalRoles.map((role) => (
                        <SelectItem key={role.role_hash} value={role.role_hash}>
                          {role.role_display_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Password Fields */}
                {mode === 'create' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) =>
                          handleInputChange('password', e.target.value)
                        }
                        required
                        disabled={isLoading}
                      />
                      {errors.password && (
                        <p className="text-xs text-destructive">
                          {errors.password}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Minimum 8 characters
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) =>
                          handleInputChange('confirmPassword', e.target.value)
                        }
                        required
                        disabled={isLoading}
                      />
                      {errors.confirmPassword && (
                        <p className="text-xs text-destructive">
                          {errors.confirmPassword}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>

              <UserFormSections
                userType={formData.userType}
                assignedProjects={formData.assignedProjects}
                assignedGroup={formData.assignedGroup}
                assignmentError={errors.assignedGroup}
                isLoading={isLoading}
                onOpenProjectModal={() => setShowProjectModal(true)}
                onOpenGroupModal={() => setShowGroupModal(true)}
              />
            </div>

            <DialogFooter className="mt-6">
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
                disabled={
                  checkingAvailability ||
                  (mode === 'create' &&
                    (usernameAvailable === false || emailAvailable === false))
                }
              >
                {isLoading && <Spinner size="sm" className="mr-2" />}
                {mode === 'create' ? 'Create User' : 'Update User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ROOT User Creation Confirmation Dialog */}
      <RootConfirmationDialog
        isOpen={showRootConfirmation}
        isLoading={isLoading}
        userName={formData.username || 'ROOT User'}
        error={rootConfirmationError}
        onConfirm={handleRootConfirmation}
        onCancel={() => {
          setShowRootConfirmation(false);
          setRootConfirmationError('');
        }}
      />

      {/* Assign Projects Modal */}
      <AssignProjectModal
        isOpen={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        onConfirm={handleProjectAssignment}
        initialSelection={formData.assignedProjects || []}
        isLoading={isLoading}
        userName={
          formData.username ||
          (formData.userType === 'admin' ? 'Admin User' : 'Consumer User')
        }
        allowMultiple={true}
        userType={formData.userType}
      />

      {/* Assign Group Modal */}
      <AssignGroupModal
        isOpen={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        onConfirm={handleGroupAssignment}
        initialSelection={
          formData.assignedGroup ? [formData.assignedGroup] : []
        }
        isLoading={isLoading}
        userName={formData.username || 'Consumer User'}
      />
    </>
  );
}

export default UserFormModal;
