import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { GroupFormData } from '@/types/group.types';
import { 
  validateRequired, 
  validateLengthRange, 
  validateMaxLength, 
  composeValidators 
} from '@/utils/validators';

interface GroupFormProps {
  mode: 'create' | 'edit';
  initialData?: Partial<GroupFormData>;
  onSubmit: (data: GroupFormData) => Promise<void>;
  isSubmitting?: boolean;
}

/**
 * GroupForm component using consolidated validation utilities
 * Follows Design System guidelines for forms and validation
 */
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

    // Group name validation using shared validators
    const nameValidation = composeValidators(
      () => validateRequired(formData.group_name, 'Group name'),
      () => validateLengthRange(formData.group_name, 3, 50, 'Group name')
    );

    if (!nameValidation.isValid) {
      newErrors.group_name = nameValidation.error!;
    }

    // Description validation
    if (formData.description) {
      const descValidation = validateMaxLength(
        formData.description, 
        255, 
        'Description'
      );
      if (!descValidation.isValid) {
        newErrors.description = descValidation.error!;
      }
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
    <Card>
      <CardHeader>
        <CardTitle>{mode === 'create' ? 'Create New Group' : 'Edit Group'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.general && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              {errors.general}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="group_name">
              Group Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="group_name"
              type="text"
              value={formData.group_name}
              onChange={(e) => handleInputChange('group_name', e.target.value)}
              placeholder="Enter group name"
              error={errors.group_name}
              helperText={!errors.group_name ? "Choose a descriptive name for your group (3-50 characters)" : undefined}
              fullWidth
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter group description (optional)"
              rows={3}
              error={errors.description}
              helperText={!errors.description ? "Optional description to help others understand this group's purpose" : undefined}
            />
          </div>

          <div className="flex gap-3 pt-4">
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
              loading={isSubmitting}
            >
              {mode === 'create' ? 'Create Group' : 'Update Group'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}; 