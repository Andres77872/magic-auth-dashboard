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
  const { summary, loading, error, healthStatus } = useRBAC(projectHash);

  if (loading) {
    return (
      <div className="project-permissions-summary loading">
        <div className="loading-spinner">Loading summary...</div>
      </div>
    );
  }

  // Check if RBAC is not initialized
  if (!healthStatus?.configured && !error) {
    return (
      <div className="project-permissions-summary not-configured">
        <div className="summary-header">
          <h3>Project Summary</h3>
          <div className="project-name">{projectName}</div>
        </div>
        <div className="rbac-not-configured-message">
          <p>RBAC system not initialized for this project.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="project-permissions-summary error">
        <div className="rbac-error-message">Error: {error}</div>
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
            {summary?.rbac_summary?.categories && summary.rbac_summary.categories.length > 0 ? (
              summary.rbac_summary.categories.map((category: string, index: number) => (
                <span key={index} className="category-tag">
                  {category}
                  <span className="category-count">
                    {summary.rbac_summary.permissions_by_category[category]?.length || 0}
                  </span>
                </span>
              ))
            ) : (
              <span className="no-data">No categories configured</span>
            )}
          </div>
        </div>

        <div className="summary-section">
          <h4>Roles by Priority</h4>
          <div className="roles-list">
            {summary?.rbac_summary?.roles_by_priority && summary.rbac_summary.roles_by_priority.length > 0 ? (
              summary.rbac_summary.roles_by_priority.slice(0, 5).map((role: any, index: number) => (
                <div key={index} className="role-item">
                  <span className="role-name">{role.group_name}</span>
                  <span className="role-priority">Priority: {role.priority}</span>
                  <span className={`role-status ${role.is_active ? 'active' : 'inactive'}`}>
                    {role.is_active ? '✓ Active' : '✗ Inactive'}
                  </span>
                </div>
              ))
            ) : (
              <span className="no-data">No roles configured</span>
            )}
          </div>
        </div>

        <div className="summary-section">
          <h4>Quick Stats</h4>
          <div className="quick-stats">
            <div className="stat-item">
              <span className="stat-label">Total Permissions:</span>
              <span className="stat-value">{summary?.rbac_summary?.total_permissions || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Roles:</span>
              <span className="stat-value">{summary?.rbac_summary?.total_roles || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">User Assignments:</span>
              <span className="stat-value">{summary?.rbac_summary?.total_user_assignments || 0}</span>
            </div>
          </div>
        </div>

        <div className="summary-section">
          <h4>Quick Links</h4>
          <div className="quick-links">
            <a href={`/dashboard/permissions/permissions?project=${projectHash}`} className="link-button">
              🔑 Manage Permissions
            </a>
            <a href={`/dashboard/permissions/roles?project=${projectHash}`} className="link-button">
              🎭 Manage Roles
            </a>
            <a href={`/dashboard/permissions/assignments?project=${projectHash}`} className="link-button">
              👥 User Assignments
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}; 