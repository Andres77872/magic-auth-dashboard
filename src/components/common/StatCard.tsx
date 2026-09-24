import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
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
  /** Makes the whole card a link to the related list. */
  href?: string;
  loading?: boolean;
  className?: string;
  /** @deprecated Meridian cards are flat; kept so existing callers compile. */
  gradient?: boolean;
  progress?: {
    value: number;
    max?: number;
    color?: string;
  };
  variant?: 'default' | 'success' | 'warning' | 'info' | 'primary';
  /** Secondary line under the value. */
  subValue?: React.ReactNode;
}

const ICON_TINTS: Record<NonNullable<StatCardProps['variant']>, string> = {
  default: 'bg-primary-subtle text-primary-subtle-foreground',
  primary: 'bg-primary-subtle text-primary-subtle-foreground',
  success: 'bg-success-subtle text-success-subtle-foreground',
  warning: 'bg-warning-subtle text-warning-subtle-foreground',
  info: 'bg-info-subtle text-info-subtle-foreground',
};

const PROGRESS_VARIANTS: Record<
  string,
  'primary' | 'success' | 'warning' | 'destructive'
> = {
  primary: 'primary',
  success: 'success',
  warning: 'warning',
  destructive: 'destructive',
  default: 'primary',
};

/** Meridian metric card: overline label, large value, optional delta/progress. */
export function StatCard({
  title,
  value,
  icon,
  badge,
  trend,
  onClick,
  href,
  loading = false,
  className = '',
  progress,
  variant = 'default',
  subValue,
}: StatCardProps): React.JSX.Element {
  const trendDirection = !trend
    ? 'neutral'
    : trend.value > 0
      ? 'up'
      : trend.value < 0
        ? 'down'
        : 'neutral';
  const TrendIcon =
    trendDirection === 'up'
      ? TrendingUp
      : trendDirection === 'down'
        ? TrendingDown
        : Minus;
  const interactive = Boolean(href || onClick);

  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.07em] text-muted-foreground">
          {title}
        </span>
        <div className="flex items-center gap-2">
          {badge}
          {icon && (
            <span
              className={cn(
                'flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-md [&_svg]:h-4 [&_svg]:w-4',
                ICON_TINTS[variant]
              )}
              aria-hidden="true"
            >
              {icon}
            </span>
          )}
        </div>
      </div>

      <div className="mt-2">
        {loading ? (
          <Skeleton className="h-8 w-2/3" />
        ) : (
          <div className="text-[28px] font-semibold leading-none tracking-[-0.01em] tabular-nums text-foreground">
            {value}
          </div>
        )}
        {subValue && !loading && (
          <div className="mt-2 text-xs text-muted-foreground">{subValue}</div>
        )}
        {progress && !loading && (
          <div className="mt-2.5">
            <Progress
              value={(progress.value / (progress.max ?? 100)) * 100}
              variant={PROGRESS_VARIANTS[progress.color ?? 'default']}
              size="sm"
            />
          </div>
        )}
        {trend && !loading && (
          <div
            className={cn(
              'mt-2 flex items-center gap-1 text-xs',
              trendDirection === 'up' && 'text-success',
              trendDirection === 'down' && 'text-destructive',
              trendDirection === 'neutral' && 'text-muted-foreground'
            )}
          >
            <TrendIcon className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="font-medium">{Math.abs(trend.value)}%</span>
            {trend.label && (
              <span className="text-muted-foreground">{trend.label}</span>
            )}
          </div>
        )}
      </div>
    </>
  );

  const classes = cn(
    'block rounded-lg border border-border bg-card p-4 text-card-foreground',
    interactive && 'transition-colors hover:border-input hover:bg-accent/30',
    className
  );

  if (href) {
    return (
      <Link
        to={href}
        className={cn(classes, 'no-underline')}
        aria-label={`${title}: ${value}`}
      >
        {body}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(classes, 'w-full text-left')}
      >
        {body}
      </button>
    );
  }
  return <div className={classes}>{body}</div>;
}

export default StatCard;
