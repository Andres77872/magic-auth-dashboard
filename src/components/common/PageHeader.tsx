import React from 'react';
import { cn } from '@/lib/utils';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

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
    <header className={cn('space-y-4 pb-6', className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            {icon && (
              <span className="text-muted-foreground" aria-hidden="true">
                {icon}
              </span>
            )}
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {badge && <span>{badge}</span>}
          </div>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {children && <div>{children}</div>}
    </header>
  );
}

export default PageHeader;

