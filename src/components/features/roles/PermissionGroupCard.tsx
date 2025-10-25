import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '@/components/common';
import { LockIcon, CheckIcon } from '@/components/icons';
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
  return (
    <Card className={`permission-group-card ${isAssigned ? 'assigned' : ''}`}>
      <CardHeader>
        <div className="group-card-header">
          <LockIcon size={18} className="group-icon" aria-hidden="true" />
          <div>
            <CardTitle>{group.group_display_name}</CardTitle>
            <p className="group-name-text">{group.group_name}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="group-info">
          <Badge variant="secondary">{group.group_category}</Badge>
          {isAssigned && (
            <Badge variant="success">
              <CheckIcon size={12} aria-hidden="true" />
              Assigned
            </Badge>
          )}
        </div>

        {group.group_description && (
          <p className="group-description">{group.group_description}</p>
        )}

        <div className="group-meta">
          <span className="meta-item">
            {permissionCount} permissions
          </span>
          <span className="meta-item">
            Created: {new Date(group.created_at).toLocaleDateString()}
          </span>
        </div>

        <div className="group-actions">
          {onViewPermissions && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewPermissions(group.group_hash)}
            >
              View Permissions
            </Button>
          )}
          
          {onAssignToRole && !isAssigned && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onAssignToRole(group.group_hash)}
            >
              Assign to Role
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default PermissionGroupCard;
