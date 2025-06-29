import React from 'react';
import type { HealthComponent } from '@/types/dashboard.types';

interface HealthIndicatorProps {
  title: string;
  component: HealthComponent;
}

export function HealthIndicator({ title, component }: HealthIndicatorProps): React.JSX.Element {
  const getStatusIcon = (status: 'healthy' | 'warning' | 'critical') => {
    switch (status) {
      case 'healthy':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20,6 9,17 4,12"/>
          </svg>
        );
      case 'warning':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        );
      case 'critical':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        );
    }
  };

  const getStatusColor = (status: 'healthy' | 'warning' | 'critical') => {
    switch (status) {
      case 'healthy':
        return 'var(--color-success)';
      case 'warning':
        return 'var(--color-warning)';
      case 'critical':
        return 'var(--color-error)';
    }
  };

  const getStatusText = (status: 'healthy' | 'warning' | 'critical') => {
    switch (status) {
      case 'healthy':
        return 'Healthy';
      case 'warning':
        return 'Warning';
      case 'critical':
        return 'Critical';
    }
  };

  const formatResponseTime = (time?: number) => {
    if (time === undefined) return 'N/A';
    if (time < 1000) return `${time}ms`;
    return `${(time / 1000).toFixed(2)}s`;
  };

  return (
    <div className={`health-indicator health-${component.status}`}>
      <div className="health-header">
        <div className="health-title-row">
          <h4 className="health-title">{title}</h4>
          <div 
            className="health-status"
            style={{ color: getStatusColor(component.status) }}
          >
            <span className="status-icon">
              {getStatusIcon(component.status)}
            </span>
            <span className="status-text">{getStatusText(component.status)}</span>
          </div>
        </div>
        
        <div className="health-pulse">
          <div 
            className={`pulse-dot pulse-${component.status}`}
            style={{ backgroundColor: getStatusColor(component.status) }}
          />
        </div>
      </div>

      <div className="health-details">
        {component.responseTime !== undefined && (
          <div className="health-metric">
            <span className="metric-label">Response Time:</span>
            <span className="metric-value">{formatResponseTime(component.responseTime)}</span>
          </div>
        )}

        {component.connectionPool && (
          <div className="health-metric">
            <span className="metric-label">Connections:</span>
            <span className="metric-value">{component.connectionPool}</span>
          </div>
        )}

        {component.memoryUsage && (
          <div className="health-metric">
            <span className="metric-label">Memory:</span>
            <span className="metric-value">{component.memoryUsage}</span>
          </div>
        )}

        {component.activeSessions !== undefined && (
          <div className="health-metric">
            <span className="metric-label">Active Sessions:</span>
            <span className="metric-value">{component.activeSessions.toLocaleString()}</span>
          </div>
        )}

        {component.additionalInfo && (
          <div className="health-metric">
            <span className="metric-label">Info:</span>
            <span className="metric-value">{component.additionalInfo}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default HealthIndicator; 