import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserForm } from '@/components/features/users/UserForm';
import { userService } from '@/services';
import { ROUTES } from '@/utils/routes';
import type { UserFormData } from '@/types/user.types';
import '@/styles/pages/user-form.css';

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
          // Admin users can be assigned to multiple projects
          response = await userService.createAdminUser({
            username: formData.username,
            password: formData.password,
            email: formData.email,
            assigned_project_ids: [], // TODO: Convert project hashes to IDs if needed
          });
          break;
        case 'consumer':
        default:
          // Validate that a group is assigned
          if (!formData.assignedGroup) {
            setError('Consumer users must be assigned to a user group');
            setIsLoading(false);
            return;
          }
          
          const consumerData = {
            username: formData.username,
            password: formData.password,
            email: formData.email,
            user_group_hash: formData.assignedGroup,
          };
          
          response = await userService.createConsumerUser(consumerData);
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