import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Badge, Button } from '@/components/common';
import { groupService } from '@/services';
import { GroupMembersTable } from '@/components/features/groups/GroupMembersTable';
import type { GroupMember } from '@/components/features/groups/GroupMembersTable';
import { ROUTES } from '@/utils/routes';
import type { UserGroup } from '@/types/group.types';

export const GroupDetailsPage: React.FC = () => {
  const { groupHash } = useParams<{ groupHash: string }>();
  const [group, setGroup] = useState<UserGroup | null>(null);
  const [statistics, setStatistics] = useState<{ total_members: number; total_projects: number } | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGroup = async () => {
      if (!groupHash) {
        setError('Group ID is required');
        setIsLoading(false);
        return;
      }

      try {
        const response = await groupService.getGroup(groupHash);
        if (response.success && response.user_group) {
          setGroup(response.user_group);
          setStatistics(response.statistics);
          // The API returns members array inside the same response
          // Map to GroupMember type to ensure keys exist
          if (Array.isArray(response.members)) {
            setMembers(response.members as unknown as GroupMember[]);
          }
        } else {
          setError(response.message || 'Failed to fetch group');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch group');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroup();
  }, [groupHash]);

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="group-details-page">
        <div>Loading group details...</div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="group-details-page">
        <div className="danger-text">
          {error || 'Group not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="group-details-page">
      <div className="page-header-flex">
        <div>
          <h1>{group.group_name}</h1>
          {group.description && (
            <p className="description-secondary">
              {group.description}
            </p>
          )}
        </div>
        
        <div className="button-group">
          <Button
            variant="outline"
            onClick={() => window.location.href = `${ROUTES.GROUPS_EDIT}/${group.group_hash}`}
          >
            Edit Group
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.href = ROUTES.GROUPS}
          >
            Back to Groups
          </Button>
        </div>
      </div>

      <div className="group-details-content">
        <Card title="Group Information">
          <div className="info-grid">
            <div className="info-item">
              <span className="detail-label">Group Name</span>
              <span>{group.group_name}</span>
            </div>
            
            <div className="info-item">
              <span className="detail-label">Description</span>
              <span>{group.description || 'No description'}</span>
            </div>
            
            <div className="info-item">
              <span className="detail-label">Members</span>
              <Badge variant="secondary">
                {statistics?.total_members ?? group.member_count ?? 0} member{(statistics?.total_members ?? group.member_count ?? 0) !== 1 ? 's' : ''}
              </Badge>
            </div>
            
            <div className="info-item">
              <span className="detail-label">Created</span>
              <span>{formatDate(group.created_at)}</span>
            </div>
            
            <div className="info-item">
              <span className="detail-label">Projects</span>
              <Badge variant="secondary">
                {statistics?.total_projects ?? 0} project{(statistics?.total_projects ?? 0) !== 1 ? 's' : ''}
              </Badge>
            </div>
            
            {group.updated_at && (
              <div className="info-item">
                <span className="detail-label">Last Updated</span>
                <span>{formatDate(group.updated_at)}</span>
              </div>
            )}
          </div>
        </Card>

        <div className="mt-8">
          <Card title="Members">
            <GroupMembersTable members={members} />
          </Card>
        </div>
      </div>
    </div>
  );
}; 