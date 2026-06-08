import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
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

  // Meridian metric icon tile tint per variant (quiet tint + saturated icon)
  const iconTints: Record<string, string> = {
    default: 'bg-primary/15 text-primary',
    primary: 'bg-primary/15 text-primary',
    success: 'bg-success/15 text-success',
    warning: 'bg-warning/15 text-warning',
    info: 'bg-info/15 text-info',
  };
  const iconTint = iconTints[variant] || iconTints.default;

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
      // `gradient` retained for API compatibility but is a no-op — Meridian cards are flat.
      className={cn(
        'p-4',
        onClick && 'cursor-pointer transition-colors hover:border-input',
        gradient && '',
        className
      )}
      onClick={onClick}
      aria-label={onClick ? `View ${title}` : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.07em] text-muted-foreground">
          {title}
        </span>
        <div className="flex items-center gap-2">
          {badge && <span>{badge}</span>}
          {icon && (
            <span
              className={cn(
                'flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-md [&_svg]:h-4 [&_svg]:w-4',
                iconTint
              )}
              aria-hidden="true"
            >
              {icon}
            </span>
          )}
        </div>
      </div>

      <div className="mt-2.5">
        {loading ? (
          <Skeleton className="h-8 w-4/5" />
        ) : (
          <div className="text-[30px] font-semibold leading-none tracking-[-0.01em]">
            {value}
          </div>
        )}
        {subValue && !loading && (
          <div className="mt-1.5 text-[13px] text-muted-foreground">{subValue}</div>
        )}
        {progress && !loading && (
          <div className="mt-2.5">
            <Progress
              value={(progress.value / (progress.max ?? 100)) * 100}
              variant={progressVariantMap[progress.color ?? 'default']}
              size="sm"
            />
          </div>
        )}
        {trend && !loading && (
          <div className={cn('mt-2 flex items-center gap-1', trendColors[trendDirection])}>
            <span>{getTrendIcon()}</span>
            <span className="text-xs font-medium">{Math.abs(trend.value)}%</span>
            {trend.label && (
              <span className="text-xs text-muted-foreground">{trend.label}</span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

export default StatCard;

