import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, Textarea, Select } from '@/components/common';
import type { GlobalPermission } from '@/types/global-roles.types';

interface PermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    permission_name: string;
    permission_display_name: string;
    permission_description?: string;
    permission_category?: string;
  }) => Promise<void>;
  permission?: GlobalPermission | null;
  mode: 'create' | 'edit';
  categories?: string[];
}

export const PermissionModal: React.FC<PermissionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  permission,
  mode,
  categories = []
}) => {
  const [formData, setFormData] = useState({
    permission_name: '',
    permission_display_name: '',
    permission_description: '',
    permission_category: 'general'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && permission) {
        setFormData({
          permission_name: permission.permission_name,
          permission_display_name: permission.permission_display_name,
          permission_description: permission.permission_description || '',
          permission_category: permission.permission_category || 'general'
        });
      } else {
        setFormData({
          permission_name: '',
          permission_display_name: '',
          permission_description: '',
          permission_category: 'general'
        });
      }
      setErrors({});
    }
  }, [isOpen, mode, permission]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.permission_name.trim()) {
      newErrors.permission_name = 'Permission name is required';
    } else if (!/^[a-z0-9_]+$/.test(formData.permission_name)) {
      newErrors.permission_name = 'Permission name must contain only lowercase letters, numbers, and underscores';
    }

    if (!formData.permission_display_name.trim()) {
      newErrors.permission_display_name = 'Display name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        permission_name: formData.permission_name,
        permission_display_name: formData.permission_display_name,
        permission_description: formData.permission_description || undefined,
        permission_category: formData.permission_category || undefined
      });
      onClose();
    } catch (error) {
      // Error handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoryOptions = [
    { value: 'general', label: 'General' },
    { value: 'admin', label: 'Admin' },
    { value: 'api', label: 'API' },
    { value: 'data', label: 'Data' },
    ...categories
      .filter(cat => !['general', 'admin', 'api', 'data'].includes(cat))
      .map(cat => ({ value: cat, label: cat.charAt(0).toUpperCase() + cat.slice(1) }))
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'create' ? 'Create Permission' : 'Edit Permission'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="permission-modal-form">
        <div className="form-group">
          <label htmlFor="permission_name">
            Permission Name <span className="required">*</span>
          </label>
          <Input
            id="permission_name"
            type="text"
            value={formData.permission_name}
            onChange={(e) => setFormData({ ...formData, permission_name: e.target.value })}
            placeholder="e.g., view_analytics"
            error={errors.permission_name}
            disabled={mode === 'edit' || isSubmitting}
          />
          <small className="form-help">
            Use lowercase letters, numbers, and underscores only
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="permission_display_name">
            Display Name <span className="required">*</span>
          </label>
          <Input
            id="permission_display_name"
            type="text"
            value={formData.permission_display_name}
            onChange={(e) => setFormData({ ...formData, permission_display_name: e.target.value })}
            placeholder="e.g., View Analytics"
            error={errors.permission_display_name}
            disabled={isSubmitting}
          />
        </div>

        <div className="form-group">
          <label htmlFor="permission_description">Description</label>
          <Textarea
            id="permission_description"
            value={formData.permission_description}
            onChange={(e) => setFormData({ ...formData, permission_description: e.target.value })}
            placeholder="Describe what this permission allows"
            rows={3}
            disabled={isSubmitting}
          />
        </div>

        <div className="form-group">
          <label>Category</label>
          <Select
            value={formData.permission_category}
            onChange={(value) => setFormData({ ...formData, permission_category: value })}
            options={categoryOptions}
            disabled={isSubmitting}
          />
        </div>

        <div className="modal-actions">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
          >
            {mode === 'create' ? 'Create Permission' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default PermissionModal;

