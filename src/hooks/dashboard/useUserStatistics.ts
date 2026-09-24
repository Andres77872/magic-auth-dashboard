import { useCallback } from 'react';
import { systemService } from '@/services';
import { useAuth } from '@/hooks/useAuth';
import { useAsyncData } from '@/hooks/useAsyncData';
import type { AdminUserStatistics } from '@/types/dashboard.types';

interface UseUserStatisticsReturn {
  statistics: AdminUserStatistics | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/** New and active users over the last `days` (`GET /admin/users/statistics`). */
export function useUserStatistics(days = 30): UseUserStatisticsReturn {
  const { isAuthenticated } = useAuth();
  const fetcher = useCallback(
    () => systemService.getUserStatistics(days),
    [days]
  );
  const { data, error, isLoading, isRefreshing, refetch } = useAsyncData(
    fetcher,
    {
      enabled: isAuthenticated,
      pollIntervalMs: 5 * 60_000,
    }
  );
  return { statistics: data, error, isLoading, isRefreshing, refetch };
}

export default useUserStatistics;
