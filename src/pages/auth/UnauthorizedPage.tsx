import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useUserType } from '@/hooks';
import { ROUTES } from '@/utils/routes';

export function UnauthorizedPage(): React.JSX.Element {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  const { userType, getUserTypeLabel } = useUserType();

  const handleGoBack = (): void => {
    navigate(-1);
  };

  const handleGoHome = (): void => {
    if (isAuthenticated) {
      navigate(ROUTES.DASHBOARD);
    } else {
      navigate(ROUTES.LOGIN);
    }
  };

  const handleLogout = async (): Promise<void> => {
    await logout();
    navigate(ROUTES.LOGIN);
  };

  return (
    <div className="unauthorized-page">
      <div className="unauthorized-container">
        <div className="unauthorized-content">
          <div className="unauthorized-icon">
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="error-icon"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="m15 9-6 6" />
              <path d="m9 9 6 6" />
            </svg>
          </div>

          <h1 className="unauthorized-title">Access Denied</h1>
          
          <p className="unauthorized-message">
            You don't have permission to access this resource.
          </p>

          {isAuthenticated && (
            <div className="user-info">
              <p className="current-user">
                Logged in as: <strong>{userType}</strong> ({getUserTypeLabel()})
              </p>
            </div>
          )}

          <div className="unauthorized-actions">
            <button
              onClick={handleGoBack}
              className="btn btn-secondary"
              type="button"
            >
              Go Back
            </button>

            <button
              onClick={handleGoHome}
              className="btn btn-primary"
              type="button"
            >
              {isAuthenticated ? 'Go to Dashboard' : 'Go to Login'}
            </button>

            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="btn btn-outline"
                type="button"
              >
                Logout
              </button>
            )}
          </div>

          <div className="help-section">
            <h3>Need Access?</h3>
            <p>
              If you believe you should have access to this resource, please contact your administrator.
            </p>
            <ul className="access-requirements">
              <li>ROOT users have access to all system features</li>
              <li>ADMIN users can manage projects and users</li>
              <li>Regular users have limited dashboard access</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UnauthorizedPage; 