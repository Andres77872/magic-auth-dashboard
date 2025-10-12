import React from 'react';
import { Card, Badge, Button } from '@/components/common';
import type { UserGroup } from '@/types/group.types';
import { ROUTES } from '@/utils/routes';

interface GroupCardProps {
  group: UserGroup;
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const GroupCard: React.FC<GroupCardProps> = ({ group }) => {
  const handleViewDetails = () => {
    window.location.href = `${ROUTES.GROUPS}/${group.group_hash}`;
  };

  return (
    <Card 
      className="group-card"
      title={group.group_name}
      subtitle={group.description}
      actions={
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleViewDetails}
        >
          View Details
        </Button>
      }
    >
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
    </Card>
  );
}; 