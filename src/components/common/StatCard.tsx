import React from 'react';
import { Card, Skeleton } from '../primitives';
import { ArrowUpIcon, ArrowDownIcon, HorizontalLineIcon } from '@/components/icons';
import { cn } from '@/utils/component-utils';

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
  const trendDirection = trend && trend.value > 0 ? 'up' : trend && trend.value < 0 ? 'down' : 'neutral';

  const getTrendIcon = () => {
    if (trendDirection === 'up') {
      return <ArrowUpIcon size={14} aria-hidden="true" />;
    }
    if (trendDirection === 'down') {
      return <ArrowDownIcon size={14} aria-hidden="true" />;
    }
    return <HorizontalLineIcon size={14} aria-hidden="true" />;
  };

  return (
    <Card
      className={cn('stat-card', className)}
      onClick={onClick}
      interactive={!!onClick}
      padding="md"
      elevated
      aria-label={onClick ? `View ${title}` : undefined}
    >
      <div className="stat-card__header">
        {icon && <div className="stat-card__icon" aria-hidden="true">{icon}</div>}
        <h3 className="stat-card__title">{title}</h3>
        {badge && <div className="stat-card__badge">{badge}</div>}
      </div>
      <div className="stat-card__body">
        {loading ? (
          <Skeleton variant="text" width="80%" height="32px" />
        ) : (
          <div className="stat-card__value">{value}</div>
        )}
        {trend && !loading && (
          <div className={cn('stat-card__trend', `stat-card__trend--${trendDirection}`)}>
            <span className="stat-card__trend-icon">
              {getTrendIcon()}
            </span>
            <span className="stat-card__trend-value">
              {Math.abs(trend.value)}%
            </span>
            {trend.label && <span className="stat-card__trend-label">{trend.label}</span>}
          </div>
        )}
      </div>
    </Card>
  );
}

export default StatCard;

