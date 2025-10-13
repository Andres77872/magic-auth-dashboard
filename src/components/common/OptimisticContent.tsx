import React from 'react';

interface OptimisticContentProps {
  isLoading?: boolean;
  isRefetching?: boolean;
  isStale?: boolean;
  children: React.ReactNode;
  className?: string;
  showIndicator?: boolean;
  indicatorText?: string;
}

/**
 * OptimisticContent - Wrapper component for smooth loading transitions
 * Shows content immediately while indicating loading state subtly
 */
export function OptimisticContent({
  isLoading = false,
  isRefetching = false,
  isStale = false,
  children,
  className = '',
  showIndicator = true,
  indicatorText = 'Updating...',
}: OptimisticContentProps): React.JSX.Element {
  const contentClasses = [
    'optimistic-content',
    isLoading && 'optimistic-content--loading',
    isRefetching && 'optimistic-content--refetching',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={contentClasses}>
      {/* Background refresh indicator */}
      {isRefetching && showIndicator && (
        <div className="optimistic-refresh-bar" />
      )}

      {/* Inline loading indicator for refetching */}
      {isRefetching && showIndicator && (
        <div className="optimistic-loading-indicator">
          <div className="optimistic-loading-indicator__spinner" />
          <span>{indicatorText}</span>
        </div>
      )}

      {/* Stale data indicator */}
      {isStale && !isRefetching && (
        <div className="optimistic-stale-indicator">
          ⚠️ Showing cached data
        </div>
      )}

      {/* Actual content */}
      {children}
    </div>
  );
}

export default OptimisticContent;
