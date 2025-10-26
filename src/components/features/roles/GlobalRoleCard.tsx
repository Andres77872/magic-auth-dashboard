import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '@/components/common';
import { EditIcon, DeleteIcon, SecurityIcon, UserIcon, LockIcon } from '@/components/icons';
import type { GlobalRole } from '@/types/global-roles.types';
import '../../../styles/components/global-role-card.css';

interface GlobalRoleCardProps {
  role: GlobalRole;
  onEdit?: (role: GlobalRole) => void;
  onDelete?: (roleHash: string) => void;
  onViewPermissions?: (roleHash: string) => void;
  onAssignUsers?: (roleHash: string) => void;
  userCount?: number;
  permissionGroupCount?: number;
}

export function GlobalRoleCard({
  role,
  onEdit,
  onDelete,
  onViewPermissions,
  onAssignUsers,
  userCount = 0,
  permissionGroupCount = 0
}: GlobalRoleCardProps): React.JSX.Element {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const handleDelete = () => {
    if (onDelete) {
      onDelete(role.role_hash);
      setShowConfirmDelete(false);
    }
  };

  const getPriorityLevel = (priority: number): { level: string; color: string } => {
    if (priority >= 900) return { level: 'Critical', color: 'error' };
    if (priority >= 700) return { level: 'High', color: 'warning' };
    if (priority >= 400) return { level: 'Medium', color: 'info' };
    return { level: 'Low', color: 'secondary' };
  };

  const priorityInfo = getPriorityLevel(role.role_priority);

  return (
    <Card className="global-role-card">
      <CardHeader>
        <div className="role-card-header">
          <div className="role-header-left">
            <div className="role-icon-container">
              <SecurityIcon size="lg" className="role-icon" aria-hidden="true" />
            </div>
            <div className="role-title-section">
              <div className="role-title-row">
                <CardTitle>{role.role_display_name}</CardTitle>
                {role.is_system_role && (
                  <Badge variant="info">
                    <LockIcon size="xs" aria-hidden="true" />
                    System
                  </Badge>
                )}
              </div>
              <p className="role-name-text">{role.role_name}</p>
            </div>
          </div>
          <div className="role-priority-badge">
            <Badge variant={priorityInfo.color as any}>
              {priorityInfo.level} • {role.role_priority}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {role.role_description && (
          <p className="role-description">{role.role_description}</p>
        )}
        
        <div className="role-stats">
          <div className="stat-item">
            <div className="stat-icon">
              <UserIcon size={18} aria-hidden="true" />
            </div>
            <div className="stat-content">
              <span className="stat-value">{userCount}</span>
              <span className="stat-label">Assigned Users</span>
            </div>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <div className="stat-icon">
              <LockIcon size={18} aria-hidden="true" />
            </div>
            <div className="stat-content">
              <span className="stat-value">{permissionGroupCount}</span>
              <span className="stat-label">Permission Groups</span>
            </div>
          </div>
        </div>

        <div className="role-meta-footer">
          <span className="meta-date">
            Created {new Date(role.created_at).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            })}
          </span>
        </div>

        <div className="role-actions">
          <div className="primary-actions">
            {onViewPermissions && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onViewPermissions(role.role_hash)}
                className="action-button-primary"
              >
                <LockIcon size={14} aria-hidden="true" />
                Permissions
              </Button>
            )}
            
            {onAssignUsers && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAssignUsers(role.role_hash)}
                className="action-button-secondary"
              >
                <UserIcon size={14} aria-hidden="true" />
                Assign Users
              </Button>
            )}
          </div>
          
          <div className="secondary-actions">
            {onEdit && !role.is_system_role && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(role)}
                className="action-button-icon"
                title="Edit role"
              >
                <EditIcon size={14} aria-hidden="true" />
              </Button>
            )}
            
            {onDelete && !role.is_system_role && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConfirmDelete(true)}
                disabled={userCount > 0}
                title={userCount > 0 ? 'Cannot delete role with assigned users' : 'Delete role'}
                className="action-button-icon action-button-danger"
              >
                <DeleteIcon size={14} aria-hidden="true" />
              </Button>
            )}
          </div>
        </div>

        {showConfirmDelete && (
          <div className="confirm-delete-overlay" onClick={() => setShowConfirmDelete(false)}>
            <div className="confirm-delete-dialog" onClick={(e) => e.stopPropagation()}>
              <div className="dialog-icon">
                <DeleteIcon size={24} aria-hidden="true" />
              </div>
              <h4>Delete Role</h4>
              <p>Are you sure you want to permanently delete <strong>"{role.role_display_name}"</strong>?</p>
              <p className="warning-text">⚠️ This action cannot be undone.</p>
              <div className="confirm-actions">
                <Button 
                  variant="danger" 
                  onClick={handleDelete}
                  className="delete-confirm-btn"
                >
                  <DeleteIcon size={16} aria-hidden="true" />
                  Delete Role
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowConfirmDelete(false)}
                >
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
