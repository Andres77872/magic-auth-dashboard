import React, { useState, useEffect, useCallback } from 'react';
import { ActivityItem } from './ActivityItem';
import { ActivityFilter } from './ActivityFilter';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useRecentActivity } from '@/hooks/dashboard/useRecentActivity';
import { useUserType } from '@/hooks';
import { Activity, RefreshCw, Clock, Smile, Loader2 } from 'lucide-react';
import type { ActivityFilters } from '@/types/analytics.types';

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
    refreshInterval: 30000,
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
      const container = document.querySelector('.activity-feed-scroll-container');
      if (!container) return;

      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;

      if (isNearBottom && hasMore && !loadingMore && !isLoading) {
        handleLoadMore();
      }
    };

    const container = document.querySelector('.activity-feed-scroll-container');
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [hasMore, loadingMore, isLoading, handleLoadMore]);

  if (error) {
    return (
      <Card className="mt-6 border-destructive/30 bg-destructive/5">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <Activity className="h-8 w-8 text-destructive" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Failed to Load Activity Feed</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md">{error}</p>
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <Activity className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Real-time system activity monitoring and audit trail</CardDescription>
            </div>
          </div>
          
          <Button 
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <ActivityFilter
          filters={filters}
          onFiltersChange={handleFilterChange}
          showUserTypeFilter={isRoot}
        />

        <div className="activity-feed-scroll-container max-h-[600px] overflow-y-auto pr-2">
          {isLoading && activities.length === 0 ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={`skeleton-${index}`} className="flex gap-4 p-4 rounded-lg border border-border">
                  <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-[40%]" />
                    <Skeleton className="h-3 w-[60%]" />
                    <div className="flex items-center gap-2 pt-2">
                      <Skeleton className="h-6 w-6 rounded-full" />
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Smile className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No Activity Found</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                No recent activity matches your current filters. Try adjusting the filters or check back later.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((activity) => (
                <ActivityItem
                  key={activity.id}
                  activity={activity}
                />
              ))}

              {loadingMore && (
                <div className="flex items-center justify-center gap-2 py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Loading more...</span>
                </div>
              )}

              {!hasMore && activities.length > 0 && (
                <div className="flex items-center justify-center py-4">
                  <p className="text-sm text-muted-foreground">You've reached the end of the activity feed</p>
                </div>
              )}

              {hasMore && !loadingMore && (
                <div className="flex justify-center pt-2">
                  <Button variant="ghost" onClick={handleLoadMore}>
                    Load More
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-4">
        <span className="flex items-center gap-1">
          <strong className="text-foreground">{activities.length}</strong> activities shown
        </span>
        {hasMore && (
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Auto-refreshes every 30 seconds
          </span>
        )}
      </CardFooter>
    </Card>
  );
}

export default RecentActivityFeed;
