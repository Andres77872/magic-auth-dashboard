import React from 'react';
import { useRBAC } from '@/hooks/useRBAC';

interface RBACDashboardProps {
  projectHash: string;
}

export const RBACDashboard: React.FC<RBACDashboardProps> = ({ projectHash }) => {
  const { summary, healthStatus, loading, error } = useRBAC(projectHash);

  if (loading) {
    return (
      <div className="rbac-dashboard loading">
        <div className="loading-spinner">
          <div className="spinner-icon"></div>
          <p>Loading RBAC data...</p>
        </div>
      </div>
    );
  }

  // Check if RBAC is not initialized (not configured)
  if (!healthStatus?.configured && !error) {
    return (
      <div className="rbac-dashboard not-configured">
        <div className="rbac-dashboard__header">
          <h3>RBAC Overview</h3>
        </div>
        <div className="rbac-not-configured-message">
          <div className="message-icon">⚙️</div>
          <h4>RBAC Not Initialized</h4>
          <p>Initialize the RBAC system for this project to start managing permissions and roles.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rbac-dashboard error">
        <div className="rbac-error-message">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="rbac-dashboard">
      <div className="rbac-dashboard__header">
        <span className="header-icon">🛡️</span>
        <h3>RBAC Overview</h3>
        {healthStatus?.configured && (
          <span className="status-badge status-active">
            ✓ Active
          </span>
        )}
      </div>
      
      <div className="rbac-dashboard__stats">
        <div className="stat-card stat-card--permissions">
          <div className="stat-icon">🔑</div>
          <div className="stat-content">
            <div className="stat-value">{summary?.rbac_summary?.total_permissions || 0}</div>
            <div className="stat-label">Permissions</div>
          </div>
        </div>
        
        <div className="stat-card stat-card--roles">
          <div className="stat-icon">🎭</div>
          <div className="stat-content">
            <div className="stat-value">{summary?.rbac_summary?.total_roles || 0}</div>
            <div className="stat-label">Roles</div>
            <div className="stat-meta">
              {summary?.rbac_summary?.active_roles || 0} active
            </div>
          </div>
        </div>
        
        <div className="stat-card stat-card--assignments">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-value">{summary?.rbac_summary?.total_user_assignments || 0}</div>
            <div className="stat-label">User Assignments</div>
          </div>
        </div>
        
        <div className="stat-card stat-card--categories">
          <div className="stat-icon">📁</div>
          <div className="stat-content">
            <div className="stat-value">{summary?.rbac_summary?.categories?.length || 0}</div>
            <div className="stat-label">Categories</div>
          </div>
        </div>
      </div>

      {summary?.rbac_summary?.categories && summary.rbac_summary.categories.length > 0 && (
        <div className="rbac-dashboard__categories">
          <h4>Permission Categories</h4>
          <div className="category-tags">
            {summary.rbac_summary.categories.map((category, index) => (
              <span key={index} className="category-tag">
                {category}
                <span className="category-count">
                  {summary.rbac_summary.permissions_by_category[category]?.length || 0}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {healthStatus?.issues && healthStatus.issues.length > 0 && (
        <div className="rbac-dashboard__issues">
          <div className="issues-header">
            <span className="icon">⚠️</span>
            <h4>Configuration Issues</h4>
          </div>
          <ul>
            {healthStatus.issues.map((issue, index) => (
              <li key={index} className="issue-item">
                <span className="icon">⚠️</span>
                {issue}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}; 