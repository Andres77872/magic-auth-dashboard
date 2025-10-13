import React from 'react';
import { Button } from '@/components/common';
import { EditIcon, DeleteIcon } from '@/components/icons';
import type { Permission } from '@/types/rbac.types';

interface PermissionTableProps {
  permissions: Permission[];
  projectHash: string;
  loading?: boolean;
  onEdit: (permission: Permission) => void;
  onDelete: (permissionId: number) => void;
}

export const PermissionTable: React.FC<PermissionTableProps> = ({
  permissions,
  loading,
  onEdit,
  onDelete
}) => {
  if (loading) {
    return <div className="permission-table loading">Loading permissions...</div>;
  }

  return (
    <div className="permission-table">
      <table className="data-table">
        <thead>
          <tr>
            <th>Permission Name</th>
            <th>Category</th>
            <th>Description</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {permissions.map((permission) => (
            <tr key={permission.id}>
              <td>{permission.permission_name}</td>
              <td>
                <span className="category-badge">{permission.category}</span>
              </td>
              <td>{permission.description}</td>
              <td>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button 
                    onClick={() => onEdit(permission)} 
                    size="sm"
                    variant="outline"
                    leftIcon={<EditIcon size={14} aria-hidden="true" />}
                    aria-label={`Edit permission ${permission.permission_name}`}
                  >
                    Edit
                  </Button>
                  <Button 
                    onClick={() => onDelete(permission.id)} 
                    size="sm"
                    variant="danger"
                    leftIcon={<DeleteIcon size={14} aria-hidden="true" />}
                    aria-label={`Delete permission ${permission.permission_name}`}
                  >
                    Delete
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}; 