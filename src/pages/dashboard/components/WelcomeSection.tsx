import React from 'react';
import { useAuth, useUserType } from '@/hooks';
import { getUserTypeBadgeBackgroundClass } from '@/utils/userTypeStyles';

export function WelcomeSection(): React.JSX.Element {
  const { user } = useAuth();
  const { getUserTypeLabel, userType } = useUserType();

  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const formatLastLogin = (): string => {
    // This would typically come from the user session data
    // For now, we'll show a placeholder
    return 'Today at 9:30 AM';
  };

  if (!user) {
    return <p role="status" aria-live="polite">Loading...</p>;
  }

  return (
    <section className="welcome-section" aria-labelledby="welcome-title">
      <div className="welcome-content">
        <div className="welcome-greeting">
          <h1 id="welcome-title" className="welcome-title">
            {getGreeting()}, {user.username}!
          </h1>
          <p className="welcome-subtitle">
            Welcome back to the Magic Auth Admin Dashboard
          </p>
        </div>

        <div className="welcome-info">
          <div className="user-badge-container">
            <span 
              className={`dashboard-welcome-badge ${getUserTypeBadgeBackgroundClass(userType || undefined)}`}
            >
              {getUserTypeLabel()}
            </span>
          </div>
          
          <div className="last-login">
            <span className="last-login-label">Last login:</span>
            <span className="last-login-time">{formatLastLogin()}</span>
          </div>
          
          <div className="system-status">
            <div className="status-indicator online">
              <div className="status-dot"></div>
              <span>System Online</span>
            </div>
          </div>
        </div>
      </div>

      <div className="welcome-actions">
        <a href="/dashboard/profile" className="profile-quick-link" aria-label="View profile">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          View Profile
        </a>
      </div>
    </section>
  );
}

export default WelcomeSection; 