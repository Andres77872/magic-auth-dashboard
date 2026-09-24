import React from 'react';
import { cn } from '@/lib/utils';

export interface PageHeaderProps {
  title: string;
  subtitle?: React.ReactNode;
  /** Optional leading visual, e.g. an entity avatar on detail pages. */
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
  /** Extra content under the title row (tabs, summary stats). */
  children?: React.ReactNode;
  className?: string;
}

/**
 * Page title row (Meridian `.page-head`): 22px title, one-line subtitle,
 * primary actions on the right. List pages usually omit `icon`.
 */
export function PageHeader({
  title,
  subtitle,
  icon,
  actions,
  badge,
  children,
  className = '',
}: PageHeaderProps): React.JSX.Element {
  return (
    <header className={cn('mb-6 space-y-5', className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          {icon && (
            <span
              className="flex shrink-0 items-center justify-center text-muted-foreground"
              aria-hidden="true"
            >
              {icon}
            </span>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-[22px] font-semibold leading-tight tracking-[-0.01em] text-foreground">
                {title}
              </h1>
              {badge}
            </div>
            {subtitle && (
              <p className="mt-1 text-[13px] text-muted-foreground">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            {actions}
          </div>
        )}
      </div>
      {children && <div>{children}</div>}
    </header>
  );
}

export default PageHeader;
