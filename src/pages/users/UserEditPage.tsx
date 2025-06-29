import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { UserForm } from '@/components/features/users/UserForm';
import { LoadingSpinner } from '@/components/common';
import { userService } from '@/services';
import { ROUTES } from '@/utils/routes';
import type { UserFormData } from '@/types/user.types';
import type { User } from '@/types/auth.types';

export function UserEditPage(): React.JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
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

  const handleUpdateUser = async (formData: UserFormData): Promise<void> => {
    if (!user || !userHash) return;

    setIsUpdating(true);
    setError(null);

    try {
      const updateData: Partial<User> = {
        username: formData.username,
        email: formData.email,
        user_type: formData.userType,
      };

      const response = await userService.updateUser(userHash, updateData);

      if (response.success) {
        // Navigate back to users list with success message
        navigate(ROUTES.USERS, {
          state: {
            message: `User "${formData.username}" updated successfully`,
            type: 'success'
          }
        });
      } else {
        setError(response.message || 'Failed to update user');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleGoBack = () => {
    navigate(ROUTES.USERS);
  };

  if (isLoading) {
    return (
      <div className="user-edit-page">
        <div className="page-header">
          <div className="page-title-section">
            <button onClick={handleGoBack} className="back-button">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15,18 9,12 15,6"/>
              </svg>
              Back to Users
            </button>
            <h1>Edit User</h1>
          </div>
        </div>
        <div className="page-content">
          <div className="loading-container">
            <LoadingSpinner size="large" message="Loading user data..." />
          </div>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="user-edit-page">
        <div className="page-header">
          <div className="page-title-section">
            <button onClick={handleGoBack} className="back-button">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15,18 9,12 15,6"/>
              </svg>
              Back to Users
            </button>
            <h1>Edit User</h1>
          </div>
        </div>
        <div className="page-content">
          <div className="error-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <h3>Failed to Load User</h3>
            <p>{error}</p>
            <button onClick={() => userHash && fetchUser(userHash)} className="btn btn-primary">
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="user-edit-page">
      <div className="page-header">
        <div className="page-title-section">
          <button onClick={handleGoBack} className="back-button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15,18 9,12 15,6"/>
            </svg>
            Back to Users
          </button>
          <h1>Edit User</h1>
          <p>Update user information and permissions</p>
        </div>
      </div>

      <div className="page-content">
        {error && (
          <div className="error-banner">
            <div className="error-content">
              <span className="error-message">{error}</span>
              <button 
                onClick={() => setError(null)}
                className="error-dismiss"
              >
                ×
              </button>
            </div>
          </div>
        )}

        <div className="form-section">
          {user && (
            <UserForm
              mode="edit"
              initialData={user}
              onSubmit={handleUpdateUser}
              isLoading={isUpdating}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default UserEditPage; 