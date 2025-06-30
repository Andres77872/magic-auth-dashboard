import React, { useState, useEffect } from 'react';
import { Card, LoadingSpinner, Badge } from '@/components/common';
import { projectService } from '@/services';
import type { ProjectDetails, UserAccess, ProjectStatistics } from '@/types/project.types';

interface ProjectOverviewTabProps {
  project: ProjectDetails;
  userAccess: UserAccess | null;
  statistics: ProjectStatistics | null;
}

export const ProjectOverviewTab: React.FC<ProjectOverviewTabProps> = ({ 
  project, 
  userAccess, 
  statistics 
}) => {
  const [activity, setActivity] = useState<any[]>([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);

  useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        setIsLoadingActivity(true);
        const response = await projectService.getProjectActivity(project.project_hash, { 
          limit: 5 
        });
        if (response.success && response.data) {
          setActivity(response.data);
        }
      } catch (err) {
        console.error('Error fetching project activity:', err);
      } finally {
        setIsLoadingActivity(false);
      }
    };

    fetchRecentActivity();
  }, [project.project_hash]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="project-overview-tab">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* Project Information */}
        <Card>
          <h3>Project Information</h3>
          <div style={{ marginTop: '16px' }}>
            <div style={{ marginBottom: '12px' }}>
              <strong>Project Hash:</strong>
              <div style={{ fontFamily: 'monospace', fontSize: '0.9em', color: 'var(--color-text-secondary)' }}>
                {project.project_hash}
              </div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <strong>Created:</strong>
              <div>{formatDate(project.created_at)}</div>
            </div>
            {project.updated_at && (
              <div style={{ marginBottom: '12px' }}>
                <strong>Last Updated:</strong>
                <div>{formatDate(project.updated_at)}</div>
              </div>
            )}
            <div style={{ marginBottom: '12px' }}>
              <strong>Status:</strong>
              <div>
                {project.is_active !== false ? (
                  <Badge variant="success">Active</Badge>
                ) : (
                  <Badge variant="warning">Archived</Badge>
                )}
              </div>
            </div>
            {userAccess?.access_level && (
              <div style={{ marginBottom: '12px' }}>
                <strong>Your Access Level:</strong>
                <div>
                  <Badge variant="info">{userAccess.access_level}</Badge>
                </div>
              </div>
            )}
            {userAccess?.permissions && userAccess.permissions.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <strong>Your Permissions:</strong>
                <div style={{ marginTop: '4px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {userAccess.permissions.map((permission, index) => (
                    <Badge key={index} variant="secondary">
                      {permission}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Project Statistics */}
        <Card>
          <h3>Statistics</h3>
          {!statistics ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
              <LoadingSpinner />
            </div>
          ) : (
            <div style={{ marginTop: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="stat-item">
                  <div style={{ fontSize: '2em', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                    {statistics.total_users}
                  </div>
                  <div style={{ color: 'var(--color-text-secondary)' }}>Users</div>
                </div>
                <div className="stat-item">
                  <div style={{ fontSize: '2em', fontWeight: 'bold', color: 'var(--color-success)' }}>
                    {statistics.total_groups}
                  </div>
                  <div style={{ color: 'var(--color-text-secondary)' }}>Groups</div>
                </div>
                <div className="stat-item">
                  <div style={{ fontSize: '2em', fontWeight: 'bold', color: 'var(--color-info)' }}>
                    {statistics.active_sessions}
                  </div>
                  <div style={{ color: 'var(--color-text-secondary)' }}>Active Sessions</div>
                </div>
                <div className="stat-item">
                  <div style={{ fontSize: '2em', fontWeight: 'bold', color: 'var(--color-warning)' }}>
                    {Object.keys(statistics.group_distribution || {}).length}
                  </div>
                  <div style={{ color: 'var(--color-text-secondary)' }}>Group Types</div>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <h3>Recent Activity</h3>
        {isLoadingActivity ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
            <LoadingSpinner />
          </div>
        ) : activity.length > 0 ? (
          <div style={{ marginTop: '16px' }}>
            {activity.map((item, index) => (
              <div 
                key={index} 
                style={{ 
                  padding: '12px', 
                  borderBottom: index < activity.length - 1 ? '1px solid var(--color-border)' : 'none',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: '500' }}>
                    {item.action || item.activity_type || 'Activity'}
                  </div>
                  <div style={{ fontSize: '0.9em', color: 'var(--color-text-secondary)' }}>
                    {item.description || item.details || 'No details available'}
                  </div>
                </div>
                <div style={{ fontSize: '0.9em', color: 'var(--color-text-secondary)' }}>
                  {item.created_at && formatDate(item.created_at)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px', 
            color: 'var(--color-text-secondary)' 
          }}>
            No recent activity found
          </div>
        )}
      </Card>
    </div>
  );
}; 