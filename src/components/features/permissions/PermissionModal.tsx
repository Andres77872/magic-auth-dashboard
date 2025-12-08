import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Create Permission' : 'Edit Permission'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="permission_name">
              Permission Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="permission_name"
              type="text"
              value={formData.permission_name}
              onChange={(e) => setFormData({ ...formData, permission_name: e.target.value })}
              placeholder="e.g., view_analytics"
              error={errors.permission_name}
              disabled={mode === 'edit' || isSubmitting}
              fullWidth
            />
            <p className="text-xs text-muted-foreground">
              Use lowercase letters, numbers, and underscores only
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="permission_display_name">
              Display Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="permission_display_name"
              type="text"
              value={formData.permission_display_name}
              onChange={(e) => setFormData({ ...formData, permission_display_name: e.target.value })}
              placeholder="e.g., View Analytics"
              error={errors.permission_display_name}
              disabled={isSubmitting}
              fullWidth
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="permission_description">Description</Label>
            <Textarea
              id="permission_description"
              value={formData.permission_description}
              onChange={(e) => setFormData({ ...formData, permission_description: e.target.value })}
              placeholder="Describe what this permission allows"
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={formData.permission_category}
              onValueChange={(value) => setFormData({ ...formData, permission_category: value })}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
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
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PermissionModal;

