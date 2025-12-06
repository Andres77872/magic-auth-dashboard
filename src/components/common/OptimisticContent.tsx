import React from 'react';
import { WarningIcon, RefreshIcon } from '@/components/icons';
import { cn } from '@/utils/component-utils';

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
        'optimistic-content',
        isLoading && 'optimistic-content--loading',
        isRefetching && 'optimistic-content--refetching',
        className
      )}
    >
      {isRefetching && showIndicator && (
        <div className="optimistic-content__refresh-bar" aria-hidden="true" />
      )}

      {isRefetching && showIndicator && (
        <div className="optimistic-content__indicator" role="status" aria-live="polite">
          <RefreshIcon size={14} className="optimistic-content__spinner" aria-hidden="true" />
          <span>{indicatorText}</span>
        </div>
      )}

      {isStale && !isRefetching && (
        <div className="optimistic-content__stale" role="status">
          <WarningIcon size={14} aria-hidden="true" />
          <span>{staleText}</span>
        </div>
      )}

      {children}
    </div>
  );
}

export default OptimisticContent;
