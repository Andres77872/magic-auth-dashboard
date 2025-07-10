import React, { useState } from 'react';
import type { Role } from '@/types/rbac.types';

interface RoleFormProps {
  mode: 'create' | 'edit';
  projectHash: string;
  initialData?: Partial<Role>;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export const RoleForm: React.FC<RoleFormProps> = ({
  mode,
  initialData,
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    group_name: initialData?.group_name || '',
    description: initialData?.description || '',
    priority: initialData?.priority || 50,
    is_active: initialData?.is_active !== undefined ? initialData.is_active : true,
    permission_ids: []
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <div className="role-form">
      <h3>{mode === 'create' ? 'Create Role' : 'Edit Role'}</h3>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="group_name">Role Name</label>
          <input
            type="text"
            id="group_name"
            value={formData.group_name}
            onChange={(e) => setFormData(prev => ({ ...prev, group_name: e.target.value }))}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          />
        </div>

        <div className="form-group">
          <label htmlFor="priority">Priority</label>
          <input
            type="number"
            id="priority"
            value={formData.priority}
            onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
            min="1"
            max="100"
            required
          />
          <small className="form-help">Higher numbers = higher priority (1-100)</small>
        </div>

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
            />
            Active Role
          </label>
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