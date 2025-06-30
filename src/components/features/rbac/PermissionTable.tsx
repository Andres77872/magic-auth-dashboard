import React from 'react';
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
  projectHash,
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
                <button onClick={() => onEdit(permission)} className="btn btn-sm">
                  Edit
                </button>
                <button 
                  onClick={() => onDelete(permission.id)} 
                  className="btn btn-sm btn-danger"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}; 