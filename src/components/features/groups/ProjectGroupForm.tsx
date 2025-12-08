import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
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
}

interface FormErrors {
  group_name?: string;
  description?: string;
}

export function ProjectGroupForm({
  group,
  onSubmit,
  onCancel,
  isLoading = false
}: ProjectGroupFormProps): React.JSX.Element {
  const [formData, setFormData] = useState<FormData>({
    group_name: group?.group_name || '',
    description: group?.description || ''
  });

  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (group) {
      setFormData({
        group_name: group.group_name,
        description: group.description || ''
      });
    }
  }, [group]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

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
      await onSubmit({
        group_name: formData.group_name.trim(),
        description: formData.description.trim() || undefined
      });
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="group_name">
            Group Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="group_name"
            value={formData.group_name}
            onChange={(e) => setFormData(prev => ({ ...prev, group_name: e.target.value }))}
            error={errors.group_name}
            placeholder="Enter group name (e.g., mobile_apps, backend_services)"
            helperText={!errors.group_name ? "Choose a descriptive name for organizing related projects (3-50 characters)" : undefined}
            disabled={isLoading}
            fullWidth
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            error={errors.description}
            placeholder="Describe the purpose of this project group (optional)"
            helperText={!errors.description ? "Optional description to help others understand which projects belong in this group" : undefined}
            rows={3}
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          variant="primary"
          loading={isLoading}
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