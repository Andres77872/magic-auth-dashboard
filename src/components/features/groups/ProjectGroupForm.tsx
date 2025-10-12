import React, { useState, useEffect } from 'react';
import { Input, Textarea, Button, Badge } from '@/components/common';
import type { CreateProjectGroupRequest, ProjectGroup } from '@/services/project-group.service';

interface ProjectGroupFormProps {
  group?: ProjectGroup;
  onSubmit: (data: CreateProjectGroupRequest) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

interface FormData {
  group_name: string;
  description: string;
  permissions: string[];
}

interface FormErrors {
  group_name?: string;
  description?: string;
  permissions?: string;
}

// Common permission options for project groups
const COMMON_PERMISSIONS = [
  'read:project',
  'write:project',
  'delete:project',
  'manage:members',
  'read:analytics',
  'write:analytics',
  'manage:settings',
  'admin:project'
];

export function ProjectGroupForm({
  group,
  onSubmit,
  onCancel,
  isLoading = false
}: ProjectGroupFormProps): React.JSX.Element {
  const [formData, setFormData] = useState<FormData>({
    group_name: group?.group_name || '',
    description: group?.description || '',
    permissions: group?.permissions || []
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [newPermission, setNewPermission] = useState('');

  useEffect(() => {
    if (group) {
      setFormData({
        group_name: group.group_name,
        description: group.description,
        permissions: group.permissions
      });
    }
  }, [group]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.group_name.trim()) {
      newErrors.group_name = 'Group name is required';
    } else if (formData.group_name.length < 3) {
      newErrors.group_name = 'Group name must be at least 3 characters';
    }

    if (formData.permissions.length === 0) {
      newErrors.permissions = 'At least one permission is required';
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
      await onSubmit({
        group_name: formData.group_name.trim(),
        description: formData.description.trim(),
        permissions: formData.permissions
      });
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleAddPermission = (permission: string) => {
    if (permission && !formData.permissions.includes(permission)) {
      setFormData(prev => ({
        ...prev,
        permissions: [...prev.permissions, permission]
      }));
      setNewPermission('');
    }
  };

  const handleRemovePermission = (permission: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.filter(p => p !== permission)
    }));
  };

  const handleAddCustomPermission = () => {
    if (newPermission.trim() && !formData.permissions.includes(newPermission.trim())) {
      handleAddPermission(newPermission.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="project-group-form">
      <div className="form-section">
        <h3>Basic Information</h3>
        
        <Input
          label="Group Name"
          value={formData.group_name}
          onChange={(e) => setFormData(prev => ({ ...prev, group_name: e.target.value }))}
          error={errors.group_name}
          placeholder="Enter group name"
          required
          disabled={isLoading}
        />

        <Textarea
          label="Description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          error={errors.description}
          placeholder="Describe the purpose of this project group"
          rows={3}
          disabled={isLoading}
        />
      </div>

      <div className="form-section">
        <h3>Permissions</h3>
        
        {errors.permissions && (
          <div className="form-error mb-4">
            {errors.permissions}
          </div>
        )}

        <div className="permission-selection">
          <h4>Common Permissions</h4>
          <div className="permission-grid">
            {COMMON_PERMISSIONS.map(permission => (
              <button
                key={permission}
                type="button"
                className={`permission-option ${formData.permissions.includes(permission) ? 'selected' : ''}`}
                onClick={() => 
                  formData.permissions.includes(permission) 
                    ? handleRemovePermission(permission)
                    : handleAddPermission(permission)
                }
                disabled={isLoading}
              >
                {permission}
              </button>
            ))}
          </div>
        </div>

        <div className="custom-permission">
          <h4>Custom Permission</h4>
          <div className="custom-permission-input">
            <Input
              value={newPermission}
              onChange={(e) => setNewPermission(e.target.value)}
              placeholder="Enter custom permission (e.g., read:custom_resource)"
              disabled={isLoading}
            />
            <Button
              type="button"
              onClick={handleAddCustomPermission}
              disabled={!newPermission.trim() || isLoading}
              size="sm"
            >
              Add
            </Button>
          </div>
        </div>

        <div className="selected-permissions">
          <h4>Selected Permissions ({formData.permissions.length})</h4>
          <div className="permission-badges">
            {formData.permissions.map(permission => (
              <Badge key={permission} variant="secondary" size="sm">
                {permission}
                <button
                  type="button"
                  className="permission-remove-btn"
                  onClick={() => handleRemovePermission(permission)}
                  disabled={isLoading}
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="form-actions">
        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
          disabled={isLoading}
        >
          {group ? 'Update Project Group' : 'Create Project Group'}
        </Button>
        
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
} 