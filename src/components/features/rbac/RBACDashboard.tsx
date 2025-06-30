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
        <div className="loading-spinner">Loading RBAC data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rbac-dashboard error">
        <div className="error-message">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="rbac-dashboard">
      <div className="rbac-dashboard__header">
        <h3>RBAC Overview</h3>
      </div>
      
      <div className="rbac-dashboard__stats">
        <div className="stat-card">
          <div className="stat-value">{summary?.statistics.total_permissions || 0}</div>
          <div className="stat-label">Permissions</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">{summary?.statistics.total_roles || 0}</div>
          <div className="stat-label">Roles</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">{summary?.statistics.total_assignments || 0}</div>
          <div className="stat-label">Assignments</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-value">{healthStatus?.configured ? '✅' : '❌'}</div>
          <div className="stat-label">Configured</div>
        </div>
      </div>

      {healthStatus?.issues && healthStatus.issues.length > 0 && (
        <div className="rbac-dashboard__issues">
          <h4>Configuration Issues</h4>
          <ul>
            {healthStatus.issues.map((issue, index) => (
              <li key={index} className="issue-item">{issue}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}; 