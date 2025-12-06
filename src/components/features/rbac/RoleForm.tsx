import React, { useState } from 'react';
import { Input, Button, Textarea, Card } from '@/components/common';
import { usePermissions } from '@/hooks/usePermissions';
import type { Role, Permission } from '@/types/rbac.types';

interface RoleFormProps {
  mode: 'create' | 'edit';
  projectHash: string;
  initialData?: Partial<Role>;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

interface FormErrors {
  group_name?: string;
  description?: string;
  priority?: string;
}

export const RoleForm: React.FC<RoleFormProps> = ({
  mode,
  projectHash,
  initialData,
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    group_name: initialData?.group_name || '',
    description: initialData?.description || '',
    priority: initialData?.priority || 50,
    is_active: initialData?.is_active !== undefined ? initialData.is_active : true,
    permission_ids: (initialData?.permissions?.map(p => p.id) || []) as number[]
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');

  const { permissions, loading: permissionsLoading } = usePermissions(projectHash);

  // Group permissions by category
  const permissionsByCategory = permissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
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
        if (value.length > 500) return 'Description must be less than 500 characters';
        return undefined;
      default:
        return undefined;
    }
  };

  const handleChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, formData[name as keyof typeof formData]);
    setErrors(prev => ({ ...prev, [name]: error }));
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
    
    setTouched({
      group_name: true,
      description: true,
      priority: true
    });
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPermissions = searchTerm
    ? permissions.filter(p => 
        p.permission_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : permissions;

  const filteredCategories = searchTerm
    ? Object.keys(permissionsByCategory).filter(category => 
        permissionsByCategory[category].some(p => filteredPermissions.includes(p))
      )
    : Object.keys(permissionsByCategory);

  const isFormValid = Object.keys(errors).length === 0 && formData.group_name;

  return (
    <Card className="role-form-card">
      <div className="form-header">
        <h3 className="form-title">
          {mode === 'create' ? '🎭 Create New Role' : '✏️ Edit Role'}
        </h3>
        <p className="form-description">
          {mode === 'create'
            ? 'Create a role and assign permissions that users in this role will have'
            : 'Update the role details and permissions below'}
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="rbac-form" noValidate>
        <div className="form-grid">
          <Input
            label="Role Name"
            id="group_name"
            name="group_name"
            value={formData.group_name}
            onChange={(e) => handleChange('group_name', e.target.value)}
            onBlur={() => handleBlur('group_name')}
            error={touched.group_name ? errors.group_name : undefined}
            placeholder="e.g., editor, moderator, viewer"
            helperText="Use lowercase with underscores (a-z, _)"
            required
            fullWidth
            disabled={mode === 'edit'}
          />

          <Input
            label="Priority"
            id="priority"
            name="priority"
            type="number"
            value={formData.priority.toString()}
            onChange={(e) => handleChange('priority', e.target.value)}
            onBlur={() => handleBlur('priority')}
            error={touched.priority ? errors.priority : undefined}
            placeholder="50"
            helperText="Higher number = higher priority (1-100)"
            min={1}
            max={100}
            required
            fullWidth
          />
        </div>

        <Textarea
          label="Description"
          id="description"
          name="description"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          onBlur={() => handleBlur('description')}
          error={touched.description ? errors.description : undefined}
          placeholder="Describe the purpose and responsibilities of this role..."
          helperText={`${formData.description.length}/500 characters`}
          rows={3}
          fullWidth
        />

        <div className="form-field">
          <label className="checkbox-container">
            <input
              type="checkbox"
              className="checkbox-input"
              checked={formData.is_active}
              onChange={(e) => handleChange('is_active', e.target.checked)}
            />
            <span className="checkbox-label">
              <strong>Active Role</strong>
              <span className="checkbox-description">Users can be assigned to this role</span>
            </span>
          </label>
        </div>

        <div className="permissions-section">
          <div className="permissions-header">
            <h4 className="permissions-title">Permissions</h4>
            <div className="permissions-stats">
              <span className="badge badge-primary">
                {formData.permission_ids.length} selected
              </span>
            </div>
          </div>

          {permissionsLoading ? (
            <div className="permissions-loading">
              Loading permissions...
            </div>
          ) : permissions.length === 0 ? (
            <div className="permissions-empty">
              <p>No permissions available. Create permissions first.</p>
            </div>
          ) : (
            <>
              <div className="permissions-search">
                <Input
                  placeholder="Search permissions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  fullWidth
                />
              </div>

              <div className="permissions-list">
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
                    <div key={category} className="permission-category">
                      <div className="permission-category-header">
                        <label className="checkbox-container">
                          <input
                            type="checkbox"
                            className="checkbox-input"
                            checked={allCategorySelected}
                            ref={input => {
                              if (input) {
                                input.indeterminate = someCategorySelected && !allCategorySelected;
                              }
                            }}
                            onChange={() => selectAllInCategory(category)}
                          />
                          <span className="checkbox-label">
                            <strong>{category.charAt(0).toUpperCase() + category.slice(1)}</strong>
                            <span className="permission-count">
                              {categoryPerms.length} permission{categoryPerms.length !== 1 ? 's' : ''}
                            </span>
                          </span>
                        </label>
                      </div>
                      
                      <div className="permission-items">
                        {categoryPerms.map(permission => (
                          <label key={permission.id} className="permission-item">
                            <input
                              type="checkbox"
                              className="checkbox-input"
                              checked={formData.permission_ids.includes(permission.id)}
                              onChange={() => togglePermission(permission.id)}
                            />
                            <div className="permission-info">
                              <div className="permission-name">{permission.permission_name}</div>
                              {permission.description && (
                                <div className="permission-description">
                                  {permission.description}
                                </div>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="form-actions">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            disabled={!isFormValid || isSubmitting}
          >
            {mode === 'create' ? 'Create Role' : 'Update Role'}
          </Button>
        </div>
      </form>
    </Card>
  );
}; 