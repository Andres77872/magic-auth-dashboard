import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '@/components/common';
import { EditIcon, DeleteIcon, SecurityIcon, UserIcon } from '@/components/icons';
import type { GlobalRole } from '@/types/global-roles.types';
import '../../../styles/components/global-role-card.css';

interface GlobalRoleCardProps {
  role: GlobalRole;
  onEdit?: (role: GlobalRole) => void;
  onDelete?: (roleHash: string) => void;
  onViewPermissions?: (roleHash: string) => void;
  onAssignUsers?: (roleHash: string) => void;
  userCount?: number;
}

export function GlobalRoleCard({
  role,
  onEdit,
  onDelete,
  onViewPermissions,
  onAssignUsers,
  userCount = 0
}: GlobalRoleCardProps): React.JSX.Element {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const handleDelete = () => {
    if (onDelete) {
      onDelete(role.role_hash);
      setShowConfirmDelete(false);
    }
  };

  return (
    <Card className="global-role-card">
      <CardHeader>
        <div className="role-card-header">
          <div className="role-header-left">
            <SecurityIcon size={20} className="role-icon" aria-hidden="true" />
            <div>
              <CardTitle>{role.role_display_name}</CardTitle>
              <p className="role-name-text">{role.role_name}</p>
            </div>
          </div>
          <div className="role-header-right">
            {role.is_system_role && (
              <Badge variant="secondary">System</Badge>
            )}
            <Badge variant="secondary">Priority: {role.role_priority}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {role.role_description && (
          <p className="role-description">{role.role_description}</p>
        )}
        
        <div className="role-meta">
          <div className="meta-item">
            <UserIcon size={16} aria-hidden="true" />
            <span>{userCount} users assigned</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Created:</span>
            <span>{new Date(role.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="role-actions">
          {onViewPermissions && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewPermissions(role.role_hash)}
            >
              View Permissions
            </Button>
          )}
          
          {onAssignUsers && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAssignUsers(role.role_hash)}
            >
              <UserIcon size={16} aria-hidden="true" />
              Assign Users
            </Button>
          )}
          
          {onEdit && !role.is_system_role && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(role)}
            >
              <EditIcon size={16} aria-hidden="true" />
              Edit
            </Button>
          )}
          
          {onDelete && !role.is_system_role && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowConfirmDelete(true)}
              disabled={userCount > 0}
              title={userCount > 0 ? 'Cannot delete role with assigned users' : 'Delete role'}
            >
              <DeleteIcon size={16} aria-hidden="true" />
              Delete
            </Button>
          )}
        </div>

        {showConfirmDelete && (
          <div className="confirm-delete-overlay">
            <div className="confirm-delete-dialog">
              <h4>Confirm Deletion</h4>
              <p>Are you sure you want to delete the role "{role.role_display_name}"?</p>
              <p className="warning-text">This action cannot be undone.</p>
              <div className="confirm-actions">
                <Button variant="danger" onClick={handleDelete}>
                  Delete
                </Button>
                <Button variant="outline" onClick={() => setShowConfirmDelete(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default GlobalRoleCard;
