import React from 'react';
import StatCard, { type StatCardProps } from './StatCard';

export interface StatsGridProps {
  stats: StatCardProps[];
  columns?: 2 | 3 | 4 | 5;
  loading?: boolean;
  className?: string;
}

/**
 * Standardized stats grid for displaying multiple stat cards
 * Use this for consistent statistics layout
 */
export function StatsGrid({
  stats,
  columns = 4,
  loading = false,
  className = '',
}: StatsGridProps): React.JSX.Element {
  const gridClasses = [
    'stats-grid',
    `stats-grid-cols-${columns}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={gridClasses}>
      {stats.map((stat, index) => (
        <StatCard key={`stat-${index}`} {...stat} loading={loading} />
      ))}
    </div>
  );
}

export default StatsGrid;

