import React from 'react';
import { Link } from 'react-router-dom';
import type { StatCardData } from '@/types/dashboard.types';
import { 
  GroupIcon, 
  ProjectIcon, 
  SettingsIcon 
} from '@/components/icons';

interface StatCardProps {
  data: StatCardData;
  isLoading?: boolean;
}

export function StatCard({ data, isLoading = false }: StatCardProps): React.JSX.Element {
  const getIcon = (iconName: string) => {
    const icons: Record<string, React.ReactElement> = {
      users: (
        <GroupIcon size="large" className="stat-icon-component" />
      ),
      projects: (
        <ProjectIcon size="large" className="stat-icon-component" />
      ),
      sessions: (
        <SettingsIcon size="large" className="stat-icon-component" />
      ),
      groups: (
        <GroupIcon size="large" className="stat-icon-component" />
      ),
    };

    return icons[iconName] || icons.users;
  };

  const getChangeIcon = (type: 'increase' | 'decrease' | 'neutral') => {
    switch (type) {
      case 'increase':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23,6 13.5,15.5 8.5,10.5 1,18"/>
            <polyline points="17,6 23,6 23,12"/>
          </svg>
        );
      case 'decrease':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23,18 13.5,8.5 8.5,13.5 1,6"/>
            <polyline points="17,18 23,18 23,12"/>
          </svg>
        );
      default:
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        );
    }
  };

  const cardContent = (
    <div className={`stat-card stat-card-${data.color} ${data.clickable ? 'stat-card-clickable' : ''}`}>
      {isLoading && <div className="stat-card-loading">
        <div className="loading-spinner">
          <div className="spinner-circle"></div>
        </div>
      </div>}
      
      <div className="stat-card-header">
        <div className="stat-card-icon">
          {getIcon(data.icon)}
        </div>
        <h3 className="stat-card-title">{data.title}</h3>
      </div>

      <div className="stat-card-content">
        <div className="stat-value">{data.value}</div>
        
        {data.change && (
          <div className={`stat-change stat-change-${data.change.type}`}>
            <span className="change-icon">
              {getChangeIcon(data.change.type)}
            </span>
            <span className="change-value">
              {data.change.value > 0 ? '+' : ''}{data.change.value}%
            </span>
          </div>
        )}
      </div>

      {data.clickable && (
        <div className="stat-card-footer">
          <span className="view-details">
            View Details
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9,18 15,12 9,6"/>
            </svg>
          </span>
        </div>
      )}
    </div>
  );

  if (data.clickable && data.href) {
    return (
      <Link to={data.href} className="stat-card-link">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}

export default StatCard; 