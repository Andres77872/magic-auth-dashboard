import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Badge, Skeleton, EmptyState } from '@/components/common';
import { userService } from '@/services';
import { ROUTES } from '@/utils/routes';
import { UserIcon, ErrorIcon } from '@/components/icons';
import type { UserType, UserProfileResponse } from '@/types/auth.types';
import '@/styles/pages/user-profile.css';

export function UserProfilePage(): React.JSX.Element {
  const [profileData, setProfileData] = useState<UserProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { userHash } = useParams<{ userHash: string }>();

  useEffect(() => {
    if (userHash) {
      fetchUser(userHash);
    } else {
      setError('User ID is required');
      setIsLoading(false);
    }
  }, [userHash]);

  const fetchUser = async (hash: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await userService.getUserByHash(hash);

      if (response.success && response.user) {
        // The response already matches UserProfileResponse structure
        // Calculate statistics from user data if not provided
        const userGroups = response.user.groups || [];
        const userProjects = response.user.projects || [];
        const allPermissions = userProjects.flatMap(project => project.effective_permissions || []);
        const accountAgeMs = new Date().getTime() - new Date(response.user.created_at).getTime();
        const accountAgeDays = Math.floor(accountAgeMs / (1000 * 60 * 60 * 24));

        // Use statistics from API if available, otherwise calculate
        const calculatedStatistics = {
          total_groups: userGroups.length,
          total_accessible_projects: userProjects.length,
          total_permissions: allPermissions.length,
          account_age_days: accountAgeDays,
        };

        const finalResponse: UserProfileResponse = {
          ...response,
          statistics: response.statistics || calculatedStatistics,
          permissions: response.permissions || allPermissions,
        };

        setProfileData(finalResponse);
      } else {
        setError(response.message || 'Failed to fetch user data');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate(ROUTES.USERS);
  };

  const handleEditUser = () => {
    if (userHash) {
      navigate(`${ROUTES.USERS_EDIT}/${userHash}`);
    }
  };

  const getUserTypeBadgeVariant = (userType: UserType) => {
    switch (userType) {
      case 'root':
        return 'error';
      case 'admin':
        return 'warning';
      case 'consumer':
        return 'info';
      default:
        return 'secondary';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="user-profile-page">
        <div className="page-header">
          <div className="page-title-section">
            <button onClick={handleGoBack} className="back-button">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15,18 9,12 15,6"/>
              </svg>
              Back to Users
            </button>
            <h1>User Profile</h1>
          </div>
        </div>
        <div className="page-content">
          <div className="profile-grid">
            <Card padding="large">
              <div className="flex items-center gap-4 mb-4">
                <Skeleton variant="avatar-lg" />
                <div className="flex-1">
                  <Skeleton variant="title" width="40%" />
                  <Skeleton variant="text" width="30%" />
                </div>
              </div>
              <div className="user-details-grid">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="detail-item">
                    <Skeleton variant="text" width="50%" />
                  </div>
                ))}
              </div>
            </Card>
            <Card padding="large">
              <Skeleton variant="title" />
              <Skeleton variant="line" count={4} />
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error && !profileData) {
    return (
      <div className="user-profile-page">
        <div className="page-header">
          <div className="page-title-section">
            <button onClick={handleGoBack} className="back-button">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15,18 9,12 15,6"/>
              </svg>
              Back to Users
            </button>
            <h1>User Profile</h1>
          </div>
        </div>
        <div className="page-content">
          <EmptyState
            icon={<ErrorIcon size="large" />}
            title="Failed to Load User Profile"
            description={error}
            action={
              <button onClick={() => userHash && fetchUser(userHash)} className="btn btn-primary">
                Try Again
              </button>
            }
          />
        </div>
      </div>
    );
  }

  if (!profileData || !profileData.user) {
    return (
      <div className="user-profile-page">
        <div className="page-header">
          <div className="page-title-section">
            <button onClick={handleGoBack} className="back-button">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15,18 9,12 15,6"/>
              </svg>
              Back to Users
            </button>
            <h1>User Profile</h1>
          </div>
        </div>
        <div className="page-content">
          <EmptyState
            icon={<UserIcon size="large" />}
            title="User Not Found"
            description="The user you're looking for doesn't exist or has been deleted."
            action={
              <button onClick={handleGoBack} className="btn btn-primary">
                Back to Users
              </button>
            }
          />
        </div>
      </div>
    );
  }

  const { user, permissions, statistics } = profileData;
  const userGroups = user.groups || [];
  const userProjects = user.projects || [];

  // Provide default statistics when API returns null to avoid runtime errors
  const defaultStatistics = {
    total_groups: 0,
    total_accessible_projects: 0,
    total_permissions: 0,
    account_age_days: 0,
  };
  const stats = statistics ?? defaultStatistics;

  return (
    <div className="user-profile-page">
      <div className="page-header">
        <div className="page-title-section">
          <button onClick={handleGoBack} className="back-button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15,18 9,12 15,6"/>
            </svg>
            Back to Users
          </button>
          <h1>User Profile</h1>
          <p>Detailed information about {user.username}</p>
        </div>
        <div className="page-actions">
          <button onClick={handleEditUser} className="btn btn-primary">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            Edit User
          </button>
        </div>
      </div>

      <div className="page-content">
        <div className="profile-grid">
          {/* User Information Card */}
          <Card title="User Information" padding="large">
            <div className="user-profile-info">
                          <div className="profile-user-avatar-section">
              <div className="profile-user-avatar-large">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div className="avatar-info">
                  <h2>{user.username}</h2>
                  <Badge
                    variant={getUserTypeBadgeVariant(user.user_type)}
                    size="medium"
                  >
                    {user.user_type.toUpperCase()}
                  </Badge>
                </div>
              </div>

              <div className="user-details-grid">
                <div className="detail-item">
                  <label>Email Address</label>
                  <span>{user.email || 'Not provided'}</span>
                </div>

                <div className="detail-item">
                  <label>User Hash</label>
                  <span className="user-hash">{user.user_hash}</span>
                </div>

                <div className="detail-item">
                  <label>Account Status</label>
                  <Badge variant={user.is_active ? 'success' : 'secondary'} size="small" dot>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="detail-item">
                  <label>Created At</label>
                  <span>{formatDate(user.created_at)}</span>
                </div>

                {user.updated_at && (
                  <div className="detail-item">
                    <label>Last Updated</label>
                    <span>{formatDate(user.updated_at)}</span>
                  </div>
                )}

                {user.last_login && (
                  <div className="detail-item">
                    <label>Last Login</label>
                    <span>{formatDate(user.last_login)}</span>
                  </div>
                )}

                <div className="detail-item">
                  <label>Account Age</label>
                  <span>{stats.account_age_days} days</span>
                </div>

                {/* User Type Info Error */}
                {user.user_type_info?.error && (
                  <div className="detail-item">
                    <label>User Type Error</label>
                    <span className="error-text">{user.user_type_info.error}</span>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Statistics Card */}
          <Card title="User Statistics" padding="large">
            <div className="statistics-grid">
              <div className="statistic-item">
                <div className="statistic-value">{stats.total_accessible_projects}</div>
                <div className="statistic-label">Projects</div>
              </div>
              <div className="statistic-item">
                <div className="statistic-value">{stats.total_groups}</div>
                <div className="statistic-label">Groups</div>
              </div>
              <div className="statistic-item">
                <div className="statistic-value">{stats.total_permissions}</div>
                <div className="statistic-label">Permissions</div>
              </div>
            </div>
          </Card>

          {/* Projects Section */}
          <Card title={`Assigned Projects (${userProjects.length})`} padding="large">
            {userProjects.length > 0 ? (
              <div className="projects-list">
                {userProjects.map((project) => (
                  <div key={project.project_hash} className="project-item">
                    <div className="project-header">
                      <h4>{project.project_name}</h4>
                      <Badge variant="info" size="small">
                        {project.effective_permissions.length} permissions
                      </Badge>
                    </div>
                    {project.project_description && (
                      <p className="project-description">{project.project_description}</p>
                    )}
                    <div className="project-meta">
                      <span className="project-hash">ID: {project.project_hash}</span>
                    </div>
                    
                    {/* Access Groups */}
                    {project.access_groups && project.access_groups.length > 0 && (
                      <div className="project-access-groups">
                        <h5>Access Groups:</h5>
                        <div className="access-groups-list">
                          {project.access_groups.map((group) => (
                            <div key={group.group_hash} className="access-group">
                              <span className="group-name">{group.group_name}</span>
                              <span className="group-permissions">
                                {group.permissions.length} permissions
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Effective Permissions */}
                    {project.effective_permissions && project.effective_permissions.length > 0 && (
                      <div className="project-permissions">
                        <h5>Effective Permissions:</h5>
                        <div className="permissions-list">
                          {project.effective_permissions.map((permission, permIndex) => (
                            <Badge key={permIndex} variant="secondary" size="small">
                              {permission}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="projects-placeholder">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2l5 0l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
                <h4>No Projects Assigned</h4>
                <p>This user doesn't have any projects assigned yet.</p>
              </div>
            )}
          </Card>

          {/* Groups Section */}
          <Card title={`User Groups (${userGroups.length})`} padding="large">
            {userGroups.length > 0 ? (
              <div className="groups-list">
                {userGroups.map((group) => (
                  <div key={group.group_hash} className="group-item">
                    <div className="group-header">
                      <h4>{group.group_name}</h4>
                      <Badge variant="info" size="small">
                        {group.projects_count} projects
                      </Badge>
                    </div>
                    {group.group_description && (
                      <p className="group-description">{group.group_description}</p>
                    )}
                    <div className="group-meta">
                      <span className="group-hash">ID: {group.group_hash}</span>
                      <span className="group-assigned">
                        Assigned: {formatDate(group.assigned_at)}
                      </span>
                      {group.assigned_by && (
                        <span className="group-assigned-by">
                          By: {group.assigned_by}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="groups-placeholder">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                <h4>No Group Memberships</h4>
                <p>This user isn't a member of any groups yet.</p>
              </div>
            )}
          </Card>

          {/* Permissions Section */}
          <Card title={`All Permissions (${permissions.length})`} padding="large">
            {permissions.length > 0 ? (
              <div className="permissions-list">
                {permissions.map((permission, index) => (
                  <div key={index} className="permission-item">
                    <Badge variant="info" size="small">
                      {permission}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="permissions-placeholder">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
                <h4>No Permissions Assigned</h4>
                <p>This user doesn't have any specific permissions assigned.</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

export default UserProfilePage;