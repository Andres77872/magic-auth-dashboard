import React, { useState } from 'react';
import { Input, Textarea, Button, Card } from '@/components/common';
import type { GroupFormData } from '@/types/group.types';

interface GroupFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<GroupFormData>;
  onSubmit: (data: GroupFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export const GroupForm: React.FC<GroupFormProps> = ({
  mode,
  initialData = {},
  onSubmit,
  isSubmitting = false
}) => {
  const [formData, setFormData] = useState<GroupFormData>({
    group_name: initialData.group_name || '',
    description: initialData.description || ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.group_name.trim()) {
      newErrors.group_name = 'Group name is required';
    } else if (formData.group_name.length < 3) {
      newErrors.group_name = 'Group name must be at least 3 characters';
    } else if (formData.group_name.length > 50) {
      newErrors.group_name = 'Group name must be less than 50 characters';
    }

    if (formData.description && formData.description.length > 255) {
      newErrors.description = 'Description must be less than 255 characters';
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
      await onSubmit(formData);
    } catch (error) {
      // Handle API errors
      if (error instanceof Error) {
        setErrors({ 
          general: error.message
        });
      } else {
        setErrors({ 
          general: 'An error occurred while saving the group'
        });
      }
    }
  };

  const handleInputChange = (field: keyof GroupFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Card 
      className="group-form-card"
      title={mode === 'create' ? 'Create New Group' : 'Edit Group'}
    >
      <form onSubmit={handleSubmit} className="group-form">
        {errors.general && (
          <div 
            className="error-banner" 
            style={{ 
              padding: '0.75rem',
              marginBottom: '1rem',
              backgroundColor: 'var(--color-danger-light)',
              border: '1px solid var(--color-danger)',
              borderRadius: '4px',
              color: 'var(--color-danger-dark)'
            }}
          >
            {errors.general}
          </div>
        )}

        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
          <label 
            htmlFor="group_name"
            style={{ 
              display: 'block',
              marginBottom: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            Group Name <span style={{ color: 'var(--color-danger)' }}>*</span>
          </label>
          <Input
            id="group_name"
            type="text"
            value={formData.group_name}
            onChange={(e) => handleInputChange('group_name', e.target.value)}
            placeholder="Enter group name"
            error={errors.group_name}
            required
          />
          <div 
            className="field-hint"
            style={{ 
              fontSize: '0.75rem',
              color: 'var(--color-text-secondary)',
              marginTop: '0.25rem'
            }}
          >
            Choose a descriptive name for your group (3-50 characters)
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: '2rem' }}>
          <label 
            htmlFor="description"
            style={{ 
              display: 'block',
              marginBottom: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            Description
          </label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Enter group description (optional)"
            rows={3}
            error={errors.description}
          />
          <div 
            className="field-hint"
            style={{ 
              fontSize: '0.75rem',
              color: 'var(--color-text-secondary)',
              marginTop: '0.25rem'
            }}
          >
            Optional description to help others understand this group's purpose
          </div>
        </div>

        <div className="form-actions" style={{ 
          display: 'flex', 
          gap: '1rem', 
          justifyContent: 'flex-end' 
        }}>
          <Button
            type="button"
            variant="outline"
            onClick={() => window.history.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : (mode === 'create' ? 'Create Group' : 'Update Group')}
          </Button>
        </div>
      </form>
    </Card>
  );
}; 