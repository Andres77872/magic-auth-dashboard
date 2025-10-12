import React from 'react';
import type { Activity } from '@/types/analytics.types';
import { getSeverityClass, getUserTypeBadgeClass } from '@/utils/userTypeStyles';
import { 
  UserIcon, 
  ProjectIcon, 
  GroupIcon, 
  SecurityIcon, 
  SettingsIcon, 
  MoreIcon 
} from '@/components/icons';

interface ActivityItemProps {
  activity: Activity;
}

export function ActivityItem({ activity }: ActivityItemProps): React.JSX.Element {
  const getActivityIcon = (type: Activity['type']) => {
    const icons: Record<Activity['type'], React.ReactElement> = {
      'user_created': (
        <UserIcon size="md" className="activity-icon-component" />
      ),
      'user_updated': (
        <UserIcon size="md" className="activity-icon-component" />
      ),
      'user_deleted': (
        <UserIcon size="md" className="activity-icon-component" />
      ),
      'login': (
        <UserIcon size="md" className="activity-icon-component" />
      ),
      'logout': (
        <UserIcon size="md" className="activity-icon-component" />
      ),
      'project_created': (
        <ProjectIcon size="md" className="activity-icon-component" />
      ),
      'project_updated': (
        <ProjectIcon size="md" className="activity-icon-component" />
      ),
      'project_deleted': (
        <ProjectIcon size="md" className="activity-icon-component" />
      ),
      'group_created': (
        <GroupIcon size="md" className="activity-icon-component" />
      ),
      'group_updated': (
        <GroupIcon size="md" className="activity-icon-component" />
      ),
      'permission_changed': (
        <SecurityIcon size="md" className="activity-icon-component" />
      ),
      'system_event': (
        <SettingsIcon size="md" className="activity-icon-component" />
      ),
    };

    return icons[type] || icons.system_event;
  };

  const formatRelativeTime = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMs = now.getTime() - time.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } else {
      return time.toLocaleDateString();
    }
  };

  const toggleMetadata = () => {
    const details = document.getElementById(`metadata-${activity.id}`);
    if (details) {
      details.classList.toggle('hidden');
    }
  };

  return (
    <div className={`activity-item activity-item-${activity.severity}`}>
      <div className="activity-icon">
        <div 
          className={`icon-container ${getSeverityClass(activity.severity)}`}
        >
          {getActivityIcon(activity.type)}
        </div>
      </div>

      <div className="activity-content">
        <div className="activity-header">
          <h4 className="activity-title">{activity.title}</h4>
          <span className="activity-time">{formatRelativeTime(activity.timestamp)}</span>
        </div>

        <p className="activity-description">{activity.description}</p>

        <div className="activity-meta">
          <div className="activity-user">
                          <span className="analytics-user-avatar">
              {activity.user.username.charAt(0).toUpperCase()}
            </span>
            <span className="user-name">{activity.user.username}</span>
            <span 
              className={`analytics-user-badge ${getUserTypeBadgeClass(activity.user.user_type)}`}
            >
              {activity.user.user_type.toUpperCase()}
            </span>
          </div>

          {activity.metadata && Object.keys(activity.metadata).length > 0 && (
            <div className="activity-metadata">
              <button
                className="metadata-toggle"
                onClick={toggleMetadata}
              >
                <MoreIcon size="sm" />
                Details
              </button>
              <div 
                id={`metadata-${activity.id}`} 
                className="metadata-details hidden"
              >
                {Object.entries(activity.metadata).map(([key, value]) => (
                  <div key={key} className="metadata-item">
                    <span className="metadata-key">{key}:</span>
                    <span className="metadata-value">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ActivityItem; 