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
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import type { GlobalRole } from '@/types/global-roles.types';

interface RoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    role_name: string;
    role_display_name: string;
    role_description?: string;
    role_priority?: number;
  }) => Promise<void>;
  role?: GlobalRole | null;
  mode: 'create' | 'edit';
}

export const RoleModal: React.FC<RoleModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  role,
  mode
}) => {
  const [formData, setFormData] = useState({
    role_name: '',
    role_display_name: '',
    role_description: '',
    role_priority: 100
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && role) {
        setFormData({
          role_name: role.role_name,
          role_display_name: role.role_display_name,
          role_description: role.role_description || '',
          role_priority: role.role_priority || 100
        });
      } else {
        setFormData({
          role_name: '',
          role_display_name: '',
          role_description: '',
          role_priority: 100
        });
      }
      setErrors({});
    }
  }, [isOpen, mode, role]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.role_name.trim()) {
      newErrors.role_name = 'Role name is required';
    } else if (!/^[a-z_]+$/.test(formData.role_name)) {
      newErrors.role_name = 'Must contain only lowercase letters and underscores';
    } else if (formData.role_name.length < 3) {
      newErrors.role_name = 'Must be at least 3 characters';
    }

    if (!formData.role_display_name.trim()) {
      newErrors.role_display_name = 'Display name is required';
    } else if (formData.role_display_name.length < 3) {
      newErrors.role_display_name = 'Must be at least 3 characters';
    }

    if (formData.role_priority < 0 || formData.role_priority > 1000) {
      newErrors.role_priority = 'Priority must be between 0 and 1000';
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
        role_name: formData.role_name,
        role_display_name: formData.role_display_name,
        role_description: formData.role_description || undefined,
        role_priority: formData.role_priority
      });
      onClose();
    } catch (error) {
      // Error handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityLevel = (priority: number): { level: string; variant: 'destructive' | 'warning' | 'info' | 'secondary' } => {
    if (priority >= 900) return { level: 'Critical', variant: 'destructive' };
    if (priority >= 700) return { level: 'High', variant: 'warning' };
    if (priority >= 400) return { level: 'Medium', variant: 'info' };
    return { level: 'Low', variant: 'secondary' };
  };

  const priorityInfo = getPriorityLevel(formData.role_priority);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Create Role' : 'Edit Role'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="role_name">
              Role Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="role_name"
              type="text"
              value={formData.role_name}
              onChange={(e) => setFormData({ ...formData, role_name: e.target.value })}
              placeholder="e.g., super_admin"
              error={errors.role_name}
              disabled={mode === 'edit' || isSubmitting}
              fullWidth
            />
            <p className="text-xs text-muted-foreground">
              Lowercase letters and underscores only
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role_display_name">
              Display Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="role_display_name"
              type="text"
              value={formData.role_display_name}
              onChange={(e) => setFormData({ ...formData, role_display_name: e.target.value })}
              placeholder="e.g., Super Administrator"
              error={errors.role_display_name}
              disabled={isSubmitting}
              fullWidth
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role_description">Description</Label>
            <Textarea
              id="role_description"
              value={formData.role_description}
              onChange={(e) => setFormData({ ...formData, role_description: e.target.value })}
              placeholder="Describe the purpose of this role"
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label id="priority-label">Priority</Label>
              <Badge variant={priorityInfo.variant}>{priorityInfo.level}: {formData.role_priority}</Badge>
            </div>
            <div className="grid grid-cols-[1fr_5rem] items-center gap-4">
              <Slider
                value={formData.role_priority}
                onChange={(value) => setFormData({ ...formData, role_priority: value })}
                min={0}
                max={1000}
                step={10}
                disabled={isSubmitting}
                aria-labelledby="priority-label"
              />
              <input
                type="number"
                min={0}
                max={1000}
                value={formData.role_priority}
                onChange={(e) => setFormData({ ...formData, role_priority: parseInt(e.target.value) || 0 })}
                disabled={isSubmitting}
                aria-labelledby="priority-label"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Higher priority roles take precedence in permission conflicts
            </p>
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
              {mode === 'create' ? 'Create Role' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RoleModal;
