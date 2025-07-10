import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useProjects } from '@/hooks/useProjects';
import { useUserRoleAssignments } from '@/hooks/useUserRoleAssignments';
import { useEffectivePermissions } from '@/hooks/useEffectivePermissions';
import { useRoles } from '@/hooks/useRoles';
import { useUsers } from '@/hooks/useUsers';
import '@/styles/pages/AssignmentsPage.css';

interface AssignmentView {
  id: string;
  name: string;
  component: React.ComponentType<any>;
  icon: string;
  description: string;
}

// Import components that we'll create next
const UserRoleMatrix = React.lazy(() => import('@/components/features/rbac/UserRoleMatrix'));
const PermissionMatrix = React.lazy(() => import('@/components/features/rbac/PermissionMatrix'));
const BulkAssignmentTool = React.lazy(() => import('@/components/features/rbac/BulkAssignmentTool'));
const AssignmentWorkflow = React.lazy(() => import('@/components/features/rbac/AssignmentWorkflow'));
const EffectivePermissions = React.lazy(() => import('@/components/features/rbac/EffectivePermissions'));
const RoleConflictResolver = React.lazy(() => import('@/components/features/rbac/RoleConflictResolver'));

export default function AssignmentsPage(): React.JSX.Element {
  const { projectHash } = useParams<{ projectHash: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedView, setSelectedView] = useState<string>('workflow');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  // Hooks for data management
  const { projects, isLoading: projectsLoading } = useProjects();
  const { users, isLoading: usersLoading, fetchUsers } = useUsers();
  const { roles, loading: rolesLoading, refreshRoles } = useRoles(projectHash || '');
  
  const assignmentHook = useUserRoleAssignments({
    projectHash: projectHash || '',
    autoRefresh: true,
    refreshInterval: 30000
  });

  const effectivePermissionsHook = useEffectivePermissions({
    projectHash: projectHash || '',
    userHashes: selectedUsers,
    autoRefresh: true,
    refreshInterval: 30000,
    includeInheritancePaths: true
  });

  // Get current project
  const currentProject = useMemo(() => {
    return projects.find(p => p.project_hash === projectHash);
  }, [projects, projectHash]);

  // Available views for the assignment interface
  const assignmentViews: AssignmentView[] = [
    {
      id: 'workflow',
      name: 'Assignment Workflow',
      component: AssignmentWorkflow,
      icon: '🔄',
      description: 'Step-by-step user role assignment process'
    },
    {
      id: 'user-roles',
      name: 'User-Role Matrix',
      component: UserRoleMatrix,
      icon: '👥',
      description: 'Visual matrix of user role assignments'
    },
    {
      id: 'permissions',
      name: 'Permission Matrix',
      component: PermissionMatrix,
      icon: '🛡️',
      description: 'Comprehensive permission visualization'
    },
    {
      id: 'effective',
      name: 'Effective Permissions',
      component: EffectivePermissions,
      icon: '⚡',
      description: 'Real-time permission calculation and inheritance'
    },
    {
      id: 'bulk',
      name: 'Bulk Assignment',
      component: BulkAssignmentTool,
      icon: '📦',
      description: 'Bulk role assignment and CSV operations'
    },
    {
      id: 'conflicts',
      name: 'Conflict Resolution',
      component: RoleConflictResolver,
      icon: '⚠️',
      description: 'Detect and resolve permission conflicts'
    }
  ];

  // URL parameter handling
  useEffect(() => {
    const view = searchParams.get('view');
    const users = searchParams.get('users');
    const user = searchParams.get('user');

    if (view && assignmentViews.find(v => v.id === view)) {
      setSelectedView(view);
    }

    if (users) {
      setSelectedUsers(users.split(',').filter(Boolean));
    }

    if (user) {
      setSelectedUser(user);
    }
  }, [searchParams]);

  // Update URL when selections change
  const updateSearchParams = (updates: Record<string, string | null>) => {
    const newParams = new URLSearchParams(searchParams);
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });
    
    setSearchParams(newParams);
  };

  const handleViewChange = (viewId: string) => {
    setSelectedView(viewId);
    updateSearchParams({ view: viewId });
  };

  const handleUserSelection = (userHashes: string[]) => {
    setSelectedUsers(userHashes);
    updateSearchParams({ 
      users: userHashes.length > 0 ? userHashes.join(',') : null 
    });
  };

  const handleSingleUserSelection = (userHash: string | null) => {
    setSelectedUser(userHash);
    updateSearchParams({ user: userHash });
  };

  // Loading states
  if (projectsLoading || !currentProject) {
    return (
      <div className="assignments-page loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading project information...</p>
        </div>
      </div>
    );
  }

  const currentView = assignmentViews.find(v => v.id === selectedView) || assignmentViews[0];
  const CurrentViewComponent = currentView.component;

  return (
    <div className="assignments-page">
      {/* Page Header */}
      <div className="assignments-header">
        <div className="header-content">
          <div className="title-section">
            <h1>User Role Assignments</h1>
            <p className="subtitle">
              Manage user permissions through role assignments for{' '}
              <span className="project-name">{currentProject.project_name}</span>
            </p>
          </div>
          
          <div className="header-stats">
            <div className="stat-card">
              <span className="stat-value">{selectedUsers.length}</span>
              <span className="stat-label">Selected Users</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{roles.length}</span>
              <span className="stat-label">Available Roles</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{assignmentHook.conflicts.length}</span>
              <span className="stat-label">Conflicts</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">
                {Math.round(effectivePermissionsHook.getPermissionCoverage().percentage)}%
              </span>
              <span className="stat-label">Coverage</span>
            </div>
          </div>
        </div>
      </div>

      {/* View Navigation */}
      <div className="view-navigation">
        <div className="nav-tabs">
          {assignmentViews.map(view => (
            <button
              key={view.id}
              className={`nav-tab ${selectedView === view.id ? 'active' : ''}`}
              onClick={() => handleViewChange(view.id)}
              title={view.description}
            >
              <span className="tab-icon">{view.icon}</span>
              <span className="tab-label">{view.name}</span>
              {view.id === 'conflicts' && assignmentHook.conflicts.length > 0 && (
                <span className="conflict-badge">{assignmentHook.conflicts.length}</span>
              )}
            </button>
          ))}
        </div>

        <div className="view-description">
          <p>{currentView.description}</p>
        </div>
      </div>

      {/* Global Controls */}
      <div className="global-controls">
        <div className="control-group">
          <label htmlFor="project-selector">Project:</label>
          <select 
            id="project-selector"
            value={projectHash || ''}
            onChange={(e) => {
              if (e.target.value && e.target.value !== projectHash) {
                window.location.href = `/dashboard/permissions/assignments/${e.target.value}`;
              }
            }}
            disabled={projectsLoading}
          >
            {projects.map(project => (
              <option key={project.project_hash} value={project.project_hash}>
                {project.project_name}
              </option>
            ))}
          </select>
        </div>

        <div className="control-group">
                     <button 
             className="refresh-btn"
             onClick={() => {
               fetchUsers();
               refreshRoles();
               assignmentHook.refreshHistory();
             }}
             disabled={usersLoading || rolesLoading}
           >
            🔄 Refresh Data
          </button>
        </div>

        {assignmentHook.hasConflicts() && (
          <div className="global-alert">
            <span className="alert-icon">⚠️</span>
            <span className="alert-text">
              {assignmentHook.conflicts.length} permission conflict(s) detected
            </span>
            <button 
              className="alert-action"
              onClick={() => handleViewChange('conflicts')}
            >
              Resolve
            </button>
          </div>
        )}
      </div>

      {/* Error Display */}
      {(assignmentHook.error || effectivePermissionsHook.error) && (
        <div className="error-banner">
          <span className="error-icon">❌</span>
          <span className="error-text">
            {assignmentHook.error || effectivePermissionsHook.error}
          </span>
          <button 
            className="error-dismiss"
            onClick={() => {
              // Clear errors would need to be implemented in hooks
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="assignments-content">
        <React.Suspense fallback={
          <div className="view-loading">
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Loading {currentView.name}...</p>
            </div>
          </div>
        }>
          <CurrentViewComponent
            projectHash={projectHash}
            currentProject={currentProject}
            users={users}
            roles={roles}
            selectedUsers={selectedUsers}
            selectedUser={selectedUser}
            onUserSelection={handleUserSelection}
            onSingleUserSelection={handleSingleUserSelection}
            assignmentHook={assignmentHook}
            effectivePermissionsHook={effectivePermissionsHook}
            loading={usersLoading || rolesLoading || assignmentHook.loading}
          />
        </React.Suspense>
      </div>

      {/* Assignment Activity Feed */}
      <div className="activity-sidebar">
        <h3>Recent Assignment Activity</h3>
        <div className="activity-feed">
          {assignmentHook.history.slice(0, 10).map(activity => (
            <div key={activity.id} className="activity-item">
              <div className="activity-icon">
                {activity.action === 'assigned' ? '➕' : 
                 activity.action === 'removed' ? '➖' : '✏️'}
              </div>
              <div className="activity-content">
                <div className="activity-title">
                  {activity.username} {activity.action} {activity.role_name}
                </div>
                <div className="activity-meta">
                  {new Date(activity.performed_at).toLocaleString()}
                  {activity.reason && (
                    <span className="activity-reason"> • {activity.reason}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {assignmentHook.history.length === 0 && (
            <div className="no-activity">
              <p>No recent assignment activity</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 