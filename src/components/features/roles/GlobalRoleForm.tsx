import React, { useState, useEffect } from 'react';
import { Input, Button, Card, CardHeader, CardTitle, CardContent, Badge } from '@/components/common';
import { CheckIcon, CloseIcon, SecurityIcon, InfoIcon } from '@/components/icons';
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
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [charCounts, setCharCounts] = useState({
    role_name: 0,
    role_display_name: 0,
    role_description: 0
  });

  useEffect(() => {
    if (initialData) {
      const data = {
        role_name: initialData.role_name,
        role_display_name: initialData.role_display_name,
        role_description: initialData.role_description || '',
        role_priority: initialData.role_priority
      };
      setFormData(data);
      setCharCounts({
        role_name: data.role_name.length,
        role_display_name: data.role_display_name.length,
        role_description: data.role_description.length
      });
    }
  }, [initialData]);

  const validateField = (name: string, value: string | number): string => {
    switch (name) {
      case 'role_name':
        if (!String(value).trim()) {
          return 'Role name is required';
        }
        if (!/^[a-z_]+$/.test(String(value))) {
          return 'Must contain only lowercase letters and underscores';
        }
        if (String(value).length < 3) {
          return 'Must be at least 3 characters';
        }
        if (String(value).length > 50) {
          return 'Must be less than 50 characters';
        }
        return '';

      case 'role_display_name':
        if (!String(value).trim()) {
          return 'Display name is required';
        }
        if (String(value).length < 3) {
          return 'Must be at least 3 characters';
        }
        if (String(value).length > 100) {
          return 'Must be less than 100 characters';
        }
        return '';

      case 'role_priority':
        const priority = Number(value);
        if (isNaN(priority)) {
          return 'Must be a valid number';
        }
        if (priority < 0 || priority > 1000) {
          return 'Must be between 0 and 1000';
        }
        return '';

      case 'role_description':
        if (String(value).length > 500) {
          return 'Must be less than 500 characters';
        }
        return '';

      default:
        return '';
    }
  };

  const handleBlur = (field: string) => {
    setTouched({ ...touched, [field]: true });
    const error = validateField(field, formData[field as keyof typeof formData]);
    setErrors({ ...errors, [field]: error });
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData({ ...formData, [field]: value });
    
    // Update character count
    if (field !== 'role_priority') {
      setCharCounts({ ...charCounts, [field]: String(value).length });
    }

    // Real-time validation for touched fields
    if (touched[field]) {
      const error = validateField(field, value);
      setErrors({ ...errors, [field]: error });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const newTouched: Record<string, boolean> = {};

    Object.keys(formData).forEach(key => {
      newTouched[key] = true;
      const error = validateField(key, formData[key as keyof typeof formData]);
      if (error) {
        newErrors[key] = error;
      }
    });

    setTouched(newTouched);
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

  const getPriorityLevel = (priority: number): { level: string; color: string; description: string } => {
    if (priority >= 900) return { 
      level: 'Critical', 
      color: 'error',
      description: 'Highest authority - overrides all other roles'
    };
    if (priority >= 700) return { 
      level: 'High', 
      color: 'warning',
      description: 'High authority - overrides most roles'
    };
    if (priority >= 400) return { 
      level: 'Medium', 
      color: 'info',
      description: 'Medium authority - standard administrative level'
    };
    return { 
      level: 'Low', 
      color: 'secondary',
      description: 'Low authority - basic access level'
    };
  };

  const priorityInfo = getPriorityLevel(formData.role_priority);

  return (
    <Card className="global-role-form">
      <CardHeader>
        <div className="form-header">
          <div className="form-header-icon">
            <SecurityIcon size={24} aria-hidden="true" />
          </div>
          <div className="form-header-content">
            <CardTitle>
              {mode === 'create' ? 'Create New Global Role' : 'Edit Global Role'}
            </CardTitle>
            <p className="form-subtitle">
              {mode === 'create' 
                ? 'Define a new role with specific permissions and priority' 
                : `Editing ${initialData?.role_display_name || 'role'}`}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="role-form">
          {/* Role Name */}
          <div className={`form-group ${touched.role_name && errors.role_name ? 'has-error' : touched.role_name ? 'has-success' : ''}`}>
            <label htmlFor="role_name" className="form-label">
              Role Name (Internal Identifier)
              <span className="required">*</span>
            </label>
            <Input
              id="role_name"
              type="text"
              value={formData.role_name}
              onChange={(e) => handleChange('role_name', e.target.value)}
              onBlur={() => handleBlur('role_name')}
              placeholder="e.g., super_admin, content_editor"
              disabled={mode === 'edit' || isLoading}
              error={touched.role_name ? errors.role_name : undefined}
              className="form-input"
            />
            <div className="field-footer">
              {touched.role_name && errors.role_name ? (
                <span className="error-message">
                  <InfoIcon size={12} aria-hidden="true" />
                  {errors.role_name}
                </span>
              ) : (
                <span className="help-text">
                  Lowercase letters and underscores only. Cannot be changed after creation.
                </span>
              )}
              <span className="char-count">{charCounts.role_name}/50</span>
            </div>
          </div>

          {/* Display Name */}
          <div className={`form-group ${touched.role_display_name && errors.role_display_name ? 'has-error' : touched.role_display_name ? 'has-success' : ''}`}>
            <label htmlFor="role_display_name" className="form-label">
              Display Name
              <span className="required">*</span>
            </label>
            <Input
              id="role_display_name"
              type="text"
              value={formData.role_display_name}
              onChange={(e) => handleChange('role_display_name', e.target.value)}
              onBlur={() => handleBlur('role_display_name')}
              placeholder="e.g., Super Administrator, Content Editor"
              disabled={isLoading}
              error={touched.role_display_name ? errors.role_display_name : undefined}
              className="form-input"
            />
            <div className="field-footer">
              {touched.role_display_name && errors.role_display_name ? (
                <span className="error-message">
                  <InfoIcon size={12} aria-hidden="true" />
                  {errors.role_display_name}
                </span>
              ) : (
                <span className="help-text">
                  User-friendly name shown in the interface
                </span>
              )}
              <span className="char-count">{charCounts.role_display_name}/100</span>
            </div>
          </div>

          {/* Description */}
          <div className={`form-group ${touched.role_description && errors.role_description ? 'has-error' : ''}`}>
            <label htmlFor="role_description" className="form-label">
              Description
              <span className="optional-badge">Optional</span>
            </label>
            <textarea
              id="role_description"
              value={formData.role_description}
              onChange={(e) => handleChange('role_description', e.target.value)}
              onBlur={() => handleBlur('role_description')}
              placeholder="Describe the purpose and permissions of this role..."
              rows={4}
              disabled={isLoading}
              className="role-description-textarea"
            />
            <div className="field-footer">
              {touched.role_description && errors.role_description ? (
                <span className="error-message">
                  <InfoIcon size={12} aria-hidden="true" />
                  {errors.role_description}
                </span>
              ) : (
                <span className="help-text">
                  Detailed explanation of role responsibilities
                </span>
              )}
              <span className="char-count">{charCounts.role_description}/500</span>
            </div>
          </div>

          {/* Priority */}
          <div className={`form-group ${touched.role_priority && errors.role_priority ? 'has-error' : ''}`}>
            <label htmlFor="role_priority" className="form-label">
              Priority Level
              <span className="required">*</span>
              <Badge variant={priorityInfo.color as any} className="priority-badge-inline">
                {priorityInfo.level}
              </Badge>
            </label>
            <div className="priority-input-group">
              <Input
                id="role_priority"
                type="range"
                min="0"
                max="1000"
                step="10"
                value={formData.role_priority}
                onChange={(e) => handleChange('role_priority', parseInt(e.target.value) || 0)}
                onBlur={() => handleBlur('role_priority')}
                disabled={isLoading}
                className="priority-slider"
              />
              <Input
                type="number"
                min="0"
                max="1000"
                value={formData.role_priority}
                onChange={(e) => handleChange('role_priority', parseInt(e.target.value) || 0)}
                onBlur={() => handleBlur('role_priority')}
                disabled={isLoading}
                error={touched.role_priority ? errors.role_priority : undefined}
                className="priority-number-input"
              />
            </div>
            <div className="priority-info">
              <div className="priority-scale">
                <span className="scale-marker" data-priority="low">0 - Low</span>
                <span className="scale-marker" data-priority="medium">400 - Medium</span>
                <span className="scale-marker" data-priority="high">700 - High</span>
                <span className="scale-marker" data-priority="critical">900 - Critical</span>
              </div>
              <p className="priority-description">{priorityInfo.description}</p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <Button
              type="submit"
              disabled={isLoading || Object.values(errors).some(err => err !== '')}
              className="submit-button"
              variant="primary"
            >
              {isLoading ? (
                <>
                  <span className="loading-spinner"></span>
                  {mode === 'create' ? 'Creating...' : 'Updating...'}
                </>
              ) : (
                <>
                  <CheckIcon size={16} aria-hidden="true" />
                  {mode === 'create' ? 'Create Role' : 'Update Role'}
                </>
              )}
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
