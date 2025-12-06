import React from 'react';
import StatCard, { type StatCardProps } from './StatCard';
import { cn } from '@/utils/component-utils';

export interface StatsGridProps {
  stats: StatCardProps[];
  columns?: 2 | 3 | 4 | 5;
  loading?: boolean;
  className?: string;
}

export function StatsGrid({
  stats,
  columns = 4,
  loading = false,
  className = '',
}: StatsGridProps): React.JSX.Element {
  return (
    <div className={cn('stats-grid', `stats-grid--cols-${columns}`, className)} role="group" aria-label="Statistics">
      {stats.map((stat, index) => (
        <StatCard key={stat.title || `stat-${index}`} {...stat} loading={loading} />
      ))}
    </div>
  );
}

export default StatsGrid;

