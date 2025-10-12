import React from 'react';
import type { HealthComponent } from '@/types/system.types';

interface HealthIndicatorProps {
  title: string;
  component: HealthComponent;
}

export function HealthIndicator({ title, component }: HealthIndicatorProps): React.JSX.Element {
  const getStatusIcon = (status: HealthComponent['status']) => {
    switch (status) {
      case 'healthy':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20,6 9,17 4,12"/>
          </svg>
        );
      case 'warning':
      case 'degraded':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        );
      case 'critical':
      case 'unhealthy':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        );
    }
  };

  const getStatusColor = (status: HealthComponent['status']) => {
    switch (status) {
      case 'healthy':
        return 'var(--color-success)';
      case 'warning':
      case 'degraded':
        return 'var(--color-warning)';
      case 'critical':
      case 'unhealthy':
        return 'var(--color-error)';
      default:
        return 'var(--color-gray-500)';
    }
  };

  const getStatusText = (status: HealthComponent['status']) => {
    switch (status) {
      case 'healthy':
        return 'Healthy';
      case 'warning':
        return 'Warning';
      case 'degraded':
        return 'Degraded';
      case 'critical':
        return 'Critical';
      case 'unhealthy':
        return 'Unhealthy';
      default:
        return 'Unknown';
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
            className="health-status status-color-dynamic"
            style={{ '--dynamic-status-color': getStatusColor(component.status) } as React.CSSProperties}
          >
            <span className="status-icon">
              {getStatusIcon(component.status)}
            </span>
            <span className="status-text">{getStatusText(component.status)}</span>
          </div>
        </div>
        
        <div className="health-pulse">
          <div 
            className={`pulse-dot pulse-${component.status} pulse-dot-dynamic`}
            style={{ '--dynamic-status-bg': getStatusColor(component.status) } as React.CSSProperties}
          />
        </div>
      </div>

      <div className="health-details">
        {component.message && (
          <div className="health-metric">
            <span className="metric-label">Status:</span>
            <span className="metric-value">{component.message}</span>
          </div>
        )}

        {component.response_time_ms !== undefined && (
          <div className="health-metric">
            <span className="metric-label">Response Time:</span>
            <span className="metric-value">{formatResponseTime(component.response_time_ms)}</span>
          </div>
        )}

        {component.connection_pool && (
          <div className="health-metric">
            <span className="metric-label">Connections:</span>
            <span className="metric-value">{component.connection_pool}</span>
          </div>
        )}

        {component.memory_usage && (
          <div className="health-metric">
            <span className="metric-label">Memory:</span>
            <span className="metric-value">{component.memory_usage}</span>
          </div>
        )}

        {component.active_sessions !== undefined && (
          <div className="health-metric">
            <span className="metric-label">Active Sessions:</span>
            <span className="metric-value">{component.active_sessions.toLocaleString()}</span>
          </div>
        )}

        {component.additional_info && (
          <div className="health-metric">
            <span className="metric-label">Info:</span>
            <span className="metric-value">{component.additional_info}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default HealthIndicator; 