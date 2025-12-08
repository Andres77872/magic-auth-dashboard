import React from 'react';
import type { ReactNode, KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export interface DataViewCardStat {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
}

export interface DataViewCardProps {
  /** Card title */
  title?: string;
  /** Subtitle displayed below the title */
  subtitle?: string;
  /** Description text */
  description?: string;
  /** Icon displayed in the header */
  icon?: ReactNode;
  /** Status badges displayed in the header */
  badges?: ReactNode[];
  /** Stats to display in a grid */
  stats?: DataViewCardStat[];
  /** Number of stats columns (1-4) */
  statsColumns?: 1 | 2 | 3 | 4;
  /** Action buttons */
  actions?: ReactNode;
  /** Footer content (alternative to actions) */
  footer?: ReactNode;
  /** Show separator before footer */
  showFooterSeparator?: boolean;
  /** Custom content */
  children?: ReactNode;
  /** Click handler - makes the card interactive */
  onClick?: () => void;
  /** Custom class name */
  className?: string;
  /** Whether the card is currently selected */
  isSelected?: boolean;
  /** Whether to use compact padding */
  compact?: boolean;
}

export function DataViewCard({
  title,
  subtitle,
  description,
  icon,
  badges,
  stats,
  statsColumns = 2,
  actions,
  footer,
  showFooterSeparator = false,
  children,
  onClick,
  className = '',
  isSelected = false,
  compact = false,
}: DataViewCardProps): React.JSX.Element {
  const isInteractive = !!onClick;

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (isInteractive && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick?.();
    }
  };

  const statsColsClasses: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-4',
  };

  const hasHeader = title || subtitle || badges?.length || icon;
  const hasFooter = actions || footer;

  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-all duration-200',
        isInteractive && [
          'cursor-pointer',
          'hover:shadow-md hover:border-primary/20',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'active:scale-[0.99]',
        ],
        isSelected && 'border-primary ring-1 ring-primary/20',
        className
      )}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={isInteractive ? 0 : undefined}
      role={isInteractive ? 'button' : undefined}
      aria-pressed={isInteractive ? isSelected : undefined}
    >
      {/* Header */}
      {hasHeader && (
        <CardHeader className={cn('pb-3', compact && 'p-4 pb-2')}>
          <div className="flex items-start gap-3">
            {/* Icon */}
            {icon && (
              <div
                className={cn(
                  'flex shrink-0 items-center justify-center rounded-lg',
                  'bg-primary/10 text-primary',
                  compact ? 'h-9 w-9' : 'h-10 w-10'
                )}
                aria-hidden="true"
              >
                {icon}
              </div>
            )}

            {/* Title & Subtitle */}
            <div className="flex-1 min-w-0 space-y-0.5">
              {title && (
                <h3
                  className={cn(
                    'font-semibold leading-tight text-foreground',
                    compact ? 'text-sm' : 'text-base',
                    'line-clamp-1'
                  )}
                  title={title}
                >
                  {title}
                </h3>
              )}
              {subtitle && (
                <p
                  className="text-sm text-muted-foreground line-clamp-1"
                  title={subtitle}
                >
                  {subtitle}
                </p>
              )}
            </div>

            {/* Badges */}
            {badges && badges.length > 0 && (
              <div className="flex shrink-0 flex-wrap items-start gap-1 max-w-[40%]">
                {badges.map((badge, index) => (
                  <span key={index} className="shrink-0">
                    {badge}
                  </span>
                ))}
              </div>
            )}
          </div>
        </CardHeader>
      )}

      {/* Content */}
      <CardContent
        className={cn(
          hasHeader ? 'pt-0' : '',
          compact ? 'p-4' : '',
          compact && hasHeader ? 'pt-0' : ''
        )}
      >
        <div className="space-y-4">
          {/* Description */}
          {description && (
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
              {description}
            </p>
          )}

          {/* Custom children content */}
          {children}

          {/* Stats Grid */}
          {stats && stats.length > 0 && (
            <div
              className={cn(
                'grid gap-4 pt-2',
                statsColsClasses[statsColumns] ?? 'grid-cols-2'
              )}
            >
              {stats.map((stat, index) => (
                <div
                  key={stat.label ?? index}
                  className="flex flex-col gap-0.5"
                >
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {stat.label}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {stat.icon && (
                      <span className="text-muted-foreground" aria-hidden="true">
                        {stat.icon}
                      </span>
                    )}
                    <span className="text-sm font-semibold text-foreground">
                      {stat.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>

      {/* Footer */}
      {hasFooter && (
        <>
          {showFooterSeparator && <Separator className="mb-0" />}
          <CardFooter
            className={cn(
              'pt-3',
              compact && 'p-4 pt-3',
              showFooterSeparator && 'pt-4'
            )}
          >
            <div className="flex w-full items-center gap-2">
              {footer ?? actions}
            </div>
          </CardFooter>
        </>
      )}
    </Card>
  );
}

export default DataViewCard;

