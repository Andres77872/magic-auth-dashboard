import React, { useState } from 'react';
import type { Permission } from '@/types/rbac.types';

interface PermissionFormProps {
  mode: 'create' | 'edit';
  projectHash: string;
  initialData?: Partial<Permission>;
  categories: string[];
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export const PermissionForm: React.FC<PermissionFormProps> = ({
  mode,
  projectHash,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <div className="permission-form">
      <h3>{mode === 'create' ? 'Create Permission' : 'Edit Permission'}</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="permission_name">Permission Name</label>
          <input
            type="text"
            id="permission_name"
            value={formData.permission_name}
            onChange={(e) => setFormData(prev => ({ ...prev, permission_name: e.target.value }))}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
            required
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            {mode === 'create' ? 'Create' : 'Update'}
          </button>
          <button type="button" onClick={onCancel} className="btn btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}; 