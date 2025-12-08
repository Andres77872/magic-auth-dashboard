import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Check, X } from 'lucide-react';
import type { GlobalRole, CreateGlobalRoleRequest, UpdateGlobalRoleRequest } from '@/types/global-roles.types';

interface RoleFormProps {
  mode: 'create' | 'edit';
  initialData?: GlobalRole;
  onSubmit: (data: CreateGlobalRoleRequest | UpdateGlobalRoleRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function RoleForm({
  mode,
  initialData,
  onSubmit,
  onCancel,
  isLoading = false
}: RoleFormProps): React.JSX.Element {
  const [formData, setFormData] = useState({
    role_name: initialData?.role_name || '',
    role_display_name: initialData?.role_display_name || '',
    role_description: initialData?.role_description || '',
    role_priority: initialData?.role_priority || 100
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        role_name: initialData.role_name,
        role_display_name: initialData.role_display_name,
        role_description: initialData.role_description || '',
        role_priority: initialData.role_priority
      });
    }
  }, [initialData]);

  const validateField = (name: string, value: string | number): string => {
    switch (name) {
      case 'role_name':
        if (!String(value).trim()) {
          return 'Role name is required';
        }
        if (!/^[a-z_]+$/.test(String(value))) {
          return 'Must contain only lowercase letters and underscores';
        }
        if (String(value).length < 3) {
          return 'Must be at least 3 characters';
        }
        if (String(value).length > 50) {
          return 'Must be less than 50 characters';
        }
        return '';

      case 'role_display_name':
        if (!String(value).trim()) {
          return 'Display name is required';
        }
        if (String(value).length < 3) {
          return 'Must be at least 3 characters';
        }
        if (String(value).length > 100) {
          return 'Must be less than 100 characters';
        }
        return '';

      case 'role_priority':
        const priority = Number(value);
        if (isNaN(priority)) {
          return 'Must be a valid number';
        }
        if (priority < 0 || priority > 1000) {
          return 'Must be between 0 and 1000';
        }
        return '';

      case 'role_description':
        if (String(value).length > 500) {
          return 'Must be less than 500 characters';
        }
        return '';

      default:
        return '';
    }
  };

  const handleBlur = (field: string) => {
    setTouched({ ...touched, [field]: true });
    const error = validateField(field, formData[field as keyof typeof formData]);
    setErrors({ ...errors, [field]: error });
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData({ ...formData, [field]: value });

    if (touched[field]) {
      const error = validateField(field, value);
      setErrors({ ...errors, [field]: error });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const newTouched: Record<string, boolean> = {};

    Object.keys(formData).forEach(key => {
      newTouched[key] = true;
      const error = validateField(key, formData[key as keyof typeof formData]);
      if (error) {
        newErrors[key] = error;
      }
    });

    setTouched(newTouched);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      if (mode === 'create') {
        await onSubmit({
          role_name: formData.role_name.trim(),
          role_display_name: formData.role_display_name.trim(),
          role_description: formData.role_description.trim() || undefined,
          role_priority: formData.role_priority
        } as CreateGlobalRoleRequest);
      } else {
        await onSubmit({
          role_display_name: formData.role_display_name.trim(),
          role_description: formData.role_description.trim() || undefined,
          role_priority: formData.role_priority
        } as UpdateGlobalRoleRequest);
      }
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const getPriorityLevel = (priority: number): { level: string; color: 'destructive' | 'warning' | 'info' | 'secondary'; description: string } => {
    if (priority >= 900) return { 
      level: 'Critical', 
      color: 'destructive',
      description: 'Highest authority - overrides all other roles'
    };
    if (priority >= 700) return { 
      level: 'High', 
      color: 'warning',
      description: 'High authority - overrides most roles'
    };
    if (priority >= 400) return { 
      level: 'Medium', 
      color: 'info',
      description: 'Medium authority - standard administrative level'
    };
    return { 
      level: 'Low', 
      color: 'secondary',
      description: 'Low authority - basic access level'
    };
  };

  const priorityInfo = getPriorityLevel(formData.role_priority);

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        {mode === 'create' 
          ? 'Define a new role with specific permissions and priority' 
          : `Editing ${initialData?.role_display_name || 'role'}`}
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="role_name">
            Role Name (Internal Identifier) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="role_name"
            type="text"
            value={formData.role_name}
            onChange={(e) => handleChange('role_name', e.target.value)}
            onBlur={() => handleBlur('role_name')}
            placeholder="e.g., super_admin, content_editor"
            disabled={mode === 'edit' || isLoading}
            error={touched.role_name ? errors.role_name : undefined}
            helperText={!errors.role_name ? "Lowercase letters and underscores only. Cannot be changed after creation." : undefined}
            maxLength={50}
            showCharCount
            fullWidth
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="role_display_name">
            Display Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="role_display_name"
            type="text"
            value={formData.role_display_name}
            onChange={(e) => handleChange('role_display_name', e.target.value)}
            onBlur={() => handleBlur('role_display_name')}
            placeholder="e.g., Super Administrator, Content Editor"
            disabled={isLoading}
            error={touched.role_display_name ? errors.role_display_name : undefined}
            helperText={!errors.role_display_name ? "User-friendly name shown in the interface" : undefined}
            maxLength={100}
            showCharCount
            fullWidth
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="role_description">Description</Label>
          <Textarea
            id="role_description"
            value={formData.role_description}
            onChange={(e) => handleChange('role_description', e.target.value)}
            onBlur={() => handleBlur('role_description')}
            placeholder="Describe the purpose and permissions of this role..."
            rows={4}
            disabled={isLoading}
            error={touched.role_description ? errors.role_description : undefined}
            helperText={!errors.role_description ? "Detailed explanation of role responsibilities" : undefined}
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Label id="priority-label">Priority Level <span className="text-destructive">*</span></Label>
            <Badge variant={priorityInfo.color}>
              {priorityInfo.level}
            </Badge>
          </div>
          <div className="grid grid-cols-[1fr_5rem] items-center gap-4">
            <Slider
              value={formData.role_priority}
              onChange={(value) => handleChange('role_priority', value)}
              min={0}
              max={1000}
              step={10}
              disabled={isLoading}
              aria-labelledby="priority-label"
            />
            <input
              type="number"
              min={0}
              max={1000}
              value={formData.role_priority}
              onChange={(e) => handleChange('role_priority', parseInt(e.target.value) || 0)}
              onBlur={() => handleBlur('role_priority')}
              disabled={isLoading}
              aria-labelledby="priority-label"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0 - Low</span>
              <span>400 - Medium</span>
              <span>700 - High</span>
              <span>900 - Critical</span>
            </div>
            <p className="text-sm text-muted-foreground">{priorityInfo.description}</p>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            disabled={isLoading || Object.values(errors).some(err => err !== '')}
            variant="primary"
            loading={isLoading}
          >
            <Check className="h-4 w-4" aria-hidden="true" />
            {mode === 'create' ? 'Create Role' : 'Update Role'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            <X className="h-4 w-4" aria-hidden="true" />
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

export default RoleForm;
