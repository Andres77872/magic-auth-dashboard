import { useCallback } from 'react';
import { auditService } from '@/services/audit.service';
import { useAuth } from '@/hooks/useAuth';
import { useAsyncData } from '@/hooks/useAsyncData';
import type { ActivityLog } from '@/types/audit.types';

interface UseRecentActivityOptions {
  limit?: number;
  pollIntervalMs?: number;
}

interface UseRecentActivityReturn {
  activities: ActivityLog[];
  total: number;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/** The newest platform activity (`GET /admin/activity`), for compact feeds. */
export function useRecentActivity({
  limit = 8,
  pollIntervalMs = 60_000,
}: UseRecentActivityOptions = {}): UseRecentActivityReturn {
  const { isAuthenticated } = useAuth();
  const fetcher = useCallback(
    () => auditService.getActivityLogs({ limit, days: 30 }),
    [limit]
  );
  const { data, error, isLoading, isRefreshing, refetch } = useAsyncData(
    fetcher,
    {
      enabled: isAuthenticated,
      pollIntervalMs,
    }
  );
  return {
    activities: data?.activities ?? [],
    total: data?.pagination.total ?? 0,
    error,
    isLoading,
    isRefreshing,
    refetch,
  };
}

export default useRecentActivity;
