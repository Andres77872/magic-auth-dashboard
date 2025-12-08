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
import type { GlobalPermissionGroup } from '@/types/global-roles.types';

interface PermissionGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    group_name: string;
    group_display_name: string;
    group_description?: string;
    group_category?: string;
  }) => Promise<void>;
  permissionGroup?: GlobalPermissionGroup | null;
  mode: 'create' | 'edit';
  categories?: string[];
}

export const PermissionGroupModal: React.FC<PermissionGroupModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  permissionGroup,
  mode,
  categories = []
}) => {
  const [formData, setFormData] = useState({
    group_name: '',
    group_display_name: '',
    group_description: '',
    group_category: 'general'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && permissionGroup) {
        setFormData({
          group_name: permissionGroup.group_name,
          group_display_name: permissionGroup.group_display_name,
          group_description: permissionGroup.group_description || '',
          group_category: permissionGroup.group_category || 'general'
        });
      } else {
        setFormData({
          group_name: '',
          group_display_name: '',
          group_description: '',
          group_category: 'general'
        });
      }
      setErrors({});
    }
  }, [isOpen, mode, permissionGroup]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.group_name.trim()) {
      newErrors.group_name = 'Group name is required';
    } else if (!/^[a-z0-9_]+$/.test(formData.group_name)) {
      newErrors.group_name = 'Group name must contain only lowercase letters, numbers, and underscores';
    }

    if (!formData.group_display_name.trim()) {
      newErrors.group_display_name = 'Display name is required';
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
        group_name: formData.group_name,
        group_display_name: formData.group_display_name,
        group_description: formData.group_description || undefined,
        group_category: formData.group_category || undefined
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
          <DialogTitle>{mode === 'create' ? 'Create Permission Group' : 'Edit Permission Group'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="group_name">
              Group Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="group_name"
              type="text"
              value={formData.group_name}
              onChange={(e) => setFormData({ ...formData, group_name: e.target.value })}
              placeholder="e.g., content_management"
              error={errors.group_name}
              disabled={mode === 'edit' || isSubmitting}
              fullWidth
            />
            <p className="text-xs text-muted-foreground">
              Use lowercase letters, numbers, and underscores only
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="group_display_name">
              Display Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="group_display_name"
              type="text"
              value={formData.group_display_name}
              onChange={(e) => setFormData({ ...formData, group_display_name: e.target.value })}
              placeholder="e.g., Content Management"
              error={errors.group_display_name}
              disabled={isSubmitting}
              fullWidth
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="group_description">Description</Label>
            <Textarea
              id="group_description"
              value={formData.group_description}
              onChange={(e) => setFormData({ ...formData, group_description: e.target.value })}
              placeholder="Describe what this permission group is for"
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={formData.group_category}
              onValueChange={(value) => setFormData({ ...formData, group_category: value })}
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
              {mode === 'create' ? 'Create Permission Group' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PermissionGroupModal;

