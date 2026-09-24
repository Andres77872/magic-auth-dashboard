import { useCallback } from 'react';
import { systemService } from '@/services';
import { useAuth } from '@/hooks/useAuth';
import { useAsyncData } from '@/hooks/useAsyncData';
import type { AdminDashboardStats } from '@/types/dashboard.types';

interface UseSystemStatsReturn {
  stats: AdminDashboardStats | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  updatedAt: Date | null;
  refetch: () => Promise<void>;
}

/** Platform totals from `GET /admin/dashboard/stats`, refreshed every minute. */
export function useSystemStats(): UseSystemStatsReturn {
  const { isAuthenticated } = useAuth();
  const fetcher = useCallback(() => systemService.getDashboardStats(), []);
  const { data, ...state } = useAsyncData(fetcher, {
    enabled: isAuthenticated,
    pollIntervalMs: 60_000,
  });
  return { stats: data, ...state };
}

export default useSystemStats;
