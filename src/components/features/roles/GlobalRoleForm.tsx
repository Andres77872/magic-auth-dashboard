import React, { useState, useEffect } from 'react';
import { Input, Button, Card, CardHeader, CardTitle, CardContent } from '@/components/common';
import { CheckIcon, CloseIcon } from '@/components/icons';
import type { GlobalRole, CreateGlobalRoleRequest, UpdateGlobalRoleRequest } from '@/types/global-roles.types';
import '../../../styles/components/global-role-form.css';

interface GlobalRoleFormProps {
  mode: 'create' | 'edit';
  initialData?: GlobalRole;
  onSubmit: (data: CreateGlobalRoleRequest | UpdateGlobalRoleRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function GlobalRoleForm({
  mode,
  initialData,
  onSubmit,
  onCancel,
  isLoading = false
}: GlobalRoleFormProps): React.JSX.Element {
  const [formData, setFormData] = useState({
    role_name: initialData?.role_name || '',
    role_display_name: initialData?.role_display_name || '',
    role_description: initialData?.role_description || '',
    role_priority: initialData?.role_priority || 100
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        role_name: initialData.role_name,
        role_display_name: initialData.role_display_name,
        role_description: initialData.role_description || '',
        role_priority: initialData.role_priority
      });
    }
  }, [initialData]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.role_name.trim()) {
      newErrors.role_name = 'Role name is required';
    } else if (!/^[a-z_]+$/.test(formData.role_name)) {
      newErrors.role_name = 'Role name must contain only lowercase letters and underscores';
    }

    if (!formData.role_display_name.trim()) {
      newErrors.role_display_name = 'Display name is required';
    }

    if (formData.role_priority < 0 || formData.role_priority > 1000) {
      newErrors.role_priority = 'Priority must be between 0 and 1000';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      if (mode === 'create') {
        await onSubmit({
          role_name: formData.role_name.trim(),
          role_display_name: formData.role_display_name.trim(),
          role_description: formData.role_description.trim() || undefined,
          role_priority: formData.role_priority
        } as CreateGlobalRoleRequest);
      } else {
        await onSubmit({
          role_display_name: formData.role_display_name.trim(),
          role_description: formData.role_description.trim() || undefined,
          role_priority: formData.role_priority
        } as UpdateGlobalRoleRequest);
      }
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <Card className="global-role-form">
      <CardHeader>
        <CardTitle>
          {mode === 'create' ? 'Create New Global Role' : 'Edit Global Role'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="role-form">
          <div className="form-group">
            <label htmlFor="role_name">
              Role Name (internal identifier)
              <span className="required">*</span>
            </label>
            <Input
              id="role_name"
              type="text"
              value={formData.role_name}
              onChange={(e) => setFormData({ ...formData, role_name: e.target.value })}
              placeholder="e.g., super_admin, content_editor"
              disabled={mode === 'edit' || isLoading}
              error={errors.role_name}
            />
            {errors.role_name && (
              <span className="error-message">{errors.role_name}</span>
            )}
            <span className="help-text">
              Lowercase letters and underscores only. Cannot be changed after creation.
            </span>
          </div>

          <div className="form-group">
            <label htmlFor="role_display_name">
              Display Name
              <span className="required">*</span>
            </label>
            <Input
              id="role_display_name"
              type="text"
              value={formData.role_display_name}
              onChange={(e) => setFormData({ ...formData, role_display_name: e.target.value })}
              placeholder="e.g., Super Administrator, Content Editor"
              disabled={isLoading}
              error={errors.role_display_name}
            />
            {errors.role_display_name && (
              <span className="error-message">{errors.role_display_name}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="role_description">
              Description
            </label>
            <textarea
              id="role_description"
              value={formData.role_description}
              onChange={(e) => setFormData({ ...formData, role_description: e.target.value })}
              placeholder="Describe the purpose and permissions of this role..."
              rows={4}
              disabled={isLoading}
              className="role-description-textarea"
            />
          </div>

          <div className="form-group">
            <label htmlFor="role_priority">
              Priority (0-1000)
              <span className="required">*</span>
            </label>
            <Input
              id="role_priority"
              type="number"
              min="0"
              max="1000"
              value={formData.role_priority}
              onChange={(e) => setFormData({ ...formData, role_priority: parseInt(e.target.value) || 0 })}
              disabled={isLoading}
              error={errors.role_priority}
            />
            {errors.role_priority && (
              <span className="error-message">{errors.role_priority}</span>
            )}
            <span className="help-text">
              Higher priority roles take precedence in permission conflicts (0 = lowest, 1000 = highest)
            </span>
          </div>

          <div className="form-actions">
            <Button
              type="submit"
              disabled={isLoading}
              className="submit-button"
            >
              <CheckIcon size={16} aria-hidden="true" />
              {mode === 'create' ? 'Create Role' : 'Update Role'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              <CloseIcon size={16} aria-hidden="true" />
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default GlobalRoleForm;
