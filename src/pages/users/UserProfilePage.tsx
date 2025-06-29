import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Badge, LoadingSpinner } from '@/components/common';
import { userService } from '@/services';
import { ROUTES } from '@/utils/routes';
import type { User, UserType } from '@/types/auth.types';

export function UserProfilePage(): React.JSX.Element {
  const [user, setUser] = useState<User | null>(null);
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
      
      if (response.success && response.data) {
        setUser(response.data);
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

  if (error && !user) {
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

  if (!user) {
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
              </div>
            </div>
          </Card>

          {/* Projects Section */}
          <Card title="Assigned Projects" padding="large">
            <div className="projects-placeholder">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2l5 0l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
              <h4>Project Information</h4>
              <p>Project assignments and permissions will be displayed here in a future update.</p>
            </div>
          </Card>

          {/* Groups Section */}
          <Card title="User Groups" padding="large">
            <div className="groups-placeholder">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <h4>Group Memberships</h4>
              <p>User group memberships will be displayed here in a future update.</p>
            </div>
          </Card>

          {/* Activity History Section */}
          <Card title="Activity History" padding="large">
            <div className="activity-placeholder">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
              </svg>
              <h4>Recent Activity</h4>
              <p>User activity history and audit logs will be displayed here in a future update.</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default UserProfilePage; 