import React from 'react';
import { HealthIndicator } from './HealthIndicator';
import { useUserType } from '@/hooks';
import type { SystemHealthData } from '@/types/dashboard.types';

interface SystemHealthPanelProps {
  health: SystemHealthData | null;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export function SystemHealthPanel({ 
  health, 
  isLoading, 
  error, 
  onRefresh 
}: SystemHealthPanelProps): React.JSX.Element {
  const { isRoot } = useUserType();

  // Don't render for non-ROOT users
  if (!isRoot) {
    return <></>;
  }

  const getOverallStatusColor = (status?: 'healthy' | 'warning' | 'critical') => {
    switch (status) {
      case 'healthy':
        return 'var(--color-success)';
      case 'warning':
        return 'var(--color-warning)';
      case 'critical':
        return 'var(--color-error)';
      default:
        return 'var(--color-gray-500)';
    }
  };

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return 'Unknown';
    
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch {
      return timestamp;
    }
  };

  if (error) {
    return (
      <div className="system-health-panel">
        <div className="health-header">
          <h2>System Health Monitor</h2>
          <p>Real-time monitoring of system components</p>
        </div>
        
        <div className="health-error">
          <div className="error-content">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            <h3>Health Check Failed</h3>
            <p>{error}</p>
            <button 
              onClick={onRefresh} 
              className="retry-button"
              disabled={isLoading}
            >
              {isLoading ? 'Checking...' : 'Retry'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="system-health-panel">
      <div className="health-header">
        <div className="header-content">
          <div className="header-text">
            <h2>System Health Monitor</h2>
            <p>Real-time monitoring of critical system components</p>
          </div>
          
          <div className="header-actions">
            <button 
              onClick={onRefresh}
              className="refresh-button"
              disabled={isLoading}
              title="Refresh health status"
            >
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
                className={isLoading ? 'spinning' : ''}
              >
                <polyline points="23,4 23,10 17,10"/>
                <polyline points="1,20 1,14 7,14"/>
                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
              </svg>
              {isLoading ? 'Checking...' : 'Refresh'}
            </button>
          </div>
        </div>

        {health && (
          <div className="overall-status">
            <div className="status-indicator">
              <div 
                className="status-light status-light-dynamic"
                style={{ '--dynamic-status-bg': getOverallStatusColor(health.status) } as React.CSSProperties}
              />
              <span className="status-label">
                System Status: <strong 
                  className="status-color-dynamic"
                  style={{ '--dynamic-status-color': getOverallStatusColor(health.status) } as React.CSSProperties}
                >
                  {health.status?.toUpperCase() || 'UNKNOWN'}
                </strong>
              </span>
            </div>
            
            <div className="last-check">
              Last updated: {formatTimestamp(health.timestamp)}
            </div>
          </div>
        )}
      </div>

      <div className="health-content">
        {isLoading && !health && (
          <div className="health-loading">
            <div className="loading-indicators">
              {[...Array(3)].map((_, index) => (
                <div key={`loading-${index}`} className="health-indicator-skeleton">
                  <div className="skeleton-header">
                    <div className="skeleton-title"></div>
                    <div className="skeleton-status"></div>
                  </div>
                  <div className="skeleton-metrics">
                    <div className="skeleton-metric"></div>
                    <div className="skeleton-metric"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {health && (
          <div className="health-indicators">
            <HealthIndicator
              title="Database"
              component={health.components.database}
            />
            
            <HealthIndicator
              title="Cache System"
              component={health.components.cache}
            />
            
            <HealthIndicator
              title="Authentication"
              component={health.components.authentication}
            />
          </div>
        )}
      </div>

      <div className="health-footer">
        <p className="auto-refresh-note">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12,6 12,12 16,14"/>
          </svg>
          Auto-refreshes every 10 seconds
        </p>
      </div>
    </div>
  );
}

export default SystemHealthPanel; 