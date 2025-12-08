import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OptimisticContentProps {
  isLoading?: boolean;
  isRefetching?: boolean;
  isStale?: boolean;
  children: React.ReactNode;
  className?: string;
  showIndicator?: boolean;
  indicatorText?: string;
  staleText?: string;
}

export function OptimisticContent({
  isLoading = false,
  isRefetching = false,
  isStale = false,
  children,
  className = '',
  showIndicator = true,
  indicatorText = 'Updating...',
  staleText = 'Showing cached data',
}: OptimisticContentProps): React.JSX.Element {
  return (
    <div
      className={cn(
        'relative',
        isLoading && 'opacity-50 pointer-events-none',
        isRefetching && 'opacity-75',
        className
      )}
    >
      {isRefetching && showIndicator && (
        <div
          className="absolute top-0 left-0 right-0 h-0.5 bg-primary/30 overflow-hidden"
          aria-hidden="true"
        >
          <div className="h-full w-1/3 bg-primary animate-pulse" />
        </div>
      )}

      {isRefetching && showIndicator && (
        <div
          className="absolute top-2 right-2 flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
          <span>{indicatorText}</span>
        </div>
      )}

      {isStale && !isRefetching && (
        <div
          className="mb-3 flex items-center gap-1.5 rounded-md bg-yellow-500/10 px-3 py-2 text-sm text-yellow-700 dark:text-yellow-400"
          role="status"
        >
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          <span>{staleText}</span>
        </div>
      )}

      {children}
    </div>
  );
}

export default OptimisticContent;
