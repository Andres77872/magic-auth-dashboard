import React from 'react';
import { useAuth, useUserType } from '@/hooks';
import { getUserTypeBadgeClass } from '@/utils/userTypeStyles';

export function ProfilePage(): React.JSX.Element {
  const { user } = useAuth();
  const { getUserTypeLabel, userType } = useUserType();

  return (
    <div className="profile-page">
      <div className="profile-header">
        <h1>User Profile</h1>
        <p>Manage your account settings and preferences</p>
      </div>

      <div className="profile-content">
        <div className="profile-card">
          <div className="profile-avatar">
            <span className="avatar-text">
              {user?.username.charAt(0).toUpperCase()}
            </span>
          </div>
          
          <div className="profile-info">
            <h2>{user?.username}</h2>
            <p>{user?.email}</p>
            <div 
              className={`profile-user-badge ${getUserTypeBadgeClass(userType || undefined)}`}
            >
              {getUserTypeLabel()}
            </div>
          </div>
        </div>

        <div className="profile-sections">
          <div className="section-placeholder">
            <h3>Profile Settings</h3>
            <p>Profile management will be implemented in a future milestone.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage; 