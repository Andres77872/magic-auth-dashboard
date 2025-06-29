import React, { useState, useEffect, useCallback } from 'react';
import { ActivityItem } from './ActivityItem';
import { ActivityFilter } from './ActivityFilter';
import { useRecentActivity } from '@/hooks/dashboard/useRecentActivity';
import { useUserType } from '@/hooks';
import { LoadingSpinner } from '@/components/common';

export interface Activity {
  id: string;
  type: 'user_created' | 'user_updated' | 'user_deleted' | 'login' | 'logout' | 
        'project_created' | 'project_updated' | 'project_deleted' |
        'group_created' | 'group_updated' | 'permission_changed' | 'system_event';
  title: string;
  description: string;
  user: {
    user_hash: string;
    username: string;
    user_type: string;
  };
  timestamp: string;
  severity: 'info' | 'warning' | 'critical';
  metadata?: Record<string, any>;
}

export interface ActivityFilters {
  type?: string;
  userType?: string;
  severity?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  search?: string;
}

export function RecentActivityFeed(): React.JSX.Element {
  const [filters, setFilters] = useState<ActivityFilters>({});
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const { isRoot } = useUserType();

  const {
    activities,
    isLoading,
    error,
    hasMore,
    refetch,
    loadMore
  } = useRecentActivity({
    filters,
    page,
    limit: 10,
    autoRefresh: true,
    refreshInterval: 30000, // 30 seconds
  });

  const handleFilterChange = useCallback((newFilters: ActivityFilters) => {
    setFilters(newFilters);
    setPage(1);
  }, []);

  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    try {
      await loadMore();
      setPage(prev => prev + 1);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, loadMore]);

  const handleRefresh = useCallback(() => {
    setPage(1);
    refetch();
  }, [refetch]);

  // Infinite scroll implementation
  useEffect(() => {
    const handleScroll = () => {
      const container = document.querySelector('.activity-feed-container');
      if (!container) return;

      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;

      if (isNearBottom && hasMore && !loadingMore && !isLoading) {
        handleLoadMore();
      }
    };

    const container = document.querySelector('.activity-feed-container');
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [hasMore, loadingMore, isLoading, handleLoadMore]);

  if (error) {
    return (
      <div className="activity-feed-error">
        <div className="error-content">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          <h3>Failed to Load Activity Feed</h3>
          <p>{error}</p>
          <button onClick={handleRefresh} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="activity-feed">
      <div className="activity-feed-header">
        <div className="header-content">
          <h2>Recent Activity</h2>
          <p>Real-time system activity monitoring and audit trail</p>
        </div>
        
        <div className="header-actions">
          <button 
            onClick={handleRefresh}
            className="refresh-button"
            disabled={isLoading}
          >
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
              className={isLoading ? 'spinning' : ''}
            >
              <polyline points="23,4 23,10 17,10"/>
              <polyline points="1,20 1,14 7,14"/>
              <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
            </svg>
            Refresh
          </button>
        </div>
      </div>

      <ActivityFilter
        filters={filters}
        onFiltersChange={handleFilterChange}
        showUserTypeFilter={isRoot}
      />

      <div className="activity-feed-container">
        {isLoading && activities.length === 0 ? (
          <div className="activity-loading">
            <LoadingSpinner size="medium" message="Loading activity feed..." />
          </div>
        ) : activities.length === 0 ? (
          <div className="activity-empty">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
              <line x1="9" y1="9" x2="9.01" y2="9"/>
              <line x1="15" y1="9" x2="15.01" y2="9"/>
            </svg>
            <h3>No Activity Found</h3>
            <p>No recent activity matches your current filters.</p>
          </div>
        ) : (
          <>
            <div className="activity-list">
              {activities.map((activity) => (
                <ActivityItem
                  key={activity.id}
                  activity={activity}
                />
              ))}
            </div>

            {loadingMore && (
              <div className="activity-loading-more">
                <LoadingSpinner size="small" message="Loading more..." />
              </div>
            )}

            {!hasMore && activities.length > 0 && (
              <div className="activity-end">
                <p>You've reached the end of the activity feed</p>
              </div>
            )}
          </>
        )}
      </div>

      <div className="activity-feed-footer">
        <div className="activity-stats">
          <span className="stat">
            <strong>{activities.length}</strong> activities shown
          </span>
          {hasMore && (
            <span className="stat">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12,6 12,12 16,14"/>
              </svg>
              Auto-refreshes every 30 seconds
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default RecentActivityFeed; 