import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserForm } from '@/components/features/users/UserForm';
import { userService } from '@/services';
import { ROUTES } from '@/utils/routes';
import type { UserFormData } from '@/types/user.types';

export function UserCreatePage(): React.JSX.Element {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleCreateUser = async (formData: UserFormData): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      let response;

      // Call appropriate service based on user type
      switch (formData.userType) {
        case 'root':
          response = await userService.createRootUser({
            username: formData.username,
            password: formData.password,
            email: formData.email,
          });
          break;
        case 'admin':
          response = await userService.createAdminUser({
            username: formData.username,
            password: formData.password,
            email: formData.email,
            assigned_project_ids: [], // TODO: Implement project assignment
          });
          break;
        case 'consumer':
        default:
          response = await userService.createConsumerUser({
            username: formData.username,
            password: formData.password,
            email: formData.email,
            project_hash: '', // TODO: Get from current context
          });
          break;
      }

      if (response.success) {
        // Navigate back to users list with success message
        navigate(ROUTES.USERS, { 
          state: { 
            message: `User "${formData.username}" created successfully`,
            type: 'success' 
          }
        });
      } else {
        setError(response.message || 'Failed to create user');
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

  return (
    <div className="user-create-page">
      <div className="page-header">
        <div className="page-title-section">
          <button onClick={handleGoBack} className="back-button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15,18 9,12 15,6"/>
            </svg>
            Back to Users
          </button>
          <h1>Create New User</h1>
          <p>Add a new user to the system with appropriate permissions</p>
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
          <UserForm
            mode="create"
            onSubmit={handleCreateUser}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}

export default UserCreatePage; 