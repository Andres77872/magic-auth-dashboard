import React, { useState } from 'react';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Textarea } from '@/components/common/Textarea';
import { Select } from '@/components/common/Select';
import { Card } from '@/components/common/Card';
import type { Permission } from '@/types/rbac.types';

interface PermissionFormProps {
  mode: 'create' | 'edit';
  projectHash: string;
  initialData?: Partial<Permission>;
  categories: string[];
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

interface FormErrors {
  permission_name?: string;
  category?: string;
  description?: string;
}

export const PermissionForm: React.FC<PermissionFormProps> = ({
  mode,
  initialData,
  categories,
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    permission_name: initialData?.permission_name || '',
    category: initialData?.category || '',
    description: initialData?.description || ''
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case 'permission_name':
        if (!value.trim()) return 'Permission name is required';
        if (value.length < 3) return 'Permission name must be at least 3 characters';
        if (!/^[a-z_]+$/.test(value)) return 'Use lowercase letters and underscores only';
        return undefined;
      case 'category':
        if (!value.trim()) return 'Category is required';
        return undefined;
      case 'description':
        if (value.length > 500) return 'Description must be less than 500 characters';
        return undefined;
      default:
        return undefined;
    }
  };

  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Validate on change if field was touched
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const handleBlur = (name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, formData[name as keyof typeof formData]);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key as keyof typeof formData]);
      if (error) newErrors[key as keyof FormErrors] = error;
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched
    setTouched({
      permission_name: true,
      category: true,
      description: true
    });
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = Object.keys(errors).length === 0 && 
                      formData.permission_name && 
                      formData.category;

  return (
    <Card className="permission-form-card">
      <div className="form-header">
        <h3 className="form-title">
          {mode === 'create' ? '✨ Create New Permission' : '✏️ Edit Permission'}
        </h3>
        <p className="form-description">
          {mode === 'create' 
            ? 'Define a new permission that can be assigned to roles'
            : 'Update the permission details below'}
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="rbac-form" noValidate>
        <div className="form-grid">
          <Input
            label="Permission Name"
            id="permission_name"
            name="permission_name"
            value={formData.permission_name}
            onChange={(e) => handleChange('permission_name', e.target.value)}
            onBlur={() => handleBlur('permission_name')}
            error={touched.permission_name ? errors.permission_name : undefined}
            placeholder="e.g., view_reports, edit_users"
            helperText="Use lowercase with underscores (a-z, _)"
            required
            fullWidth
            disabled={mode === 'edit'}
          />

          <Select
            label="Category"
            value={formData.category}
            onChange={(value) => handleChange('category', value)}
            error={touched.category ? errors.category : undefined}
            placeholder="Select a category..."
            fullWidth
            searchable
            options={[
              ...categories.map(category => ({
                value: category,
                label: category.charAt(0).toUpperCase() + category.slice(1)
              })),
              { value: 'admin', label: 'Admin' },
              { value: 'general', label: 'General' },
              { value: 'data', label: 'Data' },
              { value: 'api', label: 'API' }
            ].filter((option, index, self) => 
              index === self.findIndex((o) => o.value === option.value)
            )}
          />
        </div>

        <Textarea
          label="Description"
          id="description"
          name="description"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          onBlur={() => handleBlur('description')}
          error={touched.description ? errors.description : undefined}
          placeholder="Describe what this permission allows users to do..."
          helperText={`${formData.description.length}/500 characters`}
          rows={4}
          fullWidth
        />

        <div className="form-actions">
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
            isLoading={isSubmitting}
            disabled={!isFormValid || isSubmitting}
          >
            {mode === 'create' ? 'Create Permission' : 'Update Permission'}
          </Button>
        </div>
      </form>
    </Card>
  );
}; 