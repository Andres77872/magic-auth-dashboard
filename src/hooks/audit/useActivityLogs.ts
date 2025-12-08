import { useState, useEffect, useCallback, useRef } from 'react';
import { auditService, mapFiltersToParams } from '@/services/audit.service';
import type {
  ActivityLog,
  ActivityFilters,
  ActivityPaginationInfo,
} from '@/types/audit.types';

/**
 * Options for the useActivityLogs hook
 */
export interface UseActivityLogsOptions {
  filters?: ActivityFilters;
  limit?: number;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds, default 30000 (30 seconds)
}

/**
 * Return type for the useActivityLogs hook
 */
export interface UseActivityLogsReturn {
  activities: ActivityLog[];
  pagination: ActivityPaginationInfo;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
  setFilters: (filters: ActivityFilters) => void;
  filters: ActivityFilters;
  isAutoRefreshing: boolean;
  setAutoRefresh: (enabled: boolean) => void;
  secondsUntilRefresh: number;
}

const DEFAULT_LIMIT = 50;
const DEFAULT_REFRESH_INTERVAL = 30000; // 30 seconds

/**
 * Hook for fetching and managing activity logs with pagination, filtering, and auto-refresh
 * 
 * Requirements: 1.1, 1.3, 2.1, 2.2, 2.3, 2.4, 2.5, 6.1
 */
export function useActivityLogs(options: UseActivityLogsOptions = {}): UseActivityLogsReturn {
  const {
    filters: initialFilters = {},
    limit = DEFAULT_LIMIT,
    autoRefresh: initialAutoRefresh = false,
    refreshInterval = DEFAULT_REFRESH_INTERVAL,
  } = options;

  // State
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [pagination, setPagination] = useState<ActivityPaginationInfo>({
    total: 0,
    limit,
    offset: 0,
    hasMore: false,
    currentPage: 1,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<ActivityFilters>(initialFilters);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(initialAutoRefresh);
  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState(
    Math.floor(refreshInterval / 1000)
  );


  // Refs for interval management
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);

  /**
   * Fetch activity logs from the API
   */
  const fetchActivities = useCallback(
    async (offset: number = 0, append: boolean = false) => {
      if (!isMountedRef.current) return;

      setIsLoading(true);
      setError(null);

      try {
        const params = {
          ...mapFiltersToParams(filters),
          limit,
          offset,
        };

        const result = await auditService.getActivityLogs(params);

        if (!isMountedRef.current) return;

        const totalPages = Math.ceil(result.pagination.total / limit);
        const currentPage = Math.floor(offset / limit) + 1;

        if (append) {
          setActivities((prev) => [...prev, ...result.activities]);
        } else {
          setActivities(result.activities);
        }

        setPagination({
          total: result.pagination.total,
          limit: result.pagination.limit,
          offset: result.pagination.offset,
          hasMore: result.pagination.hasMore,
          nextOffset: result.pagination.nextOffset,
          currentPage,
          totalPages,
        });
      } catch (err) {
        if (!isMountedRef.current) return;
        setError(err instanceof Error ? err.message : 'Failed to fetch activity logs');
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    },
    [filters, limit]
  );

  /**
   * Refetch activities from the beginning
   */
  const refetch = useCallback(async () => {
    await fetchActivities(0, false);
    // Reset countdown on manual refresh
    setSecondsUntilRefresh(Math.floor(refreshInterval / 1000));
  }, [fetchActivities, refreshInterval]);

  /**
   * Load more activities (pagination)
   */
  const loadMore = useCallback(async () => {
    if (pagination.hasMore && !isLoading) {
      const nextOffset = pagination.nextOffset ?? pagination.offset + limit;
      await fetchActivities(nextOffset, true);
    }
  }, [pagination, isLoading, limit, fetchActivities]);

  /**
   * Update filters and reset pagination
   */
  const setFilters = useCallback((newFilters: ActivityFilters) => {
    setFiltersState(newFilters);
  }, []);

  /**
   * Toggle auto-refresh
   */
  const setAutoRefresh = useCallback((enabled: boolean) => {
    setIsAutoRefreshing(enabled);
  }, []);


  // Initial fetch and filter change effect
  useEffect(() => {
    fetchActivities(0, false);
  }, [fetchActivities]);

  // Auto-refresh effect
  useEffect(() => {
    // Clear existing timers
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }

    if (isAutoRefreshing) {
      // Reset countdown
      setSecondsUntilRefresh(Math.floor(refreshInterval / 1000));

      // Set up countdown timer (updates every second)
      countdownTimerRef.current = setInterval(() => {
        setSecondsUntilRefresh((prev) => {
          if (prev <= 1) {
            return Math.floor(refreshInterval / 1000);
          }
          return prev - 1;
        });
      }, 1000);

      // Set up refresh timer
      refreshTimerRef.current = setInterval(() => {
        fetchActivities(0, false);
      }, refreshInterval);
    }

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, [isAutoRefreshing, refreshInterval, fetchActivities]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    activities,
    pagination,
    isLoading,
    error,
    refetch,
    loadMore,
    setFilters,
    filters,
    isAutoRefreshing,
    setAutoRefresh,
    secondsUntilRefresh,
  };
}

export default useActivityLogs;
