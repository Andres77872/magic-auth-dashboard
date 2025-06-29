import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Badge, LoadingSpinner } from '@/components/common';
import { userService } from '@/services';
import { ROUTES } from '@/utils/routes';
import type { UserType, UserProfileResponse } from '@/types/auth.types';

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
        setProfileData(response as UserProfileResponse);
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
          <div className="loading-container">
            <LoadingSpinner size="large" message="Loading user profile..." />
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
          <div className="error-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <h3>Failed to Load User Profile</h3>
            <p>{error}</p>
            <button onClick={() => userHash && fetchUser(userHash)} className="btn btn-primary">
              Try Again
            </button>
          </div>
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
          <div className="error-state">
            <h3>User Not Found</h3>
            <p>The user you're looking for doesn't exist or has been deleted.</p>
          </div>
        </div>
      </div>
    );
  }

  const { user, permissions, groups, accessible_projects, statistics } = profileData;

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
              <div className="user-avatar-section">
                <div className="user-avatar-large">
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
                  <span>{user.email}</span>
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

                <div className="detail-item">
                  <label>Account Age</label>
                  <span>{statistics.account_age_days} days</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Statistics Card */}
          <Card title="User Statistics" padding="large">
            <div className="statistics-grid">
              <div className="statistic-item">
                <div className="statistic-value">{statistics.total_accessible_projects}</div>
                <div className="statistic-label">Projects</div>
              </div>
              <div className="statistic-item">
                <div className="statistic-value">{statistics.total_groups}</div>
                <div className="statistic-label">Groups</div>
              </div>
              <div className="statistic-item">
                <div className="statistic-value">{statistics.total_permissions}</div>
                <div className="statistic-label">Permissions</div>
              </div>
            </div>
          </Card>

          {/* Projects Section */}
          <Card title={`Assigned Projects (${accessible_projects.length})`} padding="large">
            {accessible_projects.length > 0 ? (
              <div className="projects-list">
                {accessible_projects.map((project, index) => (
                  <div key={index} className="project-item">
                    {/* Display project information when structure is known */}
                    <div className="project-placeholder">
                      <p>Project details will be displayed here once available.</p>
                    </div>
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
          <Card title={`User Groups (${groups.length})`} padding="large">
            {groups.length > 0 ? (
              <div className="groups-list">
                {groups.map((group, index) => (
                  <div key={index} className="group-item">
                    {/* Display group information when structure is known */}
                    <div className="group-placeholder">
                      <p>Group details will be displayed here once available.</p>
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
          <Card title={`Permissions (${permissions.length})`} padding="large">
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