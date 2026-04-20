import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

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
  /** Enable gradient background (from-{variant}/5 to-{variant}/10) */
  gradient?: boolean;
  /** Progress bar configuration */
  progress?: {
    value: number;
    max?: number;
    color?: string;
  };
  /** Background variant for colored cards */
  variant?: 'default' | 'success' | 'warning' | 'info' | 'primary';
  /** Secondary metric text below the main value */
  subValue?: string;
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
  gradient = false,
  progress,
  variant = 'default',
  subValue,
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
    up: 'text-success',
    down: 'text-destructive',
    neutral: 'text-muted-foreground',
  };

  // Map variant to Tailwind color class
  const variantColors: Record<string, string> = {
    default: 'primary',
    success: 'success',
    warning: 'warning',
    info: 'info',
    primary: 'primary',
  };

  const variantColor = variantColors[variant] || 'primary';

  // Build gradient classes if enabled
  const gradientClasses = gradient
    ? `bg-gradient-to-br from-${variantColor}/5 to-${variantColor}/10`
    : '';

  // Map progress color to Progress component variant
  const progressVariantMap: Record<string, 'primary' | 'success' | 'warning' | 'destructive'> = {
    primary: 'primary',
    success: 'success',
    warning: 'warning',
    destructive: 'destructive',
    default: 'primary',
  };

  return (
    <Card
      className={cn(
        onClick && 'cursor-pointer transition-colors hover:bg-muted/50',
        gradientClasses,
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
        {subValue && !loading && (
          <div className="text-sm text-muted-foreground mt-1">{subValue}</div>
        )}
        {progress && !loading && (
          <div className="mt-2">
            <Progress
              value={(progress.value / (progress.max ?? 100)) * 100}
              variant={progressVariantMap[progress.color ?? 'default']}
              size="sm"
            />
          </div>
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

