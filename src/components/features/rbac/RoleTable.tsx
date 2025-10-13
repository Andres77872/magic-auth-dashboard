import React from 'react';
import { Button } from '@/components/common';
import { EditIcon, DeleteIcon } from '@/components/icons';
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
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button 
                    onClick={() => onEdit(role)} 
                    size="sm"
                    variant="outline"
                    leftIcon={<EditIcon size={14} aria-hidden="true" />}
                    aria-label={`Edit role ${role.group_name}`}
                  >
                    Edit
                  </Button>
                  <Button 
                    onClick={() => onDelete(role.id)} 
                    size="sm"
                    variant="danger"
                    leftIcon={<DeleteIcon size={14} aria-hidden="true" />}
                    aria-label={`Delete role ${role.group_name}`}
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