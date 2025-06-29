import React, { useState, useEffect } from 'react';
import { ProjectAnalyticsCard } from './ProjectAnalyticsCard';
import { analyticsService } from '@/services/analytics.service';
import { LoadingSpinner } from '@/components/common';
import type { ProjectAnalyticsData, DateRange, DateRangePreset } from '@/types/analytics.types';

export function ProjectAnalyticsDashboard(): React.JSX.Element {
  const [data, setData] = useState<ProjectAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
    preset: 'last30days',
  });

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const analyticsData = await analyticsService.getProjectAnalytics({
        start: dateRange.start,
        end: dateRange.end,
      });
      setData(analyticsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project analytics');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateRangeChange = (preset: DateRangePreset) => {
    const today = new Date();
    let start: Date;

    switch (preset) {
      case 'today':
        start = new Date(today);
        break;
      case 'yesterday':
        start = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'last7days':
        start = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'last30days':
        start = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        return;
    }

    setDateRange({
      start: start.toISOString().split('T')[0],
      end: today.toISOString().split('T')[0],
      preset,
    });
  };

  const handleProjectClick = (projectId: string) => {
    setSelectedProject(projectId);
    // TODO: Navigate to detailed project view or expand inline
  };

  if (error) {
    return (
      <div className="analytics-error">
        <div className="error-content">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          <h3>Failed to Load Project Analytics</h3>
          <p>{error}</p>
          <button onClick={fetchAnalytics} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="analytics-loading">
        <LoadingSpinner size="large" message="Loading project analytics..." />
      </div>
    );
  }

  return (
    <div className="project-analytics-dashboard">
      <div className="analytics-header">
        <div className="header-content">
          <h2>Project Analytics</h2>
          <p>Monitor project health, activity, and member engagement</p>
        </div>

        <div className="date-range-selector">
          <div className="date-presets">
            {(['today', 'yesterday', 'last7days', 'last30days'] as DateRangePreset[]).map((preset) => (
              <button
                key={preset}
                onClick={() => handleDateRangeChange(preset)}
                className={`preset-button ${dateRange.preset === preset ? 'active' : ''}`}
              >
                {preset === 'today' && 'Today'}
                {preset === 'yesterday' && 'Yesterday'}
                {preset === 'last7days' && 'Last 7 Days'}
                {preset === 'last30days' && 'Last 30 Days'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="analytics-overview">
        <div className="overview-cards">
          <div className="overview-card">
            <div className="card-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2l5 0l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <div className="card-content">
              <div className="card-value">{data.totalProjects}</div>
              <div className="card-label">Total Projects</div>
            </div>
          </div>

          <div className="overview-card">
            <div className="card-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <polyline points="9,12 11,14 15,10"/>
              </svg>
            </div>
            <div className="card-content">
              <div className="card-value">{data.avgHealthScore.toFixed(1)}%</div>
              <div className="card-label">Average Health Score</div>
            </div>
          </div>

          <div className="overview-card">
            <div className="card-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
              </svg>
            </div>
            <div className="card-content">
              <div className="card-value">{data.totalActivity.toLocaleString()}</div>
              <div className="card-label">Total Activities</div>
            </div>
          </div>
        </div>
      </div>

      {data.engagement && (
        <div className="engagement-overview">
          <h3>Engagement Insights</h3>
          <div className="engagement-content">
            <div className="popular-actions">
              <h4>Popular Actions</h4>
              <div className="actions-list">
                {data.engagement.popularActions.slice(0, 5).map((action, index) => (
                  <div key={index} className="action-item">
                    <div className="action-name">{action.action}</div>
                    <div className="action-count">{action.count} times</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="member-engagement">
              <h4>Most Active Members</h4>
              <div className="members-list">
                {data.engagement.memberEngagement.slice(0, 5).map((member) => (
                  <div key={member.user_hash} className="member-item">
                    <div className="member-avatar">
                      {member.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="member-info">
                      <div className="member-name">{member.username}</div>
                      <div className="member-activity">{member.activityCount} activities</div>
                    </div>
                    <div className="member-last-active">
                      {new Date(member.lastActive).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="projects-section">
        <div className="projects-header">
          <h3>Project Details</h3>
          <div className="projects-count">
            {data.projects.length} project{data.projects.length !== 1 ? 's' : ''}
          </div>
        </div>

        {data.projects.length > 0 ? (
          <div className="projects-grid">
            {data.projects.map((project) => (
              <ProjectAnalyticsCard
                key={project.id}
                project={project}
                onClick={() => handleProjectClick(project.id)}
              />
            ))}
          </div>
        ) : (
          <div className="no-projects">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2l5 0l2 3h9a2 2 0 0 1 2 2z"/>
              <line x1="12" y1="10" x2="12" y2="14"/>
              <line x1="10" y1="12" x2="14" y2="12"/>
            </svg>
            <h4>No Projects Found</h4>
            <p>You don't have access to any projects yet.</p>
          </div>
        )}
      </div>

      {data.engagement && data.engagement.projectActivity.length > 0 && (
        <div className="activity-timeline">
          <h3>Activity Timeline</h3>
          <div className="timeline-chart">
            {data.engagement.projectActivity.map((day, index) => (
              <div key={index} className="timeline-item">
                <div className="timeline-date">{new Date(day.date).toLocaleDateString()}</div>
                <div className="timeline-bar">
                  <div 
                    className="timeline-fill"
                    style={{ 
                      height: `${Math.min(100, (day.activityCount / Math.max(...data.engagement.projectActivity.map(d => d.activityCount))) * 100)}%` 
                    }}
                  />
                </div>
                <div className="timeline-count">{day.activityCount}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectAnalyticsDashboard; 