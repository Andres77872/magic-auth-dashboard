import React from 'react';
import { Skeleton } from './Skeleton';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  trend?: {
    value: number;
    label?: string;
  };
  onClick?: () => void;
  loading?: boolean;
  className?: string;
}

/**
 * Standardized stat card component for displaying metrics
 * Use this for all statistics displays across the application
 */
export function StatCard({
  title,
  value,
  icon,
  badge,
  trend,
  onClick,
  loading = false,
  className = '',
}: StatCardProps): React.JSX.Element {
  const isClickable = !!onClick;
  const trendDirection = trend && trend.value > 0 ? 'up' : trend && trend.value < 0 ? 'down' : 'neutral';

  const cardClasses = [
    'stat-card',
    isClickable && 'stat-card-clickable',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const content = (
    <>
      <div className="stat-card-header">
        {icon && <div className="stat-card-icon" aria-hidden="true">{icon}</div>}
        <h3 className="stat-card-title">{title}</h3>
        {badge && <div className="stat-card-badge">{badge}</div>}
      </div>
      <div className="stat-card-body">
        {loading ? (
          <Skeleton variant="text" width="80%" height="32px" />
        ) : (
          <div className="stat-card-value">{value}</div>
        )}
        {trend && !loading && (
          <div className={`stat-card-trend stat-card-trend-${trendDirection}`}>
            <span className="stat-card-trend-icon" aria-hidden="true">
              {trendDirection === 'up' && '↑'}
              {trendDirection === 'down' && '↓'}
              {trendDirection === 'neutral' && '—'}
            </span>
            <span className="stat-card-trend-value">
              {Math.abs(trend.value)}%
            </span>
            {trend.label && <span className="stat-card-trend-label">{trend.label}</span>}
          </div>
        )}
      </div>
    </>
  );

  if (isClickable) {
    return (
      <button
        type="button"
        className={cardClasses}
        onClick={onClick}
        aria-label={`View ${title}`}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={cardClasses}>
      {content}
    </div>
  );
}

export default StatCard;

