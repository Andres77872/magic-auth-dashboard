import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '@/components/common';
import type { UserGroup } from '@/types/group.types';
import { ROUTES } from '@/utils/routes';
import { formatDate } from '@/utils';

interface GroupCardProps {
  group: UserGroup;
}

/**
 * GroupCard component for displaying group information
 * Uses shared formatters and follows Design System guidelines
 */
export const GroupCard: React.FC<GroupCardProps> = ({ group }) => {
  const handleViewDetails = () => {
    window.location.href = `${ROUTES.GROUPS}/${group.group_hash}`;
  };

  return (
    <Card className="group-card" padding="md" elevated>
      <CardHeader>
        <div>
          <CardTitle>{group.group_name}</CardTitle>
          {group.description && (
            <p className="card-subtitle">{group.description}</p>
          )}
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleViewDetails}
        >
          View Details
        </Button>
      </CardHeader>
      <CardContent>
        <div className="group-stats">
          <div className="stat-item">
            <span className="stat-label">Members</span>
            <Badge variant="secondary">
              {group.member_count || 0}
            </Badge>
          </div>
          
          <div className="stat-item">
            <span className="stat-label">Created</span>
            <span className="stat-value text-sm">
              {formatDate(group.created_at)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 