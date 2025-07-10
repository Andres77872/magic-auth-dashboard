import React from 'react';
import type { Role } from '@/types/rbac.types';

interface RoleTableProps {
  roles: Role[];
  projectHash: string;
  loading?: boolean;
  onEdit: (role: Role) => void;
  onDelete: (roleId: number) => void;
}

export const RoleTable: React.FC<RoleTableProps> = ({
  roles,
  loading,
  onEdit,
  onDelete
}) => {
  if (loading) {
    return <div className="role-table loading">Loading roles...</div>;
  }

  return (
    <div className="role-table">
      <table className="data-table">
        <thead>
          <tr>
            <th>Role Name</th>
            <th>Priority</th>
            <th>Description</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {roles.map((role) => (
            <tr key={role.id}>
              <td>
                <strong>{role.group_name}</strong>
              </td>
              <td>
                <span className="priority-badge">{role.priority}</span>
              </td>
              <td>{role.description}</td>
              <td>
                <span className={`status-badge ${role.is_active ? 'active' : 'inactive'}`}>
                  {role.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td>
                <button onClick={() => onEdit(role)} className="btn btn-sm">
                  Edit
                </button>
                <button 
                  onClick={() => onDelete(role.id)} 
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