import { useState, useEffect, useCallback, useRef } from 'react';
import { analyticsService } from '@/services/analytics.service';
import type {
  Activity,
  UseRecentActivityOptions,
  UseRecentActivityReturn,
} from '@/types/analytics.types';

export function useRecentActivity(
  options: UseRecentActivityOptions = {}
): UseRecentActivityReturn {
  const {
    filters = {},
    limit = 10,
    autoRefresh = false,
    refreshInterval = 30000,
  } = options;

  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<string | undefined>(undefined);

  const intervalRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);

  // Clear interval on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const fetchActivities = useCallback(async (
    isInitialLoad = false,
    loadMoreCursor?: string
  ) => {
    if (!isMountedRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await analyticsService.getRecentActivity({
        filters,
        limit,
        cursor: loadMoreCursor,
      });

      if (!isMountedRef.current) return;

      if (isInitialLoad || !loadMoreCursor) {
        // Replace activities for initial load or filter changes
        setActivities(response.activities);
      } else {
        // Append activities for pagination
        setActivities(prev => [...prev, ...response.activities]);
      }

      setHasMore(response.hasMore);
      setCursor(response.nextCursor);
    } catch (err) {
      if (!isMountedRef.current) return;
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to load activities';
      setError(errorMessage);
      console.error('Failed to fetch recent activity:', err);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [filters, limit]);

  // Load more activities for pagination
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading || !cursor) return;

    await fetchActivities(false, cursor);
  }, [hasMore, isLoading, cursor, fetchActivities]);

  // Refetch activities (for refresh button or filter changes)
  const refetch = useCallback(() => {
    setCursor(undefined);
    fetchActivities(true);
  }, [fetchActivities]);

  // Initial load and filter changes
  useEffect(() => {
    setCursor(undefined);
    fetchActivities(true);
  }, [fetchActivities]);

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        if (!isLoading && isMountedRef.current) {
          // Only refresh the first page to avoid disrupting pagination
          setCursor(undefined);
          fetchActivities(true);
        }
      }, refreshInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }
  }, [autoRefresh, refreshInterval, isLoading, fetchActivities]);

  return {
    activities,
    isLoading,
    error,
    hasMore,
    refetch,
    loadMore,
  };
} 