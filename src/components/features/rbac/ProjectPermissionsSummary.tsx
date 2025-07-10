import React from 'react';
import { useRBAC } from '@/hooks/useRBAC';

interface ProjectPermissionsSummaryProps {
  projectHash: string;
  projectName: string;
}

export const ProjectPermissionsSummary: React.FC<ProjectPermissionsSummaryProps> = ({ 
  projectHash, 
  projectName 
}) => {
  const { summary, loading, error } = useRBAC(projectHash);

  if (loading) {
    return (
      <div className="project-permissions-summary loading">
        <div className="loading-spinner">Loading summary...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="project-permissions-summary error">
        <div className="error-message">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="project-permissions-summary">
      <div className="summary-header">
        <h3>Project Summary</h3>
        <div className="project-name">{projectName}</div>
      </div>
      
      <div className="summary-content">
        <div className="summary-section">
          <h4>Permission Categories</h4>
          <div className="categories-list">
            {summary?.statistics.permission_categories.length ? (
              summary.statistics.permission_categories.map((category, index) => (
                <span key={index} className="category-tag">{category}</span>
              ))
            ) : (
              <span className="no-data">No categories configured</span>
            )}
          </div>
        </div>

        <div className="summary-section">
          <h4>Recent Activity</h4>
          <div className="activity-list">
            {summary?.recent_activity.length ? (
              summary.recent_activity.slice(0, 3).map((_, index) => (
                <div key={index} className="activity-item">
                  {/* Activity content would go here */}
                  <span>Activity item {index + 1}</span>
                </div>
              ))
            ) : (
              <span className="no-data">No recent activity</span>
            )}
          </div>
        </div>

        <div className="summary-section">
          <h4>Quick Links</h4>
          <div className="quick-links">
            <a href={`/dashboard/permissions/permissions?project=${projectHash}`}>
              Manage Permissions
            </a>
            <a href={`/dashboard/permissions/roles?project=${projectHash}`}>
              Manage Roles
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}; 