import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

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
  const trendDirection =
    trend && trend.value > 0 ? 'up' : trend && trend.value < 0 ? 'down' : 'neutral';

  const getTrendIcon = () => {
    if (trendDirection === 'up') {
      return <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />;
    }
    if (trendDirection === 'down') {
      return <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />;
    }
    return <Minus className="h-3.5 w-3.5" aria-hidden="true" />;
  };

  const trendColors = {
    up: 'text-green-600 dark:text-green-400',
    down: 'text-red-600 dark:text-red-400',
    neutral: 'text-muted-foreground',
  };

  return (
    <Card
      className={cn(
        onClick && 'cursor-pointer transition-colors hover:bg-muted/50',
        className
      )}
      onClick={onClick}
      aria-label={onClick ? `View ${title}` : undefined}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="flex items-center gap-2">
          {badge && <span>{badge}</span>}
          {icon && (
            <span className="h-4 w-4 text-muted-foreground" aria-hidden="true">
              {icon}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-4/5" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
        {trend && !loading && (
          <div className={cn('flex items-center gap-1 mt-1', trendColors[trendDirection])}>
            <span>{getTrendIcon()}</span>
            <span className="text-xs font-medium">{Math.abs(trend.value)}%</span>
            {trend.label && (
              <span className="text-xs text-muted-foreground">{trend.label}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default StatCard;

