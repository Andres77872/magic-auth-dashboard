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
      <div className="project-overview-grid">
        {/* Project Information */}
        <Card>
          <h3>Project Information</h3>
          <div className="overview-section">
            <div className="overview-item">
              <strong>Project Hash:</strong>
              <div className="code-block">
                {project.project_hash}
              </div>
            </div>
            <div className="overview-item">
              <strong>Created:</strong>
              <div>{formatDate(project.created_at)}</div>
            </div>
            {project.updated_at && (
              <div className="overview-item">
                <strong>Last Updated:</strong>
                <div>{formatDate(project.updated_at)}</div>
              </div>
            )}
            <div className="overview-item">
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
              <div className="overview-item">
                <strong>Your Access Level:</strong>
                <div>
                  <Badge variant="info">{userAccess.access_level}</Badge>
                </div>
              </div>
            )}
            {userAccess?.permissions && userAccess.permissions.length > 0 && (
              <div className="overview-item">
                <strong>Your Permissions:</strong>
                <div className="permissions-badge-grid">
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
            <div className="modal-loading-centered">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="overview-section">
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-value-large stat-value-primary">
                    {statistics.total_users}
                  </div>
                  <div className="stat-label-secondary">Users</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value-large stat-value-success">
                    {statistics.total_groups}
                  </div>
                  <div className="stat-label-secondary">Groups</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value-large stat-value-info">
                    {statistics.active_sessions}
                  </div>
                  <div className="stat-label-secondary">Active Sessions</div>
                </div>
                <div className="stat-item">
                  <div className="stat-value-large stat-value-warning">
                    {Object.keys(statistics.group_distribution || {}).length}
                  </div>
                  <div className="stat-label-secondary">Group Types</div>
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
          <div className="modal-loading-centered">
            <LoadingSpinner />
          </div>
        ) : activity.length > 0 ? (
          <div className="overview-section">
            {activity.map((item, index) => (
              <div key={index} className="activity-item">
                <div>
                  <div className="activity-title">
                    {item.action || item.activity_type || 'Activity'}
                  </div>
                  <div className="activity-description">
                    {item.description || item.details || 'No details available'}
                  </div>
                </div>
                <div className="activity-timestamp">
                  {item.created_at && formatDate(item.created_at)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="modal-text-centered">
            No recent activity found
          </div>
        )}
      </Card>
    </div>
  );
}; 