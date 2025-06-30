import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Badge, Button } from '@/components/common';
import { groupService } from '@/services';
import { ROUTES } from '@/utils/routes';
import type { UserGroup } from '@/types/group.types';

export const GroupDetailsPage: React.FC = () => {
  const { groupHash } = useParams<{ groupHash: string }>();
  const [group, setGroup] = useState<UserGroup | null>(null);
  const [statistics, setStatistics] = useState<{ total_members: number; total_projects: number } | null>(null);
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
        <div style={{ color: 'var(--color-danger)' }}>
          {error || 'Group not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="group-details-page">
      <div className="page-header" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        marginBottom: '2rem' 
      }}>
        <div>
          <h1>{group.group_name}</h1>
          {group.description && (
            <p style={{ 
              color: 'var(--color-text-secondary)',
              marginTop: '0.5rem'
            }}>
              {group.description}
            </p>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
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
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingBottom: '0.5rem',
              borderBottom: '1px solid var(--color-border)'
            }}>
              <span style={{ fontWeight: '500' }}>Group Name</span>
              <span>{group.group_name}</span>
            </div>
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingBottom: '0.5rem',
              borderBottom: '1px solid var(--color-border)'
            }}>
              <span style={{ fontWeight: '500' }}>Description</span>
              <span>{group.description || 'No description'}</span>
            </div>
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingBottom: '0.5rem',
              borderBottom: '1px solid var(--color-border)'
            }}>
              <span style={{ fontWeight: '500' }}>Members</span>
              <Badge variant="secondary">
                {statistics?.total_members ?? group.member_count ?? 0} member{(statistics?.total_members ?? group.member_count ?? 0) !== 1 ? 's' : ''}
              </Badge>
            </div>
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingBottom: '0.5rem',
              borderBottom: '1px solid var(--color-border)'
            }}>
              <span style={{ fontWeight: '500' }}>Created</span>
              <span>{formatDate(group.created_at)}</span>
            </div>
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingBottom: '0.5rem',
              borderBottom: '1px solid var(--color-border)'
            }}>
              <span style={{ fontWeight: '500' }}>Projects</span>
              <Badge variant="secondary">
                {statistics?.total_projects ?? 0} project{(statistics?.total_projects ?? 0) !== 1 ? 's' : ''}
              </Badge>
            </div>
            
            {group.updated_at && (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontWeight: '500' }}>Last Updated</span>
                <span>{formatDate(group.updated_at)}</span>
              </div>
            )}
          </div>
        </Card>

        <div style={{ marginTop: '2rem' }}>
          <Card title="Members">
            <div style={{ 
              textAlign: 'center',
              padding: '2rem',
              color: 'var(--color-text-secondary)'
            }}>
              <p>Member management will be implemented in the next phase.</p>
              <p>This group currently has {statistics?.total_members ?? group.member_count ?? 0} members.</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}; 