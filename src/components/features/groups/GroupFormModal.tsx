import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import type { GroupFormData, UserGroup } from '@/types/group.types';

interface GroupFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: GroupFormData) => Promise<void>;
  mode: 'create' | 'edit';
  group?: UserGroup | null;
}

export const GroupFormModal: React.FC<GroupFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  mode,
  group
}) => {
  const [formData, setFormData] = useState<GroupFormData>({
    group_name: '',
    description: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens/closes or group changes
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && group) {
        setFormData({
          group_name: group.group_name,
          description: group.description || ''
        });
      } else {
        setFormData({
          group_name: '',
          description: ''
        });
      }
      setErrors({});
    }
  }, [isOpen, mode, group]);

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

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      if (error instanceof Error) {
        setErrors({ 
          general: error.message
        });
      } else {
        setErrors({ 
          general: 'An error occurred while saving the group'
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof GroupFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Create New Group' : 'Edit Group'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.general && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm" role="alert">
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
              disabled={isSubmitting}
              error={errors.group_name}
              helperText={!errors.group_name ? "Choose a descriptive name for your group (3-50 characters)" : undefined}
              autoFocus
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
              rows={4}
              disabled={isSubmitting}
              error={errors.description}
              helperText={!errors.description ? "Optional description to help others understand this group's purpose" : undefined}
            />
          </div>

          <DialogFooter>
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
            >
              {mode === 'create' ? 'Create Group' : 'Update Group'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

