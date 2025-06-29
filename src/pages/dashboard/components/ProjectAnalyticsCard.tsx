import React from 'react';
import type { ProjectMetrics } from '@/types/analytics.types';

interface ProjectAnalyticsCardProps {
  project: ProjectMetrics;
  onClick?: () => void;
}

export function ProjectAnalyticsCard({ project, onClick }: ProjectAnalyticsCardProps): React.JSX.Element {
  const getHealthColor = (score: number) => {
    if (score >= 80) return 'var(--color-success)';
    if (score >= 60) return 'var(--color-warning)';
    return 'var(--color-error)';
  };

  const getHealthLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Attention';
  };

  const formatLastActivity = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div 
      className={`project-analytics-card ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
    >
      <div className="card-header">
        <div className="project-info">
          <h3 className="project-name">{project.name}</h3>
          <div className="project-id">ID: {project.id}</div>
        </div>
        
        <div className="health-indicator">
          <div 
            className="health-score"
            style={{ color: getHealthColor(project.healthScore) }}
          >
            {project.healthScore}%
          </div>
          <div className="health-label">{getHealthLabel(project.healthScore)}</div>
        </div>
      </div>

      <div className="card-metrics">
        <div className="metric-row">
          <div className="metric-item">
            <div className="metric-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div className="metric-content">
              <div className="metric-value">{project.memberCount}</div>
              <div className="metric-label">Members</div>
            </div>
          </div>

          <div className="metric-item">
            <div className="metric-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
              </svg>
            </div>
            <div className="metric-content">
              <div className="metric-value">{project.activityCount}</div>
              <div className="metric-label">Activities</div>
            </div>
          </div>
        </div>

        <div className="last-activity">
          <div className="activity-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12,6 12,12 16,14"/>
            </svg>
          </div>
          <span className="activity-text">Last activity {formatLastActivity(project.lastActivity)}</span>
        </div>
      </div>

      {project.recentActivities && project.recentActivities.length > 0 && (
        <div className="recent-activities">
          <h4 className="activities-title">Recent Activity</h4>
          <div className="activities-list">
            {project.recentActivities.slice(0, 3).map((activity) => (
              <div key={activity.id} className="activity-preview">
                <div className="activity-type-indicator">
                  {activity.type.includes('user') && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  )}
                  {activity.type.includes('project') && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2l5 0l2 3h9a2 2 0 0 1 2 2z"/>
                    </svg>
                  )}
                  {activity.type.includes('group') && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  )}
                </div>
                <div className="activity-summary">
                  <div className="activity-title">{activity.title}</div>
                  <div className="activity-time">{formatLastActivity(activity.timestamp)}</div>
                </div>
              </div>
            ))}
          </div>
          
          {project.recentActivities.length > 3 && (
            <div className="more-activities">
              +{project.recentActivities.length - 3} more activities
            </div>
          )}
        </div>
      )}

      <div className="card-footer">
        <div className="health-bar">
          <div 
            className="health-fill"
            style={{ 
              width: `${project.healthScore}%`,
              backgroundColor: getHealthColor(project.healthScore)
            }}
          />
        </div>
        
        {onClick && (
          <div className="view-details">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProjectAnalyticsCard; 