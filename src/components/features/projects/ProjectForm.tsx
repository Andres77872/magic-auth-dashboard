import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { ProjectFormData, ProjectFormErrors } from '@/types/project.types';
import { 
  validateRequired, 
  validateLengthRange, 
  validateMaxLength, 
  composeValidators 
} from '@/utils/validators';

interface ProjectFormProps {
  initialData?: Partial<ProjectFormData>;
  onSubmit: (data: ProjectFormData) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  mode: 'create' | 'edit';
}

/**
 * ProjectForm component using consolidated validation utilities
 * Follows Design System guidelines for forms and validation
 */
export const ProjectForm: React.FC<ProjectFormProps> = ({
  initialData = {},
  onSubmit,
  onCancel,
  isSubmitting = false,
  mode,
}) => {
  const [formData, setFormData] = useState<ProjectFormData>({
    project_name: initialData.project_name || '',
    project_description: initialData.project_description || '',
  });

  const [errors, setErrors] = useState<ProjectFormErrors>({});

  const validateForm = (): boolean => {
    const newErrors: ProjectFormErrors = {};

    // Project name validation using shared validators
    const nameValidation = composeValidators(
      () => validateRequired(formData.project_name.trim(), 'Project name'),
      () => validateLengthRange(formData.project_name.trim(), 3, 100, 'Project name')
    );

    if (!nameValidation.isValid) {
      newErrors.project_name = nameValidation.error!;
    }

    // Project description validation (optional)
    if (formData.project_description) {
      const descValidation = validateMaxLength(
        formData.project_description, 
        500, 
        'Project description'
      );
      if (!descValidation.isValid) {
        newErrors.project_description = descValidation.error!;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof ProjectFormData) => 
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData(prev => ({
        ...prev,
        [field]: e.target.value,
      }));

      // Clear error when user starts typing
      if (errors[field]) {
        setErrors(prev => ({
          ...prev,
          [field]: undefined,
        }));
      }
    };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit({
        project_name: formData.project_name.trim(),
        project_description: formData.project_description.trim() || '',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">
          {mode === 'create' ? 'Project Information' : 'Edit Project'}
        </h3>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project_name">
              Project Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="project_name"
              type="text"
              value={formData.project_name}
              onChange={handleInputChange('project_name')}
              placeholder="Enter project name"
              disabled={isSubmitting}
              error={errors.project_name}
              fullWidth
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project_description">Project Description</Label>
            <Textarea
              id="project_description"
              value={formData.project_description}
              onChange={handleInputChange('project_description')}
              placeholder="Enter project description (optional)"
              disabled={isSubmitting}
              error={errors.project_description}
              rows={4}
            />
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
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
        >
          {mode === 'create' ? 'Create Project' : 'Update Project'}
        </Button>
      </div>
    </form>
  );
}; 