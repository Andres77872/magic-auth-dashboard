import React, { useState, useEffect } from 'react';
import { Modal, Input, Textarea, Button } from '@/components/common';
import type { GroupFormData, UserGroup } from '@/types/group.types';
import '../../../styles/components/group-form-modal.css';

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
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={mode === 'create' ? 'Create New Group' : 'Edit Group'}
      size="md"
      closeOnBackdropClick={!isSubmitting}
      closeOnEscape={!isSubmitting}
    >
      <form onSubmit={handleSubmit} className="group-form-modal">
        {errors.general && (
          <div className="group-form-error-banner">
            {errors.general}
          </div>
        )}

        <div className="group-form-field">
          <label 
            htmlFor="group_name"
            className="group-form-label"
          >
            Group Name <span className="group-form-required">*</span>
          </label>
          <Input
            id="group_name"
            type="text"
            value={formData.group_name}
            onChange={(e) => handleInputChange('group_name', e.target.value)}
            placeholder="Enter group name"
            error={errors.group_name}
            disabled={isSubmitting}
            required
            autoFocus
          />
          {!errors.group_name && (
            <div className="group-form-hint">
              Choose a descriptive name for your group (3-50 characters)
            </div>
          )}
        </div>

        <div className="group-form-field">
          <label 
            htmlFor="description"
            className="group-form-label"
          >
            Description
          </label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Enter group description (optional)"
            rows={4}
            error={errors.description}
            disabled={isSubmitting}
          />
          {!errors.description && (
            <div className="group-form-hint">
              Optional description to help others understand this group's purpose
            </div>
          )}
        </div>

        <div className="group-form-actions">
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
            disabled={isSubmitting}
          >
            {mode === 'create' ? 'Create Group' : 'Update Group'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

