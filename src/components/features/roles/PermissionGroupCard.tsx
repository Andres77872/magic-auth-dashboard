import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '@/components/common';
import { LockIcon, CheckIcon, ViewIcon, PlusIcon } from '@/components/icons';
import type { GlobalPermissionGroup } from '@/types/global-roles.types';
import '../../../styles/components/permission-group-card.css';

interface PermissionGroupCardProps {
  group: GlobalPermissionGroup;
  onViewPermissions?: (groupHash: string) => void;
  onAssignToRole?: (groupHash: string) => void;
  isAssigned?: boolean;
  permissionCount?: number;
}

export function PermissionGroupCard({
  group,
  onViewPermissions,
  onAssignToRole,
  isAssigned = false,
  permissionCount = 0
}: PermissionGroupCardProps): React.JSX.Element {
  const getCategoryColor = (category: string): string => {
    const categoryLower = category.toLowerCase();
    if (categoryLower.includes('user')) return 'info';
    if (categoryLower.includes('project')) return 'warning';
    if (categoryLower.includes('admin') || categoryLower.includes('system')) return 'error';
    if (categoryLower.includes('group')) return 'success';
    return 'secondary';
  };

  const getCategoryIcon = (category: string): string => {
    const categoryLower = category.toLowerCase();
    if (categoryLower.includes('user')) return '👤';
    if (categoryLower.includes('project')) return '📁';
    if (categoryLower.includes('admin') || categoryLower.includes('system')) return '⚙️';
    if (categoryLower.includes('group')) return '👥';
    return '🔐';
  };

  return (
    <Card className={`permission-group-card ${isAssigned ? 'assigned' : ''}`}>
      <CardHeader>
        <div className="group-card-header">
          <div className="group-icon-container">
            <LockIcon size={20} className="group-icon" aria-hidden="true" />
          </div>
          <div className="group-title-section">
            <div className="group-title-row">
              <CardTitle>{group.group_display_name}</CardTitle>
              {isAssigned && (
                <Badge variant="success" className="assigned-badge">
                  <CheckIcon size={12} aria-hidden="true" />
                  Assigned
                </Badge>
              )}
            </div>
            <p className="group-name-text">{group.group_name}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="group-category-section">
          <Badge 
            variant={getCategoryColor(group.group_category) as any} 
            className="category-badge"
          >
            <span className="category-icon">{getCategoryIcon(group.group_category)}</span>
            {group.group_category}
          </Badge>
        </div>

        {group.group_description && (
          <p className="group-description">{group.group_description}</p>
        )}

        <div className="group-stats-row">
          <div className="stat-box">
            <span className="stat-number">{permissionCount}</span>
            <span className="stat-text">Permissions</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-box">
            <span className="stat-number">
              {new Date(group.created_at).toLocaleDateString('en-US', { 
                month: 'short', 
                year: 'numeric' 
              })}
            </span>
            <span className="stat-text">Created</span>
          </div>
        </div>

        <div className="group-actions">
          {onViewPermissions && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewPermissions(group.group_hash)}
              className="action-button"
            >
              <ViewIcon size={14} aria-hidden="true" />
              View Details
            </Button>
          )}
          
          {onAssignToRole && !isAssigned && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onAssignToRole(group.group_hash)}
              className="action-button"
            >
              <PlusIcon size={14} aria-hidden="true" />
              Assign
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default PermissionGroupCard;
