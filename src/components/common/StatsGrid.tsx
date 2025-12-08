import React from 'react';
import StatCard, { type StatCardProps } from './StatCard';
import { cn } from '@/lib/utils';

export interface StatsGridProps {
  stats: StatCardProps[];
  columns?: 2 | 3 | 4 | 5;
  loading?: boolean;
  className?: string;
}

const columnClasses = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5',
};

export function StatsGrid({
  stats,
  columns = 4,
  loading = false,
  className = '',
}: StatsGridProps): React.JSX.Element {
  return (
    <div
      className={cn('grid gap-4', columnClasses[columns], className)}
      role="group"
      aria-label="Statistics"
    >
      {stats.map((stat, index) => (
        <StatCard key={stat.title || `stat-${index}`} {...stat} loading={loading} />
      ))}
    </div>
  );
}

export default StatsGrid;

