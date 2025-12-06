import React, { useState, useEffect } from 'react';
import { Modal, Input, Textarea, Button, Checkbox } from '@/components/common';
import { usePermissions } from '@/hooks/usePermissions';
import type { Role, Permission } from '@/types/rbac.types';
import '../../../styles/components/role-form-modal.css';

interface RoleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  mode: 'create' | 'edit';
  projectHash: string;
  role?: Role | null;
}

interface FormErrors {
  group_name?: string;
  description?: string;
  priority?: string;
}

export const RoleFormModal: React.FC<RoleFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  mode,
  projectHash,
  role
}) => {
  const [formData, setFormData] = useState({
    group_name: '',
    description: '',
    priority: 50,
    is_active: true,
    permission_ids: [] as number[]
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { permissions, loading: permissionsLoading } = usePermissions(projectHash);

  // Reset form when modal opens/closes or role changes
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && role) {
        setFormData({
          group_name: role.group_name,
          description: role.description || '',
          priority: role.priority || 50,
          is_active: role.is_active !== undefined ? role.is_active : true,
          permission_ids: role.permissions?.map(p => p.id) || []
        });
      } else {
        setFormData({
          group_name: '',
          description: '',
          priority: 50,
          is_active: true,
          permission_ids: []
        });
      }
      setErrors({});
      setSearchTerm('');
    }
  }, [isOpen, mode, role]);

  // Group permissions by category
  const permissionsByCategory = permissions.reduce((acc, permission) => {
    const category = permission.category || 'general';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  const validateField = (name: string, value: any): string | undefined => {
    switch (name) {
      case 'group_name':
        if (!value.trim()) return 'Role name is required';
        if (value.length < 3) return 'Role name must be at least 3 characters';
        if (!/^[a-z_]+$/.test(value)) return 'Use lowercase letters and underscores only';
        return undefined;
      case 'priority':
        const num = parseInt(value);
        if (isNaN(num)) return 'Priority must be a number';
        if (num < 1 || num > 100) return 'Priority must be between 1 and 100';
        return undefined;
      case 'description':
        if (value && value.length > 500) return 'Description must be less than 500 characters';
        return undefined;
      default:
        return undefined;
    }
  };

  const handleChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    const error = validateField(name, value);
    if (error) {
      setErrors(prev => ({ ...prev, [name]: error }));
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name as keyof FormErrors];
        return newErrors;
      });
    }
  };

  const togglePermission = (permissionId: number) => {
    setFormData(prev => ({
      ...prev,
      permission_ids: prev.permission_ids.includes(permissionId)
        ? prev.permission_ids.filter(id => id !== permissionId)
        : [...prev.permission_ids, permissionId]
    }));
  };

  const selectAllInCategory = (category: string) => {
    const categoryPermissions = permissionsByCategory[category] || [];
    const categoryPermissionIds = categoryPermissions.map(p => p.id);
    const allSelected = categoryPermissionIds.every(id => formData.permission_ids.includes(id));

    if (allSelected) {
      setFormData(prev => ({
        ...prev,
        permission_ids: prev.permission_ids.filter(id => !categoryPermissionIds.includes(id))
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        permission_ids: [...new Set([...prev.permission_ids, ...categoryPermissionIds])]
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    const groupNameError = validateField('group_name', formData.group_name);
    if (groupNameError) newErrors.group_name = groupNameError;
    
    const priorityError = validateField('priority', formData.priority);
    if (priorityError) newErrors.priority = priorityError;
    
    const descriptionError = validateField('description', formData.description);
    if (descriptionError) newErrors.description = descriptionError;
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPermissions = searchTerm
    ? permissions.filter(p => 
        p.permission_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : permissions;

  const filteredCategories = searchTerm
    ? Object.keys(permissionsByCategory).filter(category => 
        permissionsByCategory[category].some(p => filteredPermissions.includes(p))
      )
    : Object.keys(permissionsByCategory);

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={mode === 'create' ? 'Create New Role' : 'Edit Role'}
      size="lg"
      closeOnBackdrop={!isSubmitting}
      closeOnEscape={!isSubmitting}
    >
      <form onSubmit={handleSubmit} className="role-form-modal">
        <div className="role-form-basic-info">
          <div className="role-form-row">
            <div className="role-form-field">
              <Input
                label="Role Name"
                id="group_name"
                value={formData.group_name}
                onChange={(e) => handleChange('group_name', e.target.value)}
                error={errors.group_name}
                placeholder="e.g., editor, moderator, viewer"
                disabled={mode === 'edit' || isSubmitting}
                required
                autoFocus
              />
              <span className="role-form-hint">Use lowercase with underscores (a-z, _)</span>
            </div>

            <div className="role-form-field">
              <Input
                label="Priority"
                id="priority"
                type="number"
                value={formData.priority.toString()}
                onChange={(e) => handleChange('priority', e.target.value)}
                error={errors.priority}
                placeholder="50"
                min={1}
                max={100}
                disabled={isSubmitting}
                required
              />
              <span className="role-form-hint">Higher number = higher priority (1-100)</span>
            </div>
          </div>

          <div className="role-form-field">
            <Textarea
              label="Description"
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              error={errors.description}
              placeholder="Describe the purpose and responsibilities of this role..."
              rows={3}
              disabled={isSubmitting}
            />
            <span className="role-form-hint">{formData.description.length}/500 characters</span>
          </div>

          <div className="role-form-field">
            <Checkbox
              checked={formData.is_active}
              onChange={(checked) => handleChange('is_active', checked)}
              label={
                <div className="role-form-checkbox-label">
                  <strong>Active Role</strong>
                  <span className="role-form-checkbox-description">
                    Users can be assigned to this role
                  </span>
                </div>
              }
              disabled={isSubmitting}
            />
          </div>
        </div>

        <div className="role-form-permissions-section">
          <div className="role-form-permissions-header">
            <h4 className="role-form-permissions-title">Permissions</h4>
            <span className="role-form-permissions-count">
              {formData.permission_ids.length} selected
            </span>
          </div>

          {permissionsLoading ? (
            <div className="role-form-permissions-loading">
              Loading permissions...
            </div>
          ) : permissions.length === 0 ? (
            <div className="role-form-permissions-empty">
              No permissions available. Create permissions first.
            </div>
          ) : (
            <>
              <div className="role-form-permissions-search">
                <Input
                  placeholder="Search permissions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="role-form-permissions-list">
                {filteredCategories.map(category => {
                  const categoryPerms = permissionsByCategory[category].filter(p => 
                    filteredPermissions.includes(p)
                  );
                  const allCategorySelected = categoryPerms.every(p => 
                    formData.permission_ids.includes(p.id)
                  );
                  const someCategorySelected = categoryPerms.some(p => 
                    formData.permission_ids.includes(p.id)
                  );

                  return (
                    <div key={category} className="role-form-permission-category">
                      <div className="role-form-category-header">
                        <Checkbox
                          checked={allCategorySelected}
                          indeterminate={someCategorySelected && !allCategorySelected}
                          onChange={() => selectAllInCategory(category)}
                          label={
                            <div className="role-form-category-label">
                              <strong>{category.charAt(0).toUpperCase() + category.slice(1)}</strong>
                              <span className="role-form-category-count">
                                {categoryPerms.length} permission{categoryPerms.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                          }
                          disabled={isSubmitting}
                        />
                      </div>
                      
                      <div className="role-form-permission-items">
                        {categoryPerms.map(permission => (
                          <div key={permission.id} className="role-form-permission-item">
                            <Checkbox
                              checked={formData.permission_ids.includes(permission.id)}
                              onChange={() => togglePermission(permission.id)}
                              label={
                                <div className="role-form-permission-info">
                                  <div className="role-form-permission-name">
                                    {permission.permission_name}
                                  </div>
                                  {permission.description && (
                                    <div className="role-form-permission-description">
                                      {permission.description}
                                    </div>
                                  )}
                                </div>
                              }
                              disabled={isSubmitting}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="role-form-actions">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            disabled={isSubmitting || Object.keys(errors).length > 0 || !formData.group_name}
          >
            {mode === 'create' ? 'Create Role' : 'Update Role'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

