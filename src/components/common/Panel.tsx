import React from 'react';
import { cn } from '@/lib/utils';

export interface PanelProps extends Omit<
  React.HTMLAttributes<HTMLElement>,
  'title'
> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** Controls rendered on the right of the header (buttons, links, filters). */
  actions?: React.ReactNode;
  /** Body padding. Use `none` for tables and lists that run edge to edge. */
  padding?: 'none' | 'sm' | 'md';
  footer?: React.ReactNode;
  as?: 'section' | 'div' | 'article';
}

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'px-5 py-4',
};

/**
 * Meridian card section: flat surface, 1px border, optional header with a
 * title, one-line description and actions. The standard container for page
 * sections on overview and detail pages.
 */
export function Panel({
  title,
  description,
  actions,
  padding = 'md',
  footer,
  as: Component = 'section',
  className,
  children,
  ...props
}: PanelProps): React.JSX.Element {
  const hasHeader = Boolean(title || description || actions);
  return (
    <Component
      className={cn(
        'flex min-w-0 flex-col rounded-lg border border-border bg-card text-card-foreground',
        className
      )}
      {...props}
    >
      {hasHeader && (
        <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 border-b border-border px-5 py-3.5">
          <div className="min-w-0">
            {title && (
              <h2 className="text-[15px] font-semibold leading-snug text-foreground">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex shrink-0 items-center gap-2">{actions}</div>
          )}
        </header>
      )}
      <div className={cn('min-w-0 flex-1', paddingClasses[padding])}>
        {children}
      </div>
      {footer && (
        <footer className="border-t border-border px-5 py-3">{footer}</footer>
      )}
    </Component>
  );
}

export default Panel;
