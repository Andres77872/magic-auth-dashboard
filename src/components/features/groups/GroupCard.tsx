import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Calendar } from 'lucide-react';
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
    <Card>
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base">{group.group_name}</CardTitle>
          {group.description && (
            <p className="text-sm text-muted-foreground">{group.description}</p>
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
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Members</span>
            <Badge variant="secondary">
              {group.member_count || 0}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Created</span>
            <span className="text-sm">
              {formatDate(group.created_at)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 